document.querySelector('.card__cta').addEventListener('click', function(event) {
  event.preventDefault();  // Prevent default behavior

  const formData = {
    email_id: document.querySelector('input[name="customer-email"]').value.trim(),
    password: document.querySelector('input[name="customer-pass"]').value.trim(),
  };

  const caMsg = document.getElementById('ca_msg');

  // Validate input fields
  if (!formData.email_id || !formData.password) {
    showError("> Email and password are required!", "red");
    return;
  }

  console.log("Sending login request with data:", formData);

  fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  })
  .then(response => response.json())
  .then(data => {
    console.log("Response:", data);

    if (data.message === "Login successful") {
      showError("> Login successful! Redirecting...", "green");

      // Wait 1 second before redirecting to let the message be visible
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    } else {
      showError("> " + (data.message || "Invalid credentials!"), "red");
    }
  })
  .catch(error => {
    showError("> An error occurred while processing your request.", "red");
    console.error("Error:", error);
  });

  function showError(message, color = "red") {
    if (caMsg) {
      caMsg.textContent = message;
      caMsg.style.color = color;
      caMsg.style.display = "block";  
    }
  }
});

// Add form submit handler for Enter key
document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    document.querySelector('.card__cta').click();
});

// Add Enter key handler for password field
document.getElementById('account-login-password').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        document.querySelector('.card__cta').click();
    }
});

// Initialize overlay and card effects
const cardsContainer = document.querySelector(".cards");
const cards = Array.from(document.querySelectorAll(".card"));
const overlay = document.querySelector(".overlay");

// Create overlay card clone
const initOverlayCard = () => {
    const card = cards[0]; // Get the sign in card
    const overlayCard = document.createElement("div");
    overlayCard.classList.add("card");
    
    // Clone the CTA button
    const cta = card.querySelector(".cta");
    if (cta) {
        const overlayCta = document.createElement("div");
        overlayCta.classList.add("cta");
        overlayCta.textContent = cta.textContent;
        overlayCta.setAttribute("aria-hidden", true);
        overlayCard.append(overlayCta);
    }
    
    overlay.innerHTML = ''; // Clear existing content
    overlay.append(overlayCard);
};

// Handle mouse movement
const applyOverlayMask = (e) => {
    const rect = cards[0].getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    const isOverCard = (
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom
    );
    
    document.documentElement.style.setProperty('--x', `${x}px`);
    document.documentElement.style.setProperty('--y', `${y}px`);
    document.documentElement.style.setProperty('--card-left', `${rect.left}px`);
    document.documentElement.style.setProperty('--card-top', `${rect.top}px`);
    overlay.style.setProperty('--opacity', isOverCard ? '1' : '0');
};

// Initialize effects
initOverlayCard();
cards[0].addEventListener("pointermove", applyOverlayMask);
cards[0].addEventListener("mouseleave", () => {
    overlay.style.setProperty('--opacity', '0');
});

// Update overlay on window resize
window.addEventListener('resize', () => {
    const rect = cards[0].getBoundingClientRect();
    document.documentElement.style.setProperty('--card-left', `${rect.left}px`);
    document.documentElement.style.setProperty('--card-top', `${rect.top}px`);
});

const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');

// Initial canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


let particles = [];
let particleCount = calculateParticleCount();

class Particle {
    constructor() {
        this.reset();
        this.y = Math.random() * canvas.height;
        this.fadeDelay = Math.random() * 600 + 100;
        this.fadeStart = Date.now() + this.fadeDelay;
        this.fadingOut = false;
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.speed = Math.random() / 5 + 0.1;
        this.opacity = 1;
        this.fadeDelay = Math.random() * 600 + 100;
        this.fadeStart = Date.now() + this.fadeDelay;
        this.fadingOut = false;
    }

    update() {
        this.y -= this.speed;
        if (this.y < 0) {
            this.reset();
        }

        if (!this.fadingOut && Date.now() > this.fadeStart) {
            this.fadingOut = true;
        }
        
        if (this.fadingOut) {
            this.opacity -= 0.008;
            if (this.opacity <= 0) {
                this.reset();
            }
        }
    }

    draw() {
        ctx.fillStyle = `rgba(${255 - (Math.random() * 255/2)}, 255, 255, ${this.opacity})`;
        ctx.fillRect(this.x, this.y, 0.4, Math.random() * 2 + 1);
    }
}

function initParticles() {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(particle => {
        particle.update();
        particle.draw();
    });
    requestAnimationFrame(animate);
}

function calculateParticleCount() {
    return Math.floor((canvas.width * canvas.height) / 6000);
}

function onResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particleCount = calculateParticleCount();
    initParticles();
}

window.addEventListener('resize', onResize);

initParticles();
animate();
