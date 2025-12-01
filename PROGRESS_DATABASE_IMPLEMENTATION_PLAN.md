# Progress Tracking Database Implementation Plan

## Overview

This document describes how to implement database storage for student progress tracking. Currently, progress is stored only in localStorage. This plan outlines how to sync progress data to the database for each student while maintaining backward compatibility.

---

## 1. Student Identification Strategy

### Current Situation

- Main frontend (`app/(main)`) appears to be open/public (no student login required)
- Progress is currently stored anonymously in localStorage
- No student authentication system exists

### Options for Student Identification

#### Option A: Anonymous Student ID (Recommended)

- **How it works:**

  - Generate a unique anonymous student ID on first visit
  - Store in localStorage: `studentId: "uuid-here"`
  - This ID persists across sessions and devices (if user uses same browser)
  - No login required - seamless experience

- **Pros:**

  - No authentication needed
  - Simple implementation
  - Works immediately
  - Users can track progress without account

- **Cons:**
  - Progress lost if localStorage is cleared
  - Can't sync across devices/browsers
  - No way to recover progress if device changes

#### Option B: Student Account System

- **How it works:**

  - Create Student model with email/password
  - Students login to access content
  - Progress linked to student account

- **Pros:**

  - Progress synced across all devices
  - Can recover account
  - Can add features like certificates, achievements
  - Better analytics

- **Cons:**
  - Requires authentication system
  - More complex implementation
  - Students must create accounts

#### Option C: Hybrid Approach (Best Long-term)

- **Phase 1:** Implement anonymous tracking (Option A)
- **Phase 2:** Add optional account creation
- **Phase 3:** Allow linking anonymous progress to account

---

## 2. Database Schema Design

### Model: StudentProgress

**Location:** `models/StudentProgress.js`

**Schema Structure:**

```javascript
{
  studentId: {
    type: String,
    required: true,
    index: true  // For fast lookups
  },
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Unit",
    required: true
  },
  chapters: [{
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
      required: true
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }],
  unitProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}
```

**Indexes:**

- `{ studentId: 1, unitId: 1 }` - Compound unique index (one progress record per student per unit)
- `{ studentId: 1 }` - For fetching all progress for a student
- `{ unitId: 1 }` - For analytics (how many students completed unit)

---

## 3. API Routes Needed

### Route 1: GET `/api/progress/[unitId]`

**Purpose:** Fetch progress for a specific unit for current student

**Query Parameters:**

- `studentId` (required) - Student identifier

**Response:**

```json
{
  "success": true,
  "data": {
    "unitId": "unit123",
    "chapters": [
      {
        "chapterId": "chapter1",
        "progress": 75,
        "isCompleted": false,
        "lastUpdated": "2025-01-01T10:00:00Z"
      }
    ],
    "unitProgress": 50,
    "lastUpdated": "2025-01-01T10:00:00Z"
  }
}
```

---

### Route 2: POST `/api/progress/[unitId]`

**Purpose:** Update progress for a specific unit

**Request Body:**

```json
{
  "studentId": "student-uuid",
  "chapterId": "chapter123",
  "progress": 85,
  "isCompleted": false
}
```

**What it does:**

- Finds or creates StudentProgress record for this student + unit
- Updates the specific chapter progress
- Recalculates unit progress (average of all chapters)
- Returns updated progress data

**Response:**

```json
{
  "success": true,
  "data": {
    "unitId": "unit123",
    "chapters": [...],
    "unitProgress": 55,
    "lastUpdated": "2025-01-01T10:05:00Z"
  }
}
```

---

### Route 3: GET `/api/progress/all`

**Purpose:** Fetch all progress records for a student (for syncing)

**Query Parameters:**

