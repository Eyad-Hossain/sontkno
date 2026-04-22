# Bloom Moderation System Documentation

## Overview

Bloom implements a **multi-layered defamation prevention system** that balances community safety with anonymity. The system uses:

- **Pre-publication moderation** (automatic risk scoring)
- **Named entity recognition** (detect names and identifiers)
- **Sentiment analysis** (detect targeted negativity)
- **Keyword filtering** (accusation detection)
- **Admin review queue** (for borderline posts)

---

## Architecture

### 1. Risk Scoring System

Every post receives a **risk score (0-100)** based on detected content:

| Score Range | Status | Action |
|------------|--------|--------|
| **< 40** | Safe | ✅ Auto-publish immediately |
| **40-70** | Soft-flagged | ⏳ Publish but queue for review |
| **> 70** | Blocked | ❌ Reject, require editing |

### 2. Risk Score Calculation

```
Risk Score = Σ(factor weights)

Named entity (full name):        +25 pts
Accusation keyword:             +30 pts per keyword
Strong negative sentiment:       +20 pts
Identifier (email/phone/ID):    +50 pts per identifier
Negative opinion:               +15 pts
```

---

## Components

### `lib/moderationConfig.ts`

**Centralized configuration** for all moderation settings:

```typescript
MODERATION_CONFIG = {
  SAFE_THRESHOLD: 40,          // Score below = auto-publish
  SOFT_FLAG_THRESHOLD: 70,      // Score 40-70 = needs review
  BLOCK_THRESHOLD: 70,          // Score above = reject

  ACCUSATION_KEYWORDS: [
    "thief", "fraud", "cheater", "harassed", "liar", "scam",
    "stole", "raped", "abused", "groomed", "assaulted", etc.
  ],

  NEGATIVE_SENTIMENT_WORDS: [
    "hate", "disgusting", "pathetic", "evil", "horrible", etc.
  ],

  CATEGORIES: ["confession", "story", "opinion"],
};
```

### `lib/moderationService.ts`

**Core moderation engine** with 5 detection methods:

#### 1. `detectIdentifiers(text)`

Finds personal information:
- **Email**: `john@example.com`
- **Phone**: `(555) 123-4567`, `555.123.4567`
- **Student ID**: 7-9 digit sequences
- **SSN-like**: `123-45-6789`

```typescript
const identifiers = detectIdentifiers("Email john@example.com");
// Returns: [{ type: "email", value: "john@example.com", start: 6, end: 24 }]
```

#### 2. `detectPersonNames(text)`

Uses pattern matching for names:
- **Full names**: "John Smith", "Mary Johnson"
- **Titled names**: "Dr. Smith", "Prof. Johnson"
- **Filters out**: common words (The, This, What)

```typescript
const names = detectPersonNames("John Smith did it");
// Returns: [{ type: "full_name", value: "John Smith", start: 0, end: 10 }]
```

#### 3. `detectAccusationKeywords(text)`

Identifies defamation-prone language:
- Accusation words: "thief", "fraud", "cheater", "liar"
- Severe crimes: "rapist", "pedophile", "murderer"
- Harassment: "harassed", "stalked", "blackmail"

```typescript
const accusations = detectAccusationKeywords("He's a thief and a liar");
// Returns: [{ keyword: "thief"... }, { keyword: "liar"... }]
```

#### 4. `analyzeSentiment(text)`

Evaluates emotional tone:
- Counts negative words
- Detects ALL CAPS (shout)
- Finds excessive punctuation (!!! ???)
- Returns: `{ sentiment: "negative" | "positive" | "neutral", score: 0-1 }`

```typescript
const sentiment = analyzeSentiment("I HATE this!!! So disgusting!!!");
// Returns: { sentiment: "negative", score: 0.8 }
```

#### 5. `validateTags(tags)`

