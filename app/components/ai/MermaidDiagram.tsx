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

    // Sanitize common AI-generated mermaid syntax errors
    const sanitizeChart = (raw: string): string => {
        let s = raw;
        // Fix unquoted labels with special chars: A --> B(Label with (parens)) → A --> B["Label with (parens)"]
        s = s.replace(/(\w+)\{("[^"]*")\}/g, '$1{$2}'); // already quoted rhombus — leave alone
        // Fix curly-brace decision nodes with unquoted text: A{ text } → A{"text"}
        s = s.replace(/(\w+)\{\s*([^"{}][^{}]*?)\s*\}/g, (_m, id, label) => `${id}{"${label.trim()}"}`);
        // Fix square brackets with unquoted parens: A[Label (x)] → A["Label (x)"]
        s = s.replace(/(\w+)\[([^\]"]*\([^\]]*\)[^\]"]*)\]/g, (_m, id, label) => `${id}["${label.trim()}"]`);
        // Fix -- text with special chars on edges: -- text --> needs quoting if it has parens
        s = s.replace(/--\s*([^>|[\]"{}][^>|]*?\([^)]*\)[^>|]*?)\s*-->/g, (_m, label) => `-- "${label.trim()}" -->`);
        return s;
    };

    useEffect(() => {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            themeVariables: {
                primaryColor: '#e0e7ff',
                primaryTextColor: '#1e293b',
                primaryBorderColor: '#818cf8',
                lineColor: '#64748b',
                background: '#f8fafc',
                nodeBorder: '#818cf8',
                fontSize: '14px',
            },
            securityLevel: 'loose',
            fontFamily: 'Inter',
            logLevel: 5,
            suppressErrorRendering: true,
        });

        let isMounted = true;
        const renderChart = async () => {
            try {
                if (!chart) return;
                const sanitized = sanitizeChart(chart);
                
                // Validate syntax to prevent crash from incomplete stream chunks
                const isSyntaxValid = await mermaid.parse(sanitized, { suppressErrors: true }).catch(() => false);
                if (!isSyntaxValid) {
                    // Fail silently during stream
                    if (isMounted) setError(true);
                    return;
                }

                const { svg } = await mermaid.render(chartId, sanitized);
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
