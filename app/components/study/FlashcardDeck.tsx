'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

export interface Flashcard {
    id: string;
    front: string;
    back: string;
}

interface FlashcardDeckProps {
    flashcards: Flashcard[];
    onClose: () => void;
}

export default function FlashcardDeck({ flashcards, onClose }: FlashcardDeckProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    // Auto-flip back to the front when changing cards
    const goToNext = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => Math.min(prev + 1, flashcards.length - 1));
        }, 150);
    };

    const goToPrev = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => Math.max(prev - 1, 0));
        }, 150);
    };

    if (!flashcards || flashcards.length === 0) {
        return null;
    }

    const currentCard = flashcards[currentIndex];
    const progressPercentage = ((currentIndex + 1) / flashcards.length) * 100;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 md:p-8 bg-slate-950/90 backdrop-blur-xl overflow-hidden font-sans"
        >
            {/* Top Navigation Bar */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10 w-full max-w-5xl mx-auto">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                        <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-sm tracking-widest uppercase">
                            Study Mode
                        </span>
                        Active Deck
                    </h2>
                    <p className="text-slate-400 font-medium text-sm">
                        Tap the card to reveal the answer.
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="p-3 bg-slate-800/50 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 rounded-full transition-all border border-slate-700/50 hover:border-rose-500/30 group"
                    title="Exit Study Mode"
                >
                    <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                </button>
            </div>

            {/* Progress Bar */}
            <div className="absolute top-24 left-0 right-0 max-w-3xl mx-auto w-full px-6">
                <div className="flex justify-between text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">
                    <span>Card {currentIndex + 1}</span>
                    <span>{flashcards.length} Total</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50 shadow-inner">
                    <motion.div
                        className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ type: 'spring', stiffness: 50 }}
                    />
                </div>
            </div>

            {/* SRS Counters */}
            <div className="w-full max-w-2xl flex justify-center gap-3 md:gap-6 mt-6 pointer-events-none z-10">
                <div className="px-3 py-2 md:px-5 md:py-2.5 bg-slate-800/80 border border-slate-700/50 rounded-2xl flex items-center gap-2 shadow-lg backdrop-blur-md text-xs md:text-sm font-bold text-slate-300">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
                    New: <span className="text-slate-100">12</span>
                </div>
                <div className="px-3 py-2 md:px-5 md:py-2.5 bg-slate-800/80 border border-slate-700/50 rounded-2xl flex items-center gap-2 shadow-lg backdrop-blur-md text-xs md:text-sm font-bold text-slate-300">
                    <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]"></div>
                    Review Due: <span className="text-slate-100">5</span>
                </div>
                <div className="px-3 py-2 md:px-5 md:py-2.5 bg-slate-800/80 border border-slate-700/50 rounded-2xl flex items-center gap-2 shadow-lg backdrop-blur-md text-xs md:text-sm font-bold text-slate-300">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                    Mastered: <span className="text-slate-100">38</span>
                </div>
            </div>

            {/* Lateral Navigation & Card Container */}
            <div className="flex items-center justify-center w-full max-w-5xl gap-4 md:gap-8 mt-6">
                
                {/* Previous Button */}
                <button
                    onClick={goToPrev}
                    disabled={currentIndex === 0}
                    className="p-3 md:p-5 bg-slate-800/50 hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-400 rounded-full shadow-lg backdrop-blur-md disabled:opacity-20 disabled:hover:bg-slate-800/50 transition-all z-10 shrink-0 border border-slate-700/50 hover:border-indigo-500/30 active:scale-95"
                >
                    <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
                </button>

                {/* Flashcard 3D Container */}
                <div className="relative w-full max-w-2xl aspect-[4/3] md:aspect-video perspective-1000 flex-shrink">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="w-full h-full preserve-3d cursor-pointer group"
                            onClick={() => setIsFlipped(!isFlipped)}
                        >
                            {/* The Flipping Card Element */}
                            <motion.div
                                animate={{ rotateY: isFlipped ? 180 : 0 }}
                                transition={{ type: 'spring', stiffness: 60, damping: 15 }}
                                className="w-full h-full relative preserve-3d shadow-2xl rounded-3xl"
                            >
                                {/* Card Front (Question) */}
                                <div
                                    className="absolute inset-0 backface-hidden bg-slate-900 border-2 border-slate-700/50 rounded-3xl p-8 md:p-12 flex flex-col items-center justify-center text-center overflow-y-auto custom-scrollbar"
                                    style={{ backfaceVisibility: 'hidden' }}
                                >
                                    <div className="absolute top-6 left-6 flex items-center gap-2 opacity-50">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                        <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">Question</span>
                                    </div>
                                    <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-100 leading-tight">
                                        {currentCard.front}
                                    </h3>
                                    <div className="absolute bottom-6 flex items-center gap-2 text-slate-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                        <RotateCcw className="w-4 h-4" />
                                        Tap to flip
                                    </div>
                                </div>

                                {/* Card Back (Answer) */}
                                <div
                                    className="absolute inset-0 backface-hidden bg-indigo-950/40 border-2 border-indigo-500/30 rounded-3xl p-8 md:p-12 flex flex-col items-center justify-center text-center overflow-y-auto custom-scrollbar"
                                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                                >
                                    <div className="absolute top-6 left-6 flex items-center gap-2 opacity-60">
                                        <div className="w-2 h-2 rounded-full bg-fuchsia-500"></div>
                                        <span className="text-xs font-bold uppercase tracking-widest text-fuchsia-300">Answer</span>
                                    </div>
                                    <div className="text-lg md:text-xl lg:text-2xl font-medium text-slate-200 leading-relaxed w-full">
                                        {currentCard.back}
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Next Button */}
                <button
                    onClick={goToNext}
                    disabled={currentIndex === flashcards.length - 1}
                    className="p-3 md:p-5 bg-slate-800/50 hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-400 rounded-full shadow-lg backdrop-blur-md disabled:opacity-20 disabled:hover:bg-slate-800/50 transition-all z-10 shrink-0 border border-slate-700/50 hover:border-indigo-500/30 active:scale-95"
                >
                    <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
                </button>
            </div>
        </motion.div>
    );
}
