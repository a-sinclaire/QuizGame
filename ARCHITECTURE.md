# AppInterfaceQuiz - Project Plan & Architecture

## Overview
A browser-based quiz game designed to run on GitHub Pages, serving as both an assessment tool and a learning resource. The game features three difficulty levels, each with detailed feedback for correct and incorrect answers.

## Feature Checklist

### ✅ Implemented Features
- [x] Score display and tracking (with points per question/difficulty)
- [x] Progress indicator (question counter + progress bar)
- [x] Question randomization (shuffle questions and options)
- [x] Review/Results screen (summary with explanations, breakdown by difficulty)
- [x] Visual feedback (colors, icons for correct/incorrect)
- [x] Hints system (progressive hints per question)
- [x] Review mode (study mode with correct answers visible, shows user selections)
- [x] Local storage (high scores, statistics tracking)
- [x] Reset button (clear saved data with confirmation)
- [x] Categories/Modules (organize questions by module/section, category selection)
- [x] Difficulty progression (automatic progression easy → medium → hard)
- [x] Basic responsive design (mobile-friendly layout)

### ⏳ Partially Implemented
- [ ] Animations (basic CSS transitions exist, but not all planned animations)
- [ ] Mobile-friendly design (responsive layout done, but no swipe gestures)

### ❌ Not Yet Implemented
- [ ] Analytics collection (aggregate user data - GitHub Actions approach)
- [ ] Scoreboard (opt-in sharing with custom names)

### 💡 Low Priority Feature Ideas
- [ ] Return to home screen button during quiz (exit quiz mid-way)
- [ ] Multiple save states per category (treat each category as separate quiz, resume any)
- [ ] Question count indicator (show how many questions will be given before starting)
- [ ] Difficulty selection (allow choosing specific difficulty instead of auto-progression)

## Project Structure

```
AppInterfaceQuiz/
├── index.html                 # Main entry point
├── README.md                  # Project documentation
├── .gitignore                 # Git ignore rules
├── assets/
│   ├── css/
│   │   ├── styles.css        # Main stylesheet
│   │   ├── themes/           # Theme files
│   │   │   ├── light.css     # Light theme (default)
│   │   │   └── dark.css      # Dark theme
│   │   └── animations.css    # Animation keyframes and transitions
│   ├── js/
│   │   ├── main.js           # Application entry point & initialization
│   │   ├── quiz-engine.js    # Core quiz logic & state management
│   │   ├── ui-controller.js  # UI rendering & user interaction handling
│   │   ├── storage.js        # LocalStorage management
│   │   ├── analytics.js      # Analytics collection and reporting
│   │   ├── sound-manager.js  # Sound effects management
│   │   ├── theme-manager.js  # Theme switching logic
│   │   └── questions/
│   │       ├── index.js      # Question registry and loader (getQuestions function)
│   │       └── categories/   # Questions organized by category/module (flat structure)
│   │           ├── module1.js # All difficulties for module1
│   │           ├── module2.js # All difficulties for module2
│   │           └── ...
│   ├── sounds/               # Sound effect files
│   │   ├── correct.mp3
│   │   ├── incorrect.mp3
│   │   └── timer-warning.mp3
│   └── images/               # Image assets (if needed)
└── docs/
    └── ARCHITECTURE.md       # This file (detailed architecture docs)
```

## Data Structure

### Question Object Schema

Each question file exports an array of question objects with the following structure:

```javascript
{
  id: string,                    // Unique identifier for the question
  question: string,              // The question text
  options: Array<string>,        // Array of answer choices (typically 4)
  correctIndex: number,          // Index of correct answer in options array
  correctResponse: string,       // Message shown when answer is correct
  incorrectResponses: {         // Object mapping option index to explanation
    0: string,                   // Explanation for why option[0] is wrong
    1: string,                   // Explanation for why option[1] is wrong
    2: string,                   // Explanation for why option[2] is wrong
    3: string                    // Explanation for why option[3] is wrong
  },
  category: string,              // REQUIRED: Category/module identifier (e.g., "module1", "section2")
  subcategory?: string,          // Optional: Subcategory within module (e.g., "authentication", "routing")
  difficulty: string,            // 'easy', 'medium', or 'hard'
  points?: number,               // Optional: point value (defaults based on difficulty)
  hints?: Array<string>,         // Optional: Array of hints (progressive hints)
  imageUrl?: string,             // Optional: URL to image for question
  codeSnippet?: string           // Optional: Code snippet to display
}
```

