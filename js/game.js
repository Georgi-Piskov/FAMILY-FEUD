/**
 * Family Feud Game - Main JavaScript
 * Version 2.0 - Two Teams + Fast Money
 */

// ========================================
// Configuration
// ========================================
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
    DEMO_MODE: false  // Changed to false - using real n8n backend!
};

// ========================================
// Sound Effects System
// ========================================
const SoundFX = {
    audioContext: null,
    
    init() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    },
    
    ensureContext() {
        if (!this.audioContext) this.init();
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    },
    
    // Wrong answer buzzer (X sound)
    playBuzzer() {
        this.ensureContext();
        const ctx = this.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
    },
    
    // Time's up alarm for Fast Money
    playTimeUp() {
        this.ensureContext();
        const ctx = this.audioContext;
        
        // Play 3 short beeps
        for (let i = 0; i < 3; i++) {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(800, ctx.currentTime + i * 0.2);
            
            gainNode.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.2);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.2 + 0.15);
            
            oscillator.start(ctx.currentTime + i * 0.2);
            oscillator.stop(ctx.currentTime + i * 0.2 + 0.15);
        }
    },
    
    // Correct answer ding
    playCorrect() {
        this.ensureContext();
        const ctx = this.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523, ctx.currentTime); // C5
        oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(784, ctx.currentTime + 0.2); // G5
        
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.4);
    }
};

// ========================================
// Game State
// ========================================
const gameState = {
    sessionId: null,
    mode: 'normal',
    currentRound: 1,
    maxRounds: 4,
    currentQuestion: null,
    answers: [],
    team1: { name: 'Отбор 1', score: 0 },
    team2: { name: 'Отбор 2', score: 0 },
    activeTeam: 1,
    controllingTeam: 1,
    strikes: 0,
    roundPoints: 0,
    stealMode: false,
    fastMoney: {
        currentPlayer: 1,
        currentQuestion: 0,
        timeLeft: 20,
        timerInterval: null,
        timeExpired: false,
        player1Answers: [],
        player2Answers: [],
        questions: [],
        totalPoints: 0,
        winningTeam: 1
    },
    spiciness: 0
};

