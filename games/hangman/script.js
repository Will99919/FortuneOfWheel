// ===== Game State =====
const gameState = {
    phrase: '',
    category: '',
    maxErrors: 6,
    currentErrors: 0,
    errorsEnabled: true,
    usedLetters: new Set(),
    revealedLetters: new Set(),
    players: [],
    currentPlayerIndex: 0,
    history: [],
    soundEnabled: true,
    gameActive: false,
    gridData: [] // 14x4 grid data
};

// ===== DOM Elements =====
const elements = {
    // Modals
    settingsModal: document.getElementById('settingsModal'),
    addPlayerModal: document.getElementById('addPlayerModal'),
    winModal: document.getElementById('winModal'),
    loseModal: document.getElementById('loseModal'),

    // Buttons
    btnSettings: document.getElementById('btnSettings'),
    btnAddPlayer: document.getElementById('btnAddPlayer'),
    btnNewGame: document.getElementById('btnNewGame'),
    btnRevealLetter: document.getElementById('btnRevealLetter'),
    btnRevealAll: document.getElementById('btnRevealAll'),
    btnApplySettings: document.getElementById('btnApplySettings'),
    btnClearHistory: document.getElementById('btnClearHistory'),
    btnSubmitLetter: document.getElementById('btnSubmitLetter'),

    // Displays
    phraseGrid: document.getElementById('phraseGrid'),
    errorsCount: document.getElementById('errorsCount'),
    currentPlayer: document.getElementById('currentPlayer'),
    currentPlayerContainer: document.getElementById('currentPlayerContainer'),
    playersList: document.getElementById('playersList'),
    historyList: document.getElementById('historyList'),
    categoryDisplay: document.getElementById('categoryDisplay'),
    categoryContainer: document.getElementById('categoryContainer'),

    // Inputs
    phraseInput: document.getElementById('phraseInput'),
    categoryInput: document.getElementById('categoryInput'),
    maxErrors: document.getElementById('maxErrors'),
    maxErrorsValue: document.getElementById('maxErrorsValue'),
    errorsEnabled: document.getElementById('errorsEnabled'),
    soundEnabled: document.getElementById('soundEnabled'),
    playerNameInput: document.getElementById('playerNameInput'),
    letterInput: document.getElementById('letterInput'),
    errorsContainer: document.querySelector('.status-item:has(#errorsCount)')
};

// ===== Initialize =====
function init() {
    loadFromLocalStorage();
    setupEventListeners();
    createGrid();
    renderPlayers();
    renderHistory();
    updateDisplay();

    // Show settings modal on first load
    if (!gameState.phrase) {
        openModal(elements.settingsModal);
    }
}

// ===== Event Listeners =====
function setupEventListeners() {
    // Modal controls
    elements.btnSettings.addEventListener('click', () => openModal(elements.settingsModal));
    elements.btnAddPlayer.addEventListener('click', () => openModal(elements.addPlayerModal));

    document.getElementById('closeSettings').addEventListener('click', () => closeModal(elements.settingsModal));
    document.getElementById('closeAddPlayer').addEventListener('click', () => closeModal(elements.addPlayerModal));
    document.getElementById('closeWin').addEventListener('click', () => {
        closeModal(elements.winModal);
        resetGame();
    });
    document.getElementById('closeLose').addEventListener('click', () => {
        closeModal(elements.loseModal);
        resetGame();
    });

    // Overlay clicks
    document.getElementById('settingsOverlay').addEventListener('click', () => closeModal(elements.settingsModal));
    document.getElementById('addPlayerOverlay').addEventListener('click', () => closeModal(elements.addPlayerModal));
    document.getElementById('winOverlay').addEventListener('click', () => closeModal(elements.winModal));
    document.getElementById('loseOverlay').addEventListener('click', () => closeModal(elements.loseModal));

    // Game controls
    elements.btnApplySettings.addEventListener('click', applySettings);
    elements.btnNewGame.addEventListener('click', resetGame);
    elements.btnRevealLetter.addEventListener('click', revealRandomLetter);
    elements.btnRevealAll.addEventListener('click', revealAllLetters);
    elements.btnClearHistory.addEventListener('click', clearHistory);
    elements.btnSubmitLetter.addEventListener('click', submitLetter);

    // Player input
    document.getElementById('confirmAddPlayer').addEventListener('click', addPlayer);
    elements.playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addPlayer();
    });

    // Settings input
    elements.phraseInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') applySettings();
    });

    // Letter input
    elements.letterInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') submitLetter();
    });

    elements.letterInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
    });

    // Max errors slider
    elements.maxErrors.addEventListener('input', (e) => {
        elements.maxErrorsValue.textContent = `${e.target.value} erreurs`;
    });
}

