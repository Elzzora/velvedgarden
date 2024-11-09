getData();
getIcon();

document.querySelectorAll('nav ul li a').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

function openModal(staffId) {
    var modal = document.getElementById(staffId + '-modal');
    modal.classList.add('active');
    var modalContent = modal.querySelector('.modal-content');
    modalContent.classList.remove('closing');  // Remove closing animation class
}

function closeModal(staffId) {
    var modal = document.getElementById(staffId + '-modal');
    var modalContent = modal.querySelector('.modal-content');
    modalContent.classList.add('closing');  // Add closing animation class
    setTimeout(function() {
        modal.classList.remove('active');
    }, 300);
}

window.onclick = function(event) {
    var modals = document.querySelectorAll('.modal');
    modals.forEach(function(modal) {
        if (event.target == modal) {
            var modalContent = modal.querySelector('.modal-content');
            modalContent.classList.add('closing');
            setTimeout(function() {
                modal.classList.remove('active');
            }, 300);
        }
    });
}

async function getData() {
    try {
      const res = await fetch('/api/guilds');
      const rating = await fetch('/api/ratings');
      const dataRate = await rating.json();
      const data = await res.json();
      document.getElementById('members-count').textContent = data?.members || 'unknown';
      document.getElementById('channels-count').textContent = data?.channels || 'unknown';
      document.getElementById('actives-count').textContent = data?.actives || 'unknown';
      document.getElementById('events-count').textContent = dataRate?.averageRating || 'unknown';
    } catch (err) {
      document.getElementById('members-count').textContent = 'fetch failed';
      document.getElementById('channels-count').textContent = 'fetch failed';
      document.getElementById('actives-count').textContent = 'fetch failed';
      document.getElementById('events-count').textContent = 'fetch failed';
    }
}

async function getIcon() {
    const images = document.querySelectorAll('.staff-member img');
    for (const img of images) {
        const imageCheck = new Image();
        imageCheck.src = img.src;
        const checkImage = new Promise((resolve) => {
            imageCheck.onload = () => resolve(true);
            imageCheck.onerror = () => resolve(false);
        });
        if (!await checkImage) {
            img.src = `https://cdn.discordapp.com/embed/avatars/${Math.floor(Math.random() * 6)}.png`;
        }
    }
}