// Generate unique session ID
function generateSessionId() {
    return 'ff_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ========================================
// Demo Data
// ========================================
const DEMO_QUESTIONS = {
    normal: [
        {
            question: "Name something people do first thing in the morning",
            answers: [
                { text: "Brush Teeth", points: 32 },
                { text: "Shower", points: 25 },
                { text: "Coffee", points: 18 },
                { text: "Check Phone", points: 12 },
                { text: "Breakfast", points: 8 },
                { text: "Exercise", points: 5 }
            ]
        },
        {
            question: "Name a place where you have to be quiet",
            answers: [
                { text: "Library", points: 35 },
                { text: "Church", points: 28 },
                { text: "Movie Theater", points: 18 },
                { text: "Hospital", points: 10 },
                { text: "Funeral", points: 6 },
                { text: "Classroom", points: 3 }
            ]
        },
        {
            question: "Name something couples argue about",
            answers: [
                { text: "Money", points: 30 },
                { text: "Chores", points: 25 },
                { text: "In-Laws", points: 18 },
                { text: "Kids", points: 12 },
                { text: "TV Remote", points: 10 },
                { text: "Driving", points: 5 }
            ]
        },
        {
            question: "Name a reason someone might call in sick to work",
            answers: [
                { text: "Flu/Cold", points: 35 },
                { text: "Hangover", points: 22 },
                { text: "Doctor Appt", points: 15 },
                { text: "Mental Health", points: 12 },
                { text: "Family Issue", points: 10 },
                { text: "Interview", points: 6 }
            ]
        }
    ],
    spicy: [
        {
            question: "Name something that gets bigger when you're excited",
            answers: [
                { text: "Eyes", points: 28 },
                { text: "Smile", points: 24 },
                { text: "Heart Rate", points: 20 },
                { text: "Voice", points: 15 },
                { text: "Pupils", points: 8 },
                { text: "Ego", points: 5 }
            ]
        },
        {
            question: "Name something you'd find in a bachelor's apartment",
            answers: [
                { text: "Pizza Boxes", points: 30 },
                { text: "Video Games", points: 25 },
                { text: "Empty Bottles", points: 18 },
                { text: "Dirty Laundry", points: 14 },
                { text: "Posters", points: 8 },
                { text: "Old Takeout", points: 5 }
            ]
        }
    ],
    fastMoney: [
        { question: "Name a fruit that's red", topAnswer: "Apple", points: 45 },
        { question: "Name something you take to the beach", topAnswer: "Towel", points: 38 },
        { question: "Name a type of pet", topAnswer: "Dog", points: 52 },
        { question: "Name something found in a wallet", topAnswer: "Money", points: 48 },
        { question: "Name a vegetable that's green", topAnswer: "Broccoli", points: 35 },
        { question: "Name something in your bathroom", topAnswer: "Toilet", points: 42 },
        { question: "Name a breakfast food", topAnswer: "Eggs", points: 40 },
        { question: "Name something with wheels", topAnswer: "Car", points: 55 },
        { question: "Name a month with 31 days", topAnswer: "January", points: 30 },
        { question: "Name a color in the rainbow", topAnswer: "Red", points: 38 }
    ]
};

// ========================================
// DOM Elements
// ========================================
let DOM = {};

function initDOM() {
    DOM = {
        gameBoard: document.querySelector('.game-board'),
        gameControls: document.getElementById('game-controls'),
        gameHeader: document.querySelector('.game-header'),
        fastMoneySection: document.getElementById('fast-money-section'),
        winnerSection: document.getElementById('winner-section'),
        team1Panel: document.getElementById('team1-panel'),
        team2Panel: document.getElementById('team2-panel'),
        team1Score: document.getElementById('team1-score'),
        team2Score: document.getElementById('team2-score'),
        team1Name: document.getElementById('team1-name'),
        team2Name: document.getElementById('team2-name'),
        currentTeamEmoji: document.getElementById('current-team-emoji'),
        currentTeamText: document.getElementById('current-team-text'),
        roundNumber: document.getElementById('round-number'),
        multiplier: document.getElementById('multiplier'),
        roundPoints: document.getElementById('round-points-value'),
        questionText: document.getElementById('question-text'),
        answerSlots: document.querySelectorAll('.answer-slot'),
        strikes: [
            document.getElementById('strike-1'),
            document.getElementById('strike-2'),
            document.getElementById('strike-3')
        ],
        stealModal: document.getElementById('steal-modal'),
        stealTeamName: document.getElementById('steal-team-name'),
        stealPoints: document.getElementById('steal-points'),
        answerForm: document.getElementById('answer-form'),
        answerInput: document.getElementById('answer-input'),
        newGameBtn: document.getElementById('new-game-btn'),
        nextQuestionBtn: document.getElementById('next-question-btn'),
        awardPointsBtn: document.getElementById('award-points-btn'),
        switchTeamBtn: document.getElementById('switch-team-btn'),
        spicinessSlider: document.getElementById('spiciness-slider'),
        spicinessValue: document.getElementById('spiciness-value'),
        fmTimer: document.getElementById('fm-timer'),
        fmPlayerNumber: document.getElementById('fm-player-number'),
        fmTotalPoints: document.getElementById('fm-total-points'),
        fmPrize: document.getElementById('fm-prize'),
        fmAnswerInput: document.getElementById('fm-answer-input'),
        fmSubmitBtn: document.getElementById('fm-submit-btn'),
        fmPassBtn: document.getElementById('fm-pass-btn'),
        winnerTeamName: document.getElementById('winner-team-name'),
        winnerScore: document.getElementById('winner-score'),
        winnerPrize: document.getElementById('winner-prize'),
        playAgainBtn: document.getElementById('play-again-btn')
    };
}

// ========================================
// Initialize
// ========================================
function init() {
    initDOM();
    
    // Main game events
    DOM.answerForm.addEventListener('submit', handleAnswerSubmit);
    DOM.newGameBtn.addEventListener('click', startNewGame);
    DOM.nextQuestionBtn.addEventListener('click', nextRound);
    DOM.awardPointsBtn.addEventListener('click', () => awardPointsToActiveTeam());
    DOM.switchTeamBtn.addEventListener('click', switchActiveTeam);
    DOM.spicinessSlider.addEventListener('input', handleSpicinessChange);
    
    // Skip question button
    document.getElementById('skip-question-btn').addEventListener('click', skipQuestion);
    
    // Steal modal events
    document.getElementById('steal-close-btn').addEventListener('click', skipSteal);
    document.getElementById('steal-submit-btn').addEventListener('click', handleStealSubmit);
    document.getElementById('steal-answer-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleStealSubmit();
    });
    
    // Fast Money events
    DOM.fmSubmitBtn.addEventListener('click', handleFastMoneySubmit);
    DOM.fmPassBtn.addEventListener('click', handleFastMoneyPass);
    DOM.fmAnswerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleFastMoneySubmit();
    });
    document.getElementById('fm-start-btn').addEventListener('click', startFMPlayerRound);
    document.getElementById('fm-done-btn').addEventListener('click', handleFMDone);
    
    // Initialize sound effects on first user interaction
    document.addEventListener('click', () => SoundFX.ensureContext(), { once: true });
    
    // Winner events
    DOM.playAgainBtn.addEventListener('click', startNewGame);
    
    startNewGame();
    console.log('🎮 Family Feud v2.0 initialized!');
}

// ========================================
// Game Flow
// ========================================
async function startNewGame() {
    // Generate new session ID for this game
    gameState.sessionId = generateSessionId();
    console.log('🎮 New game session:', gameState.sessionId);
    
    gameState.mode = 'normal';
    gameState.currentRound = 1;
    gameState.team1.score = 0;
    gameState.team2.score = 0;
    gameState.activeTeam = 1;
    gameState.controllingTeam = 1;
    gameState.strikes = 0;
    gameState.roundPoints = 0;
    gameState.stealMode = false;
    
    showSection('normal');
    await loadNextQuestion();
    updateTeamUI();
    updateRoundUI();
}

