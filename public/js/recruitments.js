const form = document.getElementById('recruitment-form');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitButton = form.querySelector('button');
  submitButton.classList.add('loading');
  submitButton.disabled = true;

  const formData = new FormData(form);
  if (!formData.get('position')) return showAlert('You must select a position to apply for!');
  if (!formData.get('reason')) return showAlert('You must include the reason why you want to apply!');
  if (!formData.get('experience')) return showAlert(`You must include your experience as a staff before applying here! If you don't have any, fill with "none"`);
  const data = {
    position: formData.get('position'),
    reason: formData.get('reason'),
    experience: formData.get('experience')
  };

  try {
    const response = await fetch('/submit/recruitments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      showAlert('Thank you for submitting your application! Make sure you are already joined to our Discord server!');
    } else {
      showAlert('Failed to submit form! Try again later.');
    }
  } catch (error) {
    showAlert('Failed to submit form! Try again later.');
  } finally {
    submitButton.classList.remove('loading');
    submitButton.disabled = false;
  }
});

function showAlert(message) {
  document.getElementById('alertMessage').innerText = message;
  document.getElementById('customAlert').style.display = 'flex';
}

function closeAlert() {
  document.getElementById('customAlert').style.display = 'none';
  window.location.href = '/logout';
}

async function getProfile() {
  const res = await fetch('/api/profile');
  const data = await res.json();
  document.getElementById('profile-name').textContent = data.name ? `@${data.name}` : 'N/A';
  document.getElementById('profile-image').src = data.avatar ?? `https://cdn.discordapp.com/embed/avatars/0.png`;
}

getProfile();

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
