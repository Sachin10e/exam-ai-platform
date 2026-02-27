import axios from 'axios'

export async function generateEmbedding(text: string) {
  const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
  const response = await axios.post(
    `${ollamaUrl}/api/embeddings`,
    {
      model: 'nomic-embed-text',
      prompt: text,
    }
  )

  return response.data.embedding
}

export async function generateAnswer(prompt: string) {
  const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
  const response = await axios.post(
    `${ollamaUrl}/api/generate`,
    {
      model: 'llama3:8b-instruct-q4_K_M',
      prompt,
      stream: false,
      options: {
        temperature: 0.1,
        num_predict: 200,
      },
    }
  )

  return response.data.response
}
