// ===== Particle Animation =====
function createParticles() {
    const particlesContainer = document.getElementById('particles');

    // Add floating particles dynamically
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
      position: absolute;
      width: ${Math.random() * 4 + 1}px;
      height: ${Math.random() * 4 + 1}px;
      background: rgba(255, 255, 255, ${Math.random() * 0.5 + 0.2});
      border-radius: 50%;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      animation: float ${Math.random() * 10 + 10}s linear infinite;
      animation-delay: ${Math.random() * 5}s;
    `;
        particlesContainer.appendChild(particle);
    }
}

// ===== Smooth Scroll for Links =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ===== Game Card Hover Effects =====
function initGameCards() {
    const gameCards = document.querySelectorAll('.game-card:not(.game-card-disabled)');

    gameCards.forEach(card => {
        // Add ripple effect on click
        card.addEventListener('click', function (e) {
            const ripple = document.createElement('div');
            ripple.className = 'ripple';

            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
      `;

            this.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);
        });

        // Add tilt effect on mouse move
        card.addEventListener('mousemove', function (e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;

            this.style.transform = `translateY(-8px) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        card.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0) perspective(1000px) rotateX(0) rotateY(0)';
        });
    });
}

// ===== Add Ripple Animation CSS =====
const style = document.createElement('style');
style.textContent = `
  @keyframes ripple {
    to {
      transform: scale(2);
      opacity: 0;
    }
  }
  
  @keyframes float {
    0%, 100% {
      transform: translateY(0) translateX(0);
    }
    25% {
      transform: translateY(-20px) translateX(10px);
    }
    50% {
      transform: translateY(-10px) translateX(-10px);
    }
    75% {
      transform: translateY(-30px) translateX(5px);
    }
  }
  
  .game-card {
    position: relative;
    overflow: hidden;
  }
`;
document.head.appendChild(style);

// ===== Initialize on DOM Load =====
document.addEventListener('DOMContentLoaded', () => {
    createParticles();
    initGameCards();

    // Add entrance animation to elements
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all game cards
    document.querySelectorAll('.game-card').forEach(card => {
        observer.observe(card);
    });
});

// ===== Console Easter Egg =====
console.log('%c🎮 Fortune Games', 'font-size: 24px; font-weight: bold; color: #667eea;');
console.log('%cBienvenue dans Fortune Games! 🎉', 'font-size: 14px; color: #764ba2;');
console.log('%cDéveloppé avec ❤️ par Will99919', 'font-size: 12px; color: #888;');
