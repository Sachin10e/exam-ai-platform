export type QuestionType = 'definition' | 'comparison' | 'process' | 'architecture' | 'list' | 'calculation' | 'concept';

export function classifyQuestion(question: string): QuestionType {
    const q = question.toLowerCase();

    // 1. Definition patterns
    if (q.match(/^(what is|define|explain the term|meaning of|what do you mean by)/i)) {
        return 'definition';
    }

    // 2. Comparison patterns
    if (q.match(/(difference between|compare|vs|versus|distinguish between|similarities and differences)/i)) {
        return 'comparison';
    }

    // 3. Process / Steps / Algorithm patterns
    if (q.match(/(how to|how does|steps to|process of|algorithm for|mechanism of|explain the working)/i)) {
        return 'process';
    }

    // 4. Architectural component patterns
    if (q.match(/(draw|diagram|architecture|structure of|flowchart|visualize|schema|topology|components of)/i)) {
        return 'architecture';
    }

    // 5. Enumeration / Advantages / Disadvantages (List context)
    if (q.match(/(list|types of|advantages|disadvantages|benefits|features of|causes of|examples of)/i)) {
        return 'list';
    }

    // 6. Algebraic or Calculation patterns
    if (q.match(/(calculate|compute|solve|math|equation|formula|derivation|value of|evaluate)/i)) {
        return 'calculation';
    }

    // 7. Generic conceptual default
    return 'concept';
}