function showSection(mode) {
    gameState.mode = mode;
    
    DOM.gameBoard.classList.add('hidden');
    DOM.gameControls.classList.add('hidden');
    DOM.gameHeader.classList.add('hidden');
    DOM.fastMoneySection.classList.remove('active');
    DOM.winnerSection.classList.remove('active');
    DOM.stealModal.classList.remove('active');
    
    if (mode === 'normal') {
        DOM.gameBoard.classList.remove('hidden');
        DOM.gameControls.classList.remove('hidden');
        DOM.gameHeader.classList.remove('hidden');
    } else if (mode === 'fast-money') {
        DOM.fastMoneySection.classList.add('active');
    } else if (mode === 'winner') {
        DOM.winnerSection.classList.add('active');
        createConfetti();
    }
}

async function loadNextQuestion() {
    // Show loading state
    DOM.questionText.textContent = '🔄 Зареждане на въпрос...';
    
    if (CONFIG.DEMO_MODE) {
        // Use demo questions
        const questions = gameState.spiciness >= 50 ? 
            [...DEMO_QUESTIONS.normal, ...DEMO_QUESTIONS.spicy] : 
            DEMO_QUESTIONS.normal;
        
        const q = questions[Math.floor(Math.random() * questions.length)];
        
        gameState.currentQuestion = {
            id: Date.now(),
            text: q.question,
            answers: q.answers.map((a, i) => ({ ...a, slot: i + 1, revealed: false }))
        };
    } else {
        // Call n8n API
        try {
            console.log('🚀 Calling API:', `${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.NEW_GAME}`);
            console.log('📤 Request body:', { sessionId: gameState.sessionId, spiciness: gameState.spiciness });
            
            const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.NEW_GAME}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    sessionId: gameState.sessionId,
                    spiciness: gameState.spiciness 
                })
            });
            
            console.log('📡 Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('📥 API Response:', data);
            console.log('📥 data.question:', data.question);
            console.log('📥 data.answers:', data.answers);
            
            if (data.question && data.answers) {
                // Direct format from n8n
                gameState.currentQuestion = {
                    id: Date.now(),
                    text: data.question,
                    answers: data.answers.map((a, i) => ({ 
                        text: a.text, 
                        points: a.points, 
                        slot: i + 1, 
                        revealed: false 
                    }))
                };
                console.log('✅ Question loaded:', gameState.currentQuestion.text);
            } else if (data.output) {
                // Handle AI Agent output format
                const parsed = typeof data.output === 'string' ? JSON.parse(data.output) : data.output;
                gameState.currentQuestion = {
                    id: Date.now(),
                    text: parsed.question,
                    answers: parsed.answers.map((a, i) => ({ ...a, slot: i + 1, revealed: false }))
                };
                console.log('✅ Question loaded from output:', gameState.currentQuestion.text);
            } else {
                console.error('❌ Invalid response format:', data);
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('❌ API Error:', error);
            console.error('❌ Falling back to demo questions');
            // Fallback to demo
            const q = DEMO_QUESTIONS.normal[0];
            gameState.currentQuestion = {
                id: Date.now(),
                text: q.question,
                answers: q.answers.map((a, i) => ({ ...a, slot: i + 1, revealed: false }))
            };
        }
    }
    
    gameState.answers = gameState.currentQuestion.answers;
    gameState.strikes = 0;
    gameState.roundPoints = 0;
    gameState.stealMode = false;
    
    DOM.questionText.textContent = gameState.currentQuestion.text;
    resetStrikes();
    resetAnswerBoard();
    updateRoundUI();
}

async function nextRound() {
    if (gameState.team1.score >= CONFIG.POINTS_TO_WIN || 
        gameState.team2.score >= CONFIG.POINTS_TO_WIN ||
        gameState.currentRound >= gameState.maxRounds) {
        await startFastMoney();
        return;
    }
    
    gameState.currentRound++;
    gameState.controllingTeam = gameState.controllingTeam === 1 ? 2 : 1;
    gameState.activeTeam = gameState.controllingTeam;
    
    await loadNextQuestion();
    updateTeamUI();
}

// Skip question without affecting score or round
async function skipQuestion() {
    console.log('🔄 Skipping question...');
    
    // Save current state
    const savedRound = gameState.currentRound;
    const savedTeam1Score = gameState.team1.score;
    const savedTeam2Score = gameState.team2.score;
    const savedActiveTeam = gameState.activeTeam;
    const savedControllingTeam = gameState.controllingTeam;
    
    // Load new question
    await loadNextQuestion();
    
    // Restore state (in case loadNextQuestion changed anything)
    gameState.currentRound = savedRound;
    gameState.team1.score = savedTeam1Score;
    gameState.team2.score = savedTeam2Score;
    gameState.activeTeam = savedActiveTeam;
    gameState.controllingTeam = savedControllingTeam;
    
    updateTeamUI();
    updateRoundUI();
    
    console.log('✅ Question skipped, state preserved');
}

