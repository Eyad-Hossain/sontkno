/**
 * Moderation System Test Cases
 * 
 * Demonstrates the moderation service with realistic examples
 */

import { moderatePost } from "@/lib/moderationService";
import {
    detectIdentifiers,
    detectPersonNames,
    detectAccusationKeywords,
    analyzeSentiment,
} from "@/lib/moderationService";

// ─────────────────────────────────────────────────────────────
// TEST CASE 1: SAFE POST (Score < 40) → AUTO PUBLISHED
// ─────────────────────────────────────────────────────────────

export const SAFE_POST_TEST = {
    title: "Safe Story Post",
    input: {
        content: "Today I had an amazing experience at campus. I went to the library and met so many interesting people. Made new friends and had a great study session.",
        category: "story",
        tags: ["campus-life", "friendship"],
    },
    expectedStatus: "published",
    expectedScore: "< 40",
    explanation: "No identifiers, no names, positive sentiment. Safe to publish immediately.",
};

// ─────────────────────────────────────────────────────────────
// TEST CASE 2: SOFT-FLAGGED POST (Score 40-70) → UNDER REVIEW
// ─────────────────────────────────────────────────────────────

export const SOFT_FLAGGED_POST_TEST = {
    title: "Opinion with Accusation Keywords",
    input: {
        content: "I think someone in my dorm is a liar. They keep telling everyone false stories about their background. It's really frustrating and dishonest.",
        category: "opinion",
        tags: ["dorm", "honesty"],
    },
    expectedStatus: "under_review",
    expectedScore: "40-70",
    explanation: "Contains accusation keyword 'liar' + negative sentiment. Requires admin review but may be publishable.",
};

// ─────────────────────────────────────────────────────────────
// TEST CASE 3: BLOCKED POST (Score > 70) → REJECTED
// ─────────────────────────────────────────────────────────────

export const BLOCKED_POST_TEST_1 = {
    title: "Post with Email Address",
    input: {
        content: "John Smith (john.smith@example.com) is a thief and a fraud. He stole money from our club.",
        category: "confession",
        tags: [],
    },
    expectedStatus: "rejected",
    expectedScore: "> 70",
    explanation: "Contains email (50pts) + name (25pts) + accusation keywords (30pts). High defamation risk.",
};

export const BLOCKED_POST_TEST_2 = {
    title: "Post with Phone Number and Accusations",
    input: {
        content: "If you want to report a cheater named Sarah Johnson call 555-123-4567. She harassed me and other students.",
        category: "confession",
        tags: [],
    },
    expectedStatus: "rejected",
    expectedScore: "> 70",
    explanation: "Contains phone number (50pts) + full name (25pts) + accusation keywords (30pts). Clearly defamatory.",
};

export const BLOCKED_POST_TEST_3 = {
    title: "Post with Student ID",
    input: {
        content: "Student ID 1234567 is a pedophile and should be expelled. Multiple girls have complained about him.",
        category: "confession",
        tags: [],
    },
    expectedStatus: "rejected",
    expectedScore: "> 70",
    explanation: "Contains student ID (50pts) + severe accusation keyword 'pedophile' (30pts). Serious defamation.",
};

// ─────────────────────────────────────────────────────────────
// TEST CASE 4: FALSE POSITIVE CHECKS (Should Pass)
// ─────────────────────────────────────────────────────────────

export const FALSE_POSITIVE_TEST_1 = {
    title: "Book Character Name (False Positive)",
    input: {
        content: "I just read a great book. The protagonist Mary Johnson is so inspiring. Her journey from poverty to success is incredible.",
        category: "story",
        tags: ["book", "fiction"],
    },
    expectedStatus: "soft_flagged", // Might trigger name detection but low overall score
    expectedScore: "< 70",
    explanation: "Contains a name (Mary Johnson) but no accusations. Score should stay low. Conversation about fiction is allowed.",
};

