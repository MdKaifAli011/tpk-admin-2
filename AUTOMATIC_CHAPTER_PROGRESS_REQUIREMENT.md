# Automatic Chapter Progress Calculation Requirement

## Overview

Currently, chapter progress is **manually set** by users via a slider or checkbox. The requirement is to make chapter progress **automatically calculated** based on what the user actually reads/visits within that chapter.

---

## Current System (Manual)

### How it works now:
1. **Unit Progress** = Average of all chapter progress values ✅ (Already correct)
2. **Chapter Progress** = Manually set by user (slider 0-100% or checkbox for 100%)

### User Flow:
- User navigates: `Unit → Chapter → Topic → Subtopic → Definition`
- User manually adjusts chapter progress slider
- Unit progress automatically updates based on chapter progress

---

## Required System (Hybrid: Automatic + Manual)

### How it should work:
1. **Unit Progress** = Average of all chapter progress values ✅ (No change needed)
2. **Chapter Progress** = **Automatically calculated** based on user visits/reads **+ Manual slider/range control**

### Key Features:
- **Automatic Tracking**: Progress updates automatically when user visits topics/subtopics/definitions
- **Manual Override**: User can still manually adjust progress using slider (0-100%) or checkbox (100%)
- **Both Work Together**: Manual adjustments override auto-calculation, but auto-tracking continues

### Calculation Logic:

#### Chapter Progress Formula:
```
Chapter Progress = (Items Visited / Total Items in Chapter) × 100
```

Where "Items" can be:
- **Topics** visited within the chapter
- **Subtopics** visited within topics of that chapter
- **Definitions** visited within subtopics of that chapter

#### Example Scenarios:

**Scenario 1: Simple Chapter (Topics only)**
- Chapter has 4 topics
- User visits 2 topics
- Chapter Progress = (2/4) × 100 = **50%**

**Scenario 2: Complex Chapter (Topics → Subtopics → Definitions)**
- Chapter has 2 topics
  - Topic 1 has 3 subtopics
    - Subtopic 1 has 5 definitions
    - Subtopic 2 has 4 definitions
    - Subtopic 3 has 0 definitions
  - Topic 2 has 2 subtopics
    - Subtopic 1 has 3 definitions
    - Subtopic 2 has 2 definitions

**Total items in chapter:**
- 2 topics + 3 subtopics + 2 subtopics + 5 definitions + 4 definitions + 3 definitions + 2 definitions = **21 items**

**If user visits:**
- Topic 1 (visited)
- Subtopic 1 of Topic 1 (visited)
- 2 definitions from Subtopic 1 (visited)
- Topic 2 (visited)

**Items visited: 4**
**Chapter Progress = (4/21) × 100 = 19%**

---

## User Navigation Flow

### Navigation Path:
```
Unit → Chapter → Topic → Subtopic → Definition
```

### Progress Tracking Points:

1. **When user visits a Chapter page:**
   - Track: Chapter visited
   - Update: Chapter progress

2. **When user visits a Topic page (within a chapter):**
   - Track: Topic visited
   - Update: Chapter progress

3. **When user visits a Subtopic page (within a topic, within a chapter):**
   - Track: Subtopic visited
   - Update: Chapter progress

4. **When user visits a Definition page (within a subtopic, within a topic, within a chapter):**
   - Track: Definition visited
   - Update: Chapter progress

---

## Implementation Requirements

### What needs to be tracked:

#### For each Chapter, track:
1. **Topics visited** (array of topic IDs)
2. **Subtopics visited** (array of subtopic IDs)
3. **Definitions visited** (array of definition IDs)

#### Storage Structure:
```javascript
{
  chapterId: {
    progress: 50, // Current progress (manual override OR auto-calculated)
    isCompleted: false, // (progress === 100)
    isManualOverride: false, // Flag to indicate if user manually set progress
    manualProgress: null, // Manually set progress value (if any)
    autoCalculatedProgress: 35, // Auto-calculated progress from visits
    visitedItems: {
      topics: ["topicId1", "topicId2"],
      subtopics: ["subtopicId1", "subtopicId2"],
      definitions: ["definitionId1", "definitionId2"]
    },
    totalItems: {
      topics: 4,
      subtopics: 8,
      definitions: 15
    }
  }
}
```

### Progress Resolution Logic:
```javascript
function getChapterProgress(chapterId) {
  const chapterData = getProgressData(chapterId);
  
  // If user manually set progress, use manual value
  if (chapterData.isManualOverride && chapterData.manualProgress !== null) {
    return chapterData.manualProgress;
  }
  
  // Otherwise, use auto-calculated progress
  return chapterData.autoCalculatedProgress || 0;
}
```

### Calculation Logic:

#### Step 1: Count Total Items in Chapter
```javascript
function getTotalItemsInChapter(chapterId) {
  // Fetch all topics in chapter
  const topics = await fetchTopicsByChapter(chapterId);
  
  // For each topic, fetch subtopics
  // For each subtopic, fetch definitions
  
  return {
    topics: topics.length,
    subtopics: totalSubtopics,
    definitions: totalDefinitions,
    total: topics.length + totalSubtopics + totalDefinitions
  };
}
```