// ===== Modal Functions =====
function openModal(modal) {
    if (modal === elements.settingsModal) {
        elements.phraseInput.value = gameState.phrase;
        elements.categoryInput.value = gameState.category;
        elements.maxErrors.value = gameState.maxErrors;
        elements.maxErrorsValue.textContent = `${gameState.maxErrors} erreurs`;
        elements.errorsEnabled.checked = gameState.errorsEnabled;
        elements.soundEnabled.checked = gameState.soundEnabled;
    }
    modal.classList.add('active');
}

function closeModal(modal) {
    modal.classList.remove('active');
}

// ===== Grid Creation =====
function createGrid() {
    elements.phraseGrid.innerHTML = '';
    gameState.gridData = [];

    // Create 14x4 grid (56 cells)
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 14; col++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell empty';
            cell.dataset.row = row;
            cell.dataset.col = col;
            elements.phraseGrid.appendChild(cell);
            gameState.gridData.push({ row, col, letter: '', revealed: false });
        }
    }
}

// ===== Game Logic =====
function applySettings() {
    const phrase = elements.phraseInput.value.trim();

    if (!phrase) {
        alert('Veuillez entrer une phrase ou un mot !');
        return;
    }

    gameState.phrase = phrase
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .replace(/[^A-Z\s]/g, " ")
        .trim();
    gameState.category = elements.categoryInput.value.trim();
    gameState.maxErrors = parseInt(elements.maxErrors.value);
    gameState.errorsEnabled = elements.errorsEnabled.checked;
    gameState.soundEnabled = elements.soundEnabled.checked;

    saveToLocalStorage();
    closeModal(elements.settingsModal);
    resetGame();
}

function resetGame() {
    gameState.currentErrors = 0;
    gameState.usedLetters.clear();
    gameState.revealedLetters.clear();
    gameState.gameActive = true;

    // Clear letter input
    elements.letterInput.value = '';
    elements.letterInput.focus();

    updateDisplay();
    saveToLocalStorage();
}

function submitLetter() {
    const letter = elements.letterInput.value.trim().toUpperCase();

    if (!letter || letter.length !== 1) {
        return;
    }

    guessLetter(letter);
    elements.letterInput.value = '';
    elements.letterInput.focus();
}

function guessLetter(letter) {
    if (!gameState.gameActive || gameState.usedLetters.has(letter)) {
        return;
    }

    gameState.usedLetters.add(letter);

    // Check if letter is in phrase
    if (gameState.phrase.includes(letter)) {
        // Correct guess
        for (let i = 0; i < gameState.phrase.length; i++) {
            if (gameState.phrase[i] === letter) {
                gameState.revealedLetters.add(i);
            }
        }

        if (gameState.soundEnabled) playSound('correct');

        // Check for win
        if (checkWin()) {
            setTimeout(() => handleWin(), 500);
        }
    } else {
        // Incorrect guess
        if (gameState.errorsEnabled) {
            gameState.currentErrors++;
        }

        if (gameState.soundEnabled) playSound('incorrect');

        // Check for loss
        if (gameState.errorsEnabled && gameState.currentErrors >= gameState.maxErrors) {
            setTimeout(() => handleLoss(), 500);
        } else {
            nextPlayer();
        }
    }

    updateDisplay();
    saveToLocalStorage();
}

