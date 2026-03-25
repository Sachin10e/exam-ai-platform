'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
    const [isLightMode, setIsLightMode] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const storedTheme = localStorage.getItem('theme_preference');
        const systemPrefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
        
        if (storedTheme === 'light' || (!storedTheme && systemPrefersLight)) {
            document.documentElement.classList.add('light-mode');
            setIsLightMode(true);
        }
    }, []);

    const toggleTheme = () => {
        const nextMode = !isLightMode;
        setIsLightMode(nextMode);
        
        if (nextMode) {
            document.documentElement.classList.add('light-mode');
            localStorage.setItem('theme_preference', 'light');
        } else {
            document.documentElement.classList.remove('light-mode');
            localStorage.setItem('theme_preference', 'dark');
        }
    };

    if (!mounted) {
        // Render an absolute placeholder skeleton to prevent layout shift during SSR hydration
        return <div className="w-10 h-10 rounded-xl bg-slate-800/50 animate-pulse" />;
    }

    return (
        <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl bg-slate-800/50 hover:bg-slate-700 border border-slate-700 flex items-center justify-center transition-all group overflow-hidden relative shadow-sm"
            title={isLightMode ? "Switch to Dark Mode" : "Switch to Light Mode"}
        >
            <motion.div
                initial={false}
                animate={{
                    y: isLightMode ? 30 : 0,
                    opacity: isLightMode ? 0 : 1
                }}
                transition={{ duration: 0.3, ease: "backInOut" }}
                className="absolute"
            >
                <Moon className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300" />
            </motion.div>
            
            <motion.div
                initial={false}
                animate={{
                    y: isLightMode ? 0 : -30,
                    opacity: isLightMode ? 1 : 0
                }}
                transition={{ duration: 0.3, ease: "backInOut" }}
                className="absolute"
            >
                <Sun className="w-5 h-5 text-amber-500 group-hover:text-amber-400" />
            </motion.div>
        </button>
    );
}
