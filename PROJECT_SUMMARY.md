# 🎮 Family Feud Project - Development Summary

## 📋 Project Overview

**Project Name:** Family Feud (Семейни Вражди)  
**Repository:** https://github.com/Georgi-Piskov/FAMILY-FEUD  
**Live URL:** https://georgi-piskov.github.io/FAMILY-FEUD/  
**Start Date:** December 2025  
**Last Updated:** January 4, 2026  

---

## 🎯 Project Goals

Create a web-based Family Feud party game with:
1. AI-generated questions via n8n + Grok AI
2. Spiciness slider (0-100%) for content control
3. Two teams hot-seat mode
4. Fast Money bonus round
5. Bulgarian language UI
6. Deploy to GitHub Pages

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | n8n Workflow Automation |
| AI | Grok AI (models 4.1, 4.2) via xAI |
| Hosting | GitHub Pages |
| Audio | Web Audio API (generated sounds, no files) |

---

## 📁 File Structure

```
FAMILY-FEUD/
├── index.html              # Main game UI (313 lines)
├── README.md               # GitHub documentation
├── PROJECT_SUMMARY.md      # This file
├── css/
│   └── styles.css          # All styling (~1400 lines)
├── js/
│   └── game.js             # Game logic (~1300 lines)
├── n8n/
│   ├── family-feud-workflow.json
│   └── SETUP_GUIDE.md
└── .github/
    └── workflows/
        └── deploy.yml      # GitHub Pages CI/CD
```

---

## 🔗 API Endpoints (n8n)