Prevents tag-based name exposure:
- Blocks: "John Smith" (looks like name)
- Blocks: "J A" (letters + letters)
- Blocks: numbers > 6 digits
- Allows: campus-life, friendship

```typescript
const validation = validateTags(["campus-life", "John Smith"]);
// Returns: { valid: ["campus-life"], invalid: [{ tag: "John Smith", reason: "..." }] }
```

### Main Function: `moderatePost(content, category, tags)`

Returns comprehensive moderation result:

```typescript
{
  riskScore: 52,
  status: "soft_flagged",
  reasons: [
    "Detected 1 identifier(s): email",
    "Contains accusation keywords: fraud, liar"
  ],
  detectedEntities: [
    { type: "email", value: "john@example.com", ... },
    { type: "full_name", value: "John Smith", ... }
  ]
}
```

---

## Database Schema

### Posts Table (Updated)

```prisma
model Post {
  id                  String
  content             String
  category            String          // "confession", "story", "opinion"
  tags                String[]        // JSON array
  publicationStatus   String          // "published", "under_review", "rejected"
  riskScore          Int              // 0-100
  moderationReason    String?         // Why it was flagged
  
  // Existing fields...
  reactions           Reaction[]
  comments            Comment[]
  reports             Report[]
  
  @@map("posts")
}
```

### New: ModerationQueue Table

```prisma
model ModerationQueue {
  id              String   @id
  post            Post     @relation(fields: [postId], references: [id])
  postId          String   @unique
  content         String
  category        String
  tags            String[]
  riskScore       Int
  status          String    // "pending", "approved", "rejected"
  reviewedAt      DateTime?
  reviewedBy      String?   // Admin user ID
  createdAt       DateTime
  
  @@map("moderation_queue")
}
```

---

## API Changes

### `actions/post.ts` - `createPost()`

**Updated signature:**
```typescript
export async function createPost(
  content: string,
  category: string,           // NEW
  tags: string[],            // NEW
  groupId: string,
  imageUrl?: string
): Promise<CreatePostResponse>
```

**Response:**
```typescript
{
  success: boolean,
  postId?: string,
  publicationStatus: "published" | "under_review" | "rejected",
  riskScore: number,
  message: string              // User-friendly message
}
```

**Flow:**
1. Validate session & category
2. Run `moderatePost()`
3. Calculate risk score
4. Determine publication status
5. Store in `posts` table with status
6. If risky, queue in `moderation_queue`
7. Return response

---

## Frontend UI Updates

### CreatePostModal Component

**New Fields:**

1. **Category Dropdown**
   ```tsx
   <select value={category} onChange={(e) => setCategory(e.target.value)}>
     <option>Confession</option>
     <option>Story</option>
     <option>Opinion</option>
   </select>
   ```

2. **Tags Input**
   ```tsx
   <input 
     placeholder="Add a tag and press Enter..."
     onKeyDown={handleAddTag}
   />
   // Displays as chips with delete buttons
   ```

3. **Warning Banner**
   ```tsx
   ⚠️ "Do not include real names, email addresses, phone numbers,
      or student IDs. Violating posts may be removed or require review."
   ```

4. **Status Messages**
   - ❌ Error: "Post rejected - contains identifying information"
   - ⏳ Under Review: "Your post is being reviewed for community safety"
   - ✅ Published: "Post published successfully!"

---

## Admin Dashboard

### `actions/moderation.ts` - New Functions

```typescript
// Get pending posts in moderation queue
getModerationQueue(limit, offset)
// Returns: { queue[], total }

// Approve a soft-flagged post
approveModerationPost(postId)
// Updates status to "published"

// Reject a soft-flagged post
rejectModerationPost(postId, reason)
// Updates status to "rejected", removes post

// Get moderation statistics
getModerationStats()
// Returns: {
//   totalPosts,
//   pendingReview,
//   flaggedPosts,
//   removedPosts,
//   averageRiskScore
// }
```

---

## Test Cases

