'use client';

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { v4 as uuid } from 'uuid';

mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'strict',
    fontFamily: 'Inter',
});

interface MermaidProps {
    chart: string;
}

export default function MermaidDiagram({ chart }: MermaidProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [svgContent, setSvgContent] = useState<string | null>(null);
    const [error, setError] = useState<boolean>(false);
    const [chartId] = useState(() => `mermaid-${uuid().substring(0, 8)}`);

    useEffect(() => {
        let isMounted = true;
        const renderChart = async () => {
            try {
                if (!chart) return;
                // The render block automatically compiles Mermaid layout semantics
                const { svg } = await mermaid.render(chartId, chart);
                if (isMounted) setSvgContent(svg);
            } catch (err) {
                console.error('Mermaid render error: ', err);
                if (isMounted) setError(true);
            }
        };
        renderChart();

        return () => { isMounted = false; };
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