// ========================================
// Team Management
// ========================================
function updateTeamUI() {
    DOM.team1Score.textContent = gameState.team1.score;
    DOM.team2Score.textContent = gameState.team2.score;
    
    if (gameState.activeTeam === 1) {
        DOM.team1Panel.classList.add('active');
        DOM.team2Panel.classList.remove('active');
        DOM.currentTeamEmoji.textContent = '🔵';
        DOM.currentTeamText.textContent = `Ред на ${gameState.team1.name}`;
    } else {
        DOM.team1Panel.classList.remove('active');
        DOM.team2Panel.classList.add('active');
        DOM.currentTeamEmoji.textContent = '🔴';
        DOM.currentTeamText.textContent = `Ред на ${gameState.team2.name}`;
    }
    
    if (gameState.stealMode) {
        DOM.currentTeamText.textContent += ' (КРАДЕ!)';
    }
}

function switchActiveTeam() {
    gameState.activeTeam = gameState.activeTeam === 1 ? 2 : 1;
    updateTeamUI();
}

function awardPointsToActiveTeam() {
    const team = gameState.activeTeam === 1 ? gameState.team1 : gameState.team2;
    team.score += gameState.roundPoints;
    gameState.roundPoints = 0;
    
    updateTeamUI();
    updateRoundUI();
    
    if (team.score >= CONFIG.POINTS_TO_WIN) {
        setTimeout(() => startFastMoney(), 1000);
    }
}

// ========================================
// Answer Handling
// ========================================
function handleAnswerSubmit(e) {
    e.preventDefault();
    
    // Don't process if steal modal is active
    if (gameState.stealMode) return;
    
    const answer = DOM.answerInput.value.trim();
    if (!answer) return;
    
    const result = checkAnswer(answer);
    
    if (result.match) {
        revealAnswer(result.slotIndex);
        
        if (gameState.answers.every(a => a.revealed)) {
            setTimeout(() => {
                DOM.questionText.textContent = "Всички отговори намерени! Натисни 'Даване на точки'";
            }, 500);
        }
    } else {
        addStrike();
    }
    
    DOM.answerInput.value = '';
    DOM.answerInput.focus();
}

function checkAnswer(answer) {
    const normalized = answer.toLowerCase().trim();
    
    for (let i = 0; i < gameState.answers.length; i++) {
        const correct = gameState.answers[i];
        if (correct.revealed) continue;
        
        const normalizedCorrect = correct.text.toLowerCase();
        if (normalizedCorrect.includes(normalized) || 
            normalized.includes(normalizedCorrect) ||
            levenshteinDistance(normalized, normalizedCorrect) <= 3) {
            return { match: true, slotIndex: i, answer: correct };
        }
    }
    
    return { match: false };
}

function revealAnswer(slotIndex) {
    const slot = DOM.answerSlots[slotIndex];
    const card = slot.querySelector('.answer-card');
    
    card.classList.add('revealed');
    slot.classList.add('correct');
    
    gameState.answers[slotIndex].revealed = true;
    
    const multiplier = CONFIG.ROUND_MULTIPLIERS[gameState.currentRound - 1] || 1;
    gameState.roundPoints += gameState.answers[slotIndex].points * multiplier;
    
    updateRoundUI();
    
    setTimeout(() => slot.classList.remove('correct'), 1000);
}

function addStrike() {
    if (gameState.strikes < CONFIG.MAX_STRIKES) {
        // Play buzzer sound
        SoundFX.playBuzzer();
        
        DOM.strikes[gameState.strikes].classList.add('active');
        gameState.strikes++;
        
        DOM.answerInput.classList.add('wrong-animation');
        setTimeout(() => DOM.answerInput.classList.remove('wrong-animation'), 500);
        
        if (gameState.strikes >= CONFIG.MAX_STRIKES) {
            handleThreeStrikes();
        }
    }
}

function handleThreeStrikes() {
    if (gameState.stealMode) {
        // Stealing team got 3 strikes - original team keeps points
        gameState.activeTeam = gameState.controllingTeam;
        DOM.stealModal.classList.remove('active');
        gameState.stealMode = false;
        awardPointsToActiveTeam();
        revealAllAnswers();
    } else {
        // Controlling team got 3 strikes - other team can steal
        gameState.stealMode = true;
        gameState.activeTeam = gameState.activeTeam === 1 ? 2 : 1;
        
        const stealingTeam = gameState.activeTeam === 1 ? gameState.team1 : gameState.team2;
        DOM.stealTeamName.textContent = stealingTeam.name;
        DOM.stealPoints.textContent = gameState.roundPoints;
        DOM.stealModal.classList.add('active');
        
        // Focus the steal input
        const stealInput = document.getElementById('steal-answer-input');
        stealInput.value = '';
        setTimeout(() => stealInput.focus(), 100);
        
        gameState.strikes = 0;
        resetStrikes();
        updateTeamUI();
    }
}

