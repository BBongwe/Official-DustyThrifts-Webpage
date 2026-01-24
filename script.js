// script.js

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactform');
  const formMessage = document.getElementById('formMessage');
  const submitBtn = document.getElementById('submitBtn');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // 1. Show "Sending..." state
      formMessage.style.display = 'block';
      formMessage.innerText = "Sending...";
      formMessage.style.color = "#5c4033"; // Match your aesthetic
      submitBtn.disabled = true;

      // 2. Collect the data
      const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        reason: document.getElementById('reason').value,
        message: document.getElementById('message').value
      };

      try {
        // 3. Send to your verified AWS API Gateway
        const response = await fetch('https://bq2qjcazw9.execute-api.us-east-1.amazonaws.com/prod/contact', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          // 4. Success! Hide form and show success message
          form.reset();
          form.style.display = 'none';
          formMessage.innerText = "Thank you for your message! We'll get back to you soon. 😊";
          formMessage.style.color = "green";
        } else {
          throw new Error('Server responded with an error');
        }
      } catch (error) {
        // 5. Error handling
        formMessage.innerText = "Oops! There was a problem. Please try again or DM us on Instagram.";
        formMessage.style.color = "red";
        submitBtn.disabled = false;
        console.error("Submission Error:", error);
      }
    });
  }

  // Smooth scroll for nav links
  const navLinks = document.querySelectorAll('nav a[href^="#"]');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').slice(1);
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
});