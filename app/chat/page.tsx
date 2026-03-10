'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Bot, User, Loader2, Database, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import clsx from 'clsx';
import { getSessions, StudySessionMeta, getSessionById } from '../actions/sessions';

export default function ChatPage() {
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
        { role: 'assistant', content: 'Hello! I am your AI learning assistant. Select a knowledge base from your history, or simply ask a generic question!' }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    const [sessions, setSessions] = useState<StudySessionMeta[]>([]);
    const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);

    useEffect(() => {
        getSessions().then(data => {
            setSessions(data);
            if (typeof window !== 'undefined') {
                const urlParams = new URLSearchParams(window.location.search);
                const sessionId = urlParams.get('session');
                if (sessionId) {
                    loadSessionContext(sessionId);
                }
            }
        });
    }, []);

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
                                        <ReactMarkdown>
                                            {m.content || '...'}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    <div>{m.content}</div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isTyping && !messages[messages.length - 1].content && (
                        <div className="flex gap-4">
                            <div className="w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center border shadow-sm bg-slate-800 border-slate-700">
                                <Bot className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl rounded-tl-sm p-5 flex items-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                                <span className="text-slate-400 text-sm font-medium tracking-wide">Synthesizing...</span>
                            </div>
                        </div>
                    )}
                    <div ref={endOfMessagesRef} className="h-4" />
                </div>
            </div>

            {/* Input Area */}
            <div className="p-6 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800 shrink-0">
                <div className="max-w-4xl mx-auto">
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
                    <div className="text-center mt-3 text-xs text-slate-500 font-medium">
                        AI Assistant can make mistakes. Verify important information from syllabus.
                    </div>
                </div>
            </div>

        </div>
    );
}