- `studentId` (required)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "unitId": "unit1",
      "chapters": [...],
      "unitProgress": 50
    },
    {
      "unitId": "unit2",
      "chapters": [...],
      "unitProgress": 100
    }
  ]
}
```

---

### Route 4: POST `/api/progress/sync`

**Purpose:** Sync multiple units at once (batch operation)

**Request Body:**

```json
{
  "studentId": "student-uuid",
  "progressData": [
    {
      "unitId": "unit1",
      "chapters": [
        {
          "chapterId": "chapter1",
          "progress": 75,
          "isCompleted": false
        }
      ]
    }
  ]
}
```

**Use Case:** When student first loads page, sync all localStorage data to database

---

## 4. Implementation Flow

### Step 1: Generate/Retrieve Student ID

**Location:** New utility file or in existing hook

**Implementation:**

```javascript
// utils/studentId.js
export function getStudentId() {
  if (typeof window === "undefined") return null;

  let studentId = localStorage.getItem("studentId");

  if (!studentId) {
    // Generate new UUID
    studentId = generateUUID(); // Use crypto.randomUUID() or uuid library
    localStorage.setItem("studentId", studentId);
  }

  return studentId;
}
```

---

### Step 2: Modify useProgress Hook

**Changes to `app/(main)/hooks/useProgress.js`:**

1. **Add student ID retrieval:**

   - Import `getStudentId()` utility
   - Get student ID at hook initialization

2. **Add database sync on progress update:**

   - After saving to localStorage, also sync to database
   - Use `fetch()` or `api.post()` to send progress update
   - Handle errors gracefully (continue working if API fails)

3. **Add initial load from database:**

   - On component mount, fetch progress from database
   - Merge with localStorage data (database takes priority)
   - Fallback to localStorage if database fetch fails

4. **Sync strategy:**
   - **Immediate sync:** When progress changes, save to localStorage first (instant), then sync to database (background)
   - **Debounced sync:** For rapid changes (slider dragging), debounce database sync (wait 500ms after last change)
   - **Offline support:** Queue sync requests if offline, retry when back online

---

### Step 3: Create Database Sync Utility

**New file:** `app/(main)/utils/progressSync.js`

**Functions needed:**

1. **`syncProgressToDatabase(unitId, chapterId, progress, isCompleted)`**

   - Makes API call to POST `/api/progress/[unitId]`
   - Handles errors gracefully
   - Returns success/failure

2. **`fetchProgressFromDatabase(unitId)`**

   - Makes API call to GET `/api/progress/[unitId]`
   - Returns progress data or null

3. **`syncAllProgressToDatabase()`**

   - Reads all progress from localStorage
   - Sends batch sync request
   - Useful on initial page load

4. **`isOnline()`**
   - Check if browser is online
   - Use `navigator.onLine` and online/offline events

---

### Step 4: Update ChapterProgressItem Component

**Changes needed:**

- After `onProgressChange` callback, also trigger database sync
- Show sync status indicator (optional - small icon showing sync state)
- Handle sync errors silently (don't break user experience)

---

## 5. Data Synchronization Strategy

### Sync Priority Rules

1. **Database is source of truth** - If data exists in DB, use it
2. **LocalStorage is cache** - Fast access, but DB is authoritative
3. **Last write wins** - If conflict, use most recent timestamp

### Sync Flow Diagram

```
User Updates Progress
    ↓
Save to localStorage (instant UI update)
    ↓
[Debounce 500ms if rapid changes]
    ↓
Send to Database API
    ↓
Success? → Update timestamp in localStorage
    ↓