**Note on Points**: Points default to difficulty-based values (easy: 10, medium: 20, hard: 30), but can be customized per question.

### Example Question

```javascript
{
  id: "module1-easy-001",
  question: "What is the capital of France?",
  options: ["Berlin", "Madrid", "Paris", "Rome"],
  correctIndex: 2,
  correctResponse: "Correct! Paris is the capital of France and has been since 987 AD.",
  incorrectResponses: {
    0: "Berlin is the capital of Germany, not France.",
    1: "Madrid is the capital of Spain, not France.",
    3: "Rome is the capital of Italy, not France."
  },
  category: "module1",
  subcategory: "geography",
  difficulty: "easy",
  points: 10,
  hints: [
    "It's a major European city known for art and culture.",
    "The Eiffel Tower is located here.",
    "It starts with the letter 'P'."
  ]
}
```

## Category/Module Structure

### Design Philosophy

Categories represent **modules** or **sections** of content. This allows:
- Filtering questions by module/section
- Tracking performance per module
- Creating module-specific quizzes
- Organizing questions logically

### Selected Structure: Flat Category Structure ✅

**Decision**: Use **Option 1: Flat Category Structure** for simplicity and ease of maintenance.

```javascript
// questions/categories/module1.js
export const module1Questions = [
  { id: "m1-easy-001", category: "module1", difficulty: "easy", ... },
  { id: "m1-medium-001", category: "module1", difficulty: "medium", ... },
  { id: "m1-hard-001", category: "module1", difficulty: "hard", ... },
  // Questions of all difficulties in one file
];

// questions/index.js - Registry
import { module1Questions } from './categories/module1.js';
import { module2Questions } from './categories/module2.js';

export const questionRegistry = {
  module1: module1Questions,
  module2: module2Questions,
  // ...
};

// Get all questions, filtered by category/difficulty
export function getQuestions(category = null, difficulty = null) {
  let questions = [];
  
  if (category) {
    questions = questionRegistry[category] || [];
  } else {
    // Combine all categories
    questions = Object.values(questionRegistry).flat();
  }
  
  if (difficulty) {
    questions = questions.filter(q => q.difficulty === difficulty);
  }
  
  return questions;
}
```

**Benefits**:
- Simple file structure (one file per module)
- Easy to add new questions (just append to array)
- Straightforward filtering logic
- Questions of all difficulties in one place (easier to maintain)

**Future Extensibility**: The `subcategory` field in the question schema allows for subcategory filtering later without restructuring files. Questions can be organized by subcategory within the same file using comments or metadata.

### Category Metadata

Consider a separate metadata file for category information:

```javascript
// questions/categories/metadata.js
export const categoryMetadata = {
  module1: {
    name: "Module 1: Introduction",
    description: "Basic concepts and fundamentals",
    icon: "📚",
    order: 1
  },
  module2: {
    name: "Module 2: Advanced Topics",
    description: "More complex scenarios",
    icon: "🚀",
    order: 2
  }
};
```

This allows UI to display category names, descriptions, and icons without parsing question data.

## Architecture Decisions

### Selected Approaches Summary

**Category/Module Structure**: ✅ **Flat Category Structure (Option 1)**
- One file per module containing questions of all difficulties
- Simple registry system for filtering
- See "Category/Module Structure" section for details

**Analytics Collection**: ✅ **GitHub Actions + JSON File (Option B)**
- Client-side anonymization before submission
- GitHub Actions for aggregation
- No external services required
- See "Analytics Collection" section for details

### 1. Separation of Concerns

