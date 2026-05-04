/**
 * Moderation Configuration
 * Centralized settings for defamation prevention
 */

export const MODERATION_CONFIG = {
    // Risk score thresholds
    SAFE_THRESHOLD: 40,
    SOFT_FLAG_THRESHOLD: 70,
    BLOCK_THRESHOLD: 70,

    // Scoring weights
    NAMED_ENTITY_SCORE: 25,
    ACCUSATION_KEYWORD_SCORE: 30,
    STRONG_NEGATIVE_SENTIMENT_SCORE: 20,
    IDENTIFIER_SCORE: 50, // Email, phone, ID
    NAME_PATTERN_SCORE: 15,

    // Rate limiting
    MAX_POSTS_PER_HOUR: 10,
    MAX_POSTS_PER_DAY: 50,

    // Post categories
    CATEGORIES: ["confession", "story", "opinion"] as const,

    // Defamation keywords that often accompany accusations
    ACCUSATION_KEYWORDS: [
        "thief",
        "fraud",
        "cheater",
        "harassed",
        "liar",
        "scam",
        "stole",
        "raped",
        "abused",
        "groomed",
        "molested",
        "assaulted",
        "drugged",
        "criminal",
        "murderer",
        "rapist",
        "pedophile",
        "stalker",
        "blackmail",
        "extortion",
    ],

    // Negative sentiment indicators
    NEGATIVE_SENTIMENT_WORDS: [
        "hate",
        "disgusting",
        "pathetic",
        "worthless",
        "evil",
        "horrible",
        "terrible",
        "awful",
        "disgusted",
        "despicable",
    ],

    // Allowed tags (prevent name-like tags)
    DISALLOWED_TAG_PATTERNS: [
        /^[a-z]\s[a-z]/i, // Single letter + space + letter (e.g., "J Smith")
        /^[a-z]+\s[a-z]+$/i, // Two word names
        /\d{6,}/i, // Long digit sequences that look like IDs
    ],

    // Name patterns to avoid (simplified)
    NAME_PATTERNS: {
        FIRST_LAST: /\b([A-Z][a-z]+)\s+([A-Z][a-z]+)\b/, // John Smith
        TITLE_NAME: /\b(Dr|Mr|Mrs|Ms|Prof|Sir)\s+([A-Z][a-z]+)/i,
        SINGLE_INITIAL: /\b[A-Z]\.\s+[A-Z][a-z]+\b/, // J. Smith
    },
};

export type PostCategory = typeof MODERATION_CONFIG.CATEGORIES[number];