Failed? → Queue for retry, continue working offline
```

### Conflict Resolution

**Scenario:** Student updates progress on Device A, then on Device B before sync completes

**Solution:**

- Database stores `lastUpdated` timestamp
- On fetch, compare timestamps
- Use most recent update
- Update localStorage with latest data

---

## 6. Offline Support

### How to Handle Offline Scenarios

1. **Queue sync requests:**

   - Store failed syncs in localStorage: `progressSyncQueue: [...]`
   - Retry queue when back online

2. **Background sync:**

   - Use `navigator.serviceWorker` (if available)
   - Or simple polling when page becomes visible

3. **User experience:**
   - Progress always works offline (localStorage)
   - Show subtle indicator when offline
   - Auto-sync when connection restored

---

## 7. Implementation Steps (Recommended Order)

### Phase 1: Database Setup

1. Create `models/StudentProgress.js` schema
2. Add database indexes
3. Test schema with sample data

### Phase 2: API Routes

1. Create `/api/progress/[unitId]` routes (GET & POST)
2. Create `/api/progress/all` route
3. Create `/api/progress/sync` route (optional, for batch)
4. Test API routes with Postman/curl

### Phase 3: Student ID Generation

1. Create `getStudentId()` utility function
2. Test ID generation and persistence

### Phase 4: Sync Integration

1. Create `progressSync.js` utility file
2. Add sync functions (fetch, save, batch)
3. Test sync functions in isolation

### Phase 5: Hook Integration

1. Modify `useProgress` hook to:
   - Get student ID
   - Fetch from database on mount
   - Sync to database on update
   - Handle errors gracefully

### Phase 6: Component Updates

1. Update `ChapterProgressItem` to trigger sync
2. Add loading states (optional)
3. Test end-to-end flow

### Phase 7: Offline Support

1. Add online/offline detection
2. Implement sync queue
3. Add retry logic

### Phase 8: Testing

1. Test with multiple units/chapters
2. Test offline scenarios
3. Test rapid updates (slider dragging)
4. Test with cleared localStorage
5. Test database persistence across sessions

---

## 8. Error Handling

### What to Do When API Fails

1. **Don't break user experience:**

   - Progress still works via localStorage
   - Show subtle notification (optional)
   - Queue sync for retry

2. **Error scenarios:**

   - Network error → Queue for retry
   - 401/403 error → Log error, continue with localStorage
   - 500 error → Log error, queue for retry
   - Timeout → Retry with exponential backoff

3. **Recovery:**
   - On next page load, try to sync queued items
   - Show sync status if user opens settings/account page

---

## 9. Performance Considerations

### Optimization Strategies

1. **Debouncing:**

   - Don't sync on every slider movement
   - Wait 500ms after last change
   - Reduces API calls significantly

2. **Batching:**

   - If multiple chapters updated, send one batch request
   - Use `/api/progress/sync` endpoint

3. **Caching:**

   - Cache progress in component state
   - Only refetch when explicitly needed
   - Use localStorage as cache layer

4. **Lazy Loading:**
   - Only fetch progress for current unit initially
   - Fetch other units on demand

---

## 10. Data Migration (For Existing Users)

### How to Handle Existing localStorage Data

1. **On first load after update:**

   - Check if student has existing localStorage progress
   - Check if student has database progress
   - If localStorage exists but no DB record:
     - Sync all localStorage data to database
     - Mark as migrated
   - If both exist:
     - Compare timestamps, use most recent
     - Merge data (database priority)

2. **Migration strategy:**
   - Automatic on first page load
   - One-time operation
   - Store migration flag: `progressMigrated: true`

---

## 11. Security Considerations

### Anonymous Student ID Security

1. **ID Format:**

   - Use UUID v4 (cryptographically random)
   - Never expose generation algorithm
   - No way to guess other student IDs

2. **API Security:**

   - Validate studentId format in API routes
   - Rate limiting (prevent spam/abuse)
   - Sanitize all inputs

3. **Privacy:**
   - Student IDs are anonymous
   - No personally identifiable information
   - Can't track back to real person

---

## 12. Future Enhancements (Optional)

### Additional Features to Consider

1. **Student Account System:**

   - Allow students to create accounts
   - Link anonymous progress to account
   - Sync across devices

2. **Analytics:**

   - Track completion rates
   - Identify difficult chapters
   - Generate reports

3. **Achievements:**

   - Badges for completing units
   - Certificates for full exam completion
   - Progress milestones

4. **Leaderboards:**
   - Compare progress (anonymously)
   - Gamification elements

---

## 13. Database Indexes

### Recommended Indexes

```javascript
// Compound unique index - one progress record per student per unit
studentProgressSchema.index({ studentId: 1, unitId: 1 }, { unique: true });

// Single field index - for fetching all progress for a student
studentProgressSchema.index({ studentId: 1 });

// Single field index - for analytics
studentProgressSchema.index({ unitId: 1 });

// TTL index (optional) - auto-delete old inactive records after 2 years
studentProgressSchema.index(
  { lastUpdated: 1 },
  { expireAfterSeconds: 63072000 }
);
```

---

## 14. Testing Checklist

### Before Going Live

- [ ] Student ID generates correctly
- [ ] Progress saves to database
- [ ] Progress fetches from database
- [ ] localStorage and database stay in sync
- [ ] Works when offline
- [ ] Sync queue retries successfully
- [ ] Multiple units work correctly
- [ ] Rapid updates don't cause issues
- [ ] Data persists across browser sessions
- [ ] Handles API errors gracefully
- [ ] Migration from localStorage works
- [ ] No data loss scenarios

---

## 15. Rollout Strategy

### Recommended Approach

1. **Phase 1 (Week 1):**

   - Implement database model and API routes
   - Test thoroughly in development

2. **Phase 2 (Week 2):**

   - Add student ID generation
   - Implement basic sync (no offline support yet)
   - Deploy to staging

3. **Phase 3 (Week 3):**

   - Add offline support
   - Add sync queue
   - Full testing

4. **Phase 4 (Week 4):**
   - Deploy to production
   - Monitor for issues
   - Fix bugs as needed

---

## Summary

This implementation will:

- ✅ Store progress in database for each student
- ✅ Maintain localStorage for instant UI updates
- ✅ Sync automatically in background
- ✅ Work offline with sync queue
- ✅ Handle errors gracefully
- ✅ Support future enhancements

The system is designed to be:

- **Non-breaking:** Existing functionality continues to work
- **Resilient:** Handles failures gracefully
- **Scalable:** Can handle many students and progress records
- **Extensible:** Easy to add features later

---

**Next Steps:**

1. Review this plan with team
2. Decide on student identification strategy (Option A, B, or C)
3. Start with Phase 1 implementation
4. Test each phase before moving to next

---

**Questions to Consider:**

- Do you want students to have accounts or stay anonymous?
- What's the expected number of students using the system?
- How important is cross-device sync?
- Do you need analytics/reporting on progress data?