- **Data Layer** (`questions/*.js`): Pure data structures, no logic
- **Business Logic** (`quiz-engine.js`): Quiz state, scoring, question management
- **Presentation Layer** (`ui-controller.js`): DOM manipulation, event handling
- **Orchestration** (`main.js`): Initialization, coordination between modules

### 2. Vanilla JavaScript (No Frameworks)

- **Rationale**: 
  - Simpler deployment to GitHub Pages (no build step required)
  - Faster load times
  - Easier to understand and modify
  - No dependency management needed

- **Module System**: Use ES6 modules with `<script type="module">` for modern browsers

### 3. State Management

The quiz engine maintains state including:
- Current difficulty level
- Current category/module filter
- Current question index
- Score (correct/total, points earned)
- Question history (for review at end)
- User selections and timestamps
- Hints used per question
- Streak count
- Time spent per question
- Quiz start/end timestamps

### 4. Extensibility Features

#### Adding New Difficulty Levels
1. Create new file: `assets/js/questions/expert.js`
2. Export array following same schema
3. Add case to difficulty selector in `main.js`
4. No core logic changes needed

#### Adding Question Categories
- Questions organized by category/module in `questions/categories/`
- Each category file exports an array of questions
- `questions/index.js` acts as registry, providing filtering functions
- UI provides category selector alongside difficulty selector
- Quiz engine filters questions by selected category and difficulty

#### Customizing Scoring
- Points system is configurable per question
- Default points based on difficulty:
  - Easy: 10 points
  - Medium: 20 points
  - Hard: 30 points
- Points can be overridden per question via `points` field
- Score tracking includes:
  - Total points earned
  - Points per question
  - Points breakdown by difficulty
  - Points breakdown by category
- Future: Can add time bonuses, streaks, multipliers in `quiz-engine.js`

#### Theming & Styling
- CSS variables for colors, fonts, spacing
- Theme files in `assets/css/themes/` (light.css, dark.css)
- Theme manager (`theme-manager.js`) handles switching
- User preference saved in localStorage
- Responsive design with mobile-first approach
- Touch-friendly buttons and interactions for mobile

### 5. GitHub Pages Considerations

- **File Structure**: All files must be relative paths (no absolute paths)
- **No Build Step**: Pure HTML/CSS/JS that works directly
- **Module Imports**: Use relative paths like `./js/quiz-engine.js`
- **Asset Organization**: Keep assets organized for easy CDN migration if needed

## Implementation Phases

### Phase 1: Foundation (Current)
- ✅ Git repository initialized
- ✅ Project structure planned
- ⏳ Create basic file structure
- ⏳ Add placeholder questions (2-3 per difficulty)

### Phase 2: Core Functionality
- Implement quiz engine with state management
- Build UI controller for rendering
- Create basic styling
- Wire up difficulty selection

### Phase 3: User Experience
- Add progress indicators
- Implement answer feedback system
- Create results screen
- Add question review capability

### Phase 4: Polish & Enhancement
- Improve styling and animations
- Add accessibility features
- Optimize for mobile devices
- Add GitHub Pages deployment configuration

## Feature Specifications

### Feature Implementation Status

#### ✅ Fully Implemented

#### 1. Score Display & Tracking
- **Current Score**: Display running total of points earned
- **Points Per Question**: Show points earned for each question
- **Points by Difficulty**: Track and display points earned per difficulty level
- **Final Score**: Total points and percentage at quiz completion
- **Score History**: Store high scores in localStorage

#### 2. Progress Indicator
- **Question Counter**: "Question X of Y" display
- **Progress Bar**: Visual progress indicator (percentage complete)
- **Remaining Questions**: Show how many questions left

#### 3. Question Randomization
- **Shuffle Questions**: Randomize order of questions in quiz
- **Shuffle Options**: Randomize order of answer choices (optional, configurable)
- **Random Selection**: Select random subset from larger question pool

#### 4. Review/Results Screen
- **Summary View**: Show all questions with user answers
- **Correct/Incorrect Indicators**: Visual markers for each question
- **Review Explanations**: Show explanations for all questions
- **Score Breakdown**: Points by question, difficulty, category
- **Retry Option**: Button to retake quiz

