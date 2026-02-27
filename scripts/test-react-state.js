const payloads = [
    'Based ',
    'on ',
    'the '
]

let reactStateString = ''
const decoder = new TextDecoder()

for (const p of payloads) {
    const streamBuffer = new TextEncoder().encode(p)
    // Simulated reading from fetch stream
    const chunkString = decoder.decode(streamBuffer, { stream: true })

    // Simulated React setMessages loop
    console.log('Stream yielded delta:', chunkString)
    reactStateString += chunkString
    console.log('Final UI State:', reactStateString)
}
