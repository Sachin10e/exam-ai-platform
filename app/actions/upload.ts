'use server'

import { createClient } from '@supabase/supabase-js'
import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'
import Tesseract from 'tesseract.js'
import crypto from 'crypto'
import { generateEmbedding } from '../../lib/ollama'

const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)



export async function uploadPdfAction(formData: FormData) {
    try {
        const file = formData.get('file') as File | null
        const subjectId = formData.get('subjectId') as string | null

        if (!file || !subjectId) {
            return { error: 'File and Subject ID are required' }
        }

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        let FullText = ''

        // 1. EXTRACT TEXT BASED ON FILE TYPE
        const mimeType = file.type || ''
        const fileName = file.name.toLowerCase()

        if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
            // PDF Parsing
            const pdfData = await pdfParse(buffer, {
                pagerender: function (pageData: { getTextContent: () => Promise<{ items: { str: string, transform: number[] }[] }> }) {
                    return pageData.getTextContent().then(function (textContent: { items: { str: string, transform: number[] }[] }) {
                        let lastY, text = ''
                        for (const item of textContent.items) {
                            if (lastY == item.transform[5] || !lastY) {
                                text += item.str
                            } else {
                                text += '\n' + item.str
                            }
                            lastY = item.transform[5]
                        }
                        return text
                    })
                }
            })
            FullText = pdfData.text
        }
        else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
            // DOCX Parsing
            const result = await mammoth.extractRawText({ buffer })
            FullText = result.value
        }
        else if (mimeType.startsWith('image/') || fileName.match(/\.(jpg|jpeg|png)$/)) {
            // Image OCR Parsing
            const { data: { text } } = await Tesseract.recognize(buffer, 'eng')
            FullText = text
        }
        else if (mimeType === 'text/plain' || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
            // Plain Text
            FullText = buffer.toString('utf-8')
        }
        else {
            return { error: 'Unsupported file format. Please upload PDF, DOCX, TXT, or Image files.' }
        }

        if (!FullText || !FullText.trim()) {
            return { error: 'Could not extract text from the file. It might be empty or unreadable.' }
        }

        // Clean text
        const cleanText = FullText
            .replace(/\u0000/g, '') // Remove null chars
            .replace(/\r\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n') // Normalize newlines
            .trim()

        // 2. Hash computation for Deduplication
        const fileHash = crypto.createHash('sha256').update(cleanText).digest('hex')
        let hasFileHashCol = true;

        // Safely probe if the DB has been migrated with file_hash
        const { error: testErr } = await serviceSupabase.from('documents').select('file_hash').limit(1)
        if (testErr && testErr.code === '42703') {
            hasFileHashCol = false;
        }

        if (hasFileHashCol) {
            const { data: searchDoc } = await serviceSupabase
                .from('documents')
                .select('id, subject_id')
                .eq('file_hash', fileHash)
                .limit(1)
                .maybeSingle()

            if (searchDoc) {
                console.log(`[DEDUPE] Exact document match found for hash ${fileHash}. Bypassing chunking!`)
                return {
                    success: true,
                    subjectId: searchDoc.subject_id,
                    message: `Reused existing database chunks for ${file.name}`
                }
            }
        }

        // 3. Insert new Document Record
        const insertPayload: Record<string, unknown> = {
            subject_id: subjectId,
            filename: file.name,
            full_text: cleanText
        }
        if (hasFileHashCol) {
            insertPayload.file_hash = fileHash
        }

        const { data: docData, error: docError } = await serviceSupabase
            .from('documents')
            .insert([insertPayload])
            .select()
            .single()

        if (docError) {
            console.error('Document insert error:', docError)
            return { error: 'Failed to save document record' }
        }

        // 3. Chunk and Embed
        // Split text by double newlines (paragraphs/sections)
        const rawChunks = cleanText.split('\n\n').filter(c => c.length > 50)
        let successCount = 0

        for (const chunk of rawChunks) { // Iterate over rawChunks
            if (!chunk.trim()) continue;

            let embedding;
            try {
                embedding = await generateEmbedding(chunk)
            } catch (embErr: unknown) {
                console.error('Failed to generate embedding for chunk', embErr)
                const errMsg = embErr instanceof Error ? embErr.message : 'Unknown error'
                throw new Error(`Failed to generate Gemini embedding: ${errMsg}`)
            }

            const { error: chunkError } = await serviceSupabase
                .from('chunks')
                .insert([{
                    subject_id: subjectId,
                    document_id: docData.id,
                    content: chunk,
                    embedding: embedding
                }])

            if (!chunkError) {
                successCount++
            }
        }

        return {
            success: true,
            message: `Processed ${successCount} chunks from ${file.name}`
        }

    } catch (err: unknown) {
        console.error('Upload error:', err)
        const errMsg = err instanceof Error ? err.message : 'Upload failed'
        return { error: errMsg }
    }
}