#### 5. Visual Feedback
- **Immediate Feedback**: Color coding (green/red) on answer selection
- **Icons**: Checkmark for correct, X for incorrect
- **Answer Highlighting**: Highlight selected answer
- **Smooth Transitions**: Animated transitions between questions

#### 6. Hints System
- **Progressive Hints**: Multiple hints per question (stored in `hints` array)
- **Hint Button**: Display hint button on each question
- **Hint Counter**: Show hints remaining/used
- **Point Deduction**: Optional point penalty for using hints (future)

#### 7. Review Mode
- **Study Mode**: Browse all questions with correct answers visible
- **Explanation View**: Show explanations for all options
- **Category Filter**: Filter review by category/module
- **Difficulty Filter**: Filter review by difficulty
- **No Scoring**: Review mode doesn't affect scores

#### 8. Local Storage & Persistence ✅ IMPLEMENTED
- ✅ **Save Progress**: Save incomplete quiz state automatically after each question
- ✅ **Resume Quiz**: Resume from where user left off (shows banner on start screen)
- ✅ **Resume UI**: Hide category selector when incomplete quiz exists, show after clicking Start New Quiz
- ✅ **State Preservation**: Restores current question, score, answers, hints used, category, difficulty
- ✅ **Auto-cleanup**: Clears incomplete quiz when quiz completes or new quiz starts
- ✅ **High Scores**: Store best scores per difficulty/category
- ✅ **Statistics**: Store user statistics (total questions, accuracy, etc.)
- ✅ **Reset Button**: Clear all saved data (with confirmation)

#### 9. Analytics Collection
**Challenge**: GitHub Pages is static (no server-side processing)

**Selected Approach: GitHub Actions + JSON File** ✅

**Decision**: Use **Option B** (GitHub Actions + JSON File) with built-in anonymization.

**Implementation**:
- Create `analytics/` directory for submissions
- Users submit analytics via GitHub API or form submission (anonymized)
- GitHub Action processes and aggregates submissions
- Aggregate data stored in JSON file in repo (`analytics/aggregated.json`)
- Public dashboard page reads and displays aggregated stats

**Anonymization Process**:
- Client-side: Hash or remove any identifying information before submission
- No user IDs, IP addresses, or PII collected
- Optional: Generate anonymous session ID (hashed, not tied to user)
- All submissions are anonymous by design

**Analytics Data Collected** (All Anonymized):
- Question ID
- Correct/Incorrect
- Time spent (in seconds)
- Hints used (count)
- User's selected answer index
- Timestamp (date/time, no timezone info)
- Difficulty level
- Category/Module
- Optional: Anonymous session hash (for grouping related submissions)

**Submission Flow**:
1. User completes quiz/question
2. Client-side code anonymizes data (removes PII, hashes if needed)
3. Submit to GitHub via API or form (GitHub Pages form submission)
4. GitHub Action triggered on submission
5. Action validates, aggregates, and updates `analytics/aggregated.json`
6. Dashboard reads from JSON file

