getCount(0);
getIcon();

async function getIcon() {
    const images = document.querySelectorAll('.partner-card img');
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

async function getCount(count = 0) {
    const cards = document.querySelectorAll('.partner-card');
    cards.forEach(() => count++);
    document.getElementById('counts').textContent = count;
}

function filterPartners() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const partnerCards = document.querySelectorAll('.partner-card');
    partnerCards.forEach(card => {
        const title = card.querySelector('h3').innerText.toLowerCase();
        if (title.includes(searchInput)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}
