const decoder = new TextDecoder('utf-8')

function simulate() {
    const payloads = [
        `{"model":"llama3","created_at":"2024-05-15T00:00:00Z","message":{"role":"assistant","content":"Based "},"done":false}\n`,
        `{"model":"llama3","created_at":"2024-05-15T00:00:00Z","message":{"role":"assistant","content":"on "},"done":false}\n`,
        `{"model":"llama3","created_at":"2024-05-15T00:00:00Z","message":{"role":"assistant","content":"the "},"done":false}\n`,
    ]

    const chunks = payloads.map(p => new TextEncoder().encode(p))

    let buffer = ''
    let finalClientString = ''

    // SERVER SIDE
    const serverEmitted = []
    for (const chunk of chunks) {
        const text = decoder.decode(chunk, { stream: true })
        buffer += text
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
            if (!line.trim()) continue
            const parsed = JSON.parse(line)
            if (parsed.message?.content) {
                serverEmitted.push(new TextEncoder().encode(parsed.message.content))
            }
        }
    }

    // CLIENT SIDE
    const clientDecoder = new TextDecoder('utf-8')
    let currentRenderedMessage = ''
    for (const serverChunk of serverEmitted) {
        const text = clientDecoder.decode(serverChunk, { stream: true })
        currentRenderedMessage += text

        console.log('--- React render cycle: ---')
        console.log(currentRenderedMessage)
    }
}

simulate()