### Test 1: Safe Post ✅
```
Input:
  "Today I had an amazing experience at campus. Made new friends."
  Category: story
  Tags: ["campus-life", "friendship"]

Expected: Published (score < 40)
Reason: No identifiers, no names, positive tone
```

### Test 2: Soft-Flagged ⏳
```
Input:
  "Someone in my dorm is a liar and keeps deceiving everyone."
  Category: opinion
  Tags: ["dorm"]

Expected: Under Review (score 40-70)
Reason: Accusation keyword "liar" + negative sentiment
Admin can approve if they deem it acceptable criticism
```

### Test 3: Blocked ❌
```
Input:
  "John Smith (john@example.com) is a thief and committed fraud.
   Call 555-123-4567 to report him."
  Category: confession

Expected: Rejected (score > 70)
Reason:
  - Email: +50
  - Full name: +25
  - Phone: +50
  - Accusations (thief, fraud): +60
  Total: 185 → capped at 100
```

### Test 4: False Positive ✅
```
Input:
  "I loved reading about Mary Johnson in my history textbook.
   She's an inspiring figure in American history."
  Category: story
  Tags: ["history", "biography"]

Expected: Published (score < 40)
Reason: Name detected but no accusations. Non-defamatory context.
```

---

## Configuration & Customization

### To adjust sensitivity:

Edit `lib/moderationConfig.ts`:

```typescript
// Make stricter
SAFE_THRESHOLD: 30,              // Lower = more posts queued
NAMED_ENTITY_SCORE: 40,          // Higher = more sensitive to names

// Make more lenient
ACCUSATION_KEYWORD_SCORE: 20,    // Lower = less sensitive
STRONG_NEGATIVE_SENTIMENT_SCORE: 10,  // Lower = ignore tone

// Add keywords
ACCUSATION_KEYWORDS: [
  "thief", "fraud", "cheater", "harassed",
  // ADD MORE HERE
  "my-custom-word"
]
```

### To ignore false positives:

Add to name filters in `moderationService.ts`:

```typescript
const commonWords = [
  "The", "This", "That", "What", "Where", "When",
  // ADD MORE COMMON NAMES HERE
  "Shakespeare", "Shakespeare" // Historical figures
];
```

---

## Security Notes

### ✅ Anonymity Preserved
- Hashes stored instead of plain emails (future enhancement)
- No user ID linked to content
- Tags stripped if post is risky
- Admin actions logged separately from post data

### ❌ Defamation Prevention
- Full names + accusations = auto-queue
- Identifiers (email/phone/ID) = high risk
- Multiple accusation keywords = cumulative scoring
- Severe crimes = highest penalty

### Rate Limiting (Future)
```typescript
MAX_POSTS_PER_HOUR: 10
MAX_POSTS_PER_DAY: 50
```

---

## Workflow Diagram

```
User submits post
    ↓
serverAction: createPost()
    ↓
moderatePost(content, category, tags)
    ├─ detectIdentifiers()
    ├─ detectPersonNames()
    ├─ detectAccusationKeywords()
    ├─ analyzeSentiment()
    └─ validateTags()
    ↓
calculateRiskScore() → 0-100
    ↓
Decision:
    ├─ score < 40 → Published ✅
    ├─ 40 ≤ score < 70 → Queue + Publish ⏳
    └─ score ≥ 70 → Rejected ❌
    ↓
Store in Posts + ModerationQueue (if needed)
    ↓
Return response to frontend
    ↓
Show status message to user
    ↓
(Admin reviews queue → approve/reject)
```

---

## Future Enhancements

- [ ] Machine learning-based NER (improve name detection)
- [ ] Contextual sentiment analysis (sarcasm detection)
- [ ] Rate limiting per user/IP
- [ ] Hash user IDs in high-risk posts
- [ ] Email notifications for mods
- [ ] Automated appeal system
- [ ] Post edit detection (prevent workaround uploads)
