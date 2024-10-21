getCount();
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

async function getCount() {
    try {
      const res = await fetch('/api/guilds');
      const rating = await fetch('/api/ratings');
      const dataRate = await rating.json();
      const data = await res.json();
      document.getElementById('members-count').textContent = data?.members || 'fetch failed';
      document.getElementById('channels-count').textContent = data?.channels || 'fetch failed';
      document.getElementById('actives-count').textContent = data?.actives || 'fetch failed';
      document.getElementById('events-count').textContent = data?.averageRating || 'fetch failed';
    } catch (err) {
      document.getElementById('members-count').textContent = 'fetch failed';
      document.getElementById('channels-count').textContent = 'fetch failed';
      document.getElementById('actives-count').textContent = 'fetch failed';
      document.getElementById('events-count').textContent = 'fetch failed';
    }
}