function revealRandomLetter() {
    if (!gameState.gameActive) return;

    // Get unrevealed letters
    const unrevealedIndices = [];
    for (let i = 0; i < gameState.phrase.length; i++) {
        if (gameState.phrase[i] !== ' ' && !gameState.revealedLetters.has(i)) {
            unrevealedIndices.push(i);
        }
    }

    if (unrevealedIndices.length === 0) return;

    // Pick random unrevealed letter
    const randomIndex = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
    const letter = gameState.phrase[randomIndex];

    // Reveal all instances of this letter
    for (let i = 0; i < gameState.phrase.length; i++) {
        if (gameState.phrase[i] === letter) {
            gameState.revealedLetters.add(i);
        }
    }

    // Mark letter as used
    gameState.usedLetters.add(letter);

    updateDisplay();

    if (checkWin()) {
        setTimeout(() => handleWin(), 500);
    }
}

function revealAllLetters() {
    if (!gameState.gameActive) return;

    // Reveal all letters in the phrase
    for (let i = 0; i < gameState.phrase.length; i++) {
        if (gameState.phrase[i] !== ' ') {
            gameState.revealedLetters.add(i);
            gameState.usedLetters.add(gameState.phrase[i]);
        }
    }

    updateDisplay();

    // Trigger win after revealing all
    if (checkWin()) {
        setTimeout(() => handleWin(), 500);
    }
}

function checkWin() {
    for (let i = 0; i < gameState.phrase.length; i++) {
        if (gameState.phrase[i] !== ' ' && !gameState.revealedLetters.has(i)) {
            return false;
        }
    }
    return true;
}

function handleWin() {
    gameState.gameActive = false;

    // Update current player stats
    if (gameState.players.length > 0) {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        currentPlayer.wins++;
        currentPlayer.gamesPlayed++;
    }

    // Add to history
    addToHistory(true);

    // Show win modal
    document.getElementById('winPhrase').textContent = gameState.phrase;
    openModal(elements.winModal);

    if (gameState.soundEnabled) playSound('win');
    createConfetti();

    renderPlayers();
    saveToLocalStorage();
}

function handleLoss() {
    gameState.gameActive = false;

    // Update current player stats
    if (gameState.players.length > 0) {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        currentPlayer.gamesPlayed++;
    }

    // Add to history
    addToHistory(false);

    // Show lose modal
    document.getElementById('losePhrase').textContent = gameState.phrase;
    openModal(elements.loseModal);

    if (gameState.soundEnabled) playSound('lose');

    renderPlayers();
    saveToLocalStorage();
}

