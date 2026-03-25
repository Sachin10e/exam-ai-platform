import { QuestionType } from './questionClassifier';

export const AI_RESPONSE_TEMPLATES: Record<QuestionType, string> = {
    definition: `
You MUST strictly follow this hierarchical format:
1. **Definition**: Provide a highly accurate, concise, 1-2 sentence academic definition of the term.
2. **Characteristics**: Use a bulleted list to outline the primary characteristics, attributes, or properties.
3. **Example**: Provide a concrete real-world or theoretical example demonstrating the concept.
    `.trim(),

    comparison: `
You MUST exclusively prioritize creating a detailed Markdown comparison table outlining the distinct differences between the entities across various logical parameters (e.g., "Feature", "Entity A", "Entity B"). Provide a brief summary conclusion.
    `.trim(),

    process: `
You MUST strictly follow this hierarchical format:
1. **Steps List**: Break down the process clearly using numbered markdown lists explaining what happens at each stage.
2. **Mermaid Flowchart**: Provide a native mermaid flowchart mapping the logical execution.
CRITICAL MERMAID RULES:
- Wrap all node labels in double quotes (e.g., A["Step 1"])
- DO NOT use text on edges (e.g., A-->B is valid, A--text-->B is INVALID)
    `.trim(),

    architecture: `
You MUST strictly follow this structured format:
1. **Explanation**: Provide an academic overview explaining the structural architecture or high-level topology requested.
2. **Mermaid Component Diagram**: Produce the exact geometric structure natively through a mermaid flowchart. Use \`subgraph\` blocks to group components conceptually!
CRITICAL MERMAID RULES:
- Use standard Flowchart TD or LR. 
- Use \`subgraph\` to cluster system architecture boundaries.
- Wrap all node labels in double quotes (e.g., A["API Gateway"])
- DO NOT use text on edges (e.g., A-->B is valid, A--text-->B is INVALID)
    `.trim(),

    list: `
You MUST strictly format your primary output using hierarchical markdown bullet points or numbered lists containing concise headers. Avoid generating monolithic block paragraphs.
    `.trim(),

    calculation: `
You MUST strictly follow this hierarchical format:
1. **Explanation**: Provide a brief academic intuition explaining the formula or proof being calculated.
2. **Formula/Calculation**: Render all mathematical steps, equations, and derivations natively using strict LaTeX block syntax.
CRITICAL LATEX RULES:
- Frame standalone equations natively inside double dollar signs: $$ equation $$
- Frame inline variables or single operators natively inside single dollar signs: $ variable $
- Show your step-by-step mathematical work clearly across lines.
    `.trim(),

    concept: `
You MUST strictly follow this hierarchical format:
1. **Overview**: An introductory breakdown breaking down the scope of the concept.
2. **Explanation**: A deeper, critical deep-dive breaking down structural and theoretical components.
3. **Example**: Real-world application or algorithmic illustration solidifying the concept contextually.
    `.trim()
};

export function getTemplateForType(type: QuestionType): string {
    return AI_RESPONSE_TEMPLATES[type] || AI_RESPONSE_TEMPLATES['concept'];
}
