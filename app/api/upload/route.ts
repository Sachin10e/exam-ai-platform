import { NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'
import { exec } from 'child_process'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'File required' }, { status: 400 })
    }

    const uploadDir = path.join(process.cwd(), 'uploads')
    const filePath = path.join(uploadDir, file.name)

    await writeFile(filePath, Buffer.from(await file.arrayBuffer()))

    exec(`node scripts/process-file.js "${filePath}"`, (err, stdout, stderr) => {
      if (err) console.error('Worker error:', err)
      if (stdout) console.log(stdout)
      if (stderr) console.error(stderr)
    })

    return NextResponse.json({
      message: 'File uploaded. Processing started in background.'
    })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
