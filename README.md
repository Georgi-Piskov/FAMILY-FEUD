# 🎮 Family Feud - AI-Powered Party Game

A modern, web-based implementation of the classic Family Feud game show, featuring AI-generated questions powered by Grok AI through n8n automation.

![Family Feud Game](https://img.shields.io/badge/Game-Family%20Feud-orange?style=for-the-badge)
![Made with JavaScript](https://img.shields.io/badge/Made%20with-JavaScript-yellow?style=for-the-badge&logo=javascript)
![Powered by Grok AI](https://img.shields.io/badge/Powered%20by-Grok%20AI-blue?style=for-the-badge)

## ✨ Features

### 🎯 Classic Game Mode
- **Two Teams Competition** - Hot-seat multiplayer for family gatherings and parties
- **4 Rounds** with increasing point multipliers (x1, x1, x2, x3)
- **6 Hidden Answers** per question with flip-card reveal animations
- **Strike System** - 3 strikes and the other team can steal!
- **Steal Mechanic** - One chance to steal all accumulated points

### ⚡ Fast Money Bonus Round
- **5 Rapid-Fire Questions** for the winning team
- **Two Players** take turns (20 seconds for Player 1, 25 seconds for Player 2)
- **Hidden Answers** - Player 2 can't see Player 1's responses
- **$20,000 Prize** if combined score reaches 200+ points
- **Continue After Timer** - Finish typing even after time expires!

### 🤖 AI-Powered Questions
- **Dynamic Question Generation** via Grok AI
- **Spiciness Slider** (0-100%) - From family-friendly to adults-only content
- **Session Memory** - AI remembers previous questions to avoid repetition
- **Fallback System** - Demo questions available if API is unavailable

### 🎨 Polished UI/UX
- **Classic Game Show Aesthetic** - Orange and blue color scheme
- **Responsive Design** - Works on desktop and tablets
- **Sound Effects** - Buzzer for wrong answers, alarm for time up
- **Animations** - Card flips, confetti on victory, pulsing effects
- **Bulgarian Language** - Full UI translation to Bulgarian (Cyrillic)

## 🚀 Live Demo

Play the game here: **[Family Feud Game](https://georgi-piskov.github.io/FAMILY-FEUD/)**

## 🛠️ Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | n8n Workflow Automation |
| AI | Grok AI (xAI) |
| Hosting | GitHub Pages |
| Audio | Web Audio API (no external files) |

## 📁 Project Structure

```
FAMILY-FEUD/
├── index.html          # Main game interface
├── css/
│   └── styles.css      # All styling (~1400 lines)
├── js/
│   └── game.js         # Game logic (~1300 lines)
├── n8n/
│   ├── family-feud-workflow.json    # n8n workflow template
│   └── SETUP_GUIDE.md               # Backend setup instructions
└── .github/
    └── workflows/
        └── deploy.yml  # GitHub Pages deployment
```

## 🎮 How to Play

### Setup
1. Open the game in your browser
2. Adjust the **Spiciness Slider** to set content level
3. Click **"Нова игра"** (New Game) to start

### Main Rounds
1. Read the question aloud to both teams
2. Teams take turns guessing answers
3. Correct answers flip to reveal points
4. 3 wrong guesses = other team can steal
5. Click **"Даване на точки"** to award points to the controlling team
6. First to 300 points (or after 4 rounds) advances to Fast Money

### Fast Money
1. Player 1 leaves the room, Player 2 watches
2. Player 1 answers 5 questions in 20 seconds
3. Players switch - Player 2 answers same questions in 25 seconds
4. If combined score ≥ 200, win the $20,000 prize!

## ⚙️ Backend Setup (Optional)

The game works with demo questions out of the box. For AI-generated questions:

1. Set up an n8n instance
2. Import the workflow from `n8n/family-feud-workflow.json`
3. Configure your Grok AI credentials
4. Update the webhook URLs in `js/game.js`

See [n8n/SETUP_GUIDE.md](n8n/SETUP_GUIDE.md) for detailed instructions.

## 🔧 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/family-feud/new-game` | POST | Generate a new question |
| `/family-feud/next-question` | POST | Get Fast Money questions |
| `/family-feud/check-answer` | POST | Validate an answer |

### Request Format
```json
{
  "sessionId": "ff_1704384000000_abc123",
  "spiciness": 50
}
```

## 🎨 Screenshots

### Main Game Board
- Classic blue and orange theme
- Flip-card answer reveal
- Team scores and round indicator

### Fast Money Round
- 5-question rapid fire
- Dual player columns
- Timer with expired state warning

### Winner Screen
- Confetti celebration
- Final scores display
- Play again option

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

**Georgi Piskov**

- GitHub: [@Georgi-Piskov](https://github.com/Georgi-Piskov)

---

⭐ **If you enjoy this game, please give it a star!** ⭐

*Made with ❤️ for family game nights*
