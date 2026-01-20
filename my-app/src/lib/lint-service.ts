export interface LintError {
    id: string;
    message: string;
    suggestion?: string;
    index: number; // Character index where the error starts
    length: number;
    severity: 'warning' | 'error';
}

const WEASEL_WORDS = ['very', 'basically', 'essentially', 'simply', 'totally', 'completely', 'absolutely', 'literally'];
const PASSIVE_VOICE_PATTERNS = [
    /\b(am|are|is|was|were|be|been|being)\s+\w+ed\b/gi, // Simple passive check
];

export const LintService = {
    lint: (text: string): LintError[] => {
        const errors: LintError[] = [];

        // Check for weasel words
        WEASEL_WORDS.forEach(word => {
            // Match whole word, case insensitive
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            let match;
            while ((match = regex.exec(text)) !== null) {
                errors.push({
                    id: `weasel-${match.index}`,
                    message: `Avoid using weasel word: "${match[0]}"`,
                    suggestion: 'Remove or be more specific',
                    index: match.index,
                    length: match[0].length,
                    severity: 'warning'
                });
            }
        });

        // Check for "very" + adjective (simplistic check)
        const veryRegex = /\bvery\s+(\w+)/gi;
        let veryMatch;
        while ((veryMatch = veryRegex.exec(text)) !== null) {
            errors.push({
                id: `weak-adj-${veryMatch.index}`,
                message: `Weak phrase: "${veryMatch[0]}"`,
                suggestion: 'Use a stronger adjective',
                index: veryMatch.index,
                length: veryMatch[0].length,
                severity: 'warning'
            });
        }

        // Check for passive voice
        PASSIVE_VOICE_PATTERNS.forEach(pattern => {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                errors.push({
                    id: `passive-${match.index}`,
                    message: `Passive voice detected: "${match[0]}"`,
                    suggestion: 'Consider active voice',
                    index: match.index,
                    length: match[0].length,
                    severity: 'warning'
                });
            }
        });

        return errors.sort((a, b) => a.index - b.index);
    }
};