// Handle steal answer submission
function handleStealSubmit() {
    const stealInput = document.getElementById('steal-answer-input');
    const answer = stealInput.value.trim();
    
    if (!answer) return;
    
    const result = checkAnswer(answer);
    const stealingTeam = gameState.activeTeam;
    const originalTeam = gameState.controllingTeam;
    const pointsToSteal = gameState.roundPoints;
    
    console.log('🎯 Steal attempt:', answer);
    console.log('Stealing team:', stealingTeam, '| Original team:', originalTeam);
    console.log('Points at stake:', pointsToSteal);
    console.log('Result:', result);
    
    // Close modal first
    DOM.stealModal.classList.remove('active');
    gameState.stealMode = false;
    
    if (result.match) {
        // Successful steal! Points go to stealing team
        console.log('✅ STEAL SUCCESS! Points to Team', stealingTeam);
        revealAnswer(result.slotIndex);
        // activeTeam is already the stealing team
        awardPointsToActiveTeam();
        revealAllAnswers();
        DOM.questionText.textContent = `🎉 КРАЖБА! ${stealingTeam === 1 ? gameState.team1.name : gameState.team2.name} печели точките!`;
    } else {
        // Wrong answer - original team keeps points
        console.log('❌ STEAL FAILED! Points stay with Team', originalTeam);
        // Switch back to original team before awarding
        gameState.activeTeam = originalTeam;
        awardPointsToActiveTeam();
        revealAllAnswers();
        DOM.questionText.textContent = `❌ Грешка! ${originalTeam === 1 ? gameState.team1.name : gameState.team2.name} запазва точките!`;
    }
    
    stealInput.value = '';
    updateTeamUI();
}

// Skip steal - original team keeps points
function skipSteal() {
    DOM.stealModal.classList.remove('active');
    gameState.stealMode = false;
    gameState.activeTeam = gameState.controllingTeam;
    awardPointsToActiveTeam();
    revealAllAnswers();
}

function revealAllAnswers() {
    gameState.answers.forEach((a, i) => {
        if (!a.revealed) {
            setTimeout(() => {
                DOM.answerSlots[i].querySelector('.answer-card').classList.add('revealed');
            }, i * 300);
        }
    });
}

// ========================================
// Fast Money
// ========================================
async function startFastMoney() {
    showSection('fast-money');
    
    const winningTeam = gameState.team1.score >= gameState.team2.score ? 1 : 2;
    
    // Show loading overlay while questions load
    showFMLoadingOverlay();
    
    // Get Fast Money questions from API
    let fmQuestions;
    if (CONFIG.DEMO_MODE) {
        fmQuestions = getRandomFMQuestions(5);
    } else {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.NEXT_QUESTION}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    sessionId: gameState.sessionId,
                    spiciness: gameState.spiciness, 
                    mode: 'fast-money' 
                })
            });
            
            const data = await response.json();
            console.log('📥 Fast Money API Response:', data);
            
            if (data.questions) {
                fmQuestions = data.questions;
            } else if (data.output) {
                const parsed = typeof data.output === 'string' ? JSON.parse(data.output) : data.output;
                fmQuestions = parsed.questions;
            } else {
                throw new Error('Invalid Fast Money response');
            }
        } catch (error) {
            console.error('❌ Fast Money API Error:', error);
            fmQuestions = getRandomFMQuestions(5);
        }
    }
    
    gameState.fastMoney = {
        currentPlayer: 1,
        currentQuestion: 0,
        timeLeft: CONFIG.FAST_MONEY_TIME_P1,
        timerInterval: null,
        player1Answers: Array(5).fill({ answer: '---', points: 0 }),
        player2Answers: Array(5).fill({ answer: '---', points: 0 }),
        questions: fmQuestions,
        totalPoints: 0,
        winningTeam: winningTeam
    };
    
    loadFMQuestions();
    updateFMUI();
    
    // Hide loading and show start overlay for Player 1
    hideFMLoadingOverlay();
    showFMStartOverlay(1);
}

function showFMLoadingOverlay() {
    const overlay = document.getElementById('fm-start-overlay');
    const title = document.getElementById('fm-start-title');
    const instruction = document.getElementById('fm-start-instruction');
    const tip = document.querySelector('.fm-start-tip');
    const startBtn = document.getElementById('fm-start-btn');
    
    title.textContent = '⏳ ЗАРЕЖДАНЕ... ⏳';
    instruction.textContent = 'Въпросите се зареждат от AI...';
    tip.style.display = 'none';
    startBtn.style.display = 'none';
    
    overlay.classList.remove('hidden');
}

function hideFMLoadingOverlay() {
    const startBtn = document.getElementById('fm-start-btn');
    startBtn.style.display = 'block';
}

