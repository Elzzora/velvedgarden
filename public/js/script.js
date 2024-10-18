// Smooth scroll for navigation
document.querySelectorAll('nav ul li a').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Function to open modal
function openModal(staffId) {
    var modal = document.getElementById(staffId + '-modal');
    modal.classList.add('active');
    var modalContent = modal.querySelector('.modal-content');
    modalContent.classList.remove('closing');  // Remove closing animation class
}

// Function to close modal with animation
function closeModal(staffId) {
    var modal = document.getElementById(staffId + '-modal');
    var modalContent = modal.querySelector('.modal-content');
    
    modalContent.classList.add('closing');  // Add closing animation class
    
    // Delay hiding modal to allow animation to finish
    setTimeout(function() {
        modal.classList.remove('active');
    }, 300); // Match the duration of fadeOut animation (0.3s)
}

// Close the modal when the user clicks outside the modal content
window.onclick = function(event) {
    var modals = document.querySelectorAll('.modal');
    modals.forEach(function(modal) {
        if (event.target == modal) {
            var modalContent = modal.querySelector('.modal-content');
            modalContent.classList.add('closing');  // Add closing animation
            
            // Delay hiding modal to allow animation to finish
            setTimeout(function() {
                modal.classList.remove('active');
            }, 300);
        }
    });
}

async function getCount() {
    try {
      const res = await fetch('/guilds');
      const data = await res.json();
      document.getElementById('members-count').textContent = data?.members ?? 'fetch failed';
      document.getElementById('channels-count').textContent = data?.channels ?? 'fetch failed';
      document.getElementById('actives-count').textContent = data?.actives ?? 'fetch failed';
      document.getElementById('events-count').textContent = '0';
    } catch (error) {
      console.error('Error fetching server statistics:', error);
    }
}

getCount();