// ===== Display Functions =====
function updateDisplay() {
    // Update grid with phrase
    const cells = elements.phraseGrid.querySelectorAll('.grid-cell');
    const gridWidth = 14;
    const gridHeight = 4;

    // First, set all cells to purple background (empty state)
    cells.forEach((cell) => {
        cell.className = 'grid-cell purple-bg';
        cell.textContent = '';
    });

    if (!gameState.phrase) return;

    // Split phrase into words and distribute across rows
    const words = gameState.phrase.split(' ');
    const rows = [];
    let currentRow = [];
    let currentLength = 0;

    // Distribute words into rows (max 14 chars per row)
    for (const word of words) {
        const wordLength = word.length;
        const spaceNeeded = currentRow.length > 0 ? 1 : 0; // Space before word (except first)

        if (currentLength + spaceNeeded + wordLength <= gridWidth) {
            // Word fits in current row
            currentRow.push(word);
            currentLength += spaceNeeded + wordLength;
        } else {
            // Start new row
            if (currentRow.length > 0) {
                rows.push(currentRow);
            }
            currentRow = [word];
            currentLength = wordLength;
        }
    }

    // Add last row
    if (currentRow.length > 0) {
        rows.push(currentRow);
    }

    // Calculate starting row to center vertically
    const startRow = Math.floor((gridHeight - rows.length) / 2);

    // Place each row centered horizontally
    let phraseCharIndex = 0;
    rows.forEach((rowWords, rowIndex) => {
        const rowText = rowWords.join(' ');
        const rowLength = rowText.length;
        const startCol = Math.floor((gridWidth - rowLength) / 2);
        const cellStartIndex = (startRow + rowIndex) * gridWidth + startCol;

        // Place characters in this row
        for (let i = 0; i < rowText.length; i++) {
            const cellIndex = cellStartIndex + i;
            if (cellIndex >= 0 && cellIndex < cells.length) {
                const cell = cells[cellIndex];
                const char = rowText[i];

                if (char === ' ') {
                    // Space - transparent
                    cell.className = 'grid-cell space';
                } else {
                    // Letter - white background
                    cell.className = 'grid-cell letter';

                    if (gameState.revealedLetters.has(phraseCharIndex)) {
                        cell.classList.add('revealed');
                        cell.textContent = char;
                    } else {
                        cell.textContent = '';
                    }
                }
            }
            phraseCharIndex++;
        }

        // Account for space between words in original phrase
        if (rowIndex < rows.length - 1) {
            phraseCharIndex++; // Skip the space character in original phrase
        }
    });

    // Update category
    if (gameState.category) {
        elements.categoryDisplay.textContent = gameState.category;
        elements.categoryContainer.style.display = 'flex';
    } else {
        elements.categoryContainer.style.display = 'none';
    }

    // Update errors count
    if (gameState.errorsEnabled) {
        elements.errorsCount.textContent = `${gameState.currentErrors} / ${gameState.maxErrors}`;
        elements.errorsContainer.style.display = 'flex';
    } else {
        elements.errorsContainer.style.display = 'none';
    }

    // Update current player
    if (gameState.players.length > 0) {
        elements.currentPlayer.textContent = gameState.players[gameState.currentPlayerIndex].name;
        elements.currentPlayerContainer.classList.add('active-player');
    } else {
        elements.currentPlayer.textContent = '-';
        elements.currentPlayerContainer.classList.remove('active-player');
    }
}

// ===== Player Management =====
function addPlayer() {
    const name = elements.playerNameInput.value.trim();

    if (!name) {
        alert('Veuillez entrer un nom !');
        return;
    }

    gameState.players.push({
        id: Date.now(),
        name: name,
        wins: 0,
        gamesPlayed: 0
    });

    elements.playerNameInput.value = '';
    closeModal(elements.addPlayerModal);
    renderPlayers();
    updateDisplay();
    saveToLocalStorage();
}

function removePlayer(id) {
    const index = gameState.players.findIndex(p => p.id === id);
    if (index !== -1) {
        gameState.players.splice(index, 1);
        if (gameState.currentPlayerIndex >= gameState.players.length) {
            gameState.currentPlayerIndex = 0;
        }
        renderPlayers();
        updateDisplay();
        saveToLocalStorage();
    }
}

function nextPlayer() {
    if (gameState.players.length > 0) {
        gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
        updateDisplay();
    }
}

function renderPlayers() {
    if (gameState.players.length === 0) {
        elements.playersList.innerHTML = `
      <div class="empty-state">
        <p>Aucun joueur ajouté</p>
        <p class="empty-state-hint">Cliquez sur "+ Ajouter"</p>
      </div>
    `;
        return;
    }

    elements.playersList.innerHTML = gameState.players.map((player, index) => `
    <div class="player-card ${index === gameState.currentPlayerIndex ? 'active' : ''}">
      <div class="player-info">
        <div class="player-name">${player.name}</div>
        <div class="player-stats">${player.wins} victoires / ${player.gamesPlayed} parties</div>
      </div>
      <button class="btn-remove" onclick="removePlayer(${player.id})" aria-label="Retirer">×</button>
    </div>
  `).join('');
}

// ===== History =====
function addToHistory(won) {
    const entry = {
        phrase: gameState.phrase,
        won: won,
        errors: gameState.currentErrors,
        timestamp: new Date().toLocaleString('fr-FR')
    };

    gameState.history.unshift(entry);

    // Keep only last 20 entries
    if (gameState.history.length > 20) {
        gameState.history = gameState.history.slice(0, 20);
    }

    renderHistory();
    saveToLocalStorage();
}

