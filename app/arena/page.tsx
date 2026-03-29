/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import React, { useState, useRef, useEffect } from 'react'
import { uploadPdfAction } from '../actions/upload'
import { createSubjectAction } from '../actions/subjects'
import { Download, FileText, Send, Loader2, Target, Briefcase, Zap, BrainCircuit, Sparkles, ChevronFirst, PenTool, LayoutTemplate, Clock4, FlaskConical, LayoutDashboard, History, Settings, Settings2, LogOut, Search, CheckCircle2, Copy, Bookmark, MoreVertical, X, Share2, Printer, ListTodo, GraduationCap, CheckCircle, UploadCloud, File as FileIcon, ChevronRight, ArrowUp, ArrowDown, PanelLeftClose, PanelLeftOpen, PlusCircle, Clock, Circle, BarChart3, AlignLeft, RefreshCcw, Lock, ArrowRight, BookOpen, Layers, Maximize2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
const ReactMarkdown = dynamic(() => import('react-markdown'), { 
  ssr: false, 
  loading: () => (
    <div className="animate-pulse flex flex-col gap-5 my-6">
      <div className="h-8 bg-slate-800/40 rounded-lg w-1/3"></div>
      <div className="h-4 bg-slate-800/40 rounded w-full"></div>
      <div className="h-4 bg-slate-800/40 rounded w-5/6"></div>
      <div className="h-4 bg-slate-800/40 rounded w-11/12"></div>
    </div>
  ) 
})
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/github-dark.css'
import FlashcardDeck, { Flashcard } from '../components/study/FlashcardDeck'
import dynamic from 'next/dynamic'
import type { ExamQuestion } from '../components/study/MockExamModal'
const MockExamModal = dynamic(() => import('../components/study/MockExamModal'), { ssr: false })
const MermaidDiagram = dynamic(() => import('../components/ai/MermaidDiagram'), { ssr: false })
import { saveSession, getSessions, getSessionById, StudySessionMeta } from '../actions/sessions'
import { logStudyEvent } from '../actions/analytics'
import { getUnitProgress } from '@/lib/analytics/unitProgress'
import PomodoroTimer from '../components/study/PomodoroTimer'
import { AIResponse } from '../types'
import { getLastSessionId, setLastSessionId } from '../actions/preferences'
import { useToast } from '../components/ui/Toast'

// Local binding obsolete, using AIResponse globally

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

const ThrottledMarkdown = React.memo(({ content }: { content: string }) => {
  const [displayContent, setDisplayContent] = useState(content);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    const now = Date.now();
    // 5 FPS Throttle (200ms threshold)
    if (now - lastUpdateRef.current >= 200) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayContent(content);
      lastUpdateRef.current = now;
    } else {
      // Ensure the final chunk strictly renders when the stream terminates
      const timer = setTimeout(() => {
        setDisplayContent(content);
        lastUpdateRef.current = Date.now();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [content]);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex, rehypeHighlight]}
      components={{
        h1: ({ node, ...props }) => <h1 className="text-4xl md:text-5xl font-black text-slate-100 print:text-[#1E1E1E] tracking-tight mt-14 mb-8 border-b border-slate-700/50 print:border-[#E5E7EB] pb-4" {...props} />,
        h2: ({ node, ...props }) => <h2 className="text-3xl md:text-[2rem] font-bold text-slate-100 print:text-[#1E1E1E] mt-12 mb-6" {...props} />,
        h3: ({ node, ...props }) => <h3 className="text-2xl md:text-[1.65rem] font-semibold text-slate-100 print:text-[#1E1E1E] mt-10 mb-5" {...props} />,
        h4: ({ node, ...props }) => <h4 className="text-xl md:text-[1.35rem] font-bold text-slate-100 mt-10 mb-4 tracking-tight" {...props} />,
        p: ({ node, children, ...props }) => {
          const text = String(children || '');
          // Hide entire paragraph if it's a Web Search or YouTube resource link line (for print/notes)
          if (text.startsWith('Web Search:') || text.startsWith('YouTube:')) {
            return <p className="text-[1.15rem] md:text-[1.25rem] leading-[1.9] text-slate-100 print:text-[#1E1E1E] mb-8 font-normal print:hidden" {...props}>{children}</p>;
          }
          return <p className="text-[1.15rem] md:text-[1.25rem] leading-[1.9] text-slate-100 print:text-[#1E1E1E] mb-8 font-normal" {...props}>{children}</p>;
        },
        ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-8 space-y-4 text-[1.15rem] md:text-[1.25rem] leading-[1.9] text-slate-100 print:text-[#1E1E1E] font-normal" {...props} />,
        ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-8 space-y-4 text-[1.15rem] md:text-[1.25rem] leading-[1.9] text-slate-100 print:text-[#1E1E1E] font-normal" {...props} />,
        li: ({ node, ...props }) => <li className="pl-2" {...props} />,
        strong: ({ node, children, ...props }) => {
          const text = String(children || '');
          if (text === 'Web Search:' || text === 'YouTube:') {
            return <strong className="font-bold text-slate-100 print:text-black print:hidden" {...props}>{children}</strong>;
          }
          return <strong className="font-bold text-slate-100 print:text-black" {...props}>{children}</strong>;
        },
        em: ({ node, ...props }) => <em className="italic text-slate-200 print:text-black" {...props} />,
        a: ({ node, href, ...props }) => {
          const isResourceLink = href && (href.includes('google.com/search') || href.includes('youtube.com/results'));
          return <a className={`text-blue-300 hover:text-blue-200 print:text-blue-700 underline underline-offset-4 ${isResourceLink ? 'print:hidden' : ''}`} target="_blank" rel="noopener noreferrer" href={href} {...props} />;
        },
        blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-slate-600 pl-6 py-2 my-6 italic text-slate-200 print:text-[#1E1E1E] bg-slate-800/20 print:bg-slate-50 rounded-r-xl" {...props} />,
        hr: ({ node, ...props }) => <hr className="border-slate-800 border-t-2 my-12" {...props} />,
        table: ({ node, ...props }) => (
          <div className="overflow-x-auto my-8 rounded-xl ring-1 ring-slate-700/50 bg-slate-900/20 shadow-lg block max-w-full">
            <table className="w-full text-left border-collapse min-w-[600px]" {...props} />
          </div>
        ),
        thead: ({ node, ...props }) => <thead className="bg-slate-800/80 border-b-2 border-slate-700 text-slate-300 text-sm uppercase tracking-wider" {...props} />,
        th: ({ node: _n1, ...props }) => <th className="px-6 py-4 font-bold border border-slate-700/50 whitespace-nowrap" {...props} />,
        td: ({ node: _n2, ...props }) => <td className="px-6 py-4 border border-slate-700/50 text-slate-300 font-normal leading-relaxed" {...props} />,
        tr: ({ node: _n3, ...props }) => <tr className="hover:bg-slate-800/40 even:bg-slate-800/20 transition-colors" {...props} />,
        pre: ({ node: _n4, children, ...props }: React.ComponentPropsWithoutRef<'pre'> & { node?: unknown }) => {
          let language = 'Code'
          const childArray = React.Children.toArray(children)
          const codeElement = childArray[0]
          if (React.isValidElement(codeElement)) {
            const childProps: React.ComponentPropsWithoutRef<'code'> = (codeElement as React.ReactElement).props || {}
            if (childProps.className) {
              const match = /language-(\w+)/.exec(childProps.className)
              if (match) language = match[1]

              // 🌟 MERMAID DIAGRAM INTERCEPTOR 🌟
              if (language === 'mermaid') {
                return (
                  <div className="my-8 rounded-xl bg-slate-900 p-4 border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.2)] overflow-x-auto print:break-inside-avoid">
                    <MermaidDiagram chart={String(childProps.children).replace(/\n$/, '')} />
                  </div>
                )
              }
            }
            return (
              <div className="my-8 rounded-xl overflow-hidden ring-1 ring-slate-700/50 print:ring-slate-300 shadow-2xl print:shadow-md bg-[#0d1117] print:bg-white">
                <div className="px-4 py-3 bg-slate-800/80 print:bg-slate-100 border-b border-slate-700/50 print:border-slate-300 text-xs text-slate-400 print:text-slate-600 font-mono uppercase flex justify-between items-center tracking-wider">
                  <span>{language}</span>
                </div>
                <pre className="p-5 overflow-x-auto text-[0.95rem] leading-relaxed print:text-black" {...props}>
                  {React.cloneElement(codeElement as React.ReactElement<Record<string, unknown>>, { 'data-block': true })}
                </pre>
              </div>
            )
          }
          return <pre className="p-5 overflow-x-auto text-[0.95rem] leading-relaxed" {...props}>{children}</pre>
        },
        code: ({ node: _n5, className, children, "data-block": isBlock, ...props }: React.ComponentPropsWithoutRef<'code'> & { node?: unknown, "data-block"?: boolean }) => {
          if (isBlock || (className && className.includes('language-'))) {
            return <code className={className} {...props}>{children}</code>
          }
          return (
            <code className="bg-slate-800/80 print:bg-slate-100 text-indigo-300 print:text-indigo-700 px-2 py-1 rounded-md font-mono text-[0.9em] border border-slate-700/50 print:border-slate-300" {...props}>
              {children}
            </code>
          )
        }
      }}
    >
      {displayContent}
    </ReactMarkdown>
  );
});
ThrottledMarkdown.displayName = "ThrottledMarkdown";

export default function ExamDashboard() {
  const { toast } = useToast()
  const [subjectId, setSubjectId] = useState<string>('')

  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sidebar Toggle State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [guestContextText, setGuestContextText] = useState('')

  // Configuration State
  const [urgency, setUrgency] = useState<'Cram' | 'Deep'>('Cram')
  const [examType, setExamType] = useState<'Mid' | 'Semester'>('Mid')
  const [midType, setMidType] = useState<'Mid 1' | 'Mid 2'>('Mid 1')
  const [answerLength, setAnswerLength] = useState<'Short' | 'Long'>('Short')
  const [targetGrade, setTargetGrade] = useState<'Pass' | 'Top'>('Pass')
  const [explanationStyle, setExplanationStyle] = useState<'Academic' | 'Simplified'>('Simplified')
  const [isGenerating, setIsGenerating] = useState(false)
  const [loadingStepIndex, setLoadingStepIndex] = useState(0)

  // Output & Chat State
  const [messages, setMessages] = useState<AIResponse[]>([])
  const [hasGenerated, setHasGenerated] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [targetUnit, setTargetUnit] = useState<number>(1)
  const [isHandwritten, setIsHandwritten] = useState(true)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up')
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastScrollTopRef = useRef<number>(0)
  const endOfMessagesRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Flashcards State
  const [showFlashcards, setShowFlashcards] = useState(false)
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [isExtractingFlashcards, setIsExtractingFlashcards] = useState(false)

  // History State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [historySessions, setHistorySessions] = useState<StudySessionMeta[]>([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  // Mock Exam State
  const [showExam, setShowExam] = useState(false)
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([])
  const [isExtractingExam, setIsExtractingExam] = useState(false)

  // Focus & Progress State
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [unitProgress, setUnitProgress] = useState(0)
  const [isTimerOpen, setIsTimerOpen] = useState(false)

  // Calculate reading time for current unit
  const calculateReadingTime = () => {
    const text = messages.map(m => m.content).join(' ');
    const words = text.split(/\s+/).length;
    return Math.ceil(words / 200); // Average 200 WPM
  }

  // Close the configuration sidebar by default on small screens
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsSidebarOpen(false)
    }
  }, [])

  // Effect for Focus Mode body class
  useEffect(() => {
    if (isFocusMode) {
      document.body.classList.add('focus-mode-active');
    } else {
      document.body.classList.remove('focus-mode-active');
    }
  }, [isFocusMode]);

  // Subject initializes lazily on first upload to prevent empty database rows

  useEffect(() => {
    getSessions().then(data => setHistorySessions(data))
  }, [])

  useEffect(() => {
    if (hasGenerated && !isGenerating && !isChatLoading && messages.length > 0) {
      const title = `Unit ${targetUnit}: ${urgency} (${examType})`
      const metadataParams = {
          subjectId, urgency, examType, midType, answerLength, targetGrade, explanationStyle, targetUnit, unitProgress
      };
      saveSession(title, messages, currentSessionId || undefined, metadataParams).then(res => {
        if (res.success && res.data) {
          if (!currentSessionId) {
             setCurrentSessionId(res.data.id)
          }
          setLastSessionId(res.data.id);
          getSessions().then(data => setHistorySessions(data))
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGenerating, isChatLoading])

  const refreshUnitProgress = async (sid: string, uid: number) => {
      const currentVal = await getUnitProgress(sid, uid.toString());
      setUnitProgress(currentVal);
  }

  useEffect(() => {
     if (hasGenerated && subjectId && targetUnit) {
         refreshUnitProgress(subjectId, targetUnit);
     }
  }, [hasGenerated, subjectId, targetUnit]);

  useEffect(() => {
    // Only auto-scroll to the bottom when explicitly loading manual chat messages, avoiding yanking during syllabus generation.
    if (isChatLoading) {
      // scrollIntoView removed to stop UI jumping
    }
  }, [messages, isChatLoading])

  // ====== [ NEW ] STATE PERSISTENCE & HYDRATION ======
  const [isHydrated, setIsHydrated] = useState(false);

  // 1. Fetch user session & data on page load
  useEffect(() => {
    const loadState = async () => {
      try {
        let sessionToLoad = null;

        // PRIORITIZE CLOUD: Server Check for Absolute Last Active Session
        const cloudLastSessionId = await getLastSessionId();
        if (cloudLastSessionId) {
            sessionToLoad = await getSessionById(cloudLastSessionId);
            if (sessionToLoad) {
                setCurrentSessionId(sessionToLoad.id);
                if (sessionToLoad.metadata) {
                   const m = sessionToLoad.metadata;
                   if (m.subjectId) setSubjectId(m.subjectId as string);
                   if (m.urgency) setUrgency(m.urgency as 'Cram' | 'Deep');
                   if (m.examType) setExamType(m.examType as 'Mid' | 'Semester');
                   if (m.midType) setMidType(m.midType as 'Mid 1' | 'Mid 2');
                   if (m.answerLength) setAnswerLength(m.answerLength as 'Short' | 'Long');
                   if (m.targetGrade) setTargetGrade(m.targetGrade as 'Pass' | 'Top');
                   if (m.explanationStyle) setExplanationStyle(m.explanationStyle as 'Academic' | 'Simplified');
                   if (m.targetUnit) setTargetUnit(Number(m.targetUnit));
                   if (m.unitProgress !== undefined && m.unitProgress !== null) setUnitProgress(Number(m.unitProgress));
                   if (sessionToLoad.messages.length > 0) setHasGenerated(true);
                   setMessages(sessionToLoad.messages);
                } else if (sessionToLoad.messages) {
                   setMessages(sessionToLoad.messages);
                   if (sessionToLoad.messages.length > 0) setHasGenerated(true);
                }
            }
        }
        
        // FALLBACK: If Cloud sync fails or is entirely new, rely on LocalStorage Snapshot
        if (!sessionToLoad) {
            const savedStateStr = localStorage.getItem('arena_active_state');
            if (savedStateStr) {
               const saved = JSON.parse(savedStateStr);
               
               if (saved.subjectId) setSubjectId(saved.subjectId);
               if (saved.urgency) setUrgency(saved.urgency);
               if (saved.examType) setExamType(saved.examType);
               if (saved.midType) setMidType(saved.midType);
               if (saved.answerLength) setAnswerLength(saved.answerLength);
               if (saved.targetGrade) setTargetGrade(saved.targetGrade);
               if (saved.explanationStyle) setExplanationStyle(saved.explanationStyle);
               if (saved.targetUnit) setTargetUnit(saved.targetUnit);
               if (saved.unitProgress) setUnitProgress(saved.unitProgress);
               if (saved.hasGenerated) setHasGenerated(saved.hasGenerated);
               if (saved.currentSessionId) setCurrentSessionId(saved.currentSessionId);
               if (saved.files) setFiles(saved.files); 
               if (saved.isSidebarOpen !== undefined) setIsSidebarOpen(saved.isSidebarOpen);

               if (saved.currentSessionId) {
                 const sessionDetail = await getSessionById(saved.currentSessionId);
                 if (sessionDetail && sessionDetail.messages) {
                   setMessages(sessionDetail.messages);
                 } else if (saved.messages && saved.messages.length > 0) {
                   setMessages(saved.messages);
                 }
               } else if (saved.messages && saved.messages.length > 0) {
                 setMessages(saved.messages);
               }
            }
        }

      } catch (e) {
        console.error("Hydration Error:", e);
      } finally {
        setIsHydrated(true);
      }
    };
    loadState();
  }, []);

  // 3. Save state gracefully continuously into localStorage preventing reload resets
  useEffect(() => {
    if (!isHydrated) return; // Wait until initial load finishes to avoid overwriting with empties
    const stateToSave = {
       subjectId, urgency, examType, midType, answerLength, targetGrade, explanationStyle,
       targetUnit, unitProgress, hasGenerated, currentSessionId,
       isSidebarOpen,
       messages // Save messages locally as fallback in case DB hook fails or hasn't committed
    };
    localStorage.setItem('arena_active_state', JSON.stringify(stateToSave));
  }, [subjectId, urgency, examType, midType, answerLength, targetGrade, explanationStyle, targetUnit, unitProgress, hasGenerated, currentSessionId, isSidebarOpen, messages, isHydrated]);
  // =====================================================

  useEffect(() => {
    if (isHandwritten) {
      document.documentElement.classList.add('print-handwritten-active');
      document.body.classList.add('print-handwritten-active');
    } else {
      document.documentElement.classList.remove('print-handwritten-active');
      document.body.classList.remove('print-handwritten-active');
    }
  }, [isHandwritten])

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

    // Prevent strictly duplicate files from being queued twice
    setFiles((prev) => {
      const newFiles = selectedFiles.filter(f => !prev.some(p => p.name === f.name))
      return [...prev, ...newFiles]
    })

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (nameToRemove: string) => {
    setFiles((prev) => prev.filter(f => f.name !== nameToRemove))
  }

  const generateStudyPlan = async (isAppend = false) => {
    if (files.length === 0) {
      alert("Please upload at least one syllabus or PYQ document first.")
      return
    }

    setIsGenerating(true)

    let activeSubjectId = subjectId;
    let accumGuestText = guestContextText;

    // BATCH UPLOAD QUEUED FILES
    const unuploadedFiles = files.filter(f => !uploadedFiles.has(f.name));
    if (unuploadedFiles.length > 0) {
      setUploading(true)
      let currentSubjectId = subjectId;
      if (!currentSubjectId) {
        try {
          const baseName = unuploadedFiles[0].name.replace(/\.[^/.]+$/, "");
          const res = await createSubjectAction(baseName);
          if (res.error) {
              setIsGenerating(false); setUploading(false);
              return alert('Action logic error: ' + res.error);
          }
          if (res.id) currentSubjectId = res.id;
        } catch (e: any) {
          setIsGenerating(false); setUploading(false); return alert('Network/Server crash: ' + String(e?.message || e));
        }
      }

      for (const file of unuploadedFiles) {
        try {
          const formData = new FormData()
          // Passing original File object rather than converting to BLOB bypasses weird encoding
          formData.append('file', file)
          formData.append('subjectId', currentSubjectId)
          const data = await uploadPdfAction(formData)
          if (data.error) { toast(data.error, 'error'); setIsGenerating(false); return }
          if (data.subjectId) currentSubjectId = data.subjectId
          
          if (data.isGuest && data.text) {
              accumGuestText += '\n\n--- DOCUMENT BOUNDARY ---\n\n' + data.text;
          }
        } catch (err) {
          console.error('Fail to upload chunk', err)
          toast('Failed to upload file. Please try again.', 'error')
        }
      }
      
      if (accumGuestText !== guestContextText) {
          setGuestContextText(accumGuestText);
      }
      if (currentSubjectId !== subjectId) setSubjectId(currentSubjectId);
      setUploadedFiles(prev => new Set([...prev, ...unuploadedFiles.map(f => f.name)]))
      setUploading(false)
      if (unuploadedFiles.length > 0) toast(`${unuploadedFiles.length} file(s) uploaded successfully`, 'success')

      // Update the activeSubjectId to guarantee the fetch sees it immediately
      activeSubjectId = currentSubjectId;
    }

    let newTargetUnit = targetUnit;
    if (!isAppend) {
      newTargetUnit = (examType === 'Mid' && midType === 'Mid 2') ? 3 : 1;
      setTargetUnit(newTargetUnit);
    } else {
      newTargetUnit = targetUnit + 1;
      setTargetUnit(newTargetUnit);
    }

    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId: activeSubjectId, urgency, examType, midType, answerLength, targetGrade, explanationStyle, isAppend, targetUnit: newTargetUnit, guestContextText: accumGuestText })
      })

      if (!res.ok || !res.body) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate study plan');
      }

      if (!isAppend) {
        setMessages([
          { role: 'assistant', content: '# 🎓 Survival Plan Generated\nI have analyzed your syllabus context. We are starting with **Unit 1**. You can ask me to explain any of these topics in deeper detail.' },
          { role: 'assistant', content: '' }
        ])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: `\n\n---\n\n# 🚀 CONTINUING TO UNIT ${newTargetUnit}\n\n` }])
      }
      setHasGenerated(true)
      setIsSidebarOpen(false)

      // Analytics Tracking
      logStudyEvent({ event_type: 'study_session', subject_id: activeSubjectId, unit_id: newTargetUnit.toString() }).then(() => {
         refreshUnitProgress(activeSubjectId, newTargetUnit);
      });

      const targetIdx = isAppend ? messages.length : 1;
      // Removed forced scroll jump on generation

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

    } catch (err: unknown) {
      console.error('Error auto-generating PDF:', err);
      const errMsg = err instanceof Error ? err.message : 'Failed to parse syllabus';
      toast(errMsg, 'error');
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
        body: JSON.stringify({ 
           messages: newMessages, 
           subjectId,
           arenaParams: { urgency, targetGrade, answerLength, explanationStyle, targetUnit },
           guestContextText
        })
      })

      if (!res.ok || !res.body) throw new Error('Failed to fetch')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      // Analytics Tracking
      logStudyEvent({ event_type: 'question_asked', subject_id: subjectId, unit_id: targetUnit.toString() }).then(() => {
          refreshUnitProgress(subjectId, targetUnit);
      });

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
      toast('Chat message failed. Please try again.', 'error')
    }
    setIsChatLoading(false)
  }

  const generateMoreQuestions = async () => {
    if (isChatLoading) return;
    const prompt = `Generate 2 MORE expected Long Questions (10-15 Marks), 3 MORE highly probable short questions, and 3 MORE highly probable MCQs for Unit ${targetUnit} from the syllabus context provided earlier. Do NOT duplicate any questions you have already provided in the feed above. Provide ONLY the new questions and their explanations using the exact same clean formatting as before (Section 1: Long, Section 2: Short, Section 3: MCQ). Use plain text for the 'A:' answers.`;

    const contextMessages = [...messages, { role: 'user' as const, content: prompt }];
    // Show a loading indicator in the feed
    setMessages(prev => [...prev, { role: 'assistant', content: `*Scanning syllabus for more high-yield questions for Unit ${targetUnit}...*` }]);
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           messages: contextMessages, 
           subjectId,
           arenaParams: { urgency, targetGrade, answerLength, explanationStyle, targetUnit },
           guestContextText
        })
      });

      if (!res.ok || !res.body) throw new Error('Failed to fetch');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedMessage = '';

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        accumulatedMessage += decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const updated = [...prev]
          let cleaned = accumulatedMessage;
          cleaned = cleaned.replace(/\*\*(A|Answer|ANSWER):\*\*/gi, 'A:');
          cleaned = cleaned.replace(/(A|Answer|ANSWER):\s*\*\*(.*?)\*\*/gi, 'A: $2');
          updated[updated.length - 1].content = cleaned
          return updated
        })
      }
    } catch (err) {
      console.error(err)
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1].content = 'Sorry, failed to generate more questions.'
        return updated;
      })
    }
    setIsChatLoading(false);
  }

  const handleExtractFlashcards = async () => {
    const aiMessages = messages.filter(m => m.role === 'assistant').map(m => m.content).join('\n\n');
    if (!aiMessages) return;

    setIsExtractingFlashcards(true);
    try {
      const response = await fetch('/api/extract-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           context: aiMessages, 
           subjectId: subjectId,
           guestContextText
        })
      });

      if (!response.ok) throw new Error('Failed to extract flashcards');

      const extractedCards = await response.json();
      if (Array.isArray(extractedCards)) {
        setFlashcards(extractedCards);
        setShowFlashcards(true);
        toast('Flashcards extracted successfully!', 'success');

        // Analytics Tracking
        logStudyEvent({ event_type: 'flashcard_review', subject_id: subjectId, unit_id: targetUnit.toString() }).then(() => {
            refreshUnitProgress(subjectId, targetUnit);
        });
      }
    } catch (error) {
      console.error(error);
      toast('Failed to generate flashcards. Please try again.', 'error');
    } finally {
      setIsExtractingFlashcards(false);
    }
  };

  const handleExtractExam = async () => {
    const aiMessages = messages.filter(m => m.role === 'assistant').map(m => m.content).join('\n\n');
    if (!aiMessages) return;

    setIsExtractingExam(true);
    try {
      const response = await fetch('/api/generate-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitText: aiMessages, subjectId: subjectId, guestContextText }),
      });

      if (!response.ok) throw new Error('Failed to extract mock exam');

      const extractedExam = await response.json();
      if (Array.isArray(extractedExam)) {
        setExamQuestions(extractedExam);
        setShowExam(true);
        toast('Mock exam generated!', 'success');
      }
    } catch (error) {
      console.error(error);
      toast('Failed to generate mock exam. Please try again.', 'error');
    } finally {
      setIsExtractingExam(false);
    }
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return
    const { scrollTop } = scrollContainerRef.current

    if (scrollTop > lastScrollTopRef.current) {
      setScrollDirection('down')
    } else if (scrollTop < lastScrollTopRef.current) {
      setScrollDirection('up')
    }
    lastScrollTopRef.current = scrollTop

    setShowBackToTop(scrollTop > 150)
    setIsScrolling(true)

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false)
    }, 1500)
  }

  const scrollToTargetUnit = () => {
    // Scroll intentionally removed to prevent layout jumping layout breakage
  }

  const scrollToBottom = () => {
    // Scroll intentionally removed to prevent layout jumping layout breakage
  }

  return (
    <div className={clsx(
      "flex h-full print:h-auto print:block print:overflow-visible bg-slate-950 print:bg-[#fdfaf0] text-slate-100 print:text-[#1E1E1E] font-sans selection:bg-indigo-500/30 relative",
      isHandwritten ? "print-handwritten" : "",
      isFocusMode ? "focus-mode" : ""
    )}>

      {/* Distraction-Free Hardware-Accelerated Ambient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 print:hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/10 rounded-full blur-[140px] mix-blend-screen animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[35%] h-[40%] bg-slate-800/20 rounded-full blur-[140px] mix-blend-screen animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[140px] mix-blend-screen animate-blob animation-delay-4000"></div>
      </div>

      {/* Mobile Configuration Overlay */}
      <div 
         onClick={() => setIsSidebarOpen(false)}
         className={clsx(
           "fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300",
           isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
         )}
      />

      {/* LEFT SIDEBAR: CONFIGURATION */}
      <div className={clsx(
        "bg-slate-900/40 backdrop-blur-3xl border-r border-slate-700/30 flex flex-col z-50 md:z-10 shadow-2xl fixed md:sticky top-0 inset-y-0 left-0 h-[100dvh] md:h-[calc(100vh-64px)] transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] print:hidden",
        isSidebarOpen && !isFocusMode ? "w-80 max-w-[85vw] p-4 md:p-6 opacity-100 translate-x-0" : "w-0 p-0 overflow-hidden border-none opacity-0 invisible -translate-x-full"
      )}>
        <div className="flex flex-col gap-4 mb-6 shrink-0">
          <div className="flex items-center justify-between">
              <h2 className="text-2xl flex items-center gap-2 font-black text-slate-100 tracking-tight whitespace-nowrap">
                <Settings2 className="w-7 h-7 text-indigo-500" />
                Customize Plan
              </h2>
          </div>
          <button 
             onClick={() => {
                localStorage.removeItem('arena_active_state');
                setSubjectId('');
                setTargetUnit(1);
                setHasGenerated(false);
                setMessages([]);
                setFiles([]);
                setUploadedFiles(new Set());
                setCurrentSessionId(null);
                setGuestContextText('');
             }}
             className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
          >
             <PlusCircle className="w-4 h-4" /> Start New Plan
          </button>
        </div>

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
              <FileIcon className="w-8 h-8 text-indigo-400 mx-auto mb-3 opacity-80" />
              <p className="text-sm text-slate-300 font-medium">
                {uploading ? 'Parsing files...' : 'Drop Syllabus & PYQs'}
              </p>
              <p className="text-xs text-slate-500 mt-1">PDF, DOCX, Img</p>
            </div>

            <AnimatePresence>
              {files.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 flex flex-col gap-2">
                  {files.map((f, i) => (
                    <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }} key={i} className="flex items-center gap-3 p-2.5 bg-slate-800/50 rounded-lg border border-slate-700/50 text-xs text-slate-300 group">
                      <FileIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate flex-1">{f.name}</span>
                      {uploadedFiles.has(f.name) ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <button onClick={() => removeFile(f.name)} className="text-slate-500 hover:text-rose-400 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
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

            <div className="space-y-6">
              <div>
                <label className="text-xs text-slate-300 block mb-2 font-bold tracking-wide">Proximity / Urgency</label>
                <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 relative shadow-inner">
                  {['Cram', 'Deep'].map((option) => (
                    <button
                      key={option}
                      onClick={() => setUrgency(option as 'Cram' | 'Deep')}
                      className={clsx(
                        "flex-1 text-sm py-2.5 rounded-lg font-bold transition-colors relative z-10",
                        urgency === option ? "text-white" : "text-slate-500 hover:text-slate-300"
                      )}
                    >
                      {urgency === option && (
                        <motion.div layoutId="urgencyTab" className="absolute inset-0 bg-rose-600 rounded-lg shadow-md -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                      )}
                      {option === 'Cram' ? 'Tomorrow' : 'Deep Study'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-2 font-bold tracking-wide">Exam Standard</label>
                <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 relative shadow-inner">
                  {['Mid', 'Semester'].map((option) => (
                    <button
                      key={option}
                      onClick={() => setExamType(option as 'Mid' | 'Semester')}
                      className={clsx(
                        "flex-1 text-sm py-2.5 rounded-lg font-bold transition-colors relative z-10",
                        examType === option ? "text-white" : "text-slate-500 hover:text-slate-300"
                      )}
                    >
                      {examType === option && (
                        <motion.div layoutId="examTypeTab" className="absolute inset-0 bg-indigo-600 rounded-lg shadow-md -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                      )}
                      {option}
                    </button>
                  ))}
                </div>
                <AnimatePresence>
                  {examType === 'Mid' && (
                    <motion.div initial={{ opacity: 0, height: 0, marginTop: 12 }} animate={{ opacity: 1, height: 'auto', marginTop: 12 }} exit={{ opacity: 0, height: 0, marginTop: 0 }} className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 relative shadow-inner overflow-hidden">
                      {['Mid 1', 'Mid 2'].map((option) => (
                        <button
                          key={option}
                          onClick={() => setMidType(option as 'Mid 1' | 'Mid 2')}
                          className={clsx(
                            "flex-1 text-xs py-2 rounded-lg font-bold transition-colors relative z-10 whitespace-nowrap px-1",
                            midType === option ? "text-white" : "text-slate-500 hover:text-slate-300"
                          )}
                        >
                          {midType === option && (
                            <motion.div layoutId="midTypeTab" className="absolute inset-0 bg-teal-600 rounded-lg shadow-md -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                          )}
                          {option === 'Mid 1' ? 'Mid 1 (First Half)' : 'Mid 2 (Second Half)'}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-2 font-bold tracking-wide">Target Grade Strategy</label>
                <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 relative shadow-inner">
                  {['Pass', 'Top'].map((option) => (
                    <button
                      key={option}
                      onClick={() => setTargetGrade(option as 'Pass' | 'Top')}
                      className={clsx(
                        "flex-1 text-sm py-2.5 rounded-lg font-bold transition-colors relative z-10",
                        targetGrade === option ? "text-white" : "text-slate-500 hover:text-slate-300"
                      )}
                    >
                      {targetGrade === option && (
                        <motion.div layoutId="targetGradeTab" className="absolute inset-0 bg-amber-600 rounded-lg shadow-md -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                      )}
                      {option === 'Pass' ? 'Guaranteed Pass' : 'Top Ranker (100%)'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-2 font-bold tracking-wide">Explanation Style</label>
                <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 relative shadow-inner">
                  {['Simplified', 'Academic'].map((option) => (
                    <button
                      key={option}
                      onClick={() => setExplanationStyle(option as 'Simplified' | 'Academic')}
                      className={clsx(
                        "flex-1 text-sm py-2.5 rounded-lg font-bold transition-colors relative z-10",
                        explanationStyle === option ? "text-white" : "text-slate-500 hover:text-slate-300"
                      )}
                    >
                      {explanationStyle === option && (
                        <motion.div layoutId="explanationStyleTab" className="absolute inset-0 bg-purple-600 rounded-lg shadow-md -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                      )}
                      {option === 'Simplified' ? 'Simple Explanation' : 'Strict Academic'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-2 font-bold tracking-wide">Output Depth (Speed)</label>
                <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 relative shadow-inner">
                  {['Short', 'Long'].map((option) => (
                    <button
                      key={option}
                      onClick={() => setAnswerLength(option as 'Short' | 'Long')}
                      className={clsx(
                        "flex-1 text-sm py-2.5 rounded-lg font-bold transition-colors relative z-10",
                        answerLength === option ? "text-white" : "text-slate-500 hover:text-slate-300"
                      )}
                    >
                      {answerLength === option && (
                        <motion.div layoutId="answerLengthTab" className="absolute inset-0 bg-emerald-600 rounded-lg shadow-md -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                      )}
                      {option === 'Short' ? 'Fast & Concise' : '10-Mark Detailed'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Generate Button Fixed to Bottom */}
        <div className="pt-4 pb-6 mt-auto shrink-0 border-t border-slate-700/30">
          <button
            onClick={() => generateStudyPlan(false)}
            disabled={isGenerating || uploading || (files.length === 0 && !subjectId)}
            className="w-full relative overflow-hidden group py-3.5 px-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] active:scale-[0.98] transition-all focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
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
      <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative z-10 bg-transparent custom-scrollbar print:block">
        
        {/* Floating Open Config Button: REMOVED — duplicate of header button */}

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
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="min-h-[60vh] flex flex-col items-center justify-center text-center px-8 text-slate-500 relative z-10 w-full mt-4">
            <div className="w-24 h-24 mb-6 rounded-3xl bg-slate-800/40 backdrop-blur-lg border border-slate-700/50 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.15)] relative">
              <div className="absolute inset-0 bg-indigo-500/10 rounded-3xl blur-xl"></div>
              <GraduationCap className="w-12 h-12 text-indigo-400 relative z-10" />
            </div>
            <h2 className="text-3xl font-bold text-slate-200 mb-3 tracking-tight">Arena Awaiting Context</h2>
            <p className="text-slate-400 max-w-md text-lg">Load your parameters on the left to synthesize the ultimate exam survival protocol.</p>
          </motion.div>
        ) : hasGenerated ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col min-h-0 print:min-h-full print:h-auto print:block print:overflow-visible relative">

            {/* Header Area */}
            <div className="border-b border-slate-700/30 px-6 h-16 bg-slate-900/40 backdrop-blur-2xl sticky top-0 z-20 flex justify-between items-center shadow-sm relative print:hidden">
              <div className="flex items-center gap-4 flex-1">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-slate-300 border border-slate-700 transition-colors shadow-sm shrink-0"
                  title={isSidebarOpen && !isFocusMode ? "Close Configuration Sidebar" : "Open Configuration Sidebar"}
                >
                  {isSidebarOpen && !isFocusMode ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
                </button>
                <div className="h-6 w-1 bg-indigo-500 rounded-full shrink-0"></div>
                <div className="flex flex-col">
                  <h3 className="text-base md:text-lg font-bold text-slate-100 tracking-tight leading-tight">
                    {examType === 'Mid' ? (
                      <>{midType === 'Mid 1' ? 'Mid 1' : 'Mid 2'} <span className="text-teal-400 font-semibold text-sm">({midType === 'Mid 1' ? 'Unit 1–2.5' : 'Unit 2.5–5'})</span></>
                    ) : (
                      <>Unit {targetUnit}</>
                    )}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => generateStudyPlan(true)}
                  className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-slate-300 border border-slate-700 transition-colors shadow-sm"
                  title="Regenerate Section"
                >
                  <RefreshCcw className="w-4 h-4 text-emerald-400" />
                </button>
                <button
                  onClick={() => window.print()}
                  className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-slate-300 border border-slate-700 transition-colors shadow-sm"
                  title="Export Notes"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                </button>
                <button
                  onClick={() => {}}
                  className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-slate-300 border border-slate-700 transition-colors shadow-sm mr-2"
                  title="Bookmark"
                >
                  <Bookmark className="w-4 h-4 text-fuchsia-400" />
                </button>

                <button
                  onClick={() => {
                    const next = !isFocusMode;
                    setIsFocusMode(next);
                    // Focus mode → close sidebar for true full-screen
                    if (next) setIsSidebarOpen(false);
                  }}
                  className={clsx(
                    "flex items-center gap-2 px-3 py-1.5 font-bold rounded-xl border transition-all shadow-sm text-xs group flex-shrink-0",
                    isFocusMode ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700"
                  )}
                >
                  <Maximize2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  <span className="hidden md:inline">{isFocusMode ? "Exit Focus" : "Focus Mode"}</span>
                </button>

                {!isFocusMode && (
                  <button
                    onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 rounded-xl text-slate-300 font-medium border border-slate-700 transition-colors shadow-sm text-xs"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">History</span>
                  </button>
                )}

                {/* Local Timer Popover for Arena - Removed in favor of floating widget */}
              </div>
            </div>

            {/* Chat/Markdown Feed — bottom padding accounts for floating chat bar */}
            <div
              className={clsx(
                "flex-1 overflow-y-auto print:overflow-visible print:block print:h-auto pt-6 pb-36 print:px-0 print:py-0 scroll-smooth custom-scrollbar relative",
                isFocusMode ? "px-6 md:px-16" : "px-4 md:px-12"
              )}
              ref={scrollContainerRef}
              onScroll={handleScroll}
            >
              <div className={clsx(
                "mx-auto pb-40 print:max-w-none print:w-full print:mx-0 print:pb-0 print:block flex flex-col gap-10 print:gap-0",
                isFocusMode ? "max-w-[860px]" : "max-w-[800px]"
              )}>
{/* Estimated Study Time: REMOVED per user request */}
                <table className="w-full border-collapse !border-none !bg-transparent print:table block">
                  <thead className="table-header-group !border-none !bg-transparent hidden print:table-header-group">
                    <tr>
                      <td className="!border-none !bg-transparent p-0">
                        <div className="h-[2.5cm] w-full invisible"></div>
                      </td>
                    </tr>
                  </thead>
                  <tfoot className="table-footer-group !border-none !bg-transparent hidden print:table-footer-group">
                    <tr>
                      <td className="!border-none !bg-transparent p-0">
                        <div className="h-[2.5cm] w-full invisible"></div>
                      </td>
                    </tr>
                  </tfoot>
                  <tbody className="!border-none !bg-transparent block md:table-row-group w-full">
                    {messages.map((m, idx) => {
                      let displayContent = m.content || '*Incoming transmission...*';
                      if (isChatLoading && idx === messages.length - 1 && m.role === 'assistant') {
                        displayContent += ' ▋';
                      }

                      // Dynamic sanitization for authentic handwritten feel
                      if (isHandwritten) {
                        // Start directly from Unit 1 by collapsing the entire Survival Plan Intro Message entirely
                        displayContent = displayContent.replace(/# 🎓 Survival Plan Generated[\s\S]*?deeper detail\./, '');

                        // Strip all emojis EXCEPT: ✅ ✔️ ❌ (MCQs), 🌍 📺 💡 🧠 (resource links & tips)
                        displayContent = displayContent.replace(/(?!\u{1F30D}|\u{1F4FA}|\u{1F4A1}|\u{1F9E0})[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{2704}\u{2706}-\u{2713}\u{2715}-\u{274B}\u{274D}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{1F400}-\u{1F4FF}\u{2B50}]/gu, '');
                        // NOTE: Web/YouTube resource links are intentionally preserved — do NOT strip them.

                        // Replace green ✅ with a simple bold unicode ✔️ (which renders natively black)
                        displayContent = displayContent.replace(/✅/gi, '**✔**');

                        // Make MCQ option lines (e.g., "- A) ...") drop the bullet point and bold the letter to act as a black ink header
                        displayContent = displayContent.replace(/^[ \t]*[-\*][ \t]+([A-E][\.\)])/gmi, '\n**$1**');

                        // Force headers for A: and Pro-Tip: to make them render in Black Ink instead of Blue
                        displayContent = displayContent.replace(/(?:^|\n)[ \t]*(A:|Pro-Tip:)/gmi, '\n**$1**');

                        // Clean up potential extra newlines
                        displayContent = displayContent.replace(/\n\s*\n/g, '\n\n').trim();
                        if (!displayContent) return null; // If intro was the only thing, don't render an empty box!
                      }

                      return (
                        <tr key={idx} className="block md:table-row w-full print:page-break-inside-avoid print:break-inside-avoid">
                          <td className="!border-none !bg-transparent p-0 align-top block md:table-cell w-full print:pt-3 print:pb-4">
                            <div id={`message-${idx}`} className={clsx("flex font-sans print:block", m.role === 'user' ? "justify-end print:hidden" : "justify-start mb-10 print:mb-0")}>
                              {m.role === 'user' ? (
                                <div className="max-w-[85%] bg-indigo-600 text-white p-5 rounded-3xl rounded-tr-sm shadow-md text-lg leading-relaxed antialiased ml-auto">
                                  {m.content}
                                </div>
                              ) : (
                                <div className="w-full text-slate-200 print:text-[#1E1E1E] print:!bg-transparent antialiased flex flex-col gap-6">
                                  <ThrottledMarkdown content={displayContent} />
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {/* Inline Action Buttons at End of Feed */}
                {!isGenerating && !isChatLoading && messages.length > 0 && (
                  <div className="flex flex-col items-center gap-6 mt-8 pt-8 border-t border-slate-800/50 print:hidden">

                    {/* Unified Completion Card */}
                    <div className="w-full max-w-xl mx-auto bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6 flex flex-col items-center text-center space-y-6 shadow-xl mb-4">
                      
                      <div className="flex flex-col items-center justify-center gap-2">
                         <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mb-1">
                            <CheckCircle2 className="w-6 h-6" />
                         </div>
                         <h4 className="font-black text-2xl text-slate-100 flex items-center gap-2">Unit {targetUnit} Completed</h4>
                      </div>

                      <div className="w-full space-y-4">
                        {/* Primary Action */}
                        {!(examType === 'Mid' && midType === 'Mid 1' && targetUnit >= 3) ? (
                            <button
                                onClick={async () => {
                                    await logStudyEvent({ event_type: 'unit_completed', subject_id: subjectId, unit_id: targetUnit.toString() });
                                    setUnitProgress(100);
                                    generateStudyPlan(true);
                                }}
                                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <BrainCircuit className="w-5 h-5" />
                                Continue to Next Unit
                            </button>
                        ): (
                            <button
                                onClick={async () => {
                                    await logStudyEvent({ event_type: 'unit_completed', subject_id: subjectId, unit_id: targetUnit.toString() });
                                    setUnitProgress(100);
                                }}
                                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <CheckCircle className="w-5 h-5" />
                                Syllabus Completed
                            </button>
                        )}

                        {/* Secondary Actions */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            onClick={() => generateMoreQuestions()}
                            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-transparent hover:bg-slate-800 text-slate-300 font-semibold rounded-xl border border-slate-700 transition-all text-sm"
                          >
                            <PlusCircle className="w-4 h-4 text-indigo-400" />
                            Practice Questions
                          </button>
                          
                          <button
                            onClick={handleExtractExam}
                            disabled={isExtractingExam || messages.length === 0}
                            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-transparent hover:bg-slate-800 text-slate-300 font-semibold rounded-xl border border-slate-700 transition-all text-sm disabled:opacity-50"
                          >
                            {isExtractingExam ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenTool className="w-4 h-4 text-emerald-400" />}
                            Take Mock Test
                          </button>

                          <button
                            onClick={() => window.print()}
                            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-transparent hover:bg-slate-800 text-slate-300 font-semibold rounded-xl border border-slate-700 transition-all text-sm"
                          >
                            <FileIcon className="w-4 h-4 text-amber-400" />
                            Generate Notes
                          </button>

                          <button
                            onClick={handleExtractFlashcards}
                            disabled={isExtractingFlashcards || messages.length === 0}
                            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-transparent hover:bg-slate-800 text-slate-300 font-semibold rounded-xl border border-slate-700 transition-all text-sm disabled:opacity-50"
                          >
                            {isExtractingFlashcards ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4 text-fuchsia-400" />}
                            Review Flashcards
                          </button>
                        </div>
                      </div>
                      

                    </div>
                  </div>
                )}
                <div ref={endOfMessagesRef} className="h-4"></div>
              </div>

              {/* Sticky Chat Bar — inside scroll container for proper alignment */}
              <div className="sticky bottom-0 z-[15] print:hidden bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent pt-4">
                <div className={clsx(
                  "mx-auto pb-3",
                  isFocusMode ? "max-w-[860px] px-6 md:px-16" : "max-w-[800px] px-4 md:px-12"
                )}>
                  <form onSubmit={handleSendMessage} className="flex items-center gap-3 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl px-4 py-2.5 shadow-[0_-4px_30px_rgba(0,0,0,0.3)]">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask about the study plan..."
                      disabled={isChatLoading || isGenerating}
                      className="flex-1 min-w-0 bg-transparent outline-none text-sm md:text-base text-slate-100 placeholder:text-slate-500 font-sans py-1.5"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || isChatLoading || isGenerating}
                      className="shrink-0 w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-40 disabled:bg-slate-800 disabled:text-slate-600 transition-colors shadow-md"
                    >
                      <span className="font-black text-lg leading-none">↑</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Smart Back to Top/Bottom FAB — fixed to viewport */}
            <AnimatePresence>
              {showBackToTop && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 20 }}
                  onClick={() => {
                    const el = scrollContainerRef.current;
                    if (!el) return;
                    if (scrollDirection === 'up') {
                      el.scrollTo({ top: 0, behavior: 'smooth' });
                    } else {
                      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
                    }
                  }}
                  className="fixed bottom-6 right-6 z-[60] p-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-2xl transition-colors focus:ring-4 focus:ring-indigo-500/50 flex items-center justify-center group print:hidden"
                  title={scrollDirection === 'up' ? "Back to Top" : "Scroll to Bottom"}
                >
                  {scrollDirection === 'up' ? (
                    <ArrowUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                  ) : (
                    <ArrowDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                  )}
                </motion.button>
              )}
            </AnimatePresence>

          </motion.div>
        ) : null}

      </div>

      {/* RIGHT SIDEBAR: HISTORY */}
      <div className={clsx(
        "bg-slate-900/80 backdrop-blur-3xl border-l border-slate-700/30 flex flex-col z-50 shadow-2xl absolute right-0 top-0 bottom-0 transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] print:hidden",
        isHistoryOpen ? "w-80 p-6 opacity-100 translate-x-0" : "w-0 p-0 overflow-hidden border-none opacity-0 translate-x-full invisible"
      )}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl flex items-center gap-2 font-bold text-slate-200 tracking-tight whitespace-nowrap">
            <History className="w-5 h-5 text-indigo-400" />
            Study History
          </h2>
          <button onClick={() => setIsHistoryOpen(false)} className="text-slate-500 hover:text-rose-400 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {historySessions.length === 0 ? (
            <div className="text-slate-500 text-sm text-center mt-10">No saved sessions yet.</div>
          ) : (
            historySessions.map(session => (
              <button
                key={session.id}
                disabled={isHistoryLoading || isGenerating}
                onClick={async () => {
                  setIsHistoryLoading(true)
                  const fullSession = await getSessionById(session.id)
                  if (fullSession) {
                    setMessages(fullSession.messages)
                    setCurrentSessionId(fullSession.id)
                    setHasGenerated(true)
                    setIsHistoryOpen(false)
                  }
                  setIsHistoryLoading(false)
                }}
                className={clsx(
                  "w-full text-left p-4 rounded-xl border transition-all flex flex-col gap-2 group",
                  currentSessionId === session.id
                    ? "bg-indigo-600/20 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                    : "bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600"
                )}
              >
                <div className="font-bold text-slate-200 text-sm truncate w-full">{session.title}</div>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(session.created_at).toLocaleDateString()}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Flashcard Overlay */}
      {showFlashcards && (
        <FlashcardDeck flashcards={flashcards} onClose={() => setShowFlashcards(false)} />
      )}

      {/* Mock Exam Overlay */}
      {showExam && (
        <MockExamModal 
          questions={examQuestions} 
          onClose={() => setShowExam(false)} 
          onComplete={(score, total) => {
            logStudyEvent({ 
              event_type: 'mock_test', 
              subject_id: subjectId, 
              unit_id: targetUnit.toString(), 
              score: Math.round((score / total) * 100) 
            }).then(() => refreshUnitProgress(subjectId, targetUnit));
          }}
        />
      )}

      {/* Floating Global Study Tracker Widget */}
      {hasGenerated && (
        <div className="print:hidden">

        </div>
      )}
    </div>
  )
}