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
  const res = await axios.post('http://localhost:11434/api/embeddings', {
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
    const data = await pdfParse(buffer)
    const fullText = data.text

    const subjectName = filePath.split('/').pop().replace('.pdf', '')

    console.log('Inserting subject...')
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .insert({ name: subjectName })
      .select()
      .single()

    if (subjectError) throw subjectError

    console.log('Inserting document...')
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        subject_id: subject.id,
        filename: subjectName,
        full_text: fullText,
      })
      .select()
      .single()

    if (docError) throw docError

    console.log('Chunking text...')
    const chunks = chunkText(fullText)

    console.log(`Generating embeddings for ${chunks.length} chunks...`)

    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk)

      const { error: chunkError } = await supabase
        .from('chunks')
        .insert({
          document_id: document.id,
          content: chunk,
          embedding,
        })

      if (chunkError) throw chunkError
    }

    console.log('Processing complete')
  } catch (err) {
    console.error('Worker failed:', err)
  }
}

processFile()
