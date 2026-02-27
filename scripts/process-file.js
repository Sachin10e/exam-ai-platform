const fs = require('fs')
const pdfParse = require('pdf-parse')
const { createClient } = require('@supabase/supabase-js')
const axios = require('axios')
require('dotenv').config()

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
  const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
  const res = await axios.post(`${ollamaUrl}/api/embeddings`, {
    model: 'nomic-embed-text',
    prompt: text,
  })
  return res.data.embedding
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
    const { data: existing, error: existingError } = await supabase
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