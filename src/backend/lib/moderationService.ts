/**
 * Moderation Service
 * 
 * Handles all pre-publication defamation prevention:
 * - Regex-based identifier detection
 * - Named entity recognition (simplified)
 * - Accusation keyword detection
 * - Sentiment analysis
 * - Risk score calculation
 */

import { MODERATION_CONFIG } from "./moderationConfig";

export interface ModerationResult {
    riskScore: number;
    status: "safe" | "soft_flagged" | "blocked";
    reasons: string[];
    detectedEntities: {
        type: string;
        value: string;
        start: number;
        end: number;
    }[];
}

/**
 * Detects phone numbers, emails, student IDs, and other PII
 */
export function detectIdentifiers(text: string): {
    type: string;
    value: string;
    start: number;
    end: number;
}[] {
    const identifiers: {
        type: string;
        value: string;
        start: number;
        end: number;
    }[] = [];

    // Email pattern: xxx@xxx.xxx
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    let match;
    while ((match = emailRegex.exec(text)) !== null) {
        identifiers.push({
            type: "email",
            value: match[0],
            start: match.index,
            end: match.index + match[0].length,
        });
    }

    // Phone pattern: (123) 456-7890, 123-456-7890, 1234567890
    const phoneRegex = /(\+?1?\s*)?(\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}\b/g;
    while ((match = phoneRegex.exec(text)) !== null) {
        identifiers.push({
            type: "phone",
            value: match[0],
            start: match.index,
            end: match.index + match[0].length,
        });
    }

    // Student ID pattern: 7-9 consecutive digits
    const idRegex = /\b\d{7,9}\b/g;
    while ((match = idRegex.exec(text)) !== null) {
        identifiers.push({
            type: "student_id",
            value: match[0],
            start: match.index,
            end: match.index + match[0].length,
        });
    }

    // Social Security-like pattern: XXX-XX-XXXX
    const ssnRegex = /\d{3}-\d{2}-\d{4}/g;
    while ((match = ssnRegex.exec(text)) !== null) {
        identifiers.push({
            type: "ssn_like",
            value: match[0],
            start: match.index,
            end: match.index + match[0].length,
        });
    }

    return identifiers;
}

/**
 * Detects likely person names using patterns and capitalization
 * Simplified NER - not a full ML model
 */
export function detectPersonNames(text: string): {
    type: string;
    value: string;
    start: number;
    end: number;
}[] {
    const names: {
        type: string;
        value: string;
        start: number;
        end: number;
    }[] = [];

    // First Last Name pattern (Capitalized words)
    const firstLastRegex = /\b([A-Z][a-z]+)\s+([A-Z][a-z]+)\b/g;
    let match;
    while ((match = firstLastRegex.exec(text)) !== null) {
        // Filter out common words like "I", "The", etc.
        const commonWords = ["The", "This", "That", "What", "Where", "When"];
        if (!commonWords.includes(match[1])) {
            names.push({
                type: "full_name",
                value: match[0],
                start: match.index,
                end: match.index + match[0].length,
            });
        }
    }

    // Title + Name pattern (Dr. Smith, Mr. John)
    const titleNameRegex = /\b(Dr|Mr|Mrs|Ms|Prof|Sir|Dr\.)\s+([A-Z][a-z]+)\b/gi;
    while ((match = titleNameRegex.exec(text)) !== null) {
        names.push({
            type: "titled_name",
            value: match[0],
            start: match.index,
            end: match.index + match[0].length,
        });
    }

    return names;
}

/**
 * Checks for accusation keywords that often precede defamatory content
 */
export function detectAccusationKeywords(text: string): {
    keyword: string;
    start: number;
    end: number;
}[] {
    const accusations: {
        keyword: string;
        start: number;
        end: number;
    }[] = [];



    for (const keyword of MODERATION_CONFIG.ACCUSATION_KEYWORDS) {
        const regex = new RegExp(`\\b${keyword}\\b`, "gi");
        let match;
        while ((match = regex.exec(text)) !== null) {
            accusations.push({
                keyword: match[0],
                start: match.index,
                end: match.index + match[0].length,
            });
        }
    }

    return accusations;
}

/**
 * Analyzes sentiment by counting negative indicators
 * Returns: "positive" | "negative" | "neutral"
 */
export function analyzeSentiment(text: string): {
    sentiment: "positive" | "negative" | "neutral";
    score: number; // 0 to 1 (higher = more negative)
} {
    const lowerText = text.toLowerCase();

    let negativeCount = 0;
    let positiveCount = 0;

    // Count negative words
    for (const word of MODERATION_CONFIG.NEGATIVE_SENTIMENT_WORDS) {
        const regex = new RegExp(`\\b${word}\\b`, "gi");
        const matches = lowerText.match(regex) || [];
        negativeCount += matches.length;
    }

    // Count positive words
    const positiveWords = ["love", "amazing", "great", "wonderful", "excellent", "good"];
    for (const word of positiveWords) {
        const regex = new RegExp(`\\b${word}\\b`, "gi");
        const matches = lowerText.match(regex) || [];
        positiveCount += matches.length;
    }

    // Check for ALL CAPS (often indicates strong emotion)
    const capWords = text.match(/\b[A-Z]{2,}\b/g) || [];
    if (capWords.length > 2) negativeCount += capWords.length;

    // Check for excessive punctuation
    const excessivePunctuation = (text.match(/[!?]{2,}/g) || []).length;
    if (excessivePunctuation > 1) negativeCount += excessivePunctuation;

    const net = negativeCount - positiveCount;
    const sentiment = net > 2 ? "negative" : net < -2 ? "positive" : "neutral";
    const score = Math.min(1, Math.abs(net) * 0.1); // Normalize to 0-1

    return { sentiment, score };
}

