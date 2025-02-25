document.querySelector('.card__cta').addEventListener('click', function(event) {
  event.preventDefault();  // Prevent the default behavior of the anchor tag

  const formData = {
    username: document.querySelector('input[name="username"]').value.trim(),
    first_name: document.querySelector('input[name="first_name"]').value.trim(),
    last_name: document.querySelector('input[name="last_name"]').value.trim(),
    email: document.querySelector('input[name="email"]').value.trim(),
    password: document.querySelector('input[name="password"]').value.trim(),
  };

  const caMsg = document.getElementById('ca_msg');

  // Validate that none of the fields are empty
  for (const key in formData) {
    if (!formData[key]) {
      showError(`> ${key.replace('_', ' ')} is required.`, 'red');
      return;  // Stop further execution if any field is empty
    }
  }

  console.log(formData);

  // Send data to the server if all fields are valid
  fetch('/create-account', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formData)
  }) 
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Show success message
      showError('> ' + data.success, 'green');
      window.location.href = data.redirect;
    } else {
      // Show error message from the server
      showError('> ' + data.error, 'red');
    }
    console.log('Success:', data);
  })
  .catch(error => {
    showError('> An error occurred while processing your request.', 'red');
    console.error('Error:', error);
  });

  // Function to show messages
  function showError(message, color = 'red') {
    caMsg.textContent = message;
    caMsg.style.color = color;
    caMsg.style.display = 'block';  // Ensure the message element is visible
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