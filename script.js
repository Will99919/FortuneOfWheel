// ============================================
// Fortune Wheel Game - Main Application
// ============================================

class FortuneWheel {
  constructor() {
    // Canvas setup
    this.canvas = document.getElementById('wheelCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.centerX = this.canvas.width / 2;
    this.centerY = this.canvas.height / 2;
    this.radius = 230;

    // Game state
    this.segments = this.loadSegments();
    this.players = this.loadPlayers();
    this.history = this.loadHistory();
    this.currentAngle = 0;
    this.isSpinning = false;
    this.spinVelocity = 0;
    this.spinVelocity = 0;
    this.lastSector = -1;

    // Settings
    this.settings = this.loadSettings();

    // Audio
    this.tickSound = this.createTickSound();
    this.winSound = this.createWinSound();

    // Initialize
    this.init();
  }

  // ============================================
  // Initialization
  // ============================================

  init() {
    this.setupEventListeners();
    this.applySettings();

    // Initial render
    this.renderWheel();
    this.renderPlayers();
    this.renderSegmentsList();
    this.renderHistory();
    this.createParticles();
    this.applySettings();

    // Force re-render after a short delay to ensure everything is initialized
    setTimeout(() => {
      this.renderWheel();
      this.renderPlayers();
      this.renderSegmentsList();
    }, 100);
  }

  setupEventListeners() {
    // Spin button
    document.getElementById('spinButton').addEventListener('click', () => this.spin());

    // Settings modal
    document.getElementById('btnSettings').addEventListener('click', () => this.openModal('settingsModal'));
    document.getElementById('closeSettings').addEventListener('click', () => this.closeModal('settingsModal'));
    document.getElementById('settingsOverlay').addEventListener('click', () => this.closeModal('settingsModal'));

    // Add player modal
    document.getElementById('btnAddPlayer').addEventListener('click', () => this.openAddPlayerModal());
    document.getElementById('closeAddPlayer').addEventListener('click', () => this.closeModal('addPlayerModal'));
    document.getElementById('addPlayerOverlay').addEventListener('click', () => this.closeModal('addPlayerModal'));
    document.getElementById('cancelAddPlayer').addEventListener('click', () => this.closeModal('addPlayerModal'));
    document.getElementById('confirmAddPlayer').addEventListener('click', () => this.addPlayer());
    document.getElementById('playerNameInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addPlayer();
    });

    // Result modal
    document.getElementById('closeResult').addEventListener('click', () => this.closeModal('resultModal'));
    document.getElementById('resultOverlay').addEventListener('click', () => this.closeModal('resultModal'));

    // Game mode selection
    document.querySelectorAll('input[name="gameMode"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.settings.gameMode = e.target.value;
        this.saveSettings();
      });
    });

    document.getElementById('spinSpeed').addEventListener('change', (e) => {
      this.settings.spinSpeed = parseInt(e.target.value);
      this.saveSettings();
    });

    document.getElementById('soundEnabled').addEventListener('change', (e) => {
      this.settings.soundEnabled = e.target.checked;
      this.saveSettings();
    });

    // Segment controls
    document.getElementById('btnAddSegment').addEventListener('click', () => this.addSegment());

    // Color presets
    document.querySelectorAll('.color-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const preset = e.currentTarget.dataset.preset;
        this.applyColorPreset(preset);
      });
    });

    // Reset button
    document.getElementById('btnResetAll').addEventListener('click', () => this.resetAll());

    // Player removal delegation
    document.getElementById('playersList').addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-remove')) {
        const playerId = parseInt(e.target.dataset.playerId);
        if (playerId) {
          this.removePlayer(playerId);
        }
      }
    });

    // Clear history button
    document.getElementById('btnClearHistory').addEventListener('click', () => this.clearHistory());
  }

  // ============================================
  // Wheel Rendering
  // ============================================

  renderWheel() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.segments.length === 0) {
      this.drawEmptyWheel();
      return;
    }

    const anglePerSegment = (2 * Math.PI) / this.segments.length;

    // Draw segments
    this.segments.forEach((segment, i) => {
      const startAngle = i * anglePerSegment + this.currentAngle;
      const endAngle = (i + 1) * anglePerSegment + this.currentAngle;

      // Segment
      this.ctx.fillStyle = segment.color;
      this.ctx.beginPath();
      this.ctx.moveTo(this.centerX, this.centerY);
      this.ctx.arc(this.centerX, this.centerY, this.radius, startAngle, endAngle);
      this.ctx.closePath();
      this.ctx.fill();

      // Border
      this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();

      // Text
      this.ctx.save();
      this.ctx.translate(this.centerX, this.centerY);
      this.ctx.rotate(startAngle + anglePerSegment / 2);
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 18px Poppins, Arial';
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      this.ctx.shadowBlur = 4;

      const text = segment.text.length > 12 ? segment.text.substring(0, 12) + '...' : segment.text;
      this.ctx.fillText(text, this.radius * 0.65, 6);
      this.ctx.restore();
    });

    // Center circle
    const gradient = this.ctx.createRadialGradient(this.centerX, this.centerY, 0, this.centerX, this.centerY, 50);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#e0e0e0');

    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, 50, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 4;
    this.ctx.stroke();

    // Play tick sound if spinning
    if (this.isSpinning && this.settings.soundEnabled) {
      const currentSector = this.getCurrentSector();
      if (currentSector !== this.lastSector) {
        this.playTickSound();
        this.lastSector = currentSector;
      }
    }
  }

  drawEmptyWheel() {
    // Draw a simple circle with message
    this.ctx.fillStyle = '#334155';
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, this.radius, 0, 2 * Math.PI);
    this.ctx.fill();

    this.ctx.fillStyle = '#94a3b8';
    this.ctx.font = 'bold 20px Poppins, Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Ajoutez des segments', this.centerX, this.centerY - 10);
    this.ctx.fillText('dans les paramètres', this.centerX, this.centerY + 20);
  }

  getCurrentSector() {
    const anglePerSegment = (2 * Math.PI) / this.segments.length;
    const normalizedAngle = ((-this.currentAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    return Math.floor(normalizedAngle / anglePerSegment) % this.segments.length;
  }

  getWinningSegment() {
    if (this.segments.length === 0) return null;

    // Pointer is at 0 degrees (right side)
    const pointerAngle = 0;
    let relativeAngle = (pointerAngle - this.currentAngle) % (2 * Math.PI);
    if (relativeAngle < 0) relativeAngle += 2 * Math.PI;

    const anglePerSegment = (2 * Math.PI) / this.segments.length;
    const index = Math.floor(relativeAngle / anglePerSegment);

    return this.segments[index];
  }

  // ============================================
  // Spin Animation
  // ============================================

  spin() {
    if (this.isSpinning || this.segments.length === 0) return;

    // Check if we have players
    if (this.players.length === 0) {
      return;
    }

    this.isSpinning = true;
    this.lastSector = -1;

    // Disable button
    const spinButton = document.getElementById('spinButton');
    spinButton.disabled = true;
    spinButton.querySelector('.center-button-text').textContent = '...';

    // Calculate spin velocity based on speed setting
    const baseVelocity = 15;
    const speedMultipliers = { 1: 0.5, 2: 1.0, 3: 1.8 };
    const speedMultiplier = speedMultipliers[this.settings.spinSpeed] || 1.0;
    this.spinVelocity = (baseVelocity + Math.random() * 15) * speedMultiplier;

    // Add extra rotations for excitement
    const extraRotations = 5 + Math.random() * 3;
    this.spinVelocity += extraRotations;

    this.animate();
  }

  animate() {
    this.spinVelocity *= 0.98; // Deceleration
    this.currentAngle += this.spinVelocity * 0.04;

    this.renderWheel();

    if (this.spinVelocity > 0.1) {
      requestAnimationFrame(() => this.animate());
    } else {
      this.isSpinning = false;
      this.onSpinComplete();
    }
  }

  onSpinComplete() {
    const winner = this.getWinningSegment();

    // Re-enable button
    const spinButton = document.getElementById('spinButton');
    spinButton.disabled = false;
    spinButton.querySelector('.center-button-text').textContent = 'LANCER';

    // Update result display
    document.getElementById('resultValue').textContent = winner.text;

    // Get current player (rotate through players)
    const currentPlayerIndex = this.getCurrentPlayerIndex();
    const currentPlayer = this.players[currentPlayerIndex];

    // Update player stats
    currentPlayer.wins.push(winner.text);
    currentPlayer.totalWins++;
    this.savePlayer(currentPlayer);
    this.renderPlayers();

    // Add to history
    this.addToHistory(currentPlayer.name, winner.text);

    // Play win sound
    if (this.settings.soundEnabled) {
      this.playWinSound();
    }

    // Show result modal
    this.showResultModal(currentPlayer, winner);

    // Handle game mode
    this.handleGameMode(winner);
  }

  getCurrentPlayerIndex() {
    // Simple rotation: use total spins to determine current player
    const totalSpins = this.players.reduce((sum, p) => sum + p.totalWins, 0);
    return totalSpins % this.players.length;
  }

  handleGameMode(winner) {
    if (this.settings.gameMode === 'elimination') {
      // Remove the winning segment
      this.segments = this.segments.filter(s => s.text !== winner.text);
      this.saveSegments();
      this.renderSegmentsList();
    }
  }

  showResultModal(player, segment) {
    document.getElementById('modalWinner').textContent = player.name;
    document.getElementById('modalPrize').textContent = segment.text;

    this.openModal('resultModal');
    this.createConfetti();
  }

  // ============================================
  // Players Management
  // ============================================

  openAddPlayerModal() {
    document.getElementById('playerNameInput').value = '';
    this.openModal('addPlayerModal');
    setTimeout(() => {
      document.getElementById('playerNameInput').focus();
    }, 100);
  }

  addPlayer() {
    const input = document.getElementById('playerNameInput');
    const name = input.value.trim();

    if (!name) {
      return;
    }

    if (this.players.some(p => p.name === name)) {
      return;
    }

    const player = {
      id: Date.now(),
      name: name,
      wins: [],
      totalWins: 0,
      score: 0
    };

    this.players.push(player);
    this.savePlayer(player);
    this.renderPlayers();
    this.closeModal('addPlayerModal');
  }

  removePlayer(playerId) {
    this.players = this.players.filter(p => p.id !== playerId);
    localStorage.setItem('fortuneWheel_players', JSON.stringify(this.players));
    this.renderPlayers();
  }

  renderPlayers() {
    const container = document.getElementById('playersList');

    if (this.players.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>Aucun joueur ajouté</p>
          <p class="empty-state-hint">Cliquez sur "+ Ajouter" pour commencer</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.players.map(player => `
      <div class="player-card">
        <div class="player-info">
          <div class="player-name">${this.escapeHtml(player.name)}</div>
          <div class="player-stats">
            ${this.settings.gameMode === 'points'
        ? `<span class="player-score">🏆 ${player.score || 0} pts</span>`
        : `${player.wins.length} gains`}
            ${player.wins.length > 0 ? ' • Dernier: ' + this.escapeHtml(player.wins[player.wins.length - 1]) : ''}
          </div>
        </div>
        <button class="btn-remove" data-player-id="${player.id}" title="Supprimer">×</button>
      </div>
    `).join('');
  }

  // ============================================
  // History Management
  // ============================================

  addToHistory(playerName, prize) {
    const historyItem = {
      id: Date.now(),
      player: playerName,
      prize: prize,
      timestamp: new Date().toISOString()
    };

    this.history.unshift(historyItem); // Add to beginning

    // Keep only last 50 items
    if (this.history.length > 50) {
      this.history = this.history.slice(0, 50);
    }

    this.saveHistory();
    this.renderHistory();
  }

  renderHistory() {
    const container = document.getElementById('historyList');

    if (this.history.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>Aucun tour joué</p>
          <p class="empty-state-hint">L'historique apparaîtra ici</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.history.map(item => `
      <div class="history-item">
        <div class="history-header">
          <span class="history-player">${this.escapeHtml(item.player)}</span>
          <span class="history-time">${this.formatTime(item.timestamp)}</span>
        </div>
        <div class="history-prize">${this.escapeHtml(item.prize)}</div>
      </div>
    `).join('');
  }

  clearHistory() {
    this.history = [];
    this.saveHistory();
    this.renderHistory();
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  // ============================================
  // Segments Management
  // ============================================

  renderSegmentsList() {
    const segmentsList = document.getElementById('segmentsList');
    segmentsList.innerHTML = this.segments.map((segment, index) => `
      <div class="segment-item">
        <input type="color" class="segment-color" value="${segment.color}" data-index="${index}" title="Couleur">
        <input type="text" class="segment-text" value="${segment.text}" data-index="${index}" placeholder="Texte">

        <button class="btn-remove-segment" onclick="game.removeSegment(${index})" title="Supprimer">×</button>
      </div>
    `).join('');

    // Add event listeners for inputs
    segmentsList.querySelectorAll('.segment-color').forEach(input => {
      input.addEventListener('change', (e) => this.updateSegmentColor(e.target.dataset.index, e.target.value));
    });

    segmentsList.querySelectorAll('.segment-text').forEach(input => {
      input.addEventListener('change', (e) => this.updateSegmentText(e.target.dataset.index, e.target.value));
    });
  }

  openPointsModal(index) {
    this.currentSegmentIndex = index;
    const points = this.segments[index].points || 100;
    document.getElementById('pointsInput').value = points;
    this.openModal('pointsModal');
    setTimeout(() => {
      document.getElementById('pointsInput').focus();
      document.getElementById('pointsInput').select();
    }, 100);
  }

  saveSegmentPoints() {
    if (this.currentSegmentIndex === null) return;

    const points = parseInt(document.getElementById('pointsInput').value) || 0;
    this.updateSegmentPoints(this.currentSegmentIndex, points);
    this.closeModal('pointsModal');
    this.renderSegmentsList();
    this.currentSegmentIndex = null;
  }

  addSegment() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    this.segments.push({
      text: `Segment ${this.segments.length + 1}`,
      color: randomColor
    });

    this.saveSegments();
    this.renderSegmentsList();
    this.renderWheel();
  }

  removeSegment(index) {
    if (this.segments.length <= 2) {
      return;
    }

    this.segments.splice(index, 1);
    this.saveSegments();
    this.renderSegmentsList();
    this.renderWheel();
  }

  updateSegmentColor(index, color) {
    this.segments[index].color = color;
    this.saveSegments();
    this.renderWheel();

    this.segments[index].text = text;
    this.saveSegments();

    // Also update history if needed? No, keep history as is
    this.renderWheel();
  }

  updateSegmentPoints(index, points) {
    this.segments[index].points = parseInt(points) || 0;
    this.saveSegments();
  }

  applyColorPreset(preset) {
    const presets = {
      vibrant: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'],
      pastel: ['#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#FFD9BA', '#E0BBE4', '#FFDFD3', '#C7CEEA'],
      neon: ['#FF006E', '#8338EC', '#3A86FF', '#FFBE0B', '#FB5607', '#06FFA5', '#7209B7', '#F72585'],
      ocean: ['#06FFA5', '#00D9FF', '#0096FF', '#7B68EE', '#4169E1', '#1E90FF', '#00CED1', '#20B2AA']
    };

    const colors = presets[preset];
    this.segments.forEach((segment, i) => {
      segment.color = colors[i % colors.length];
    });

    this.saveSegments();
    this.renderSegmentsList();
    this.renderWheel();
  }

  // ============================================
  // Settings
  // ============================================

  applySettings() {
    const gameModeRadio = document.querySelector(`input[name = "gameMode"][value = "${this.settings.gameMode}"]`);
    if (gameModeRadio) gameModeRadio.checked = true;

    document.getElementById('spinSpeed').value = this.settings.spinSpeed;
    document.getElementById('soundEnabled').checked = this.settings.soundEnabled;
  }

  resetAll() {
    localStorage.clear();
    location.reload();
  }

  // ============================================
  // Modal Management
  // ============================================

  openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
  }

  closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
  }

  // ============================================
  // Visual Effects
  // ============================================

  createParticles() {
    const container = document.getElementById('particles');
    const particleCount = 30;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 20 + 's';
      particle.style.animationDuration = (15 + Math.random() * 10) + 's';
      container.appendChild(particle);
    }
  }

  createConfetti() {
    const container = document.getElementById('confetti');
    container.innerHTML = '';

    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#F7DC6F', '#BB8FCE'];
    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti-piece';
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.top = -10 + 'px';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = Math.random() * 0.5 + 's';
      confetti.style.animationDuration = (2 + Math.random()) + 's';
      container.appendChild(confetti);
    }
  }

  // ============================================
  // Audio
  // ============================================

  createTickSound() {
    // Create a simple tick sound using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    return audioContext;
  }

  playTickSound() {
    try {
      const audioContext = this.tickSound;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'square';

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.05);
    } catch (e) {
      // Silently fail if audio doesn't work
    }
  }

  createWinSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    return audioContext;
  }

  playWinSound() {
    try {
      const audioContext = this.winSound;
      const notes = [523.25, 659.25, 783.99]; // C, E, G

      notes.forEach((freq, i) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = freq;
        oscillator.type = 'sine';

        const startTime = audioContext.currentTime + (i * 0.15);
        gainNode.gain.setValueAtTime(0.2, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.3);
      });
    } catch (e) {
      // Silently fail if audio doesn't work
    }
  }

  // ============================================
  // Local Storage
  // ============================================

  loadSegments() {
    const saved = localStorage.getItem('fortuneWheel_segments');
    if (saved) {
      return JSON.parse(saved);
    }

    return [
      { text: 'Prix 1', color: '#FF6B6B' },
      { text: 'Prix 2', color: '#4ECDC4' },
      { text: 'Prix 3', color: '#FFE66D' },
      { text: 'Bonus', color: '#1A535C' },
      { text: 'Replay', color: '#F7FFF7' },
      { text: 'Jackpot', color: '#FF9F1C' }
    ];
  }

  saveSegments() {
    localStorage.setItem('fortuneWheel_segments', JSON.stringify(this.segments));
  }

  loadPlayers() {
    const saved = localStorage.getItem('fortuneWheel_players');
    return saved ? JSON.parse(saved) : [];
  }

  savePlayer(player) {
    const index = this.players.findIndex(p => p.id === player.id);
    if (index !== -1) {
      this.players[index] = player;
    }
    localStorage.setItem('fortuneWheel_players', JSON.stringify(this.players));
  }

  loadSettings() {
    const saved = localStorage.getItem('fortuneWheel_settings');
    if (saved) {
      return JSON.parse(saved);
    }

    return {
      gameMode: 'classic',
      spinSpeed: 2,
      soundEnabled: true
    };
  }

  saveSettings() {
    localStorage.setItem('fortuneWheel_settings', JSON.stringify(this.settings));
  }

  loadHistory() {
    const saved = localStorage.getItem('fortuneWheel_history');
    return saved ? JSON.parse(saved) : [];
  }

  saveHistory() {
    localStorage.setItem('fortuneWheel_history', JSON.stringify(this.history));
  }

  // ============================================
  // Utilities
  // ============================================

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// ============================================
// Initialize Game
// ============================================

// Start the game
document.addEventListener('DOMContentLoaded', () => {
  window.game = new FortuneWheel();
});