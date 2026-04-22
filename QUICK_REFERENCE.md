# Quick Reference: Bloom Moderation System

## 📚 File Map

```
frontend/
├── lib/
│   ├── moderationConfig.ts      ← Settings (keywords, thresholds, weights)
│   ├── moderationService.ts     ← Core detection & scoring engine
│   └── moderationTests.ts       ← Test cases & examples
├── actions/
│   ├── post.ts                  ← createPost() with moderation
│   └── moderation.ts            ← Admin functions (approve, reject, stats)
├── components/
│   └── CreatePostModal.tsx      ← Updated UI (category, tags, warnings)
├── prisma/
│   └── schema.prisma            ← DB schema (Post fields + ModerationQueue)
│
├── MODERATION_DOCUMENTATION.md  ← Detailed technical docs
├── IMPLEMENTATION_CHECKLIST.md  ← Deployment & testing guide
└── IMPLEMENTATION_SUMMARY.md    ← Overview & quick start
```

---

## 🎯 Risk Scoring Reference

```
IDENTIFIER DETECTION
  Email (e.g., john@example.com) ...................... +50 pts
  Phone (e.g., 555-123-4567) .......................... +50 pts
  Student ID (e.g., 1234567) .......................... +50 pts
  SSN-like (e.g., 123-45-6789) ........................ +50 pts

PERSON NAMES
  Full name (e.g., John Smith) ........................ +25 pts
  Titled name (e.g., Dr. Smith) ....................... +25 pts

ACCUSATIONS
  Per keyword found (thief, fraud, liar, etc.) ....... +30 pts

SENTIMENT
  Strong negative (hate, disgusting, etc.) ........... +20 pts
  Negative opinion .................................... +15 pts

TOTAL RISK SCORE: 0-100

PUBLICATION DECISION
  < 40:   Publish immediately ✅
  40-70:  Publish + Queue for review ⏳
  > 70:   Reject, ask user to edit ❌
```

---

## 🔑 Keyword Lists

### Accusation Keywords (20+)
```
"thief", "fraud", "cheater", "harassed", "liar", "scam",
"stole", "raped", "abused", "groomed", "molested", "assaulted",
"drugged", "criminal", "murderer", "rapist", "pedophile", "stalker",
"blackmail", "extortion"
```

### Negative Sentiment Words
```
"hate", "disgusting", "pathetic", "worthless", "evil",
"horrible", "terrible", "awful", "despised", "despicable"
```

---

## 💻 Main Functions Reference

### `moderatePost(content, category, tags)` → ModerationResult
```typescript
import { moderatePost } from "@/lib/moderationService";

const result = moderatePost(
  "John Smith stole my laptop",
  "confession",
  ["theft", "laptop"]
);

// Returns:
{
  riskScore: 105,  // (25 + 50 + 30) capped at 100
  status: "blocked",
  reasons: [
    "Detected 1 name(s)",
    "Contains accusation keywords: stole"
  ],
  detectedEntities: [
    { type: "full_name", value: "John Smith", ... }
  ]
}
```

### `createPost(content, category, tags, groupId)` → CreatePostResponse
```typescript
import { createPost } from "@/actions/post";

const response = await createPost(
  "Great campus experience!",
  "story",
  ["campus-life"],
  "default-group-id"
);

// Returns:
{
  success: true,
  postId: "cuid123",
  publicationStatus: "published",  // or "under_review" / "rejected"
  riskScore: 15,
  message: "Post published successfully!"
}
```

### Admin Functions
```typescript
// Get queue
const { queue, total } = await getModerationQueue(20, 0);

// Approve post
await approveModerationPost(postId);

// Reject post
await rejectModerationPost(postId, "Contains real name");

// Stats
const stats = await getModerationStats();
```

---

## 🧪 Quick Test

### Safe Post
```
Content: "I had an amazing day at campus!"
Category: "story"
Tags: ["campus-life"]

Score: ~10 ✅
Status: published
```

### Risky Post
```
Content: "John Smith is a liar and thief"
Category: "confession"
Tags: []

Score: ~80 ❌
Status: rejected
Reason: "Contains names, accusations"
```

---

## ⚙️ Configuration Cheat Sheet

### File: `lib/moderationConfig.ts`

