'use server'

import { createClient as createClientJs } from '@supabase/supabase-js'
import mammoth from 'mammoth'
import crypto from 'crypto'
import { generateEmbedding } from '../../lib/embeddings'
import { encode, decode } from 'gpt-tokenizer'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { generateTopicRelationships } from '../../lib/analytics/topicRelationships'
import { createClient } from '@/utils/supabase/server'

async function extractPdfText(buffer: Buffer): Promise<string> {
    // pdfjs-dist v5 ships only .mjs — use dynamic import() inside an async function
    // This works correctly in Next.js server actions on Vercel Node.js runtime
    const pdfjsLib = await import('pdfjs-dist');
    // Disable worker (we are in Node.js server-side, no DOM/WebWorker)
    // @ts-ignore
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';
    const uint8Array = new Uint8Array(buffer);
    // @ts-ignore
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array, useSystemFonts: true, disableFontFace: true });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;
    let fullText = '';
    for (let i = 1; i <= numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = (textContent.items as any[]).map((item: any) => item.str || '').join(' ');
        fullText += pageText + '\n';
    }
    return fullText;
}

// We maintain serviceSupabase specifically for bypassing RLS across extremely heavy global vector searches if necessary
const serviceSupabase = createClientJs(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
)



export async function uploadPdfAction(formData: FormData) {
    try {
        const file = formData.get('file') as File | null
        const subjectId = formData.get('subjectId') as string | null

        if (!file || !subjectId) {
            return { error: 'File and Subject ID are required' }
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        const isGuest = !user;

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        let FullText = ''

        // 1. EXTRACT TEXT BASED ON FILE TYPE
        const mimeType = file.type || ''
        const fileName = file.name.toLowerCase()

        if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
            // PDF Parsing via pdfjs-dist (Vercel-compatible)
            try {
                FullText = await extractPdfText(buffer);
            } catch (pdfErr) {
                console.error('PDF parse error:', pdfErr);
                return { error: 'Failed to parse PDF. Please ensure the file is not password-protected or corrupted.' };
            }
        } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
            // DOCX Parsing
            const result = await mammoth.extractRawText({ buffer })
            FullText = result.value
        }
        else if (mimeType.startsWith('image/') || fileName.match(/\.(jpg|jpeg|png)$/)) {
            // Image OCR via Gemini Vision API (Tesseract requires WebWorkers unavailable on Vercel)
            try {
                const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
                const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
                const base64Image = buffer.toString('base64');
                const mimeTypeForGemini = mimeType || 'image/jpeg';
                const result = await model.generateContent([
                    { inlineData: { data: base64Image, mimeType: mimeTypeForGemini } },
                    'Extract all readable text from this image. Return only the text content, preserving structure as much as possible.'
                ]);
                FullText = result.response.text();
            } catch (imgErr) {
                console.error('Image OCR error:', imgErr);
                return { error: 'Failed to extract text from image. Please try a clearer image or text-based PDF.' };
            }
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

        if (isGuest) {
            console.log(`[GUEST MODE] Returning raw text payload for ${file.name}. Bypassing database.`);
            return {
                success: true,
                subjectId: 'guest-local',
                isGuest: true,
                text: cleanText,
                message: `Extracted text from ${file.name} for local guest session.`
            }
        }

        let finalSubjectId = subjectId;
        // Handle Edge Case: User uploaded as guest initially, got 'guest-local', then successfully logged in.
        // The UUID insert will fail for "guest-local", so we must promote and auto-containerize them into a real subject.
        if (!isGuest && subjectId === 'guest-local') {
             const { data: newSubj } = await supabase.from('subjects').insert([{ name: `Promoted Guest Plan (${file.name})`, user_id: user.id }]).select().single();
             if (newSubj) finalSubjectId = newSubj.id;
        }

        // 2. Hash computation for Deduplication
        const fileHash = crypto.createHash('sha256').update(cleanText).digest('hex')
        let hasFileHashCol = true;

        // Safely probe if the DB has been migrated with file_hash
        const { error: testErr } = await serviceSupabase.from('documents').select('file_hash').limit(1)
        if (testErr && testErr.code === '42703') {
            hasFileHashCol = false;
        }

        if (hasFileHashCol) {
            const { data: searchDoc } = await supabase
                .from('documents')
                .select('id, subject_id')
                .eq('file_hash', fileHash)
                .eq('user_id', user.id)
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
            user_id: user.id,
            subject_id: finalSubjectId,
            filename: file.name,
            full_text: cleanText
        }
        if (hasFileHashCol) {
            insertPayload.file_hash = fileHash
        }

        let res = await supabase
            .from('documents')
            .insert([insertPayload])
            .select()
            .single()

        // Fallback if file_hash causes global uniqueness violation
        if (res.error && res.error.code === '23505' && hasFileHashCol) {
            delete (insertPayload as any).file_hash;
            res = await supabase
                .from('documents')
                .insert([insertPayload])
                .select()
                .single()
        }

        const docData = res.data;
        const docError = res.error;

        if (docError) {
            console.error('Document insert error:', docError)
            return { error: `Failed to save document record: ${docError.message}` }
        }

        // 3. Chunk and Embed
        // Sliding Token Window (500 tokens, 100 overlap)
        const tokens = encode(cleanText)
        const rawChunks: string[] = []
        const chunkSize = 500
        const overlap = 100
        const step = chunkSize - overlap

        for (let i = 0; i < tokens.length; i += step) {
            const chunkTokens = tokens.slice(i, i + chunkSize)
            const decodedChunk = decode(chunkTokens)
            if (decodedChunk.trim().length > 50) {
                rawChunks.push(decodedChunk)
            }
        }
        let successCount = 0

        for (const chunk of rawChunks) {
            if (!chunk.trim()) continue;

            let embedding;
            try {
                embedding = await generateEmbedding(chunk)
            } catch (embErr: unknown) {
                console.error('Failed to generate embedding for chunk', embErr)
                const errMsg = embErr instanceof Error ? embErr.message : 'Unknown error'
                throw new Error(`Failed to generate Gemini embedding: ${errMsg}`)
            }

            const { error: chunkError } = await supabase
                .from('chunks')
                .insert([{
                    user_id: user.id,
                    subject_id: finalSubjectId,
                    document_id: docData.id,
                    content: chunk,
                    embedding: embedding
                }])

            if (!chunkError) {
                successCount++
            }
        }

        // KNOWLEDGE GRAPH SYNTHESIS: Topic Extraction Node (Moved outside loop for massive performance gain)
        try {
            const extractText = cleanText.substring(0, 5000);
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const prompt = `
Extract only the highly concrete academic or syllabus topics from the following text fragment.
Return ONLY a valid JSON array. Do not include markdown formatting or backticks.
Format strictly:
[
  {
    "topic": "Name of the topic",
    "description": "Brief description of the concept",
    "importance_score": 1 to 10
  }
]
Text: ${extractText}
            `;
            
            const result = await model.generateContent(prompt);
            let jsonStr = result.response.text().trim();
            if (jsonStr.startsWith('\`\`\`')) {
                jsonStr = jsonStr.replace(/^\`\`\`json\n?/, '').replace(/\n?\`\`\`$/, '');
            }
            const extractedTopics = JSON.parse(jsonStr);

            for (const t of extractedTopics) {
                if (!t.topic) continue;
                const { data: existing } = await supabase
                    .from('topics')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('subject_id', finalSubjectId)
                    .ilike('name', t.topic)
                    .limit(1)
                    .maybeSingle();

                if (!existing) {
                    await supabase.from('topics').insert({
                        user_id: user.id,
                        subject_id: finalSubjectId,
                        name: t.topic,
                        description: t.description,
                        importance: t.importance_score || 1
                    });
                }
            }
        } catch (kgErr) {
            console.warn('[Knowledge Graph] Topic extraction failed for global text:', String(kgErr).substring(0, 100));
        }

        // KNOWLEDGE GRAPH SYNTHESIS: Topic Linkage Edge Network Strategy
        // Deployed passively off the main UI execution thread to not freeze user input
        generateTopicRelationships(finalSubjectId).then(res => {
            console.log(`[Knowledge Graph] Edge Mapping Status: ${res.success ? res.message : res.error}`);
        }).catch(err => console.error('[Knowledge Graph] Relation dispatch fault:', err));

        return {
            success: true,
            subjectId: finalSubjectId,
            message: `Processed ${successCount} chunks from ${file.name}`
        }

    } catch (err: unknown) {
        console.error('Upload error:', err)
        const errMsg = err instanceof Error ? err.message : 'Upload failed'
        return { error: errMsg }
    }
}