function showFMStartOverlay(playerNum) {
    const overlay = document.getElementById('fm-start-overlay');
    const title = document.getElementById('fm-start-title');
    const instruction = document.getElementById('fm-start-instruction');
    const tip = document.querySelector('.fm-start-tip');
    const startBtn = document.getElementById('fm-start-btn');
    
    startBtn.style.display = 'block';
    startBtn.textContent = '▶️ СТАРТ';
    startBtn.onclick = startFMPlayerRound;
    
    if (playerNum === 1) {
        title.textContent = '🎯 ИГРАЧ 1 🎯';
        instruction.textContent = 'Приготви се! Имаш 20 секунди за 5 въпроса.';
        tip.textContent = '⚠️ Играч 2 - излез от стаята!';
        tip.style.display = 'block';
    } else {
        title.textContent = '🎯 ИГРАЧ 2 🎯';
        instruction.textContent = 'Твой ред! Имаш 25 секунди за 5 въпроса.';
        tip.textContent = '⚠️ Не повтаряй отговорите на Играч 1!';
        tip.style.display = 'block';
    }
    
    overlay.classList.remove('hidden');
}

function hideFMStartOverlay() {
    const overlay = document.getElementById('fm-start-overlay');
    overlay.classList.add('hidden');
}

function startFMPlayerRound() {
    hideFMStartOverlay();
    DOM.fmAnswerInput.focus();
    startFMTimer();
}

function getRandomFMQuestions(count) {
    return [...DEMO_QUESTIONS.fastMoney].sort(() => Math.random() - 0.5).slice(0, count);
}

function loadFMQuestions() {
    const fm = gameState.fastMoney;
    
    fm.questions.forEach((q, i) => {
        document.getElementById(`fm-q${i+1}-text`).textContent = q.question;
        ['a1', 'p1', 'a2', 'p2'].forEach(suffix => {
            const el = document.getElementById(`fm-q${i+1}-${suffix}`);
            el.textContent = suffix.startsWith('a') ? '---' : '0';
            el.classList.add('hidden');
        });
    });
    
    highlightFMQuestion(0);
}

function highlightFMQuestion(index) {
    document.querySelectorAll('.fm-question-row').forEach((row, i) => {
        row.classList.toggle('active', i === index);
    });
}

function startFMTimer() {
    const fm = gameState.fastMoney;
    
    // Clear any existing interval to prevent double speed
    if (fm.timerInterval) {
        clearInterval(fm.timerInterval);
        fm.timerInterval = null;
    }
    
    fm.timeExpired = false;
    hideFMDoneButton();
    
    fm.timerInterval = setInterval(() => {
        fm.timeLeft--;
        DOM.fmTimer.textContent = fm.timeLeft;
        
        if (fm.timeLeft <= 0) {
            clearInterval(fm.timerInterval);
            fm.timerInterval = null;
            fm.timeExpired = true;
            
            // Play time up sound and show visual warning
            SoundFX.playTimeUp();
            showFMTimeExpired();
            showFMDoneButton();
            
            // Don't auto-end - let player click Done button
        }
    }, 1000);
}

function showFMTimeExpired() {
    const fmSection = document.getElementById('fast-money-section');
    fmSection.classList.add('time-expired');
    DOM.fmTimer.classList.add('expired');
}

function hideFMTimeExpired() {
    const fmSection = document.getElementById('fast-money-section');
    fmSection.classList.remove('time-expired');
    DOM.fmTimer.classList.remove('expired');
}

function showFMDoneButton() {
    const doneBtn = document.getElementById('fm-done-btn');
    if (doneBtn) doneBtn.classList.remove('hidden');
}

function hideFMDoneButton() {
    const doneBtn = document.getElementById('fm-done-btn');
    if (doneBtn) doneBtn.classList.add('hidden');
}

function handleFMDone() {
    const fm = gameState.fastMoney;
    
    // Clear timer if still running
    if (fm.timerInterval) {
        clearInterval(fm.timerInterval);
        fm.timerInterval = null;
    }
    
    hideFMTimeExpired();
    hideFMDoneButton();
    
    if (fm.currentPlayer === 1) {
        revealPlayer1Answers();
    } else {
        endFastMoney();
    }
}

function handleFastMoneySubmit() {
    const fm = gameState.fastMoney;
    const answer = DOM.fmAnswerInput.value.trim();
    
    if (!answer || fm.currentQuestion >= 5) return;
    
    const question = fm.questions[fm.currentQuestion];
    const normalized = answer.toLowerCase();
    const normalizedCorrect = question.topAnswer.toLowerCase();
    
    let points = 0;
    if (normalizedCorrect.includes(normalized) || 
        normalized.includes(normalizedCorrect) ||
        levenshteinDistance(normalized, normalizedCorrect) <= 2) {
        points = question.points;
    }
    
    if (fm.currentPlayer === 2) {
        const p1Answer = fm.player1Answers[fm.currentQuestion].answer.toLowerCase();
        if (normalized === p1Answer || levenshteinDistance(normalized, p1Answer) <= 1) {
            DOM.fmAnswerInput.value = '';
            DOM.fmAnswerInput.placeholder = 'Същ отговор! Опитай отново...';
            setTimeout(() => DOM.fmAnswerInput.placeholder = 'Бързо! Напиши отговор...', 1500);
            return;
        }
    }
    
    if (fm.currentPlayer === 1) {
        fm.player1Answers[fm.currentQuestion] = { answer, points };
    } else {
        fm.player2Answers[fm.currentQuestion] = { answer, points };
    }
    
    fm.currentQuestion++;
    DOM.fmAnswerInput.value = '';
    
    if (fm.currentQuestion >= 5) {
        clearInterval(fm.timerInterval);
        fm.timerInterval = null;
        if (fm.currentPlayer === 1) revealPlayer1Answers();
        else endFastMoney();
    } else {
        highlightFMQuestion(fm.currentQuestion);
    }
}

