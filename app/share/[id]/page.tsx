import { getPublicSession } from '@/app/actions/sessions'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const session = await getPublicSession(params.id)
  return {
    title: session ? `${session.title} — ExamArena` : 'Study Plan — ExamArena',
    description: 'AI-generated exam study plan created with ExamArena',
  }
}

export default async function SharePage({ params }: Props) {
  const session = await getPublicSession(params.id)
  if (!session) notFound()

  const content = session.messages
    ?.filter((m: any) => m.role === 'assistant')
    .map((m: any) => m.content)
    .join('\n\n') || ''

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-10 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-bold text-indigo-400 uppercase tracking-widest">
              Shared Study Plan
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight mb-2">
            {session.title}
          </h1>
          <p className="text-slate-500 text-sm">
            Generated with ExamArena · {new Date(session.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="prose prose-invert prose-slate max-w-none
          prose-h1:text-3xl prose-h1:font-black prose-h1:text-slate-100
          prose-h2:text-2xl prose-h2:font-bold prose-h2:text-slate-100
          prose-h3:text-xl prose-h3:font-semibold prose-h3:text-slate-100
          prose-h4:text-lg prose-h4:font-bold prose-h4:text-slate-200
          prose-p:text-slate-300 prose-p:leading-relaxed
          prose-strong:text-slate-100
          prose-table:border-collapse
          prose-th:bg-slate-800 prose-th:text-slate-300 prose-th:px-4 prose-th:py-2 prose-th:border prose-th:border-slate-700
          prose-td:text-slate-300 prose-td:px-4 prose-td:py-2 prose-td:border prose-td:border-slate-700
          prose-code:text-indigo-300 prose-code:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
          prose-hr:border-slate-800">
          <div dangerouslySetInnerHTML={{ __html: require('marked').parse(content) }} />
        </div>

        <div className="mt-16 pt-8 border-t border-slate-800 text-center">
          <p className="text-slate-500 text-sm mb-4">Want to create your own AI exam study plan?</p>
          <a href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all text-sm">
            Try ExamArena Free →
          </a>
        </div>
      </div>
    </div>
  )
}