/**
 * Validates tags to prevent name-like tags
 */
export function validateTags(tags: string[]): {
    valid: string[];
    invalid: { tag: string; reason: string }[];
} {
    const valid: string[] = [];
    const invalid: { tag: string; reason: string }[] = [];

    for (const tag of tags) {
        let isValid = true;
        let reason = "";

        // Check for name-like patterns
        for (const pattern of MODERATION_CONFIG.DISALLOWED_TAG_PATTERNS) {
            if (pattern.test(tag)) {
                isValid = false;
                reason = "Tag looks like a person's name";
                break;
            }
        }

        // Check length
        if (tag.length < 2) {
            isValid = false;
            reason = "Tag must be at least 2 characters";
        }
        if (tag.length > 30) {
            isValid = false;
            reason = "Tag must be at most 30 characters";
        }

        // Check for offensive characters
        if (!/^[a-zA-Z0-9_-]+$/.test(tag)) {
            isValid = false;
            reason = "Tag can only contain letters, numbers, hyphens, and underscores";
        }

        if (isValid) {
            valid.push(tag.toLowerCase());
        } else {
            invalid.push({ tag, reason });
        }
    }

    return { valid, invalid };
}

/**
 * Main moderation function: calculates risk score
 * Combines all detection methods
 */
export function calculateRiskScore(
    text: string,
    category: string,
    _tags: string[] = []
): { score: number; breakdown: Record<string, number> } {
    let score = 0;
    const breakdown: Record<string, number> = {};

    // 1. Detect identifiers (email, phone, SSN, etc.)
    const identifiers = detectIdentifiers(text);
    if (identifiers.length > 0) {
        score += identifiers.length * MODERATION_CONFIG.IDENTIFIER_SCORE;
        breakdown.identifiers = identifiers.length * MODERATION_CONFIG.IDENTIFIER_SCORE;
    }

    // 2. Detect person names
    const names = detectPersonNames(text);
    if (names.length > 0) {
        score += names.length * MODERATION_CONFIG.NAMED_ENTITY_SCORE;
        breakdown.names = names.length * MODERATION_CONFIG.NAMED_ENTITY_SCORE;
    }

    // 3. Detect accusation keywords
    const accusations = detectAccusationKeywords(text);
    if (accusations.length > 0) {
        score += accusations.length * MODERATION_CONFIG.ACCUSATION_KEYWORD_SCORE;
        breakdown.accusations = accusations.length * MODERATION_CONFIG.ACCUSATION_KEYWORD_SCORE;
    }

    // 4. Analyze sentiment (especially for opinions)
    const { sentiment, score: sentimentScore } = analyzeSentiment(text);
    if (sentiment === "negative" && sentimentScore > 0.3) {
        score += sentimentScore * MODERATION_CONFIG.STRONG_NEGATIVE_SENTIMENT_SCORE;
        breakdown.negativeSentiment = Math.round(sentimentScore * MODERATION_CONFIG.STRONG_NEGATIVE_SENTIMENT_SCORE);
    }

    // 5. Opinion category with negative sentiment = higher risk
    if (category === "opinion" && sentiment === "negative") {
        score += 15; // Additional penalty for negative opinions
        breakdown.negativeOpinion = 15;
    }

    // Cap the score at 100
    score = Math.min(100, Math.max(0, score));

    return { score, breakdown };
}

/**
 * Main wrapper function for moderation
 * Returns comprehensive moderation result
 */
export function moderatePost(
    content: string,
    category: string,
    tags: string[] = []
): ModerationResult {
    const reasons: string[] = [];
    const detectedEntities: ModerationResult["detectedEntities"] = [];

    // Validate tags
    const tagValidation = validateTags(tags);
    if (tagValidation.invalid.length > 0) {
        reasons.push(
            `Invalid tags: ${tagValidation.invalid.map((t) => t.reason).join(", ")}`
        );
    }

    // Calculate risk score
    const { score } = calculateRiskScore(content, category, tagValidation.valid);

    // Collect entities
    const identifiers = detectIdentifiers(content);
    detectedEntities.push(...identifiers);

    const names = detectPersonNames(content);
    detectedEntities.push(...names);

    // Assign status based on score
    let status: "safe" | "soft_flagged" | "blocked" = "safe";
    if (score >= MODERATION_CONFIG.SOFT_FLAG_THRESHOLD && score < MODERATION_CONFIG.BLOCK_THRESHOLD) {
        status = "soft_flagged";
        reasons.push("Post contains potentially defamatory content and requires review");
    } else if (score >= MODERATION_CONFIG.BLOCK_THRESHOLD) {
        status = "blocked";
        reasons.push("Post detected as high-risk for defamation. Please review and remove identifying information.");
    }

    // Add specific reasons based on what was detected
    if (identifiers.length > 0) {
        reasons.push(`Detected ${identifiers.length} identifier(s): ${identifiers.map((i) => i.type).join(", ")}`);
    }
    if (names.length > 0) {
        reasons.push(`Detected ${names.length} potential name(s)`);
    }

    const accusations = detectAccusationKeywords(content);
    if (accusations.length > 0) {
        reasons.push(`Contains accusation keywords: ${accusations.map((a) => a.keyword).join(", ")}`);
    }

    const { sentiment } = analyzeSentiment(content);
    if (sentiment === "negative") {
        reasons.push("Post contains strong negative sentiment");
    }

    return {
        riskScore: Math.round(score),
        status,
        reasons,
        detectedEntities,
    };
}