function handleFastMoneyPass() {
    const fm = gameState.fastMoney;
    if (fm.currentQuestion >= 5) return;
    
    if (fm.currentPlayer === 1) {
        fm.player1Answers[fm.currentQuestion] = { answer: 'PASS', points: 0 };
    } else {
        fm.player2Answers[fm.currentQuestion] = { answer: 'PASS', points: 0 };
    }
    
    fm.currentQuestion++;
    
    if (fm.currentQuestion >= 5) {
        clearInterval(fm.timerInterval);
        fm.timerInterval = null;
        if (fm.currentPlayer === 1) revealPlayer1Answers();
        else endFastMoney();
    } else {
        highlightFMQuestion(fm.currentQuestion);
    }
}

function revealPlayer1Answers() {
    const fm = gameState.fastMoney;
    
    fm.player1Answers.forEach((a, i) => {
        setTimeout(() => {
            const answerEl = document.getElementById(`fm-q${i+1}-a1`);
            const pointsEl = document.getElementById(`fm-q${i+1}-p1`);
            
            answerEl.textContent = a.answer;
            answerEl.classList.remove('hidden');
            pointsEl.textContent = a.points;
            pointsEl.classList.remove('hidden');
            
            fm.totalPoints += a.points;
            updateFMTotal();
        }, i * 500);
    });
    
    setTimeout(() => startPlayer2FM(), 3000);
}

function startPlayer2FM() {
    const fm = gameState.fastMoney;
    
    // Clear any existing interval
    if (fm.timerInterval) {
        clearInterval(fm.timerInterval);
        fm.timerInterval = null;
    }
    
    // Reset time expired state
    fm.timeExpired = false;
    hideFMTimeExpired();
    hideFMDoneButton();
    
    fm.currentPlayer = 2;
    fm.currentQuestion = 0;
    fm.timeLeft = CONFIG.FAST_MONEY_TIME_P2;
    
    DOM.fmPlayerNumber.textContent = '2';
    DOM.fmTimer.textContent = fm.timeLeft;
    
    // Hide Player 1's answers so Player 2 can't see them
    hidePlayer1Answers();
    
    highlightFMQuestion(0);
    
    // Show start overlay for Player 2 instead of starting timer immediately
    showFMStartOverlay(2);
}

function hidePlayer1Answers() {
    for (let i = 1; i <= 5; i++) {
        document.getElementById(`fm-q${i}-a1`).classList.add('hidden');
        document.getElementById(`fm-q${i}-p1`).classList.add('hidden');
    }
}

function showAllAnswers() {
    // Show all Player 1 and Player 2 answers
    for (let i = 1; i <= 5; i++) {
        document.getElementById(`fm-q${i}-a1`).classList.remove('hidden');
        document.getElementById(`fm-q${i}-p1`).classList.remove('hidden');
        document.getElementById(`fm-q${i}-a2`).classList.remove('hidden');
        document.getElementById(`fm-q${i}-p2`).classList.remove('hidden');
    }
}

function endFastMoney() {
    const fm = gameState.fastMoney;
    
    // First show Player 1's answers again
    for (let i = 1; i <= 5; i++) {
        document.getElementById(`fm-q${i}-a1`).classList.remove('hidden');
        document.getElementById(`fm-q${i}-p1`).classList.remove('hidden');
    }
    
    fm.player2Answers.forEach((a, i) => {
        setTimeout(() => {
            const answerEl = document.getElementById(`fm-q${i+1}-a2`);
            const pointsEl = document.getElementById(`fm-q${i+1}-p2`);
            
            answerEl.textContent = a.answer;
            answerEl.classList.remove('hidden');
            pointsEl.textContent = a.points;
            pointsEl.classList.remove('hidden');
            
            fm.totalPoints += a.points;
            updateFMTotal();
        }, i * 500);
    });
    
    // After all answers revealed, show top answers panel and Next button
    setTimeout(() => {
        if (fm.totalPoints >= CONFIG.FAST_MONEY_TARGET) {
            DOM.fmPrize.classList.add('won');
        }
        // Show top answers panel
        showTopAnswersPanel();
        // Show "Next" button using overlay instead of auto-transition
        showFMNextOverlay();
    }, 3000);
}