function clearHistory() {
    gameState.history = [];
    renderHistory();
    saveToLocalStorage();
}

function renderHistory() {
    if (gameState.history.length === 0) {
        elements.historyList.innerHTML = `
      <div class="empty-state">
        <p>Aucune partie jouée</p>
        <p class="empty-state-hint">L'historique apparaîtra ici</p>
      </div>
    `;
        return;
    }

    elements.historyList.innerHTML = gameState.history.map(entry => `
    <div class="history-item ${entry.won ? 'win' : 'lose'}">
      <div class="history-result">${entry.won ? '✅ Victoire' : '❌ Défaite'}</div>
      <div class="history-phrase">"${entry.phrase}"</div>
      <div class="history-time">${entry.timestamp} • ${entry.errors} erreurs</div>
    </div>
  `).join('');
}

// ===== Sound Effects =====
function playSound(type) {
    // Create simple beep sounds using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch (type) {
        case 'correct':
            oscillator.frequency.value = 800;
            gainNode.gain.value = 0.1;
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
        case 'incorrect':
            oscillator.frequency.value = 200;
            gainNode.gain.value = 0.1;
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.2);
            break;
        case 'win':
            oscillator.frequency.value = 1000;
            gainNode.gain.value = 0.1;
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
            break;
        case 'lose':
            oscillator.frequency.value = 150;
            gainNode.gain.value = 0.1;
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.5);
            break;
    }
}

// ===== Confetti Effect =====
function createConfetti() {
    const confettiContainer = document.getElementById('confetti');
    confettiContainer.innerHTML = '';

    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];

    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
      position: absolute;
      width: 10px;
      height: 10px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      left: ${Math.random() * 100}%;
      top: -10px;
      opacity: ${Math.random() * 0.5 + 0.5};
      transform: rotate(${Math.random() * 360}deg);
      animation: confettiFall ${Math.random() * 3 + 2}s linear forwards;
    `;
        confettiContainer.appendChild(confetti);
    }

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
    @keyframes confettiFall {
      to {
        transform: translateY(110vh) rotate(${Math.random() * 720}deg);
        opacity: 0;
      }
    }
  `;
    document.head.appendChild(style);
}

// ===== Local Storage =====
function saveToLocalStorage() {
    localStorage.setItem('wordGameState', JSON.stringify({
        phrase: gameState.phrase,
        category: gameState.category,
        maxErrors: gameState.maxErrors,
        errorsEnabled: gameState.errorsEnabled,
        soundEnabled: gameState.soundEnabled,
        players: gameState.players,
        history: gameState.history
    }));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('wordGameState');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            gameState.phrase = data.phrase || '';
            gameState.category = data.category || '';
            gameState.maxErrors = data.maxErrors || 6;
            gameState.errorsEnabled = data.errorsEnabled !== false;
            gameState.soundEnabled = data.soundEnabled !== false;
            gameState.players = data.players || [];
            gameState.history = data.history || [];

            // Update form inputs
            elements.phraseInput.value = gameState.phrase;
            elements.categoryInput.value = gameState.category;
            elements.maxErrors.value = gameState.maxErrors;
            elements.maxErrorsValue.textContent = `${gameState.maxErrors} erreurs`;
            elements.errorsEnabled.checked = gameState.errorsEnabled;
            elements.soundEnabled.checked = gameState.soundEnabled;
        } catch (e) {
            console.error('Error loading from localStorage:', e);
        }
    }
}

// ===== Initialize on Load =====
document.addEventListener('DOMContentLoaded', init);

// ===== Console Easter Egg =====
console.log('%c🎯 Devinez la Phrase', 'font-size: 24px; font-weight: bold; color: #667eea;');
console.log('%cComme à la Roue de la Fortune ! 🎉', 'font-size: 14px; color: #764ba2;');