**Privacy Guarantees**:
- ✅ No PII collection
- ✅ All data anonymized before submission
- ✅ No tracking of individual users
- ✅ Aggregate statistics only
- ✅ Users can opt-out (don't submit analytics)

**Pros**: 
- No external services required
- Free (GitHub Actions free tier)
- Version controlled data
- Transparent and auditable

**Cons**: 
- Requires GitHub authentication for submissions (or use form submission)
- GitHub Actions rate limits
- Slight delay in aggregation (not real-time)

#### 10. Mobile-Friendly Design
- **Responsive Layout**: Works on phones, tablets, desktops
- **Touch Targets**: Large, touch-friendly buttons (min 44x44px)
- **Mobile Navigation**: Swipe gestures for next/previous
- **Viewport Optimization**: Proper meta tags, no horizontal scroll
- **Performance**: Optimized for slower mobile connections

#### 11. Sound Effects ✅ IMPLEMENTED
- ✅ **Correct Answer Sound**: Play pleasant ascending tones on correct answer
- ✅ **Incorrect Answer Sound**: Play low descending tones on incorrect answer
- ⏳ **Timer Warning**: Sound when time is running low (if timer enabled) - Not yet implemented
- ✅ **Volume Control**: Slider to adjust volume (0-100%) with percentage display
- ✅ **Mute Toggle**: Quick mute/unmute button with visual indicator
- ✅ **Sound Manager**: `sound-manager.js` handles all audio using Web Audio API
- ✅ **Persistent Preferences**: Volume and mute state saved in localStorage
- ✅ **Browser Compatibility**: Audio context initialized on first user interaction (required by browsers)

#### 12. Dark Mode & Themes ✅ IMPLEMENTED
- ✅ **Dark Theme**: Full dark mode with proper contrast
- ✅ **Light Theme**: Default light theme
- ✅ **Theme Toggle**: Easy switch between themes (🌙/☀️ button)
- ✅ **Persistent Preference**: Save theme choice in localStorage
- ✅ **System Preference**: Detects and applies OS theme preference on first load
- ⏳ **Custom Themes**: Structure allows for additional themes (future)

#### 13. Animations ⏳ PARTIALLY IMPLEMENTED
- ✅ **Progress Bar**: Smooth progress bar animation (CSS transition)
- ✅ **Button Hover**: Subtle hover effects
- ❌ **Question Transitions**: Smooth fade/slide between questions
- ❌ **Answer Reveal**: Animated reveal of correct answer
- ❌ **Score Updates**: Animated score counter
- ❌ **Loading States**: Spinner/loading animation for data loading
- **CSS Animations**: Use CSS keyframes for performance

#### 14. Categories/Modules
- **Category Selection**: UI to select which module/category to quiz on
- **Multi-Category**: Option to select multiple categories
- **Category Filtering**: Filter questions by category
- **Category Progress**: Track performance per category
- **Category Metadata**: Display names, descriptions, icons
- See "Category/Module Structure" section above for implementation details

#### 15. Share Results ✅ IMPLEMENTED
- ✅ **Copy to Clipboard**: Button to copy results as text
- ✅ **Share Format**: Formatted text with score, percentage, category, difficulty, and breakdown
- ✅ **Visual Feedback**: Button shows confirmation message when copied
- ✅ **Browser Compatibility**: Uses execCommand with Clipboard API fallback
- ⏳ **Social Sharing**: Future: Share to Twitter, etc. (with user permission)

#### 16. Difficulty Progression
- **Unlock System**: Unlock harder difficulties based on performance
- **Recommendation**: Suggest next difficulty based on score
- **Adaptive Difficulty**: Option to adjust difficulty mid-quiz (future)
- **Progression Tracking**: Track which difficulties user has completed

#### 17. Question Reporting ✅ IMPLEMENTED
- ✅ **Report Button**: Compact button in question header (right side, gray color for icon contrast)
- ✅ **Report Modal**: Modal dialog displaying question text with form
- ✅ **Report Reasons**: 
  - Question or answer is incorrect
  - Question is unclear or confusing
  - Explanation is confusing or wrong
  - Typo or grammar error
  - Other issue
- ✅ **Report Storage**: Store reports in localStorage with metadata (question ID, category, difficulty, reason, details, timestamp)
- ✅ **Report Export**: Export all reports as JSON to clipboard via button on results screen
- ✅ **UI Integration**: Button only visible during quiz, hidden on start screen
- ✅ **Responsive Design**: Button stacks below question on mobile
- ⏳ **GitHub Integration**: Future: Create GitHub issue automatically (requires auth)

#### 18. Scoreboard (Opt-In Leaderboard) ❌ NOT IMPLEMENTED
- **Opt-In Sharing**: Users explicitly choose to share their score
- **Custom Names**: Users can enter any name (no authentication required)
- **Privacy First**: Only shared if user explicitly opts in after quiz completion
- **Scoreboard Display**: Public leaderboard showing:
  - Player name (user-provided)
  - Score/Percentage
  - Difficulty level
  - Category (if applicable)
  - Date/Time
  - Optional: Rank/Position
- **Filtering**: Filter scoreboard by difficulty, category, date range
- **Sorting**: Sort by score, date, difficulty
- **Storage**: Similar to analytics - use GitHub Actions + JSON file approach
  - User submits score via form/API (with name)
  - GitHub Action validates and adds to `scoreboard.json`
  - Public scoreboard page reads from JSON
- **Data Structure**:
  ```javascript
  {
    name: string,        // User-provided name
    score: number,       // Points earned
    percentage: number,  // Percentage correct
    difficulty: string,  // 'easy', 'medium', 'hard'
    category: string,    // Category/module (if applicable)
    totalQuestions: number,
    timestamp: string,   // ISO timestamp
    id: string          // Unique ID (hash of name+timestamp for deduplication)
  }
  ```
- **Privacy Considerations**:
  - No PII required (users choose their own name)
  - Clear opt-in consent
  - Option to remove score from leaderboard
  - No tracking of who submitted what (anonymous submissions)
- **UI Flow**:
  1. User completes quiz
  2. Results screen shows "Share to Scoreboard?" option
  3. If yes, prompt for name (optional, defaults to "Anonymous")
  4. Submit score
  5. Show confirmation and link to scoreboard
- **Scoreboard Page**: Separate page (`scoreboard.html`) displaying public leaderboard

## Future Enhancements (Extensibility Examples)

1. **Question Types**: Support true/false, multiple select, fill-in-the-blank
2. **Timed Quizzes**: Add time limits per question or overall
3. **Question Editor**: Admin interface to add/edit questions
5. **Export/Import**: Share question sets as JSON
6. **Multiplayer Mode**: Real-time competition (would need backend)
7. **Achievements/Badges**: Unlock achievements for milestones
8. **Question Media**: Support images, code snippets, diagrams in questions

## File Naming Conventions

- **HTML**: kebab-case (`index.html`)
- **JavaScript**: kebab-case (`quiz-engine.js`)
- **CSS**: kebab-case (`styles.css`)
- **Question Files**: lowercase (`easy.js`, `medium.js`, `hard.js`)

## Browser Compatibility

- Target: Modern browsers (Chrome, Firefox, Safari, Edge)
- Use ES6+ features (modules, arrow functions, const/let)
- No polyfills needed for GitHub Pages audience

## Implementation Priority

### Phase 1: Foundation
- Basic file structure
- Question data files (2-3 placeholder questions per difficulty)
- Basic HTML/CSS skeleton
- Simple quiz engine (no persistence)

### Phase 2: Core Gameplay
- Score display and tracking
- Progress indicator
- Question randomization
- Visual feedback
- Results screen

### Phase 3: Enhanced UX
- Local storage (save/resume)
- Reset button
- Review mode
- Hints system
- Sound effects
- Animations

### Phase 4: Advanced Features
- Categories/modules structure
- Category filtering
- Difficulty progression
- Dark mode/themes
- Share results
- Question reporting

### Phase 5: Analytics & Polish
- Analytics collection system
- Mobile optimization
- Accessibility improvements
- Performance optimization
- Documentation

## Questions to Consider

1. **Question Count**: How many questions per difficulty level? Per category?
2. **Randomization**: Shuffle questions? Shuffle options? (Both recommended: Yes)
3. **Hints**: Point penalty for hints? (Start: No penalty, add later if needed)
4. **Timer**: Per-question timer or overall timer? (Start: Optional, user choice)
5. **Review Mode**: Separate mode or part of results screen? (Both: Results screen + dedicated review mode)
6. **Analytics Privacy**: How to anonymize user data? (Hash user identifiers, no PII)
7. **Category Structure**: Flat or hierarchical? (Start flat, support subcategories in data)

## Next Steps

1. Create the directory structure
2. Set up basic HTML skeleton
3. Create question data files with placeholders
4. Implement minimal quiz engine
5. Build basic UI
6. Test locally before GitHub Pages deployment

