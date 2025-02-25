
document.addEventListener('DOMContentLoaded', function() {
  // const form = document.getElementById('otpForm');
  const otpInput = document.getElementById('otp');
  const caMsg = document.getElementById('ca_msg');
  const resendOtp = document.getElementById('resendOtp');
  const emailInput = document.getElementById('email');

  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get('email');
  if (email) {
      emailInput.value = email;
  }

  document.getElementById('submit-otp').addEventListener('click', function(e) {
    e.preventDefault();
    const otp = otpInput.value.trim();
    const email = emailInput.value;

    if (otp === '') {
        showError('> Please enter a valid OTP');
    } else if (!/^\d{4}$/.test(otp)) {
        showError('> OTP must be a 4-digit number');
    } else {
        fetch('/verify-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, otp })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showError('> ' + data.success, 'green');
                // Redirect to a success page or login page
                window.location.href = '/sign.html';
            } else {
                showError('> ' + data.error, 'red');
            }
        })
        .catch(error => {
            showError('> An error occurred while verifying OTP.', 'red');
            console.error('Error:', error);
        });
    }
});

  otpInput.addEventListener('input', function() {
      this.value = this.value.replace(/[^0-9]/g, '').slice(0, 4);
  });

  resendOtp.addEventListener('click', function(e) {
    e.preventDefault();
    const email = emailInput.value;

    fetch('/resend-otp', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showError('> ' + data.success, 'green');
        } else {
            showError('> ' + data.error, 'red');
        }
    })
    .catch(error => {
        showError('> An error occurred while resending OTP.', 'red');
        console.error('Error:', error);
    });
});

  function showError(message, color = 'red') {
      caMsg.textContent = message;
      caMsg.style.color = color;
      caMsg.style.display = 'block';
  }
});

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
