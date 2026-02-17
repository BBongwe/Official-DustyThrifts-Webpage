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

document.getElementById("year").textContent = new Date().getFullYear();
// --- Your existing Form Validation Code below ---
const contactForm = document.getElementById('contactform');
const formMessage = document.getElementById('formMessage');
const submitBtn = document.getElementById('submitBtn');


if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value, // Added email
            reason: document.getElementById('reason').value,
            message: document.getElementById('message').value
        };

        // Basic validation
        if (!formData.name.trim() || !formData.reason.trim() || !formData.message.trim()) {
            formMessage.style.display = 'block';
            formMessage.innerText = "Please fill in all required fields.";
            formMessage.style.color = "red";
            return; 
        }

        // UI Feedback
        formMessage.style.display = 'block';
        formMessage.innerText = "Thank you! Sending...";
        formMessage.style.color = "green";
        submitBtn.disabled = true;

        try {
            const response = await fetch("https://bq2qjcazw9.execute-api.us-east-1.amazonaws.com/prod/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                formMessage.innerText = "Thank you for your message! We'll get back to you soon. 😊";
                contactForm.reset();
                contactForm.style.display = 'none'; // Optional: hide form on success
            } else {
                throw new Error("Server error");
            }
        } catch (error) {
            formMessage.innerText = "Oops! Something went wrong. Please try again later.";
            formMessage.style.color = "red";
            submitBtn.disabled = false;
        }
    });
}