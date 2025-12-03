# Progress and Congratulations System Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [Progress Tracking System](#progress-tracking-system)
3. [Congratulations System](#congratulations-system)
4. [Components](#components)
5. [Database Tracking](#database-tracking)
6. [User Flow](#user-flow)
7. [API Endpoints](#api-endpoints)

---

## 🎯 Overview

This system tracks student progress across a 7-level hierarchy (Exam → Subject → Unit → Chapter → Topic → Subtopic → Definition) and displays congratulations modals when students complete different levels. The system ensures:

- ✅ Progress is tracked at every level
- ✅ Congratulations show **only once** when first completed
- ✅ No duplicate modals appear
- ✅ Database persistence prevents showing again on page reload
- ✅ Works for both manual completion (checkbox) and automatic progress

---

## 📊 Progress Tracking System

### Hierarchy Levels

```
Exam
  └── Subject
      └── Unit
          └── Chapter
              └── Topic
                  └── Subtopic
                      └── Definition
```

### Progress Calculation

#### **Chapter Progress**

- Tracked via `ProgressTracker` component
- Stored in `localStorage` as `unit-progress-{unitId}`
- Structure: `{ chapterId: { progress: 0-100, isCompleted: boolean } }`
- Also synced to database via API

#### **Unit Progress**

- Calculated from average of all chapters in the unit
- Formula: `Sum of all chapter progress / Total number of chapters`
- Stored in database and `localStorage` as `_unitProgress`

#### **Subject Progress**

- Calculated from average of all units in the subject
- Formula: `Sum of all unit progress / Total number of units`
- Includes ALL units (even those with 0% progress)

---

## 🎉 Congratulations System

### Rules

1. **Show Only Once**: Each congratulations modal shows only once when first completed
2. **Database Tracking**: Uses database to track if congratulations were already shown
3. **No Duplicates**: Multiple components check database to prevent duplicate modals
4. **Location-Specific**: Congratulations show on the appropriate page:
   - Chapter completion → Chapter page
   - Unit completion → Unit page
   - Subject completion → Subject page

### Completion Methods

#### **Chapter Completion**

- ✅ "Mark as Done" checkbox checked
- ✅ Progress slider reaches 100%
- ✅ Automatic progress tracking reaches 100%

#### **Unit Completion**

- ✅ All chapters in unit reach 100% progress

#### **Subject Completion**

- ✅ All units in subject reach 100% progress

---

## 🧩 Components

### Progress Display Components

#### **1. UnitProgressClient** (`app/(main)/components/UnitProgressClient.jsx`)

- **Purpose**: Displays unit progress percentage and bar
- **Location**: Unit page header
- **Features**:
  - Fetches progress from database or localStorage
  - Updates in real-time via event listeners
  - Shows congratulations modal when unit reaches 100%
  - Database tracking prevents duplicate modals

#### **2. SubjectProgressClient** (`app/(main)/components/SubjectProgressClient.jsx`)

- **Purpose**: Displays subject progress percentage and bar
- **Location**: Subject page header
- **Features**:
  - Calculates progress from all units
  - Shows congratulations modal when subject reaches 100%
  - Database tracking prevents duplicate modals

#### **3. ChapterProgressItem** (`app/(main)/components/ChapterProgressItem.jsx`)

- **Purpose**: Displays individual chapter progress in list view
- **Location**: Chapters list (unit page)
- **Features**:
  - Progress slider (0-100%)
  - "Mark as Done" checkbox
  - Shows congratulations when:
    - Checkbox is checked
    - Slider reaches 100%
  - Updates progress in real-time

### Completion Tracker Components

#### **4. ChapterCompletionTracker** (`app/(main)/components/ChapterCompletionTracker.jsx`)

- **Purpose**: Tracks chapter completion and shows congratulations on chapter page
- **Location**: Chapter page
- **Features**:
  - Monitors chapter progress
  - Shows congratulations when chapter reaches 100%
  - Checks database to prevent duplicate modals
  - Listens to progress update events

#### **5. UnitCompletionTracker** (`app/(main)/components/UnitCompletionTracker.jsx`)

- **Purpose**: Empty component (congratulations handled by UnitProgressClient)
- **Status**: Deprecated - kept for backward compatibility

#### **6. SubjectCompletionTracker** (`app/(main)/components/SubjectCompletionTracker.jsx`)

- **Purpose**: Empty component (congratulations handled by SubjectProgressClient)
- **Status**: Deprecated - kept for backward compatibility

### Progress Tracking Components

#### **7. ProgressTracker** (`app/(main)/components/ProgressTracker.jsx`)

- **Purpose**: Tracks student visits to content items
- **Location**: All content pages (chapter, topic, subtopic, definition)
- **Features**:
  - Tracks visits to content items
  - Updates progress in localStorage
  - Dispatches progress update events
  - Syncs with database

#### **8. CongratulationsModal** (`app/(main)/components/CongratulationsModal.jsx`)

- **Purpose**: Displays congratulations message
- **Types**:
  - `chapter`: "Congratulations! You completed the chapter {name}!"
  - `unit`: "Congratulations! You completed the unit {name}!"
  - `subject`: "Congratulations! You completed the subject {name}!"
- **Features**:
  - Animated confetti
  - Beautiful gradient design
  - Responsive layout

---

## 💾 Database Tracking

### Database Schema

#### **StudentProgress Model**

```javascript
{
  studentId: ObjectId,
  unitId: ObjectId,
  unitProgress: Number (0-100),
  unitCongratulationsShown: Boolean,
  progress: {
    [chapterId]: {
      progress: Number (0-100),
      isCompleted: Boolean,
      isManualOverride: Boolean,
      manualProgress: Number,
      autoCalculatedProgress: Number,
      congratulationsShown: Boolean  // ← Tracks if congratulations shown
    }
  }
}
```

#### **SubjectProgress Model**

```javascript
{
  studentId: ObjectId,
  subjectId: ObjectId,
  subjectProgress: Number (0-100),
  subjectCongratulationsShown: Boolean  // ← Tracks if congratulations shown
}
```

### Tracking Functions

Located in `lib/congratulations.js`:

#### **Chapter Congratulations**

- `checkChapterCongratulationsShown(chapterId, unitId)` - Checks if already shown
- `markChapterCongratulationsShown(chapterId, unitId)` - Marks as shown

#### **Unit Congratulations**

- `checkUnitCongratulationsShown(unitId)` - Checks if already shown
- `markUnitCongratulationsShown(unitId)` - Marks as shown

#### **Subject Congratulations**

- `checkSubjectCongratulationsShown(subjectId)` - Checks if already shown
- `markSubjectCongratulationsShown(subjectId)` - Marks as shown

---

## 🔄 User Flow

### Chapter Completion Flow

```
1. Student completes chapter (via checkbox or slider)
   ↓
2. ChapterProgressItem detects completion
   ↓
3. Checks database: Has congratulations been shown?
   ↓
4a. NO → Show congratulations modal
     → Mark as shown in database
   ↓
4b. YES → Don't show modal
   ↓
5. Student visits chapter page
   ↓
6. ChapterCompletionTracker checks database
   ↓
7. Already shown → Don't show again
```

### Unit Completion Flow

```
1. All chapters in unit reach 100%
   ↓
2. UnitProgressClient calculates unit progress = 100%
   ↓
3. Checks database: Has congratulations been shown?
   ↓
4a. NO → Show congratulations modal
     → Mark as shown in database
   ↓
4b. YES → Don't show modal
   ↓
5. Student visits unit page again
   ↓
6. UnitProgressClient checks database
   ↓
7. Already shown → Don't show again
```

### Subject Completion Flow

```
1. All units in subject reach 100%
   ↓
2. SubjectProgressClient calculates subject progress = 100%
   ↓
3. Checks database: Has congratulations been shown?
   ↓
4a. NO → Show congratulations modal
     → Mark as shown in database
   ↓
4b. YES → Don't show modal
   ↓
5. Student visits subject page again
   ↓
6. SubjectProgressClient checks database
   ↓
7. Already shown → Don't show again
```

---

## 🔌 API Endpoints

### Progress Endpoints

#### **GET `/api/student/progress?unitId={unitId}`**

- **Purpose**: Fetch unit progress
- **Response**:

```json
{
  "success": true,
  "data": [
    {
      "unitProgress": 85,
      "unitCongratulationsShown": false,
      "progress": {
        "chapterId1": {
          "progress": 100,
          "congratulationsShown": true
        }
      }
    }
  ]
}
```

#### **GET `/api/student/progress/subject?subjectId={subjectId}`**

- **Purpose**: Fetch subject progress
- **Response**:

```json
{
  "success": true,
  "data": {
    "subjectProgress": 75,
    "subjectCongratulationsShown": false
  }
}
```

#### **POST `/api/student/progress/track-visit`**

- **Purpose**: Track student visit to content item
- **Body**:

```json
{
  "unitId": "unitId",
  "chapterId": "chapterId",
  "itemType": "chapter|topic|subtopic|definition",
  "itemId": "itemId"
}
```

### Congratulations Endpoints

#### **POST `/api/student/progress/mark-congratulations`**

- **Purpose**: Mark congratulations as shown
- **Body** (Chapter):

```json
{
  "type": "chapter",
  "unitId": "unitId",
  "chapterId": "chapterId"
}
```

- **Body** (Unit):

```json
{
  "type": "unit",
  "unitId": "unitId"
}
```

- **Body** (Subject):

```json
{
  "type": "subject",
  "subjectId": "subjectId"
}
```

---

## 📝 Component Usage

### Chapter Page

```jsx
<ChapterCompletionTracker
  chapterId={chapter._id}
  chapterName={chapter.name}
  unitId={unit._id}
/>
```

### Unit Page

```jsx
<UnitProgressClient
  unitId={unit._id}
  unitName={unit.name}
  initialProgress={0}
/>
```

### Subject Page

```jsx
<SubjectProgressClient
  subjectId={subject._id}
  subjectName={subject.name}
  unitIds={fetchedUnits.map((unit) => unit._id)}
  initialProgress={0}
/>
```

### Chapters List

```jsx
<ChapterProgressItem
  chapter={chapter}
  unitId={unit._id}
  progress={chapterProgress}
  isCompleted={isCompleted}
  onProgressChange={handleProgressChange}
  onMarkAsDone={handleMarkAsDone}
/>
```

---

## ✅ Key Features

### 1. **Single Show Guarantee**

- Database tracking ensures each congratulations shows only once
- Checks database on component mount
- Marks as shown immediately when displayed

### 2. **No Duplicate Modals**

- Only one component per level handles congratulations
- Chapter: `ChapterProgressItem` (list) + `ChapterCompletionTracker` (page)
- Unit: `UnitProgressClient` only
- Subject: `SubjectProgressClient` only

### 3. **Real-Time Updates**

- Event listeners: `progress-updated`, `chapterProgressUpdate`
- Polling backup (3-5 seconds interval)
- Storage events for cross-tab sync

### 4. **Multiple Completion Methods**

- Manual: Checkbox, Slider
- Automatic: Progress tracking via visits
- All methods trigger congratulations

### 5. **Database Persistence**

- Survives page reloads
- Works across devices (if authenticated)
- Prevents showing again after refresh

---

## 🐛 Troubleshooting

### Congratulations Not Showing

1. Check if already shown in database
2. Verify progress is exactly 100%
3. Check browser console for errors
4. Ensure student is authenticated

### Duplicate Modals

1. Verify only one component handles congratulations per level
2. Check database tracking is working
3. Ensure `congratulationsShown` flag is set correctly

### Progress Not Updating

1. Check `localStorage` for progress data
2. Verify API endpoints are working
3. Check event listeners are attached
4. Verify `ProgressTracker` is mounted on page

---

## 📚 Related Files

### Components

- `app/(main)/components/UnitProgressClient.jsx`
- `app/(main)/components/SubjectProgressClient.jsx`
- `app/(main)/components/ChapterProgressItem.jsx`
- `app/(main)/components/ChapterCompletionTracker.jsx`
- `app/(main)/components/ProgressTracker.jsx`
- `app/(main)/components/CongratulationsModal.jsx`

### Utilities

- `lib/congratulations.js` - Congratulations tracking functions
- `lib/api.js` - API helper functions

### Models

- `models/StudentProgress.js` - Unit progress model
- `models/SubjectProgress.js` - Subject progress model

### API Routes

- `app/api/student/progress/route.js` - Progress endpoints
- `app/api/student/progress/mark-congratulations/route.js` - Mark congratulations
- `app/api/student/progress/track-visit/route.js` - Track visits

---

## 🎯 Summary

The progress and congratulations system provides:

✅ **Accurate Progress Tracking** at all hierarchy levels  
✅ **One-Time Congratulations** when items are completed  
✅ **No Duplicate Modals** through database tracking  
✅ **Multiple Completion Methods** (checkbox, slider, automatic)  
✅ **Database Persistence** across sessions  
✅ **Real-Time Updates** via events and polling

The system ensures students receive appropriate feedback when completing chapters, units, and subjects, while maintaining data integrity and preventing duplicate notifications.

---

**Last Updated**: 2024  
**Version**: 1.0
