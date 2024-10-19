const form = document.getElementById('recruitment-form');
const submitButton = form.querySelector('button');
getProfile();

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  submitButton.classList.add('loading');
  submitButton.disabled = true;

  const formData = new FormData(form);
  const data = {
    rating: formData.get('rating') || 'N/A',
    reason: formData.get('reason') || 'N/A',
    suggestion: formData.get('suggestion') || 'N/A' 
  };
  
  if (!data.rating) return showAlert('You must select rating you want to send!', 'error');
  
  try {
    const response = await fetch('/submit/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      showAlert('✅  Thank you for submitting your rating!', 'success');
    } else {
      showAlert('Failed to submit form! Try again later.', 'error');
    }
  } catch (error) {
    showAlert('500: Internal Server Error', 'error');
  } finally {
    submitButton.classList.remove('loading');
    submitButton.disabled = false;
  }
});

function showAlert(message, type = 'success') {
  document.getElementById('alertMessage').innerText = message;
  document.getElementById('customAlert').style.display = 'flex';
  document.getElementById('alertMessage').alertTypes = type ?? 'success';
}

function closeAlert() {
  const type = document.getElementById('alertMessage').alertTypes;
  document.getElementById('customAlert').style.display = 'none';
  submitButton.classList.remove('loading');
  submitButton.disabled = false;
  if (type === 'success') {
    return window.location.href = '/logout';
  } else {
    return document.getElementById('alertMessage').alertTypes = 'null';
  }
}

async function getProfile() {
  const res = await fetch('/api/profile');
  const data = await res.json();
  document.getElementById('profile-name').textContent = data.name ? `@${data.name}` : 'N/A';
  document.getElementById('profile-image').src = data.avatar ?? `https://cdn.discordapp.com/embed/avatars/0.png`;
}

document.querySelectorAll('.custom-select .selected').forEach(selected => {
  selected.addEventListener('click', function () {
    const optionsContainer = this.nextElementSibling;
    optionsContainer.style.display = optionsContainer.style.display === 'block' ? 'none' : 'block';
  });
});

document.querySelectorAll('.custom-select .option').forEach(option => {
  option.addEventListener('click', function () {
    const value = this.getAttribute('data-value');
    const selectedDiv = this.closest('.custom-select').querySelector('.selected');
    selectedDiv.textContent = this.textContent;
    selectedDiv.nextElementSibling.style.display = 'none';

    const input = this.closest('.custom-select').querySelector('input[type="hidden"]');
    input.value = value;
  });
});

document.addEventListener('click', function (event) {
  const isClickInside = event.target.closest('.custom-select');
  if (!isClickInside) {
    document.querySelectorAll('.options').forEach(options => {
      options.style.display = 'none';
    });
  }
});
