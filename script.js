// Ensure we only declare these once
const menuToggle = document.getElementById('menuToggle');
const sideMenu = document.getElementById('sideMenu');
const menuOverlay = document.getElementById('menuOverlay');
const closeMenu = document.getElementById('closeMenu');
const sideNavLinks = document.querySelectorAll('.nav-list-side a'); // Renamed to avoid conflict

function toggleMenu() {
    sideMenu.classList.toggle('active');
    menuOverlay.classList.toggle('active');
}

if (menuToggle) {
    menuToggle.addEventListener('click', toggleMenu);
}
if (closeMenu) {
    closeMenu.addEventListener('click', toggleMenu);
}
if (menuOverlay) {
    menuOverlay.addEventListener('click', toggleMenu);
}

sideNavLinks.forEach(link => {
    link.addEventListener('click', toggleMenu);
});

// --- Your existing Form Validation Code below ---
const contactForm = document.getElementById('contactform');
const formMessage = document.getElementById('formMessage');
const submitBtn = document.getElementById('submitBtn');

if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value,
            reason: document.getElementById('reason').value,
            message: document.getElementById('message').value
        };

        if (!formData.name.trim() || !formData.reason.trim() || !formData.message.trim()) {
            formMessage.style.display = 'block';
            formMessage.innerText = "Please fill in all required fields.";
            formMessage.style.color = "red";
            return; 
        }

        formMessage.style.display = 'block';
        formMessage.innerText = "Thank you! Sending...";
        formMessage.style.color = "green";
        submitBtn.disabled = true;
        // Add your fetch call here
    });
}