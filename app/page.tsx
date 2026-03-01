'use client'

import React, { useState, useRef, useEffect } from 'react'
import { uploadPdfAction } from './actions/upload'
import { createSubjectAction } from './actions/subjects'
import { BookOpen, CheckCircle, FileText, UploadCloud, BrainCircuit, FileQuestion, GraduationCap, File as FileIcon, Loader2, Sparkles, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/atom-one-dark.css'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

type GeneratedPlan = {
  hitlist: { q: string, a: string }[],
  summaries: { unit: string, text: string }[],
  flashcards: { front: string, back: string }[]
} | null

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
}

const loadingSteps = [
  "Analyzing Syllabus & Context...",
  "Running Deep Pattern Recognition...",
  "Formulating High-Yield Questions...",
  "Structuring Answers & Mnemonics...",
  "Finalizing Exam Study Plan..."
]

export default function ExamDashboard() {
  const [subjectId, setSubjectId] = useState<string>('')

  // File Upload State
  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Configuration State
  const [urgency, setUrgency] = useState<'Cram' | 'Deep'>('Cram')
  const [examType, setExamType] = useState<'Internal' | 'Final'>('Internal')
  const [answerLength, setAnswerLength] = useState<'Short' | 'Long'>('Short')
  const [targetGrade, setTargetGrade] = useState<'Pass' | 'Top'>('Pass')
  const [explanationStyle, setExplanationStyle] = useState<'Academic' | 'Simplified'>('Simplified')
  const [isGenerating, setIsGenerating] = useState(false)
  const [loadingStepIndex, setLoadingStepIndex] = useState(0)

  // Output & Chat State
  const [messages, setMessages] = useState<Message[]>([])
  const [hasGenerated, setHasGenerated] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [targetUnit, setTargetUnit] = useState<number>(1)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up')
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastScrollTopRef = useRef<number>(0)
  const endOfMessagesRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function initSubject() {
      try {
        const res = await createSubjectAction()
        if (res.id) setSubjectId(res.id)
      } catch (err) {
        console.error('Failed to init subject', err)
      }
    }
    initSubject()
  }, [])

  useEffect(() => {
    // Only auto-scroll to the bottom when explicitly loading manual chat messages, avoiding yanking during syllabus generation.
    if (isChatLoading) {
      endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isChatLoading])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isGenerating) {
      interval = setInterval(() => {
        setLoadingStepIndex((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev))
      }, 3500)
    } else {
      setLoadingStepIndex(0)
    }
    return () => clearInterval(interval)
  }, [isGenerating])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    const selectedFiles = Array.from(e.target.files)
    setFiles((prev) => [...prev, ...selectedFiles])

    setUploading(true)
    for (const file of selectedFiles) {
      try {
        const formData = new FormData()
        formData.append('file', new Blob([await file.arrayBuffer()], { type: file.type }), file.name)
        formData.append('subjectId', subjectId)

        const data = await uploadPdfAction(formData)
        if (data.error) throw new Error(data.error)
      } catch (err: any) {
        console.error('Failed to upload', file.name, err)
        alert(`Failed to process ${file.name}: ${err.message}`)
      }
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const generateStudyPlan = async (isAppend = false) => {
    if (files.length === 0) {
      alert("Please upload at least one syllabus or PYQ document first.")
      return
    }

    setIsGenerating(true)

    let newTargetUnit = targetUnit;
    if (!isAppend) {
      newTargetUnit = 1;
      setTargetUnit(1);
    } else {
      newTargetUnit = targetUnit + 1;
      setTargetUnit(newTargetUnit);
    }

    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId, urgency, examType, answerLength, targetGrade, explanationStyle, isAppend, targetUnit: newTargetUnit })
      })

      if (!res.ok || !res.body) throw new Error('Failed to generate study plan')

      if (!isAppend) {
        setMessages([
          { role: 'assistant', content: '# 🎓 Survival Plan Generated\nI have analyzed your syllabus context. We are starting with **Unit 1**. You can ask me to explain any of these topics in deeper detail.' },
          { role: 'assistant', content: '' }
        ])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: `\n\n---\n\n# 🚀 CONTINUING TO UNIT ${newTargetUnit}\n\n` }])
      }
      setHasGenerated(true)

      const targetIdx = isAppend ? messages.length : 1;
      setTimeout(() => {
        document.getElementById(`message-${targetIdx}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 150)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedMessage = isAppend ? `\n\n---\n\n# 🚀 CONTINUING TO UNIT ${newTargetUnit}\n\n` : ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        accumulatedMessage += chunk
        setMessages(prev => {
          const updated = [...prev]
          let cleaned = accumulatedMessage;
          // Gemini stubbornly tries to bold short answers in a thousand different ways. Strip them all dynamically:
          cleaned = cleaned.replace(/\*\*(A|Answer|ANSWER):\*\*/gi, 'A:');
          cleaned = cleaned.replace(/\*\*(A|Answer|ANSWER):/gi, 'A:');
          cleaned = cleaned.replace(/(A|Answer|ANSWER):\s*\*\*(.*?)\*\*/gi, 'A: $2');
          cleaned = cleaned.replace(/(A|Answer|ANSWER):\s*\*\*/gi, 'A: ');

          updated[updated.length - 1].content = cleaned
          return updated
        })
      }

    } catch (err: any) {
      console.error(err)
      alert("Error generating plan: " + err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || isChatLoading) return

    const newMessages = [...messages, { role: 'user' as const, content: chatInput }]
    setMessages(newMessages)
    setChatInput('')
    setIsChatLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, subjectId })
      })

      if (!res.ok || !res.body) throw new Error('Failed to fetch')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])
      let accumulatedMessage = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        accumulatedMessage += decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1].content = accumulatedMessage
          return updated
        })
      }
    } catch (err) {
      console.error(err)
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error.' }])
    }
    setIsChatLoading(false)
  }

  const handleScroll = () => {
    if (!scrollContainerRef.current) return
    const { scrollTop } = scrollContainerRef.current

    if (scrollTop > lastScrollTopRef.current) {
      setScrollDirection('down')
    } else if (scrollTop < lastScrollTopRef.current) {
      setScrollDirection('up')
    }
    lastScrollTopRef.current = scrollTop

    setShowBackToTop(scrollTop > 500)
    setIsScrolling(true)

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false)
    }, 1500)
  }

  const scrollToTargetUnit = () => {
    // Scroll to the latest message which represents the current target unit.
    const targetId = `message-${messages.length > 0 ? messages.length - 1 : 0}`
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden selection:bg-indigo-500/30">

      {/* LEFT SIDEBAR: CONFIGURATION */}
      <div className="w-80 bg-slate-900 border-r border-slate-800 p-6 flex flex-col z-10 shadow-xl relative">
        <h2 className="text-2xl flex items-center gap-2 font-bold bg-gradient-to-br from-indigo-400 to-purple-500 bg-clip-text text-transparent mb-8 tracking-tight">
          <GraduationCap className="w-8 h-8 text-indigo-500" />
          Pro-Prep AI
        </h2>

        <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">

          {/* File Upload Section */}
          <section>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-slate-500" /> Knowledge Base
            </h3>
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={clsx(
                "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300",
                uploading ? "border-indigo-500/50 bg-indigo-500/10 opacity-70" : "border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/50"
              )}
            >
              <input
                type="file" multiple accept=".pdf,.doc,.docx,.png,.jpg" className="hidden" ref={fileInputRef} onChange={handleFileUpload} disabled={uploading}
              />
              <FileText className="w-8 h-8 text-indigo-400 mx-auto mb-3 opacity-80" />
              <p className="text-sm text-slate-300 font-medium">
                {uploading ? 'Parsing files...' : 'Drop Syllabus & PYQs'}
              </p>
              <p className="text-xs text-slate-500 mt-1">PDF, DOCX, Img</p>
            </div>

            <AnimatePresence>
              {files.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 flex flex-col gap-2">
                  {files.map((f, i) => (
                    <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }} key={i} className="flex items-center gap-3 p-2.5 bg-slate-800/50 rounded-lg border border-slate-700/50 text-xs text-slate-300">
                      <FileIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate">{f.name}</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Parameters Section */}
          <section>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-slate-500" /> Engine Parameters
            </h3>

            <div className="space-y-5">
              <div>
                <label className="text-xs text-slate-300 block mb-2 font-bold tracking-wide">Proximity / Urgency</label>
                <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-700/50">
                  <button onClick={() => setUrgency('Cram')} className={clsx("flex-1 text-sm py-2.5 rounded-lg font-bold transition-all", urgency === 'Cram' ? "bg-rose-600 text-white shadow-lg scale-[1.02]" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50")}>Tomorrow</button>
                  <button onClick={() => setUrgency('Deep')} className={clsx("flex-1 text-sm py-2.5 rounded-lg font-bold transition-all", urgency === 'Deep' ? "bg-indigo-600 text-white shadow-lg scale-[1.02]" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50")}>Deep Study</button>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-2 font-bold tracking-wide">Exam Standard</label>
                <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-700/50">
                  <button onClick={() => setExamType('Internal')} className={clsx("flex-1 text-sm py-2.5 rounded-lg font-bold transition-all", examType === 'Internal' ? "bg-emerald-600 text-white shadow-lg scale-[1.02]" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50")}>Internal/Mid</button>
                  <button onClick={() => setExamType('Final')} className={clsx("flex-1 text-sm py-2.5 rounded-lg font-bold transition-all", examType === 'Final' ? "bg-indigo-600 text-white shadow-lg scale-[1.02]" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50")}>University</button>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-2 font-bold tracking-wide">Target Grade Strategy</label>
                <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-700/50">
                  <button onClick={() => setTargetGrade('Pass')} className={clsx("flex-1 text-sm py-2.5 rounded-lg font-bold transition-all", targetGrade === 'Pass' ? "bg-amber-600 text-white shadow-lg scale-[1.02]" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50")}>Guaranteed Pass</button>
                  <button onClick={() => setTargetGrade('Top')} className={clsx("flex-1 text-sm py-2.5 rounded-lg font-bold transition-all", targetGrade === 'Top' ? "bg-indigo-600 text-white shadow-lg scale-[1.02]" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50")}>Top Ranker (100%)</button>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-2 font-bold tracking-wide">Explanation Style</label>
                <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-700/50">
                  <button onClick={() => setExplanationStyle('Simplified')} className={clsx("flex-1 text-sm py-2.5 rounded-lg font-bold transition-all", explanationStyle === 'Simplified' ? "bg-purple-600 text-white shadow-lg scale-[1.02]" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50")}>Simple Explanation</button>
                  <button onClick={() => setExplanationStyle('Academic')} className={clsx("flex-1 text-sm py-2.5 rounded-lg font-bold transition-all", explanationStyle === 'Academic' ? "bg-indigo-600 text-white shadow-lg scale-[1.02]" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50")}>Strict Academic</button>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-2 font-bold tracking-wide">Output Depth (Speed)</label>
                <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-700/50">
                  <button onClick={() => setAnswerLength('Short')} className={clsx("flex-1 text-sm py-2.5 rounded-lg font-bold transition-all", answerLength === 'Short' ? "bg-emerald-600 text-white shadow-lg scale-[1.02]" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50")}>Fast & Concise</button>
                  <button onClick={() => setAnswerLength('Long')} className={clsx("flex-1 text-sm py-2.5 rounded-lg font-bold transition-all", answerLength === 'Long' ? "bg-amber-600 text-white shadow-lg scale-[1.02]" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50")}>10-Mark Detailed</button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Generate Button Fixed to Bottom */}
        <div className="pt-6 border-t border-slate-800 mt-2">
          <button
            onClick={() => generateStudyPlan(false)}
            disabled={isGenerating || uploading}
            className="w-full relative overflow-hidden group py-3.5 px-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition-all focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 ease-in-out transition-transform"></div>
            {isGenerating ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Igniting Engine...</>
            ) : (
              <><Sparkles className="w-5 h-5" /> Generate Action Plan</>
            )}
          </button>
        </div>
      </div>

      {/* MAIN AREA: TABS & CONTENT */}
      <div className="flex-1 flex flex-col relative bg-[#09090b] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]">

        {/* Loading Overlay */}
        <AnimatePresence>
          {isGenerating && (messages.length === 0) && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm"
            >
              <motion.div
                animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                className="w-24 h-24 border-t-2 border-r-2 border-indigo-500 rounded-full mb-8"
              />
              <div className="h-8 overflow-hidden relative w-full max-w-sm text-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={loadingStepIndex}
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
                    className="text-indigo-400 font-medium tracking-wide"
                  >
                    {loadingSteps[loadingStepIndex]}
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="w-64 h-1 bg-slate-800 rounded-full mt-4 overflow-hidden">
                <motion.div
                  initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 15, ease: "easeOut" }}
                  className="h-full bg-indigo-500 rounded-full"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!hasGenerated && !isGenerating ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col items-center justify-center text-center px-8 text-slate-500">
            <div className="w-24 h-24 mb-6 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-2xl">
              <GraduationCap className="w-12 h-12 text-slate-700" />
            </div>
            <h2 className="text-3xl font-bold text-slate-200 mb-3 tracking-tight">Arena Awaiting Context</h2>
            <p className="text-slate-400 max-w-md text-lg">Load your parameters on the left to synthesize the ultimate exam survival protocol.</p>
          </motion.div>
        ) : hasGenerated ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col min-h-0 relative">

            {/* Header Area */}
            <div className="border-b border-slate-800 px-8 py-6 bg-slate-900/50 backdrop-blur-md sticky top-0 z-20 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-indigo-500 rounded-full"></div>
                <h3 className="text-2xl font-bold text-slate-100 tracking-tight">Active Survival Plan</h3>
              </div>
            </div>

            {/* Chat/Markdown Feed */}
            <div
              className="flex-1 overflow-y-auto px-6 py-12 md:px-12 scroll-smooth custom-scrollbar relative"
              ref={scrollContainerRef}
              onScroll={handleScroll}
            >
              <div className="max-w-4xl 2xl:max-w-5xl mx-auto pb-40 flex flex-col gap-10">
                {messages.map((m, idx) => (
                  <div key={idx} id={`message-${idx}`} className={clsx("flex font-sans", m.role === 'user' ? "justify-end" : "justify-start")}>
                    {m.role === 'user' ? (
                      <div className="max-w-[85%] bg-indigo-600 text-white p-5 rounded-3xl rounded-tr-sm shadow-md text-lg leading-relaxed antialiased ml-auto">
                        {m.content}
                      </div>
                    ) : (
                      <div className="w-full text-slate-200 antialiased flex flex-col gap-6">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex, rehypeHighlight]}
                          components={{
                            h1: ({ node, ...props }) => <h1 className="text-4xl md:text-5xl font-black text-slate-100 tracking-tight mt-12 mb-6 border-b border-slate-800 pb-4" {...props} />,
                            h2: ({ node, ...props }) => <h2 className="text-2xl md:text-3xl font-bold text-slate-100 mt-10 mb-4" {...props} />,
                            h3: ({ node, ...props }) => <h3 className="text-xl md:text-2xl font-bold text-slate-200 mt-10 mb-6 bg-slate-900/60 p-4 border-l-4 border-indigo-500 rounded-r-lg uppercase tracking-wider" {...props} />,
                            h4: ({ node, ...props }) => <h4 className="text-xl md:text-[1.35rem] font-bold text-slate-100 mt-8 mb-3 tracking-tight" {...props} />,
                            p: ({ node, ...props }) => <p className="text-lg md:text-[1.125rem] leading-[1.8] text-slate-300 md:mb-5 tracking-wide" {...props} />,
                            ul: ({ node, ...props }) => <ul className="list-disc leading-[1.8] text-lg md:text-[1.125rem] pl-8 mb-6 space-y-3 text-slate-300" {...props} />,
                            ol: ({ node, ...props }) => <ol className="list-decimal leading-[1.8] text-lg md:text-[1.125rem] pl-8 mb-6 space-y-3 text-slate-300" {...props} />,
                            li: ({ node, ...props }) => <li className="pl-2" {...props} />,
                            strong: ({ node, ...props }) => <strong className="font-bold text-white" {...props} />,
                            a: ({ node, ...props }) => <a className="text-indigo-400 font-medium hover:text-indigo-300 hover:underline underline-offset-4 transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
                            blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-slate-600 pl-4 italic text-slate-400 my-6 bg-slate-900/30 py-2 pr-4 rounded-r-lg" {...props} />,
                            hr: ({ node, ...props }) => <hr className="border-slate-800 border-t-2 my-12" {...props} />,
                            table: ({ node, ...props }) => (
                              <div className="overflow-x-auto my-8 rounded-xl ring-1 ring-slate-700/50 bg-slate-900/20">
                                <table className="w-full text-left border-collapse" {...props} />
                              </div>
                            ),
                            thead: ({ node, ...props }) => <thead className="bg-slate-800/80 border-b border-slate-700 text-slate-300 text-sm uppercase tracking-wider" {...props} />,
                            th: ({ node, ...props }) => <th className="px-6 py-4 font-bold" {...props} />,
                            td: ({ node, ...props }) => <td className="px-6 py-4 border-b border-slate-800/50 text-slate-300 bg-slate-900/30" {...props} />,
                            tr: ({ node, ...props }) => <tr className="hover:bg-slate-800/20 transition-colors" {...props} />,
                            pre: ({ node, children, ...props }: any) => {
                              let language = 'Code'
                              const childArray = React.Children.toArray(children)
                              const codeElement = childArray[0]
                              if (React.isValidElement(codeElement)) {
                                const childProps: any = codeElement.props || {}
                                if (childProps.className) {
                                  const match = /language-(\w+)/.exec(childProps.className)
                                  if (match) language = match[1]
                                }
                                return (
                                  <div className="my-8 rounded-xl overflow-hidden ring-1 ring-slate-700/50 shadow-2xl bg-[#0d1117]">
                                    <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700/50 text-xs text-slate-400 font-mono uppercase flex justify-between items-center tracking-wider">
                                      <span>{language}</span>
                                    </div>
                                    <pre className="p-5 overflow-x-auto text-[0.95rem] leading-relaxed" {...props}>
                                      {React.cloneElement(codeElement, { 'data-block': true } as any)}
                                    </pre>
                                  </div>
                                )
                              }
                              return <pre {...props}>{children}</pre>
                            },
                            code: ({ node, className, children, "data-block": isBlock, ...props }: any) => {
                              if (isBlock || (className && className.includes('language-'))) {
                                return <code className={className} {...props}>{children}</code>
                              }
                              return (
                                <code className="bg-slate-800/80 text-indigo-300 px-2 py-1 rounded-md font-mono text-[0.9em] border border-slate-700/50" {...props}>
                                  {children}
                                </code>
                              )
                            }
                          }}
                        >{m.content || '*Incoming transmission...*'}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                ))}

                {/* Inline Action Buttons at End of Feed */}
                {!isGenerating && !isChatLoading && messages.length > 0 && (
                  <div className="flex items-center gap-4 mt-8 pt-8 border-t border-slate-800/50 justify-center">
                    <button
                      onClick={() => generateStudyPlan(true)}
                      className="flex items-center gap-2 px-6 py-3.5 bg-fuchsia-600/20 hover:bg-fuchsia-600/40 text-fuchsia-200 border border-fuchsia-500/30 font-bold rounded-xl transition-all shadow-lg"
                    >
                      <BrainCircuit className="w-5 h-5 text-fuchsia-400" />
                      Continue to Unit {targetUnit + 1}
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-2 px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl border border-slate-700 transition-all font-sans"
                    >
                      <FileIcon className="w-5 h-5 text-slate-400" />
                      Export Feed to PDF
                    </button>
                  </div>
                )}
                <div ref={endOfMessagesRef} className="h-4"></div>
              </div>

              {/* Smart Back to Top/Bottom FAB */}
              <AnimatePresence>
                {showBackToTop && isScrolling && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 20 }}
                    onClick={scrollDirection === 'up' ? scrollToTargetUnit : scrollToBottom}
                    className="fixed bottom-32 right-12 z-50 p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-2xl transition-colors focus:ring-4 focus:ring-indigo-500/50 flex items-center justify-center group"
                    title={scrollDirection === 'up' ? "Back to Top of Current Unit" : "Scroll to Bottom"}
                  >
                    {scrollDirection === 'up' ? (
                      <ArrowUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
                    ) : (
                      <ArrowDown className="w-6 h-6 group-hover:translate-y-1 transition-transform" />
                    )}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Sticky Chat Input Bar (ChatGPT Style) */}
            <div className="bg-slate-900/80 backdrop-blur-xl border-t border-slate-800 p-6">
              <div className="max-w-4xl 2xl:max-w-5xl mx-auto">
                <form onSubmit={handleSendMessage} className="relative flex items-center shadow-2xl">
                  <input
                    type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask a question about the study plan... (e.g., Explain Finite Automata step-by-step)"
                    disabled={isChatLoading || isGenerating}
                    className="w-full pl-6 pr-16 py-4 bg-slate-950/80 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none text-lg text-slate-100 transition-all placeholder:text-slate-500 font-sans shadow-inner"
                  />
                  <button type="submit" disabled={!chatInput.trim() || isChatLoading || isGenerating} className="absolute right-3 aspect-square flex items-center justify-center p-2 bg-indigo-600 shadow-md text-white rounded-xl hover:bg-indigo-500 disabled:opacity-40 disabled:bg-slate-800 disabled:text-slate-600 transition-colors">
                    <span className="font-black text-xl leading-none">↑</span>
                  </button>
                </form>
              </div>
            </div>

          </motion.div>
        ) : null}

      </div>

    </div>
  )
}