document.querySelector('.card__cta').addEventListener('click', function(event) {
  event.preventDefault();  // Prevent the default behavior of the anchor tag
  
  const facultySwitch = document.getElementById('switch');
  let formData = {};
  
  if (facultySwitch.checked) {
    // When faculty toggle is o
    console.log('Faculty');
    formData = {
      email_id: document.getElementById('regEmail').value.trim(),
      password: document.getElementById('regPassword').value.trim(),
      name: document.getElementById('name').value.trim(),
      degree: document.getElementById('degree').value.trim(),
      department: document.getElementById('department').value.trim(),
      mobile_no: document.getElementById('mobile').value.trim(),
    };

    
  } else {
    console.log('Admin');
    formData = {
      email_id: document.getElementById('regEmail').value.trim(),
      password: document.getElementById('regPassword').value.trim(),
    };
  }
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
  fetch('/register', {
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

document.addEventListener('DOMContentLoaded', function() {
  const facultySwitch = document.getElementById('switch');
  const cardsInner = document.querySelector('.cards__inner');
  
  facultySwitch.addEventListener('change', function() {
    if (this.checked) {
      // When faculty toggle is on
      cardsInner.classList.add('faculty-active');
    } else {
      // When faculty toggle is off
      cardsInner.classList.remove('faculty-active');
    }
  });
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