function showTopAnswersPanel() {
    const fm = gameState.fastMoney;
    const panel = document.getElementById('fm-top-answers-panel');
    const list = document.getElementById('fm-top-answers-list');
    
    if (!panel || !list) return;
    
    list.innerHTML = '';
    
    fm.questions.forEach((q, i) => {
        const row = document.createElement('div');
        row.className = 'fm-top-answer-row';
        row.innerHTML = `
            <span class="fm-top-q-num">${i + 1}.</span>
            <span class="fm-top-answer">${q.topAnswer}</span>
            <span class="fm-top-points">${q.points} pts</span>
        `;
        list.appendChild(row);
    });
    
    panel.classList.remove('hidden');
}

function showFMNextOverlay() {
    const fm = gameState.fastMoney;
    const overlay = document.getElementById('fm-start-overlay');
    const title = document.getElementById('fm-start-title');
    const instruction = document.getElementById('fm-start-instruction');
    const tip = document.querySelector('.fm-start-tip');
    const startBtn = document.getElementById('fm-start-btn');
    
    const wonPrize = fm.totalPoints >= CONFIG.FAST_MONEY_TARGET;
    
    if (wonPrize) {
        title.textContent = '🎉 ПОБЕДА! 🎉';
        instruction.textContent = `Общо ${fm.totalPoints} точки! Печелите наградата!`;
    } else {
        title.textContent = '📊 РЕЗУЛТАТ 📊';
        instruction.textContent = `Общо ${fm.totalPoints} от ${CONFIG.FAST_MONEY_TARGET} точки`;
    }
    
    tip.style.display = 'none';
    startBtn.textContent = '➡️ НАПРЕД';
    startBtn.style.display = 'block';
    startBtn.onclick = () => {
        hideFMStartOverlay();
        showWinner(fm.winningTeam, wonPrize);
    };
    
    overlay.classList.remove('hidden');
}

function updateFMUI() {
    DOM.fmPlayerNumber.textContent = gameState.fastMoney.currentPlayer;
    DOM.fmTimer.textContent = gameState.fastMoney.timeLeft;
}

function updateFMTotal() {
    DOM.fmTotalPoints.textContent = gameState.fastMoney.totalPoints;
}

// ========================================
// Winner
// ========================================
function showWinner(teamNumber, wonFastMoney) {
    showSection('winner');
    
    const team = teamNumber === 1 ? gameState.team1 : gameState.team2;
    
    DOM.winnerTeamName.textContent = team.name;
    DOM.winnerScore.textContent = team.score;
    
    if (wonFastMoney) {
        DOM.winnerPrize.textContent = `+ $${CONFIG.FAST_MONEY_PRIZE.toLocaleString()} Бързи пари!`;
        DOM.winnerPrize.style.display = 'block';
    } else {
        DOM.winnerPrize.style.display = 'none';
    }
}

function createConfetti() {
    const confetti = document.getElementById('confetti');
    confetti.innerHTML = '';
    
    const colors = ['#ff6b00', '#ffd700', '#ff0000', '#00ff00', '#0000ff', '#ff00ff'];
    
    for (let i = 0; i < 100; i++) {
        const piece = document.createElement('div');
        piece.style.cssText = `
            position: absolute;
            width: 10px;
            height: 10px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            left: ${Math.random() * 100}%;
            top: -10px;
            animation: confettiFall ${2 + Math.random() * 3}s linear forwards;
            animation-delay: ${Math.random() * 2}s;
        `;
        confetti.appendChild(piece);
    }
    
    const style = document.createElement('style');
    style.textContent = `@keyframes confettiFall { to { top: 100%; transform: rotate(720deg); } }`;
    document.head.appendChild(style);
}

// ========================================
// UI Helpers
// ========================================
function updateRoundUI() {
    const multiplier = CONFIG.ROUND_MULTIPLIERS[gameState.currentRound - 1] || 1;
    DOM.roundNumber.textContent = `Рунд ${gameState.currentRound}`;
    DOM.multiplier.textContent = `x${multiplier}`;
    DOM.roundPoints.textContent = gameState.roundPoints;
}

function resetStrikes() {
    DOM.strikes.forEach(s => s.classList.remove('active'));
}

function resetAnswerBoard() {
    DOM.answerSlots.forEach((slot, i) => {
        const card = slot.querySelector('.answer-card');
        card.classList.remove('revealed');
        
        const text = slot.querySelector('.answer-text');
        const pts = slot.querySelector('.answer-points');
        
        if (gameState.answers[i]) {
            text.textContent = gameState.answers[i].text;
            pts.textContent = gameState.answers[i].points;
        }
    });
}

function handleSpicinessChange(e) {
    gameState.spiciness = parseInt(e.target.value);
    DOM.spicinessValue.textContent = `${gameState.spiciness}%`;
    
    const icon = document.querySelector('.spicy-icon');
    if (gameState.spiciness < 30) icon.textContent = '🌶️';
    else if (gameState.spiciness < 70) icon.textContent = '🌶️🌶️';
    else icon.textContent = '🌶️🌶️🌶️';
}

// ========================================
// Utility
// ========================================
function levenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

// ========================================
// Start
// ========================================
document.addEventListener('DOMContentLoaded', init);