#### Step 2: Count Visited Items
```javascript
function getVisitedItemsInChapter(chapterId, visitedData) {
  const visited = visitedData[chapterId] || { topics: [], subtopics: [], definitions: [] };
  
  return {
    topics: visited.topics.length,
    subtopics: visited.subtopics.length,
    definitions: visited.definitions.length,
    total: visited.topics.length + visited.subtopics.length + visited.definitions.length
  };
}
```

#### Step 3: Calculate Progress
```javascript
function calculateChapterProgress(chapterId) {
  const totalItems = getTotalItemsInChapter(chapterId);
  const visitedItems = getVisitedItemsInChapter(chapterId, visitedData);
  
  if (totalItems.total === 0) return 0;
  
  const progress = Math.round((visitedItems.total / totalItems.total) * 100);
  return Math.min(100, Math.max(0, progress));
}
```

---

## Tracking Points (Where to Update)

### 1. Chapter Page Visit
**File:** `app/(main)/[exam]/[subject]/[unit]/[chapter]/page.js`
- When page loads, mark chapter as visited
- Calculate and update chapter progress

### 2. Topic Page Visit
**File:** `app/(main)/[exam]/[subject]/[unit]/[chapter]/[topic]/page.js`
- When page loads, mark topic as visited
- Calculate and update parent chapter progress

### 3. Subtopic Page Visit
**File:** `app/(main)/[exam]/[subject]/[unit]/[chapter]/[topic]/[subtopic]/page.js`
- When page loads, mark subtopic as visited
- Calculate and update parent chapter progress

### 4. Definition Page Visit
**File:** `app/(main)/[exam]/[subject]/[unit]/[chapter]/[topic]/[subtopic]/[definition]/page.js`
- When page loads, mark definition as visited
- Calculate and update parent chapter progress

---

## Data Flow

### When User Visits a Page:

```
1. User navigates to Topic/Subtopic/Definition page
   ↓
2. Page component loads
   ↓
3. Check if item already visited (from localStorage)
   ↓
4. If not visited:
   - Mark item as visited
   - Fetch total items in parent chapter
   - Calculate new chapter progress
   - Update localStorage
   - Update parent chapter progress in useProgress hook
   ↓
5. Unit progress automatically recalculates (already works)
```

---

## Edge Cases

### 1. Empty Chapter
- If chapter has no topics/subtopics/definitions
- Chapter progress = 0% (or handle gracefully)

### 2. Chapter with Only Topics (No Subtopics/Definitions)
- Count only topics visited
- Chapter progress = (topics visited / total topics) × 100

### 3. User Visits Same Item Multiple Times
- Should only count once (deduplicate)
- Use Set or array with unique IDs

### 4. Items Added/Removed After User Visits
- Recalculate total items when calculating progress
- Always fetch fresh data for total items count

### 5. Manual Override Behavior
- ✅ **Manual slider/checkbox WILL work** (user confirmed)
- When user manually adjusts slider:
  - Set `isManualOverride = true`
  - Store manual value in `manualProgress`
  - Use manual value as current progress
  - Continue tracking visits (for auto-calculation)
- When auto-calculation updates:
  - Only update if `isManualOverride = false`
  - If `isManualOverride = true`, keep manual value
  - Still update `autoCalculatedProgress` for reference

---

## Benefits

1. **Automatic Tracking**: No manual input required
2. **Accurate Progress**: Reflects actual reading/learning progress
3. **Better UX**: Users see progress update as they learn
4. **Motivation**: Visual feedback encourages completion

---

## Implementation Behavior

### Manual Slider/Checkbox ✅
- **WILL remain functional** - User can manually set progress
- Manual override takes precedence over auto-calculation
- Auto-tracking continues in background (for reference)

### Questions to Clarify

1. **What counts as "visited"?**
   - Just page load?
   - Time spent on page (e.g., 30 seconds)?
   - Scroll depth (e.g., 80% scrolled)?
   - User interaction (e.g., click, scroll)?

2. **Should visiting a parent item (e.g., Topic) automatically mark all children as visited?**
   - Or only count the specific item visited?

3. **Progress calculation method:**
   - Count all items equally? (1 topic = 1 subtopic = 1 definition)
   - Or weighted? (e.g., definition = 1 point, subtopic = 2 points, topic = 3 points)

4. **Should progress persist across sessions?**
   - Yes, using localStorage (current approach)
   - Or sync to database (future implementation)?

5. **Manual Override Reset:**
   - Should there be a way to "reset to auto" if user manually overrides?
   - Or manual override is permanent until user changes it again?

---

## Summary

**Current:** Chapter progress = Manual only (user sets via slider/checkbox)

**Required:** Chapter progress = **Hybrid System**
- **Automatic Tracking**: Progress auto-updates based on user visits to topics/subtopics/definitions
- **Manual Override**: User can still manually adjust progress via slider/checkbox
- **Smart Resolution**: Manual override takes precedence, but auto-tracking continues

**Unit Progress:** No change needed (already depends on chapters correctly)

**Key Changes:**
1. Add automatic progress tracking based on navigation/visits
2. Keep manual slider/checkbox functionality
3. Implement priority system: Manual override > Auto-calculation
4. Both systems work together seamlessly

