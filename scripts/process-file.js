import fs from 'fs'
import pdfParse from 'pdf-parse'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { GoogleGenerativeAI } from '@google/generative-ai'
dotenv.config()

const filePath = process.argv[2]

if (!filePath) {
  console.error('No file path provided')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function chunkText(text, size = 800) {
  const chunks = []
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size))
  }
  return chunks
}

async function generateEmbedding(text) {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not found")
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' })
  const result = await model.embedContent({
    content: { role: "user", parts: [{ text: text }] },
    outputDimensionality: 768
  })
  return result.embedding.values
}

async function processFile() {
  try {
    console.log('Reading file...')
    const buffer = fs.readFileSync(filePath)

    console.log('Extracting text...')
    const pdfData = await pdfParse(buffer)
    const fullText = pdfData.text

    const fileName = filePath.split('/').pop()
    const subjectName = fileName.replace('.pdf', '')

    console.log('Checking for existing subject...')
    // Check if subject already exists
    const { data: existing } = await supabase
      .from('subjects')
      .select('*')
      .eq('name', subjectName)
      .single()

    let subjectId
    let subjectData
    let subjectError

    if (existing) {
      subjectId = existing.id
      subjectData = existing
    } else {
      console.log('Inserting new subject...')
      const insertResp = await supabase
        .from('subjects')
        .insert([{ name: subjectName }])
        .select()
        .single()
      subjectData = insertResp.data
      subjectError = insertResp.error
      if (subjectError) {
        console.error('Subject insert error:', subjectError)
        process.exit(1)
      }
      subjectId = subjectData.id
    }

    console.log('Subject ID:', subjectId)

    console.log('Inserting document...')
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert([{
        subject_id: subjectId,
        filename: fileName,
        full_text: fullText
      }])
      .select()
      .single()

    if (docError) {
      console.error('Document insert error:', docError)
      process.exit(1)
    }

    console.log('Chunking text...')
    const chunks = chunkText(fullText)

    console.log(`Generating embeddings for ${chunks.length} chunks...`)

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]

      const embedding = await generateEmbedding(chunk)

      const { error: chunkError } = await supabase
        .from('chunks')
        .insert([{
          subject_id: subjectId,
          document_id: docData.id,
          content: chunk,
          embedding: embedding
        }])

      if (chunkError) {
        console.error('Chunk insert error:', chunkError)
      }
    }

    console.log('Processing complete')
  } catch (err) {
    console.error('Processing failed:', err)
  }
}

processFile()