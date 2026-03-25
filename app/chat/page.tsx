'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Bot, User, Database, ChevronDown, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import clsx from 'clsx';
import { getSessionById, getSessions, StudySessionMeta } from '../actions/sessions'
import { AIResponse } from '../types';

const SUGGESTED_ACTIONS = [
    { label: "Explain Simply", prompt: "Explain this topic in simple terms with examples.", icon: "💡" },
    { label: "Generate Diagram", prompt: "Generate a mermaid diagram for this concept.", icon: "📊" },
    { label: "Create Flashcards", prompt: "Create 5 high-yield flashcards from this text.", icon: "📇" },
    { label: "Generate MCQs", prompt: "Generate 3 multiple-choice questions to test my knowledge.", icon: "📝" },
    { label: "Give Exam Answer", prompt: "Provide a structured, 10-mark exam answer for this topic.", icon: "🎓" }
];

export default function ChatPage() {
    const [messages, setMessages] = useState<AIResponse[]>([
        { role: 'assistant', content: 'Hello! I am your AI learning assistant. Select a knowledge base from your history, or simply ask a generic question!' }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    const [sessions, setSessions] = useState<StudySessionMeta[]>([]);
    const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);

    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        getSessions().then(data => {
            setSessions(data);
            if (typeof window !== 'undefined') {
                const urlParams = new URLSearchParams(window.location.search);
                const sessionId = urlParams.get('session');
                if (sessionId) {
                    loadSessionContext(sessionId);
                    setIsHydrated(true);
                } else {
                    // Phase 1: LocalStorage + DB Recovery Hydration
                    const loadState = async () => {
                        try {
                            const savedStr = localStorage.getItem('chat_active_state');
                            if (savedStr) {
                                const saved = JSON.parse(savedStr);
                                if (saved.activeSubjectId) setActiveSubjectId(saved.activeSubjectId);
                                
                                if (saved.currentSessionId) {
                                    // Resume Database DB
                                    const sessionDetail = await getSessionById(saved.currentSessionId);
                                    if (sessionDetail && sessionDetail.messages) {
                                        setMessages(sessionDetail.messages);
                                    } else if (saved.messages) {
                                        setMessages(saved.messages);
                                    }
                                } else if (saved.messages) {
                                    setMessages(saved.messages);
                                }
                            }
                        } catch (e) {
                            console.error('Failed to hydrate chat state', e)
                        } finally {
                            setIsHydrated(true);
                        }
                    }
                    loadState();
                }
            }
        });
    }, []);

    // Phase 2: Save continuous stream state
    useEffect(() => {
        if (!isHydrated) return;
        
        let extractedSessionId = null;
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            extractedSessionId = params.get('session');
        }

        const stateToSave = {
            activeSubjectId,
            currentSessionId: extractedSessionId,
            messages
        };
        localStorage.setItem('chat_active_state', JSON.stringify(stateToSave));
    }, [activeSubjectId, messages, isHydrated]);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const loadSessionContext = async (sessionId: string) => {
        const sessionDetail = await getSessionById(sessionId);
        if (sessionDetail) {
            setActiveSubjectId(null);
            setMessages(sessionDetail.messages || [
                { role: 'assistant', content: `Context switched to **${sessionDetail.title}**. How can I help you?` }
            ]);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || isTyping) return;

        const newMessages = [...messages, { role: 'user' as const, content: chatInput }];
        setMessages(newMessages);
        setChatInput('');
        setIsTyping(true);

        try {
            // In standalone chat, we can optionally pass the activeSubjectId to lock the prompt context.
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: newMessages, subjectId: activeSubjectId })
            });

            if (!res.ok || !res.body) throw new Error('Failed to fetch');

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
            let accumulatedMessage = '';

            while (true) {
                const { value, done } = await reader.read()
                if (done) break
                accumulatedMessage += decoder.decode(value, { stream: true })
                setMessages((prev) => {
                    const updated = [...prev]
                    updated[updated.length - 1].content = accumulatedMessage
                    return updated
                });
            }
        } catch (err) {
            console.error(err);
            setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error communicating with the mainframe.' }]);
        }
        setIsTyping(false);
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 font-sans">

            {/* Top Header */}
            <header className="h-16 shrink-0 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                        <MessageSquare className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-white">AI Assistant</h1>
                </div>

                <div className="relative group">
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-xl border border-slate-700 hover:bg-slate-700/80 transition-colors text-sm font-medium text-slate-200">
                        <Database className="w-4 h-4 text-emerald-400" />
                        {activeSubjectId ? 'Context Linked' : 'Global Context'}
                        <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
                    </button>

                    <div className="absolute top-[110%] right-0 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col p-2 z-50 overflow-hidden">
                        <div className="px-3 py-2 text-xs font-bold text-slate-400 tracking-wider">SELECT KNOWLEDGE BASE</div>
                        <div className="flex flex-col max-h-48 overflow-y-auto custom-scrollbar">
                            <button onClick={() => { setActiveSubjectId(null); setMessages([{ role: 'assistant', content: 'Context cleared. I am now operating in base zero-shot mode.' }]) }} className="text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors">
                                General AI (No Context)
                            </button>
                            {sessions.map(s => (
                                <button key={s.id} onClick={() => loadSessionContext(s.id)} className="text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors truncate">
                                    {s.title}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                <div className="max-w-4xl mx-auto flex flex-col gap-6">
                    {messages.map((m, idx) => (
                        <div key={idx} className={clsx("flex gap-4", m.role === 'user' ? "flex-row-reverse" : "flex-row")}>

                            {/* Avatar */}
                            <div className={clsx("w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center border shadow-sm", m.role === 'user' ? "bg-indigo-600 border-indigo-500" : "bg-slate-800 border-slate-700")}>
                                {m.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-indigo-400" />}
                            </div>

                            {/* Message Bubble */}
                            <div className={clsx("max-w-[85%] rounded-3xl p-5 shadow-sm leading-relaxed text-[0.95rem]", m.role === 'user' ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-sm")}>
                                {m.role === 'assistant' ? (
                                    <div className="markdown-prose space-y-4">
                                        <ReactMarkdown 
                                            remarkPlugins={[remarkMath]} 
                                            rehypePlugins={[rehypeKatex]}
                                        >
                                            {m.content ? (m.content + (isTyping && idx === messages.length - 1 && m.role === 'assistant' ? ' ▋' : '')) : (isTyping && idx === messages.length - 1 && m.role === 'assistant' ? '*Incoming transmission...* ▋' : '...')}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    <div>{m.content}</div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isTyping && !messages[messages.length - 1].content && (
                        <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center border shadow-sm bg-slate-800 border-slate-700">
                                <Bot className="w-5 h-5 text-indigo-400 animate-pulse" />
                            </div>
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl rounded-tl-sm p-6 flex flex-col gap-3 min-w-[240px] shadow-sm">
                                <div className="flex items-center gap-2 mb-1">
                                    <Sparkles className="w-4 h-4 animate-pulse text-indigo-400" />
                                    <span className="text-indigo-300/80 text-xs font-bold tracking-widest uppercase">Synthesizing</span>
                                </div>
                                <div className="flex flex-col gap-2.5">
                                    <div className="h-2 bg-slate-800/80 rounded-full w-full animate-pulse"></div>
                                    <div className="h-2 bg-slate-800/80 rounded-full w-[85%] animate-pulse delay-75"></div>
                                    <div className="h-2 bg-slate-800/80 rounded-full w-[60%] animate-pulse delay-150"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={endOfMessagesRef} className="h-4" />
                </div>
            </div>

            {/* Input Area */}
            <div className="p-6 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800 shrink-0">
                <div className="max-w-4xl mx-auto flex flex-col gap-4">

                    {/* Suggested Smart Actions */}
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
                        {SUGGESTED_ACTIONS.map((action, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => setChatInput(action.prompt)}
                                className="flex items-center gap-2 whitespace-nowrap px-4 py-2 bg-slate-900 border border-slate-700/80 hover:border-indigo-500/50 hover:bg-slate-800 text-slate-300 text-sm font-medium rounded-full shadow-sm hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all group shrink-0"
                            >
                                <span>{action.icon}</span>
                                <span className="group-hover:text-indigo-300 transition-colors">{action.label}</span>
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSend} className="relative flex items-center shadow-2xl">
                        <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder={activeSubjectId ? "Ask a question about the active syllabus..." : "Ask a general question..."}
                            disabled={isTyping}
                            className="w-full pl-6 pr-16 py-4 bg-slate-900 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none text-[0.95rem] text-slate-100 transition-all placeholder:text-slate-500 shadow-inner"
                        />
                        <button
                            type="submit"
                            disabled={!chatInput.trim() || isTyping}
                            className="absolute right-3 aspect-square flex items-center justify-center p-2 bg-indigo-600 shadow-md text-white rounded-xl hover:bg-indigo-500 disabled:opacity-40 disabled:bg-slate-800 disabled:text-slate-600 transition-all"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </div>

        </div>
    );
}
