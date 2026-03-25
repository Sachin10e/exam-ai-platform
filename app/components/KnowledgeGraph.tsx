'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, X, Scaling, BookOpen, Layers, Target, Sparkles, PlayCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { getTopicExplanation } from '../../lib/analytics/topicExplanation';

// ForceGraph relies on HTML5 Canvas and window object. We MUST disable SSR.
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

interface GraphNode {
    id: string;
    label: string;
    description: string;
    importance: number;
    accuracy?: number | null;
    val?: number; // Size weight for visual
}

interface GraphEdge {
    source: string;
    target: string;
    relation: string;
}

interface GraphData {
    nodes: GraphNode[];
    links: GraphEdge[]; // Note: react-force-graph expects 'links' instead of 'edges' array keys usually, but accepts data payload
}

interface KnowledgeGraphProps {
    subjectId: string;
}

export default function KnowledgeGraph({ subjectId }: KnowledgeGraphProps) {
    const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
    const [explanation, setExplanation] = useState<string | null>(null);
    const [loadingExplanation, setLoadingExplanation] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const graphRef = useRef<any>(null);

    // Dynamic resize handler
    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                setDimensions({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height
                });
            }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        if (!subjectId) return;

        const loadGraph = async () => {
             try {
                const res = await fetch(`/api/knowledge-graph?subject_id=${subjectId}`);
                if (!res.ok) throw new Error("Request failed");
                const data = await res.json();
                if (data.error) {
                    setError(data.error);
                } else {
                    // Assuming the API now returns nodes with an 'accuracy' field
                    const normalizedNodes = (data.nodes || []).map((n: GraphNode) => ({
                        ...n,
                        val: Math.max(1, (n.importance || 1) * 2)
                    }));
                    const normalizedLinks = (data.edges || []).map((e: GraphEdge) => ({
                        source: e.source,
                        target: e.target,
                        relation: e.relation
                    }));
                    setGraphData({ nodes: normalizedNodes, links: normalizedLinks });
                }
             } catch (err) {
                 console.error("Knowledge Graph Fetch Error:", err);
                 setError("Something went wrong. Retry.");
             } finally {
                 setLoading(false);
             }
        };

        const timer = setTimeout(() => loadGraph(), 0);
        return () => clearTimeout(timer);
    }, [subjectId]);

    // Priority Color coding: Performance Telemetry overrides static Subject Importance
    const getNodeColor = (node: GraphNode) => {
        // Evaluate dynamic Mock Test Accuracy if detected
        if (node.accuracy !== undefined && node.accuracy !== null) {
            if (node.accuracy < 60) return '#ef4444'; // Red for Weak Topics
            if (node.accuracy <= 80) return '#eab308'; // Yellow for Developing concepts
            return '#22c55e'; // Green for Mastered concepts
        }

        // Fallback gracefully to systemic extracted importance weight
        const imp = node.importance || 0;
        if (imp >= 8) return '#1d4ed8'; // Deep blue
        if (imp >= 5) return '#3b82f6'; // Core blue
        if (imp >= 3) return '#94a3b8'; // Modest slate
        return '#cbd5e1'; // Light contextual edge
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleNodeClick = useCallback(async (node: any) => {
        const targetNode = node as GraphNode;
        setSelectedNode(targetNode);
        setExplanation(null); // Reset layout
        
        // Auto-pan softly to node on click
        if (graphRef.current) {
             graphRef.current.centerAt(node.x, node.y, 1000);
             graphRef.current.zoom(8, 2000);
        }

        // Fire implicit explanation extraction
        setLoadingExplanation(true);
        const explResponse = await getTopicExplanation(subjectId, targetNode.label, targetNode.description);
        if (explResponse.success && explResponse.explanation) {
             setExplanation(explResponse.explanation);
        } else {
             setExplanation("Failed to extract semantic explanation vectors.");
        }
        setLoadingExplanation(false);

    }, [graphRef, subjectId]);

    if (loading) {
        return (
            <div className="w-full h-[600px] flex flex-col items-center justify-center bg-slate-900/40 rounded-3xl border border-slate-800">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
                <p className="text-sm font-medium text-slate-400 tracking-widest uppercase">Calculating Node Vectors...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-[600px] flex flex-col items-center justify-center bg-slate-900/40 rounded-3xl border border-rose-900/30 gap-4">
                <p className="text-sm font-medium text-rose-400">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-rose-500/10 text-rose-400 rounded-xl hover:bg-rose-500/20 text-sm font-bold transition-colors"
                >
                  Reload Page
                </button>
            </div>
        );
    }

    if (graphData.nodes.length === 0) {
        return (
            <div className="w-full h-[600px] flex flex-col items-center justify-center bg-slate-900/40 rounded-3xl border border-slate-800">
                <Scaling className="w-12 h-12 text-slate-600 mb-4 opacity-50" />
                <h3 className="text-lg font-bold text-slate-300">No Knowledge Graph Available</h3>
                <p className="text-sm text-slate-500 mt-2 text-center max-w-sm">Upload a course syllabus or text document to automatically generate topic relationships.</p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-[600px] bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl flex" ref={containerRef}>
            
            {/* FORCE GRAPH CANVAS CORE */}
            <div className="absolute inset-0 z-0">
                <ForceGraph2D
                    ref={graphRef}
                    width={dimensions.width}
                    height={dimensions.height}
                    graphData={graphData}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    nodeLabel={(node: any) => (node as GraphNode).label || 'Unknown Topic'}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    nodeColor={(node: any) => getNodeColor(node as GraphNode)}
                    nodeRelSize={4}
                    linkColor={() => 'rgba(99, 102, 241, 0.2)'} // Subtle indigo links
                    linkWidth={1.5}
                    linkDirectionalArrowLength={3.5}
                    linkDirectionalArrowRelPos={1}
                    onNodeClick={handleNodeClick}
                    d3AlphaDecay={0.02} // Slower decay = more fluid repulsive movement
                    d3VelocityDecay={0.1} // Less friction
                />
            </div>

            {/* OVERLAY: Absolute position HUD indicator */}
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <div className="px-3 py-1.5 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-full flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-xs font-bold text-slate-300 tracking-wider">LIVE GRAPH</span>
                </div>
            </div>

            {/* OVERLAY: Selected Node Information Panel */}
            {selectedNode && (
                <div className="absolute top-6 bottom-6 right-6 w-[400px] bg-slate-900/95 backdrop-blur-xl border border-indigo-500/30 rounded-2xl shadow-2xl z-20 flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-300">
                    <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/50 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: getNodeColor(selectedNode), boxShadow: `0 0 10px ${getNodeColor(selectedNode)}` }}></div>
                            <h3 className="text-base font-bold text-slate-200 pr-2 line-clamp-1">{selectedNode.label}</h3>
                        </div>
                        <button 
                            onClick={() => setSelectedNode(null)}
                            className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
                        {loadingExplanation ? (
                            <div className="flex flex-col items-center justify-center h-40 space-y-3">
                                <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
                                <span className="text-sm font-medium text-slate-400 tracking-wider uppercase">Synthesizing AI Extraction...</span>
                            </div>
                        ) : explanation ? (
                            <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-headings:text-indigo-200 custom-scrollbar pr-2 pb-4">
                                <ReactMarkdown
                                    remarkPlugins={[remarkMath]}
                                    rehypePlugins={[rehypeKatex]}
                                >
                                    {explanation}
                                </ReactMarkdown>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400 leading-relaxed font-medium">
                                {selectedNode.description || 'No description extracted for this concept node.'}
                            </p>
                        )}
                    </div>
                    
                    <div className="p-4 bg-slate-950/80 border-t border-slate-800 shrink-0 space-y-3">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex flex-col">
                                 <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mastery Status</span>
                                 {selectedNode.accuracy !== undefined && selectedNode.accuracy !== null ? (
                                      <span className="text-sm font-bold mt-1" style={{ color: getNodeColor(selectedNode) }}>
                                          {selectedNode.accuracy}% Accuracy
                                      </span>
                                 ) : (
                                      <span className="text-xs text-slate-600 font-medium mt-1">Pending Exam</span>
                                 )}
                            </div>
                            
                            <div className="flex flex-col items-end">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Weight</span>
                                <div className="flex items-center gap-1 mt-1.5">
                                    {Array.from({ length: 10 }).map((_, i) => (
                                        <div 
                                            key={i} 
                                            className={`w-1 h-3 rounded-sm ${i < selectedNode.importance ? 'opacity-100' : 'opacity-20'}`}
                                            style={{ backgroundColor: '#cbd5e1' }}
                                        ></div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                             <Link href={`/arena?subject=${subjectId}&topic=${encodeURIComponent(selectedNode.label)}`} className="w-full">
                                  <button className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-900/20">
                                       <BookOpen className="w-4 h-4" /> Study Concept
                                  </button>
                             </Link>
                             <div className="grid grid-cols-2 gap-2">
                                  <Link href={`/arena?subject=${subjectId}&topic=${encodeURIComponent(selectedNode.label)}&mode=flashcards`} className="w-full">
                                      <button className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 rounded-xl text-sm font-bold transition-all border border-slate-700 hover:border-slate-600">
                                          <Layers className="w-4 h-4 text-emerald-400" /> Flashcards
                                      </button>
                                  </Link>
                                  <Link href={`/arena?subject=${subjectId}&topic=${encodeURIComponent(selectedNode.label)}&mode=mock`} className="w-full">
                                      <button className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 rounded-xl text-sm font-bold transition-all border border-slate-700 hover:border-slate-600">
                                          <Target className="w-4 h-4 text-rose-400" /> Mock Quiz
                                      </button>
                                  </Link>
                             </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