export const FALSE_POSITIVE_TEST_2 = {
    title: "Negative Review of Non-Person Entity",
    input: {
        content: "This campus dining hall is absolutely terrible. The food quality is disgusting and the service is awful. Total waste of money.",
        category: "opinion",
        tags: ["campus", "dining"],
    },
    expectedStatus: "soft_flagged", // May trigger negative sentiment but no personal defamation
    expectedScore: "20-40",
    explanation: "Contains negative sentiment about a place (not a person). Should not be heavily penalized.",
};

// ─────────────────────────────────────────────────────────────
// UTILITY: Run all tests
// ─────────────────────────────────────────────────────────────

export function runModerationTests() {
    const tests = [
        {
            ...SAFE_POST_TEST,
            result: moderatePost(SAFE_POST_TEST.input.content, SAFE_POST_TEST.input.category, SAFE_POST_TEST.input.tags),
        },
        {
            ...SOFT_FLAGGED_POST_TEST,
            result: moderatePost(SOFT_FLAGGED_POST_TEST.input.content, SOFT_FLAGGED_POST_TEST.input.category, SOFT_FLAGGED_POST_TEST.input.tags),
        },
        {
            ...BLOCKED_POST_TEST_1,
            result: moderatePost(BLOCKED_POST_TEST_1.input.content, BLOCKED_POST_TEST_1.input.category, BLOCKED_POST_TEST_1.input.tags),
        },
        {
            ...BLOCKED_POST_TEST_2,
            result: moderatePost(BLOCKED_POST_TEST_2.input.content, BLOCKED_POST_TEST_2.input.category, BLOCKED_POST_TEST_2.input.tags),
        },
        {
            ...BLOCKED_POST_TEST_3,
            result: moderatePost(BLOCKED_POST_TEST_3.input.content, BLOCKED_POST_TEST_3.input.category, BLOCKED_POST_TEST_3.input.tags),
        },
        {
            ...FALSE_POSITIVE_TEST_1,
            result: moderatePost(FALSE_POSITIVE_TEST_1.input.content, FALSE_POSITIVE_TEST_1.input.category, FALSE_POSITIVE_TEST_1.input.tags),
        },
        {
            ...FALSE_POSITIVE_TEST_2,
            result: moderatePost(FALSE_POSITIVE_TEST_2.input.content, FALSE_POSITIVE_TEST_2.input.category, FALSE_POSITIVE_TEST_2.input.tags),
        },
    ];

    return tests.map((test) => ({
        title: test.title,
        expectedStatus: test.expectedStatus,
        actualStatus: test.result.status,
        expectedScore: test.expectedScore,
        actualScore: test.result.riskScore,
        passed: test.result.status === test.expectedStatus,
        explanation: test.explanation,
        reasons: test.result.reasons,
    }));
}

// ─────────────────────────────────────────────────────────────
// COMPONENT TEST: Detection Functions
// ─────────────────────────────────────────────────────────────

export function testDetectionFunctions() {
    console.log("=== IDENTIFIER DETECTION ===");
    const testText1 = "Contact me at john@example.com or 555-123-4567";
    console.log("Text:", testText1);
    console.log("Identifiers:", detectIdentifiers(testText1));

    console.log("\n=== PERSON NAME DETECTION ===");
    const testText2 = "Dr. Smith and Mary Johnson both agree this is wrong.";
    console.log("Text:", testText2);
    console.log("Names:", detectPersonNames(testText2));

    console.log("\n=== ACCUSATION KEYWORD DETECTION ===");
    const testText3 = "He is a thief and a liar. He committed fraud against us.";
    console.log("Text:", testText3);
    console.log("Accusations:", detectAccusationKeywords(testText3));

    console.log("\n=== SENTIMENT ANALYSIS ===");
    const testText4 = "This is absolutely disgusting and horrible! I HATE this place!!!";
    console.log("Text:", testText4);
    console.log("Sentiment:", analyzeSentiment(testText4));
}
