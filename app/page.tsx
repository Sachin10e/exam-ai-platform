'use client'

import { useState, useRef, useEffect } from 'react'
import { uploadPdfAction } from './actions/upload'
import { createSubjectAction } from './actions/subjects'
import { BookOpen, CheckCircle, FileText, UploadCloud, BrainCircuit, MessageSquareText, FileQuestion, GraduationCap, File as FileIcon, Loader2, Sparkles, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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
  const [examType, setExamType] = useState<'Internal' | 'Final'>('Final')
  const [answerLength, setAnswerLength] = useState<'Short' | 'Long'>('Long')
  const [targetGrade, setTargetGrade] = useState<'Pass' | 'Top'>('Top')
  const [explanationStyle, setExplanationStyle] = useState<'Academic' | 'Simplified'>('Academic')
  const [isGenerating, setIsGenerating] = useState(false)
  const [loadingStepIndex, setLoadingStepIndex] = useState(0)

  // Output State
  const [activeTab, setActiveTab] = useState<'Hitlist' | 'Summaries' | 'Flashcards'>('Hitlist')
  const [plan, setPlan] = useState<GeneratedPlan>(null)
  const [memorizedQs, setMemorizedQs] = useState<Set<number>>(new Set())

  // Sidekick Chat State
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const endOfMessagesRef = useRef<HTMLDivElement>(null)

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
    if (chatOpen) endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, chatOpen])

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
      } catch (err) {
        console.error('Failed to upload', file.name, err)
        alert(`Failed to process ${file.name}. Ensure Ollama is running.`)
      }
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const generateStudyPlan = async () => {
    if (files.length === 0) {
      alert("Please upload at least one syllabus or PYQ document first.")
      return
    }

    setIsGenerating(true)

    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId, urgency, examType, answerLength, targetGrade, explanationStyle })
      })

      if (!res.ok) throw new Error('Failed to generate study plan')

      const data = await res.json()
      setPlan(data)
      setMemorizedQs(new Set())

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
                <label className="text-xs text-slate-500 block mb-2 font-medium">Proximity / Urgency</label>
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button onClick={() => setUrgency('Cram')} className={clsx("flex-1 text-xs py-2 rounded-md font-semibold transition-all", urgency === 'Cram' ? "bg-slate-800 text-rose-400 shadow-sm" : "text-slate-500 hover:text-slate-300")}>Tomorrow</button>
                  <button onClick={() => setUrgency('Deep')} className={clsx("flex-1 text-xs py-2 rounded-md font-semibold transition-all", urgency === 'Deep' ? "bg-slate-800 text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-300")}>Deep Study</button>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-2 font-medium">Exam Standard</label>
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button onClick={() => setExamType('Internal')} className={clsx("flex-1 text-xs py-2 rounded-md font-semibold transition-all", examType === 'Internal' ? "bg-slate-800 text-slate-200 shadow-sm" : "text-slate-500 hover:text-slate-300")}>Internal/Mid</button>
                  <button onClick={() => setExamType('Final')} className={clsx("flex-1 text-xs py-2 rounded-md font-semibold transition-all", examType === 'Final' ? "bg-slate-800 text-slate-200 shadow-sm" : "text-slate-500 hover:text-slate-300")}>University</button>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-2 font-medium">Target Grade Strategy</label>
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button onClick={() => setTargetGrade('Pass')} className={clsx("flex-1 text-xs py-2 rounded-md font-semibold transition-all", targetGrade === 'Pass' ? "bg-slate-800 text-amber-400 shadow-sm" : "text-slate-500 hover:text-slate-300")}>Guaranteed Pass</button>
                  <button onClick={() => setTargetGrade('Top')} className={clsx("flex-1 text-xs py-2 rounded-md font-semibold transition-all", targetGrade === 'Top' ? "bg-slate-800 text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-300")}>Top Ranker (100%)</button>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-2 font-medium">Explanation Style</label>
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button onClick={() => setExplanationStyle('Simplified')} className={clsx("flex-1 text-xs py-2 rounded-md font-semibold transition-all", explanationStyle === 'Simplified' ? "bg-slate-800 text-emerald-400 shadow-sm" : "text-slate-500 hover:text-slate-300")}>ELI5 / Simple</button>
                  <button onClick={() => setExplanationStyle('Academic')} className={clsx("flex-1 text-xs py-2 rounded-md font-semibold transition-all", explanationStyle === 'Academic' ? "bg-slate-800 text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-300")}>Strict Academic</button>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-2 font-medium">Output Depth (Speed)</label>
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button onClick={() => setAnswerLength('Short')} className={clsx("flex-1 text-xs py-2 rounded-md font-semibold transition-all", answerLength === 'Short' ? "bg-slate-800 text-emerald-400 shadow-sm" : "text-slate-500 hover:text-slate-300")}>Fast & Concise</button>
                  <button onClick={() => setAnswerLength('Long')} className={clsx("flex-1 text-xs py-2 rounded-md font-semibold transition-all", answerLength === 'Long' ? "bg-slate-800 text-amber-400 shadow-sm" : "text-slate-500 hover:text-slate-300")}>10-Mark Detailed</button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Generate Button Fixed to Bottom */}
        <div className="pt-6 border-t border-slate-800 mt-2">
          <button
            onClick={generateStudyPlan}
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
          {isGenerating && (
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

        {!plan && !isGenerating ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col items-center justify-center text-center px-8 text-slate-500">
            <div className="w-24 h-24 mb-6 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-2xl">
              <GraduationCap className="w-12 h-12 text-slate-700" />
            </div>
            <h2 className="text-3xl font-bold text-slate-200 mb-3 tracking-tight">Arena Awaiting Context</h2>
            <p className="text-slate-400 max-w-md text-lg">Load your parameters on the left to synthesize the ultimate exam survival protocol.</p>
          </motion.div>
        ) : plan ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col min-h-0">
            {/* Tabs Header */}
            <div className="border-b border-slate-800 px-8 pt-6 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
              <div className="flex gap-8">
                {[
                  { id: 'Hitlist', icon: FileQuestion, label: 'Expected Hitlist' },
                  { id: 'Summaries', icon: BookOpen, label: 'Unit Summaries' },
                  { id: 'Flashcards', icon: CheckCircle, label: 'Flashcards' }
                ].map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={clsx(
                        "pb-4 px-2 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all",
                        isActive ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700"
                      )}
                    >
                      <Icon className="w-4 h-4" /> {tab.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Tab Content Area */}
            <div className="flex-1 overflow-y-auto p-8 scroll-smooth custom-scrollbar">
              <div className="max-w-4xl mx-auto pb-24">

                {/* Progress Bar */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-xl flex items-center gap-6 backdrop-blur-md">
                  <div className="font-bold text-slate-300 w-48 shrink-0 flex justify-between items-center">
                    <span className="text-xs uppercase tracking-widest text-slate-500">Completion</span>
                    <span className="text-emerald-400 text-xl tracking-tighter">
                      {Math.round((memorizedQs.size / (plan.hitlist.length || 1)) * 100)}%
                    </span>
                  </div>
                  <div className="flex-1 bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <motion.div
                      className="bg-emerald-500 h-full relative"
                      initial={{ width: 0 }}
                      animate={{ width: `${(memorizedQs.size / (plan.hitlist.length || 1)) * 100}%` }}
                      transition={{ type: "spring", bounce: 0, duration: 1 }}
                    >
                      <div className="absolute inset-0 bg-white/20"></div>
                    </motion.div>
                  </div>
                </motion.div>

                <AnimatePresence mode="wait">
                  {activeTab === 'Hitlist' && (
                    <motion.div key="hitlist" variants={containerVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-6">
                      <div className="flex items-center gap-3 mb-8 border-b border-slate-800 pb-4">
                        <div className="h-8 w-1 bg-indigo-500 rounded-full"></div>
                        <h3 className="text-2xl font-bold text-slate-100 tracking-tight">High-Yield Hitlist</h3>
                      </div>
                      {plan.hitlist.map((item, i) => {
                        const isMemorized = memorizedQs.has(i)
                        return (
                          <motion.div variants={itemVariants} key={i} className={clsx(
                            "p-6 rounded-2xl border shadow-xl relative group transition-all duration-300 bg-slate-900/40 backdrop-blur-sm",
                            isMemorized ? 'border-emerald-500/30 bg-emerald-950/20' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                          )}>
                            <div className="absolute top-6 right-6 flex items-center gap-4 z-10">
                              {!isMemorized && <span className="text-[10px] font-bold text-rose-400 bg-rose-400/10 border border-rose-400/20 px-2 py-1 rounded tracking-widest uppercase">Target</span>}
                              <label className="flex items-center gap-2 cursor-pointer bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors">
                                <input
                                  type="checkbox" checked={isMemorized}
                                  className="w-4 h-4 text-emerald-500 rounded border-slate-700 focus:ring-emerald-500 focus:ring-offset-slate-900 bg-slate-900"
                                  onChange={(e) => {
                                    const next = new Set(memorizedQs)
                                    e.target.checked ? next.add(i) : next.delete(i)
                                    setMemorizedQs(next)
                                  }}
                                />
                                <span className={clsx("text-xs font-bold tracking-wide", isMemorized ? 'text-emerald-400' : 'text-slate-400')}>Mark Complete</span>
                              </label>
                            </div>
                            <h4 className={clsx("text-xl font-bold mb-5 pr-40 leading-snug transition-colors", isMemorized ? 'text-emerald-200/50' : 'text-slate-100')}>
                              <span className="text-indigo-500 mr-2">Q{i + 1}.</span> {item.q}
                            </h4>
                            {/* React Markdown handles tables, robust lists, and prose flawlessly */}
                            <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed prose-strong:text-indigo-300 prose-strong:font-bold prose-p:mb-4 prose-a:text-indigo-400 prose-table:w-full prose-table:border-collapse prose-th:bg-slate-800/80 prose-th:border prose-th:border-slate-700 prose-td:border prose-td:border-slate-700/50 prose-th:p-3 prose-td:p-3 prose-td:bg-slate-800/20 prose-li:my-1">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.a}</ReactMarkdown>
                            </div>
                            <div className="mt-6 pt-4 border-t border-slate-800/50">
                              <button
                                onClick={() => { setChatOpen(true); setChatInput(`Can you explain the answer to: "${item.q}" in simpler terms?`); }}
                                className="text-xs font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2 hover:text-indigo-300 transition-colors"
                              >
                                <MessageSquareText className="w-4 h-4" /> Dive Deeper <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </motion.div>
                        )
                      })}
                    </motion.div>
                  )}

                  {activeTab === 'Summaries' && (
                    <motion.div key="summaries" variants={containerVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-6">
                      <div className="flex items-center gap-3 mb-8 border-b border-slate-800 pb-4">
                        <div className="h-8 w-1 bg-purple-500 rounded-full"></div>
                        <h3 className="text-2xl font-bold text-slate-100 tracking-tight">Architectural Architectures</h3>
                      </div>
                      {plan.summaries.map((item, i) => (
                        <motion.div variants={itemVariants} key={i} className="bg-slate-900/40 p-8 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm">
                          <h4 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>{item.unit}
                          </h4>
                          <div className="prose prose-invert prose-sm max-w-none text-slate-400 leading-loose prose-strong:text-purple-300 prose-strong:font-bold">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.text}</ReactMarkdown>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  {activeTab === 'Flashcards' && (
                    <motion.div key="flashcards" variants={containerVariants} initial="hidden" animate="visible" exit="hidden" className="grid grid-cols-2 gap-6">
                      {plan.flashcards.map((item, i) => (
                        <motion.div variants={itemVariants} key={i} className="bg-slate-900/40 p-8 rounded-2xl border border-slate-800 shadow-xl text-center flex flex-col justify-center min-h-[200px] cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-950/20 transition-all group backdrop-blur-sm">
                          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/0 to-transparent group-hover:via-indigo-500/50 transition-all rounded-t-2xl"></div>
                          <h4 className="font-bold text-lg text-slate-200 group-hover:hidden transition-all">{item.front}</h4>
                          <div className="text-indigo-300 font-medium hidden group-hover:block transition-all leading-relaxed text-sm px-4">{item.back}</div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        ) : null}

        {/* Floating Sidekick Toggle Button (if closed) */}
        {!chatOpen && plan && (
          <motion.button
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            onClick={() => setChatOpen(true)}
            className="absolute bottom-8 right-8 bg-indigo-600 text-white p-4 rounded-full shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:scale-105 hover:bg-indigo-500 transition-all group flex items-center gap-3 border border-indigo-400/30"
          >
            <MessageSquareText className="w-6 h-6" />
            <span className="font-bold tracking-wide overflow-hidden max-w-0 group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">Summon Sidekick</span>
          </motion.button>
        )}
      </div>

      {/* RIGHT SLIDE-OUT PANEL: TUTOR SIDEKICK */}
      <div className={clsx(
        "w-[450px] bg-slate-900 border-l border-slate-800 flex flex-col transition-transform duration-500 shadow-2xl z-20 absolute right-0 top-0 bottom-0",
        chatOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <h3 className="font-bold text-slate-200 flex items-center gap-3">
            <MessageSquareText className="w-5 h-5 text-indigo-400" /> Active Session
          </h3>
          <button onClick={() => setChatOpen(false)} className="text-slate-500 hover:text-slate-300 p-2 rounded-lg hover:bg-slate-800 transition-colors">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar bg-slate-900">
          <div className="bg-indigo-950/30 text-indigo-200/80 p-4 rounded-2xl rounded-tl-sm border border-indigo-500/20 text-sm leading-relaxed backdrop-blur-sm shadow-sm">
            I am your dedicated academic co-pilot. Drop any term or Hitlist question here, and I'll break it down into molecular detail.
          </div>
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={clsx(
                "max-w-[85%] rounded-2xl p-4 text-sm shadow-sm leading-relaxed",
                m.role === 'user'
                  ? 'bg-indigo-600/90 text-white rounded-br-sm backdrop-blur-md'
                  : 'bg-slate-800 text-slate-200 rounded-bl-sm border border-slate-700/50'
              )}>
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
            </div>
          ))}
          <div ref={endOfMessagesRef} />
        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <form onSubmit={handleSendMessage} className="relative">
            <input
              type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
              placeholder="Query the database..." disabled={isChatLoading}
              className="w-full pl-4 pr-12 py-3.5 bg-slate-900 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none text-sm text-slate-200 transition-all placeholder:text-slate-600"
            />
            <button type="submit" disabled={!chatInput.trim() || isChatLoading} className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-indigo-600 shadow-md text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-600 transition-colors">
              <span className="font-bold text-lg leading-none">↑</span>
            </button>
          </form>
        </div>
      </div>

    </div>
  )
}