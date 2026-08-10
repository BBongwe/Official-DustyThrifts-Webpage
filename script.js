document.addEventListener('DOMContentLoaded', () => {
  // Navigation Menu Logic
  const menuToggle = document.getElementById('menuToggle');
  const sideMenu = document.getElementById('sideMenu');
  const menuOverlay = document.getElementById('menuOverlay');
  const closeMenu = document.getElementById('closeMenu');
  const sideNavLinks = document.querySelectorAll('.nav-list-side a');

  function toggleMenu(e) {
    if(e) e.preventDefault(); // Prevents default click behavior
    sideMenu.classList.toggle('active');
    menuOverlay.classList.toggle('active');
  }

  // Bind events securely for mobile
  if (menuToggle) menuToggle.addEventListener('click', toggleMenu);
  if (closeMenu) closeMenu.addEventListener('click', toggleMenu);
  if (menuOverlay) menuOverlay.addEventListener('click', toggleMenu);

  sideNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      sideMenu.classList.remove('active');
      menuOverlay.classList.remove('active');
    });
  });

  // Dynamic Footer Year
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // AWS API Gateway Contact Form Logic
  const contactForm = document.getElementById('contactform');
  const formMessage = document.getElementById('formMessage');
  const submitBtn = document.getElementById('submitBtn');

  if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        reason: document.getElementById('reason').value,
        message: document.getElementById('message').value
      };

      if (!formData.name.trim() || !formData.reason.trim() || !formData.message.trim()) {
        formMessage.style.display = 'block';
        formMessage.textContent = "Please fill in all required fields.";
        formMessage.style.color = '#842029';
        return; 
      }

      formMessage.style.display = 'block';
      formMessage.textContent = "Transmitting message...";
      formMessage.style.color = 'inherit';
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";

      try {
        const response = await fetch("https://bq2qjcazw9.execute-api.us-east-1.amazonaws.com/prod/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          formMessage.textContent = "Thank you for reaching out. We will be in touch shortly.";
          formMessage.style.color = '#0f5132';
          contactForm.reset();
        } else {
          throw new Error("Server communication failed.");
        }
      } catch (error) {
        formMessage.textContent = "Our apologies, there was an error sending your message. Please try again.";
        formMessage.style.color = '#842029';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Send Message";
      }
    });
  }
});
