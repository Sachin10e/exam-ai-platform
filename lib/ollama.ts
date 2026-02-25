import axios from 'axios'

export async function generateEmbedding(text: string) {
  const response = await axios.post(
    'http://localhost:11434/api/embeddings',
    {
      model: 'nomic-embed-text',
      prompt: text,
    }
  )

  return response.data.embedding
}

export async function generateAnswer(prompt: string) {
  const response = await axios.post(
    'http://localhost:11434/api/generate',
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
