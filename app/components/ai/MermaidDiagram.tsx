'use client';

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { v4 as uuid } from 'uuid';

// Initialization migrated to useEffect to support dynamic theme polling

interface MermaidProps {
    chart: string;
}

export default function MermaidDiagram({ chart }: MermaidProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [svgContent, setSvgContent] = useState<string | null>(null);
    const [error, setError] = useState<boolean>(false);
    const [chartId] = useState(() => `mermaid-${uuid().substring(0, 8)}`);

    useEffect(() => {
        mermaid.initialize({
            startOnLoad: false,
            theme: document.documentElement.classList.contains('light-mode') ? 'default' : 'dark',
            themeCSS: '.nodeLabel { font-weight: 800 !important; font-size: 14px !important; } .edgeLabel { font-weight: bold !important; }',
            securityLevel: 'strict',
            fontFamily: 'Inter',
            logLevel: 5,
            suppressErrorRendering: true,
        });

        let isMounted = true;
        const renderChart = async () => {
            try {
                if (!chart) return;
                
                // Validate syntax to prevent crash from incomplete stream chunks
                const isSyntaxValid = await mermaid.parse(chart, { suppressErrors: true }).catch(() => false);
                if (!isSyntaxValid) {
                    // Fail silently during stream
                    if (isMounted) setError(true);
                    return;
                }

                const { svg } = await mermaid.render(chartId, chart);
                if (isMounted) {
                    setSvgContent(svg);
                    setError(false);
                }
            } catch (err) {
                if (isMounted) setError(true);
            }
        };

        // Debounce rendering to avoid thrashing during streaming tokens
        const timeoutId = setTimeout(() => {
            renderChart();
        }, 300);

        return () => { 
            isMounted = false; 
            clearTimeout(timeoutId);
        };
    }, [chart, chartId]);

    if (error) {
        // If syntax breaks, display raw code cleanly with an alert banner
        return (
            <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-4 my-4 overflow-x-auto text-sm text-slate-300">
                <div className="text-amber-500 font-bold mb-2 text-xs uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    Diagram Syntax Error (Raw Fallback)
                </div>
                <pre className="opacity-75">{chart}</pre>
            </div>
        );
    }

    if (!svgContent) {
        return (
            <div className="animate-pulse bg-slate-800/40 border border-slate-700/50 rounded-2xl h-48 w-full my-6 flex items-center justify-center">
                <div className="text-slate-500 text-sm font-medium tracking-wide">Synthesizing diagram layer...</div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="my-8 p-6 bg-slate-900/50 border border-slate-700/50 rounded-2xl flex justify-center overflow-x-auto shadow-sm"
            dangerouslySetInnerHTML={{ __html: svgContent }}
        />
    );
}