**Base URL:** `https://n8n.simeontsvetanovn8nworkflows.site/webhook`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/family-feud/new-game` | POST | Generate main round question |
| `/family-feud/next-question` | POST | Get Fast Money questions (5) |
| `/family-feud/check-answer` | POST | Validate answer |

### Request Format:
```json
{
  "sessionId": "ff_1704384000000_abc123xyz",
  "spiciness": 50,
  "mode": "fast-money"  // optional
}
```

### Response Format (new-game):
```json
{
  "success": true,
  "sessionId": "...",
  "question": "Кажете нещо...",
  "answers": [
    { "text": "Отговор 1", "points": 32 },
    { "text": "Отговор 2", "points": 25 },
    ...
  ]
}
```

---

## ✅ Completed Features

### 1. Main Game Mode
- [x] Two teams (Отбор 1, Отбор 2) with scores
- [x] 4 rounds with multipliers (x1, x1, x2, x3)
- [x] 6 answer slots with flip-card animation
- [x] 3 strikes system (X marks)
- [x] Steal mechanic with modal popup
- [x] Steal input field for answer submission
- [x] Skip question button (doesn't affect state)
- [x] Award points button
- [x] Switch team button

### 2. Fast Money Mode
- [x] 5 questions rapid-fire
- [x] Player 1: 20 seconds, Player 2: 25 seconds
- [x] Start overlay for each player ("🎯 ИГРАЧ 1 🎯")
- [x] Loading overlay while questions load from AI
- [x] Hide Player 1's answers when Player 2 plays
- [x] Continue typing after timer expires
- [x] "✅ ГОТОВО" (Done) button when time runs out
- [x] Red pulsing background when time expired
- [x] Show all answers + top answers panel at end
- [x] "➡️ НАПРЕД" button before winner screen
- [x] Target: 200 points for $20,000 prize

### 3. Sound Effects (Web Audio API)
- [x] Buzzer sound on wrong answer (X)
- [x] Time-up alarm (3 beeps) when Fast Money timer expires
- [x] Correct answer ding (optional, implemented but not always used)

### 4. UI/UX
- [x] Classic orange/blue Family Feud color scheme
- [x] Responsive design
- [x] Bulgarian language (Cyrillic) for all text
- [x] Spiciness slider with emoji feedback (🌶️)
- [x] Confetti animation on winner screen
- [x] Active team indicators

### 5. n8n Backend
- [x] Bulgarian prompts for AI question generation
- [x] Spiciness parameter for content control
- [x] Session ID for Simple Memory (avoid repeat questions)
- [x] Fallback to demo questions on API error

### 6. Deployment
- [x] GitHub repository created
- [x] GitHub Pages workflow (deploy.yml)
- [x] Comprehensive README.md

---

## 🐛 Bugs Fixed During Development

1. **Steal modal missing input field** - Added text input and submit button
2. **Double timer speed in Fast Money** - Clear existing interval before starting new
3. **Questions loading slower than Start button** - Added loading overlay
4. **Answers shown too briefly before winner** - Added "НАПРЕД" button
5. **Player 1 answers visible to Player 2** - Hide them during P2's turn
6. **n8n Simple Memory error** - Added sessionId to API requests
7. **API response not displaying** - Fixed parsing to handle direct format

---

## 📝 Configuration (game.js)

```javascript
const CONFIG = {
    API_BASE_URL: 'https://n8n.simeontsvetanovn8nworkflows.site/webhook',
    ENDPOINTS: {
        NEW_GAME: '/family-feud/new-game',
        CHECK_ANSWER: '/family-feud/check-answer',
        NEXT_QUESTION: '/family-feud/next-question'
    },
    MAX_STRIKES: 3,
    POINTS_TO_WIN: 300,
    ROUND_MULTIPLIERS: [1, 1, 2, 3],
    FAST_MONEY_TARGET: 200,
    FAST_MONEY_PRIZE: 20000,
    FAST_MONEY_TIME_P1: 20,
    FAST_MONEY_TIME_P2: 25,
    DEMO_MODE: false  // Set to true to use demo questions
};
```

---

## 🔮 Potential Future Improvements

- [ ] Add more sound effects (correct answer ding, applause)
- [ ] Multiplayer over network (WebSocket)
- [ ] Save/load game state
- [ ] Leaderboard with localStorage
- [ ] More themes/skins
- [ ] Mobile-optimized layout
- [ ] Voice input for answers
- [ ] Multiple language support
- [ ] Custom team names input
- [ ] Timer sound countdown (last 5 seconds)

---

## 📚 Key Code Sections

### game.js Functions:
- `startNewGame()` - Initialize new game, generate sessionId
- `loadNextQuestion()` - Fetch question from API or demo
- `handleAnswerSubmit()` - Process typed answers
- `addStrike()` - Add X mark, play buzzer
- `handleThreeStrikes()` - Trigger steal or end round
- `handleStealSubmit()` - Process steal attempt
- `startFastMoney()` - Begin Fast Money round
- `startFMTimer()` - Timer with expiry handling
- `handleFMDone()` - Manual end after timer expires
- `revealPlayer1Answers()` - Show P1 answers
- `startPlayer2FM()` - Hide P1 answers, start P2
- `endFastMoney()` - Show all answers + top answers panel
- `showWinner()` - Display winner with confetti

### CSS Highlights:
- `.answer-card` - Flip animation on reveal
- `.time-expired` - Red pulsing background
- `.fm-start-overlay` - Full-screen player overlays
- `.fm-top-answers-panel` - Side panel with correct answers
- `.steal-modal` - Steal opportunity popup

---

## 💡 n8n Workflow Notes

The n8n workflow uses:
1. **Webhook Trigger** - Receives POST requests
2. **AI Agent** - Grok AI with Bulgarian prompts
3. **Simple Memory** - Stores previous questions per sessionId
4. **Code Node** - Parses AI response to JSON format

**Important:** Simple Memory requires `sessionId` in the request body. The Session Key should be set to `{{ $json.body.sessionId }}`.

---

## 🎮 How the Game Works

1. **New Game** → Generate sessionId → Fetch question from n8n → Display
2. **Answer** → Check against answer list → Reveal or Strike
3. **3 Strikes** → Steal modal → One guess to win points
4. **End Round** → Award points → Next round or Fast Money
5. **Fast Money** → Player 1 (20s) → Reveal → Player 2 (25s) → Calculate total
6. **Winner** → Show winning team → Confetti → Play again option

---

*This summary was created on January 4, 2026 to preserve project context for future development sessions.*
