'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, ChevronRight, Award } from 'lucide-react';
import clsx from 'clsx';

export interface ExamQuestion {
    question: string;
    options: string[];
    correctAnswerIndex: number;
    explanation: string;
}

interface MockExamModalProps {
    questions: ExamQuestion[];
    onClose: () => void;
}

export default function MockExamModal({ questions, onClose }: MockExamModalProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    // If questions array is completely empty, fail safely.
    if (!questions || questions.length === 0) {
        return null;
    }

    const currentQ = questions[currentIndex];
    const isAnswered = selectedOption !== null;
    const isCorrect = selectedOption === currentQ.correctAnswerIndex;

    const handleSelect = (index: number) => {
        if (isAnswered) return; // Prevent changing answer
        setSelectedOption(index);
        if (index === currentQ.correctAnswerIndex) {
            setScore(prev => prev + 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setSelectedOption(null);
            setCurrentIndex(prev => prev + 1);
        } else {
            setIsFinished(true);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 print:hidden">
            {/* Heavy Blur Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl transition-all"
                onClick={onClose}
            />

            {/* Animated Modal Container */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-3xl bg-slate-900/90 border border-slate-700/50 rounded-3xl p-6 md:p-10 shadow-[0_0_50px_rgba(99,102,241,0.15)] flex flex-col min-h-[500px]"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors z-10"
                >
                    <X className="w-6 h-6" />
                </button>

                {isFinished ? (
                    /* Finished Screen */
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex-1 flex flex-col items-center justify-center text-center px-4"
                    >
                        <div className="w-24 h-24 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6">
                            <Award className="w-12 h-12 text-indigo-400" />
                        </div>
                        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 mb-4 tracking-tight">
                            Exam Complete!
                        </h2>
                        <div className="text-5xl font-black text-indigo-400 mb-6 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                            {score} / {questions.length}
                        </div>
                        <p className="text-slate-400 text-lg max-w-sm mb-10">
                            {score === questions.length ? "Flawless victory! You've mastered this subject completely." : "Great effort! Review your core materials to bridge any remaining gaps."}
                        </p>
                        <button
                            onClick={onClose}
                            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-xl transition-all hover:-translate-y-1 w-full max-w-xs"
                        >
                            Return to Study Plan
                        </button>
                    </motion.div>
                ) : (
                    /* Active Question Screen */
                    <div className="flex-1 flex flex-col">
                        {/* Header & Progress */}
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-indigo-400 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                                Mock Exam Session
                            </span>
                            <span className="text-slate-400 font-medium">Question {currentIndex + 1} of {questions.length}</span>
                        </div>

                        <div className="w-full h-1.5 bg-slate-800 rounded-full mb-10 overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>

                        {/* Question Wrapper */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentIndex}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="flex-1 flex flex-col"
                            >
                                <h3 className="text-2xl md:text-3xl font-semibold text-slate-100 mb-8 leading-snug">
                                    {currentQ.question}
                                </h3>

                                <div className="flex flex-col gap-3 mb-8">
                                    {currentQ.options.map((opt, i) => {
                                        const isSelected = selectedOption === i;
                                        const isTrueAnswer = i === currentQ.correctAnswerIndex;

                                        let buttonStyle = "bg-slate-800/50 border-slate-700 hover:bg-slate-700 hover:border-slate-500 text-slate-300";

                                        if (isAnswered) {
                                            if (isTrueAnswer) {
                                                buttonStyle = "bg-emerald-500/10 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/50";
                                            } else if (isSelected && !isTrueAnswer) {
                                                buttonStyle = "bg-rose-500/10 border-rose-500/50 text-rose-300 ring-1 ring-rose-500/50 opacity-80";
                                            } else {
                                                buttonStyle = "bg-slate-800/20 border-slate-800 text-slate-600 opacity-50";
                                            }
                                        }

                                        return (
                                            <button
                                                key={i}
                                                onClick={() => handleSelect(i)}
                                                disabled={isAnswered}
                                                className={clsx(
                                                    "w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between group",
                                                    buttonStyle
                                                )}
                                            >
                                                <span className="text-lg font-medium pr-4">{opt}</span>
                                                {isAnswered && isTrueAnswer && <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
                                                {isAnswered && isSelected && !isTrueAnswer && <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />}
                                            </button>
                                        )
                                    })}
                                </div>

                                {/* Explanation Reveal */}
                                <AnimatePresence>
                                    {isAnswered && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                                            className="overflow-hidden"
                                        >
                                            <div className={clsx(
                                                "p-5 rounded-2xl border flex flex-col gap-2",
                                                isCorrect ? "bg-emerald-950/30 border-emerald-800/50" : "bg-rose-950/30 border-rose-800/50"
                                            )}>
                                                <h4 className={clsx("font-bold uppercase tracking-wider text-xs", isCorrect ? "text-emerald-500" : "text-rose-500")}>
                                                    {isCorrect ? "Correct" : "Incorrect"}
                                                </h4>
                                                <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                                                    {currentQ.explanation}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                            </motion.div>
                        </AnimatePresence>

                        {/* Sticky Next Button */}
                        <div className="mt-8 pt-4 flex justify-end min-h-[60px]">
                            <AnimatePresence>
                                {isAnswered && (
                                    <motion.button
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        onClick={handleNext}
                                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition-transform hover:-translate-y-0.5"
                                    >
                                        {currentIndex < questions.length - 1 ? "Next Question" : "Finish Exam"}
                                        <ChevronRight className="w-5 h-5" />
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>

                    </div>
                )}
            </motion.div>
        </div>
    );
}
