// document.querySelector('.card__cta').addEventListener('click', function(event) {
//   event.preventDefault();  // Prevent the default behavior of the anchor tag

//   const formData = {
//     email_id: document.querySelector('input[name="customer-email"]').value.trim(),
//     password: document.querySelector('input[name="customer-pass"]').value.trim(),
//   };

//   const caMsg = document.getElementById('ca_msg');

//   // Validate that none of the fields are empty
//   for (const key in formData) {
//     if (!formData[key]) {
//       showError(`> ${key.replace('_', ' ')} is required.`, 'red');
//       return;  // Stop further execution if any field is empty
//     }
//   }

//   console.log(formData);
  
// // Send data to the server for sign-in
//   fetch('/login', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json'
//     },
//     body: JSON.stringify(formData)
//   }) 
//   .then(response => response.json())
//   .then(data => {
//     if (data.success) {
//       // Show success message
//       showError('> ' + data.success, 'green');
//       // You can redirect to a dashboard or home page here
//       window.location.href = '/dashboard';
//       // console.log('Signed in as:', data.username);
//       // window.location.href = data.redirect;
//     } else {
//       // Show error message from the server
//       showError('> ' + data.error, 'red');
//     }
//     console.log('Response:', data);
//   })
//   .catch(error => {
//     showError('> An error occurred while processing your request.', 'red');
//     console.error('Error:', error);
//   });
 
//   function showError(message, color = 'red') {
//     caMsg.textContent = message;
//     caMsg.style.color = color;
//     caMsg.style.display = 'block';  // Ensure the message element is visible
//   }
  
// });

// document.querySelector('.card__cta').addEventListener('click', function(event) {
//   event.preventDefault();  // Prevent default anchor behavior

//   const formData = {
//     email_id: document.querySelector('input[name="customer-email"]').value.trim(),
//     password: document.querySelector('input[name="customer-pass"]').value.trim(),
//   };

//   const caMsg = document.getElementById('ca_msg');

//   // Validate input fields
//   if (!formData.email_id || !formData.password) {
//     showError("> Email and password are required!", "red");
//     return;
//   }

//   console.log("Sending login request with data:", formData);

//   fetch('/login', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(formData)
//   })
//   .then(response => response.json())
//   .then(data => {
//     if (data.success) {
//       showError("> " + data.success, "green");
//       window.location.href = '/dashboard'; // Redirect
//     } else {
//       showError("> " + (data.message || "Invalid credentials!"), "red");
//     }
//     console.log("Response:", data);
//   })
//   .catch(error => {
//     showError("> An error occurred while processing your request.", "red");
//     console.error("Error:", error);
//   });

//   function showError(message, color = "red") {
//     if (caMsg) {
//       caMsg.textContent = message;
//       caMsg.style.color = color;
//       caMsg.style.display = "block";  
//     }
//   }
// });
  


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


// Function to show messages

const cardsContainer = document.querySelector(".cards");
const cardsContainerInner = document.querySelector(".cards__inner");
const cards = Array.from(document.querySelectorAll(".card"));
const overlay = document.querySelector(".overlay");

const applyOverlayMask = (e) => {
  const overlayEl = e.currentTarget;
  const x = e.pageX - cardsContainer.offsetLeft;
  const y = e.pageY - cardsContainer.offsetTop;

  overlayEl.style = `--opacity: 1; --x: ${x}px; --y:${y}px;`;
};

const createOverlayCta = (overlayCard, ctaEl) => {
  const overlayCta = document.createElement("div");
  overlayCta.classList.add("cta");
  overlayCta.textContent = ctaEl.textContent;
  overlayCta.setAttribute("aria-hidden", true);
  overlayCard.append(overlayCta);
};

const observer = new ResizeObserver((entries) => {
  entries.forEach((entry) => {
    const cardIndex = cards.indexOf(entry.target);
    let width = entry.borderBoxSize[0].inlineSize;
    let height = entry.borderBoxSize[0].blockSize;

    if (cardIndex >= 0) {
      overlay.children[cardIndex].style.width = `${width}px`;
      overlay.children[cardIndex].style.height = `${height}px`;
    }
  });
});

const initOverlayCard = (cardEl) => {
  const overlayCard = document.createElement("div");
  overlayCard.classList.add("card");
  createOverlayCta(overlayCard, cardEl.lastElementChild);
  overlay.append(overlayCard);
  observer.observe(cardEl);
};

cards.forEach(initOverlayCard);
document.body.addEventListener("pointermove", applyOverlayMask);

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
