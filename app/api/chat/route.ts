import { NextResponse } from 'next/server'
import { generateMultiPassAnswerStream } from '../../../lib/ai/answerEngine'



export async function POST(req: Request) {
    try {
        const { messages, subjectId, arenaParams, guestContextText } = await req.json()

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: 'Missing generic messages array' }, { status: 400 })
        }

        // Get the latest user message
        const lastMessage = messages[messages.length - 1]
        const query = lastMessage.content

        const resultStream = await generateMultiPassAnswerStream(subjectId, query, messages, arenaParams, guestContextText);

        const textEncoder = new TextEncoder()
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of resultStream.stream) {
                        const chunkText = chunk.text()
                        if (chunkText) {
                            controller.enqueue(textEncoder.encode(chunkText))
                        }
                    }
                    controller.close()
                } catch (err) {
                    controller.error(err)
                }
            }
        })

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked',
            }
        })

    } catch (error: unknown) {
        console.error('Chat API Error:', error)
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
    }
}