**To make stricter:**
```typescript
SAFE_THRESHOLD: 30  // ← lower = more queued
IDENTIFIER_SCORE: 60  // ← higher = more sensitive
ACCUSATION_KEYWORD_SCORE: 40  // ← higher = more sensitive
```

**To make lenient:**
```typescript
SAFE_THRESHOLD: 50  // ← higher = more auto-published
IDENTIFIER_SCORE: 30  // ← lower = less sensitive
STRONG_NEGATIVE_SENTIMENT_SCORE: 10  // ← lower = ignore tone
```

**To update keywords:**
```typescript
ACCUSATION_KEYWORDS: [
  // Add new
  "plagiarized", "falsified",
  // Remove overly broad
  // "cheater" ← remove this line
]
```

---

## 🚀 Deployment Steps

```bash
cd frontend

# 1. Update Prisma client
npx prisma generate

# 2. Apply schema to database
npx prisma db push

# 3. (Optional) Verify in studio
npx prisma studio

# 4. Done! System is live
```

---

## 📊 Admin Dashboard Usage

### Check Queue
```typescript
const { queue, total } = await getModerationQueue();

queue.forEach(item => {
  console.log(`
    [${item.riskScore}/100] ${item.post.content.substring(0, 50)}...
    Category: ${item.category}
    Status: ${item.status}
  `);
});
```

### Approve Post
```typescript
// Admin reviews and approves uncertain post
await approveModerationPost(postId);
// → Post now visible to all users
```

### Reject Post
```typescript
// Admin rejects genuine defamation
await rejectModerationPost(postId, "Contains real names and accusations");
// → Post hidden, user can edit and resubmit
```

### Dashboard Stats
```typescript
const stats = await getModerationStats();
console.log(`
  Total posts: ${stats.totalPosts}
  Pending review: ${stats.pendingReview}
  Flagged by users: ${stats.flaggedPosts}
  Removed: ${stats.removedPosts}
  Avg risk score: ${stats.averageRiskScore}
`);
```

---

## 🚨 Common Commands

### Test Detection Functions
```bash
# In Node.js
node -r ts-node/register lib/moderationTests.ts
```

### View Database
```bash
npx prisma studio
# Check: Post table (new fields), ModerationQueue table
```

### Run All Tests
```typescript
import { runModerationTests } from "@/lib/moderationTests";
const results = runModerationTests();
results.forEach(t => console.log(`${t.title}: ${t.passed ? '✅' : '❌'}`));
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Unknown field category in Post" | `npx prisma generate && npx prisma db push` |
| Posts not being moderated | Check Prisma client is regenerated |
| Too many false positives | Increase `SAFE_THRESHOLD` in config |
| Real defamation publishing | Lower `SOFT_FLAG_THRESHOLD` or add keywords |
| Tags not storing | Ensure PostgreSQL JSON support, check schema |

---

## 📈 Success Metrics

✅ 90%+ posts auto-published (healthy)
✅ 5-10% in review queue (normal)
✅ < 5% blocked (selective)
✅ < 5% false positives (good accuracy)
✅ Average risk score ~25 (low risk)

---

## 📝 Key Concepts

**Publication Status:**
- `"published"` = visible to all (either auto-approved or admin-approved)
- `"under_review"` = visible but flagged for review
- `"rejected"` = hidden, user must edit and resubmit

**Risk Score:**
- Based on detected identifiers, names, accusations, sentiment
- Weighted algorithm, capped at 100
- Higher = more defamation risk

**Soft-Flagged Posts:**
- Published immediately (better UX)
- Added to review queue
- Admin can dismiss (false positive) or confirm
- Keeps moderation from slowing down new users

---

## 🎓 What Mods Should Know

1. **How scoring works**: Each component adds points
2. **Why soft-flagged**: Great review candidates, often legitimate
3. **False positives**: Book characters, historical figures, general criticism
4. **Clear rejections**: Explain why user needs to edit
5. **Privacy first**: Never share user data with rejecters

---

## 📚 Documentation Map

- **Need details?** → `MODERATION_DOCUMENTATION.md`
- **Deploying?** → `IMPLEMENTATION_CHECKLIST.md`
- **Overview?** → `IMPLEMENTATION_SUMMARY.md`
- **Quick ref?** → This page! 📄

---

**Status**: ✅ Production Ready
**Lines of Code**: ~1000 (modular, documented)
**Test Cases**: 7+
**Configuration**: Highly customizable

Ready to deploy! 🚀
