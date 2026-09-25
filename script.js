document.addEventListener('DOMContentLoaded', () => {
  const CART_STORAGE_KEY = 'dustythriftsCart';
  const LAST_ORDER_STORAGE_KEY = 'dustythriftsLastOrder';
  
  // =========================================================
  // CONFIGURATION: REPLACE THESE 2 URLS WITH YOUR ACTUAL LINKS
  // =========================================================
  const API_GATEWAY_URL = 'arn:aws:lambda:us-east-1:140191458621:function:processDustyThriftsOrder'; 
  const PAYMENT_LINK = 'YOUR_YOCO_PAYMENT_LINK_HERE';

  let cart = loadCart();
  let toastTimer = null;
  let lastFocusedElement = null;

  const menuToggle = document.getElementById('menuToggle');
  const sideMenu = document.getElementById('sideMenu');
  const menuOverlay = document.getElementById('menuOverlay');
  const closeMenu = document.getElementById('closeMenu');
  const sideNavLinks = document.querySelectorAll('.nav-list-side a');

  const lightbox = document.getElementById('imageLightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxDetails = document.getElementById('lightboxDetails');

  const openCartBtn = document.getElementById('openCart');
  const closeCartBtn = document.getElementById('closeCart');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartCountEl = document.getElementById('cartCount');
  const cartDrawerCountEl = document.getElementById('cartDrawerCount');
  const cartItemsList = document.getElementById('cartItemsList');
  const cartSubtotalEl = document.getElementById('cartSubtotal');
  const cartShippingEl = document.getElementById('cartShipping');
  const cartTotalEl = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const shippingBanner = document.getElementById('shippingBanner');
  const checkoutMessage = document.getElementById('checkoutMessage');
  const orderPayloadInput = document.getElementById('orderPayload');

  const pepRadio = document.querySelector('input[value="pep"]');
  const aramexRadio = document.querySelector('input[value="aramex"]');
  const pepField = document.getElementById('pepField');
  const aramexField = document.getElementById('aramexField');
  const pepInput = document.getElementById('pepStore');
  const aramexInput = document.getElementById('homeAddress');

  let currentLightboxImages = [];
  let currentLightboxIndex = 0;
  let currentLightboxProduct = null;

  function formatPrice(amount) {
    return `R${Number(amount || 0).toFixed(0)}`;
  }

  function normaliseStatus(status) {
    return (status || 'available').trim().toLowerCase();
  }

  function displayStatus(status) {
    return normaliseStatus(status) === 'sold' ? 'Sold' : 'Available';
  }

  function isSold(status) {
    return normaliseStatus(status) === 'sold';
  }

  function getImageSrc(img) {
    return (img.getAttribute('src') || img.dataset.src || '').trim();
  }

  function getProductFromCard(card) {
    const firstImage = card.querySelector('.carousel-slides img[src]');

    return {
      id: card.dataset.id,
      title: card.dataset.title,
      price: Number.parseFloat(card.dataset.price || '0'),
      size: card.dataset.size || '',
      status: normaliseStatus(card.dataset.status),
      measurements: card.dataset.measurements || '',
      fabric: card.dataset.fabric || '',
      condition: card.dataset.condition || '',
      image: firstImage ? getImageSrc(firstImage) : ''
    };
  }

  function showToast(message) {
    const toast = document.getElementById('siteToast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('active');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove('active');
    }, 3200);
  }

  function loadCart() {
    try {
      const savedCart = window.localStorage.getItem(CART_STORAGE_KEY);
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      return [];
    }
  }

  function saveCart() {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }

  function updatePageLock() {
    const hasOpenLayer =
      sideMenu?.classList.contains('active') ||
      cartDrawer?.classList.contains('active') ||
      lightbox?.classList.contains('active');

    document.body.classList.toggle('no-scroll', Boolean(hasOpenLayer));
  }

  function rememberFocus() {
    lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }

  function restoreFocus() {
    if (lastFocusedElement && document.body.contains(lastFocusedElement)) {
      lastFocusedElement.focus();
    }
    lastFocusedElement = null;
  }

  function openMenu() {
    if (!sideMenu || !menuOverlay) return;
    rememberFocus();
    sideMenu.classList.add('active');
    menuOverlay.classList.add('active');
    sideMenu.setAttribute('aria-hidden', 'false');
    menuToggle?.setAttribute('aria-expanded', 'true');
    closeMenu?.focus();
    updatePageLock();
  }

  function closeSideMenu() {
    if (!sideMenu || !menuOverlay) return;
    sideMenu.classList.remove('active');
    menuOverlay.classList.remove('active');
    sideMenu.setAttribute('aria-hidden', 'true');
    menuToggle?.setAttribute('aria-expanded', 'false');
    updatePageLock();
    restoreFocus();
  }

  function openCart() {
    if (!cartDrawer || !cartOverlay) return;
    rememberFocus();
    cartDrawer.classList.add('active');
    cartOverlay.classList.add('active');
    cartDrawer.setAttribute('aria-hidden', 'false');
    cartDrawer.focus();
    updatePageLock();
  }

  function closeCart() {
    if (!cartDrawer || !cartOverlay) return;
    cartDrawer.classList.remove('active');
    cartOverlay.classList.remove('active');
    cartDrawer.setAttribute('aria-hidden', 'true');
    updatePageLock();
    restoreFocus();
  }

  function renderLightboxDetails() {
    if (!lightboxDetails || !currentLightboxProduct) return;

    const product = currentLightboxProduct;
    lightboxDetails.innerHTML = `
      <h4>${product.title}</h4>
      <p><strong>${formatPrice(product.price)}</strong> | Size: ${product.size} | ${displayStatus(product.status)}</p>
      <p><strong>Measurements:</strong> ${product.measurements || 'To be added'}</p>
      <p><strong>Fabric:</strong> ${product.fabric || 'To be added'}</p>
      <p><strong>Condition:</strong> ${product.condition || 'Vintage condition'}</p>
    `;
  }

  function showLightboxSlide(index) {
    if (!lightboxImg || currentLightboxImages.length === 0) return;
    currentLightboxIndex = (index + currentLightboxImages.length) % currentLightboxImages.length;
    lightboxImg.src = currentLightboxImages[currentLightboxIndex].src;
    lightboxImg.alt = currentLightboxImages[currentLightboxIndex].alt || `${currentLightboxProduct?.title || 'Product'} image`;

    const onlyOneImage = currentLightboxImages.length <= 1;
    lightboxPrev?.classList.toggle('is-hidden', onlyOneImage);
    lightboxNext?.classList.toggle('is-hidden', onlyOneImage);
  }

  function openLightbox(slides, index, product) {
    if (!lightbox || !lightboxImg) return;

    currentLightboxImages = slides
      .map(img => ({ src: getImageSrc(img), alt: img.alt }))
      .filter(img => img.src !== '');

    if (currentLightboxImages.length === 0) return;

    rememberFocus();
    currentLightboxProduct = product;
    showLightboxSlide(index);
    renderLightboxDetails();
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    lightboxClose?.focus();
    updatePageLock();
  }

  function closeLightbox() {
    if (!lightbox || !lightboxImg) return;
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxImg.src = '';
    currentLightboxImages = [];
    currentLightboxProduct = null;
    updatePageLock();
    restoreFocus();
  }

  function nextLightboxSlide() {
    if (currentLightboxImages.length === 0) return;
    showLightboxSlide(currentLightboxIndex + 1);
  }

  function prevLightboxSlide() {
    if (currentLightboxImages.length === 0) return;
    showLightboxSlide(currentLightboxIndex - 1);
  }

  function setFieldError(field, errorId, message) {
    const errorEl = document.getElementById(errorId);
    if (field) field.classList.toggle('input-error', Boolean(message));
    if (errorEl) errorEl.textContent = message || '';
  }

  function clearCheckoutErrors() {
    setFieldError(document.getElementById('custName'), 'custNameError', '');
    setFieldError(document.getElementById('custPhone'), 'custPhoneError', '');
    setFieldError(pepInput, 'pepStoreError', '');
    setFieldError(aramexInput, 'homeAddressError', '');
  }

  function setFeedback(el, message, type = 'success') {
    if (!el) return;
    el.textContent = message;
    el.className = `form-feedback active ${type}`;
  }

  function clearFeedback(el) {
    if (!el) return;
    el.textContent = '';
    el.className = 'form-feedback';
  }

  function getTotals() {
    const subtotal = cart.reduce((sum, item) => sum + Number(item.price || 0), 0);
    const isFreeShipping = subtotal >= 300;
    const shippingFee = cart.length === 0 ? 0 : isFreeShipping ? 0 : pepRadio?.checked ? 60 : 100;
    const total = cart.length > 0 ? subtotal + shippingFee : 0;

    return {
      subtotal,
      shippingFee,
      total,
      isFreeShipping
    };
  }

  function buildOrderPayload() {
    const totals = getTotals();
    const shippingMethod = pepRadio?.checked ? 'PEP Paxi' : 'Aramex Courier';
    const destination = pepRadio?.checked ? pepInput?.value.trim() : aramexInput?.value.trim();

    return {
      orderId: `DT-${Date.now()}`,
      paymentStatus: 'pending',
      currency: 'ZAR',
      customer: {
        name: document.getElementById('custName')?.value.trim() || '',
        phone: document.getElementById('custPhone')?.value.trim() || ''
      },
      shipping: {
        method: shippingMethod,
        destination: destination || '',
        fee: totals.shippingFee,
        freeShipping: totals.isFreeShipping
      },
      items: cart.map(item => ({
        id: item.id,
        title: item.title,
        price: item.price,
        size: item.size,
        status: item.status,
        measurements: item.measurements,
        fabric: item.fabric,
        condition: item.condition
      })),
      totals: {
        subtotal: totals.subtotal,
        shipping: totals.shippingFee,
        total: totals.total
      },
      createdAt: new Date().toISOString()
    };
  }

  function validateCheckoutForm() {
    clearCheckoutErrors();
    clearFeedback(checkoutMessage);

    const nameEl = document.getElementById('custName');
    const phoneEl = document.getElementById('custPhone');
    const name = nameEl?.value.trim() || '';
    const phone = phoneEl?.value.trim() || '';
    const phoneDigits = phone.replace(/\D/g, '');
    let isValid = true;

    if (cart.length === 0) {
      setFeedback(checkoutMessage, 'Your basket is empty.', 'error');
      return false;
    }

    if (!name) {
      setFieldError(nameEl, 'custNameError', 'Please enter your full name.');
      isValid = false;
    }

    if (!phone || phoneDigits.length < 9) {
      setFieldError(phoneEl, 'custPhoneError', 'Please enter a valid phone number.');
      isValid = false;
    }

    if (pepRadio?.checked && !pepInput?.value.trim()) {
      setFieldError(pepInput, 'pepStoreError', 'Please add your closest PEP store.');
      isValid = false;
    }

    if (aramexRadio?.checked && !aramexInput?.value.trim()) {
      setFieldError(aramexInput, 'homeAddressError', 'Please add your delivery address.');
      isValid = false;
    }

    return isValid;
  }

  function updateAddButtons() {
    document.querySelectorAll('.product-card').forEach(card => {
      const product = getProductFromCard(card);
      const button = card.querySelector('.btn-add-cart');
      const statusEl = card.querySelector('.product-status');
      const alreadyInCart = cart.some(cartItem => cartItem.id === product.id);
      const sold = isSold(product.status);

      if (statusEl) {
        statusEl.textContent = displayStatus(product.status);
        statusEl.classList.toggle('is-sold', sold);
      }

      if (!button) return;

      if (sold) {
        button.textContent = 'Sold';
        button.disabled = true;
        button.classList.add('is-added');
        button.setAttribute('aria-label', `${product.title} is sold`);
      } else if (alreadyInCart) {
        button.textContent = 'Added';
        button.disabled = true;
        button.classList.add('is-added');
        button.setAttribute('aria-label', `${product.title} is already in your basket`);
      } else {
        button.textContent = '+';
        button.disabled = false;
        button.classList.remove('is-added');
        button.setAttribute('aria-label', `Add ${product.title} to basket`);
      }
    });
  }

  function updateShippingFields() {
    if (pepRadio && aramexRadio && pepField && aramexField && pepInput && aramexInput) {
      if (pepRadio.checked) {
        pepField.classList.remove('hidden');
        aramexField.classList.add('hidden');
        pepInput.required = true;
        aramexInput.required = false;
      } else {
        pepField.classList.add('hidden');
        aramexField.classList.remove('hidden');
        pepInput.required = false;
        aramexInput.required = true;
      }
    }

    updateCartTotals();
  }

  function updateCartTotals() {
    const totals = getTotals();
    const pepPriceLabel = document.getElementById('pepPriceLabel');
    const aramexPriceLabel = document.getElementById('aramexPriceLabel');

    if (cart.length > 0) {
      if (totals.isFreeShipping) {
        if (shippingBanner) shippingBanner.innerHTML = "You've unlocked <strong>FREE Shipping!</strong>";
        if (pepPriceLabel) pepPriceLabel.textContent = 'FREE';
        if (aramexPriceLabel) aramexPriceLabel.textContent = 'FREE';
      } else {
        const diff = 300 - totals.subtotal;
        if (shippingBanner) shippingBanner.innerHTML = `Add <strong>${formatPrice(diff)}</strong> more for FREE Shipping!`;
        if (pepPriceLabel) pepPriceLabel.textContent = 'R60';
        if (aramexPriceLabel) aramexPriceLabel.textContent = 'R100';
      }
    } else {
      if (shippingBanner) shippingBanner.innerHTML = 'Add R300 or more for <strong>FREE Shipping!</strong>';
      if (pepPriceLabel) pepPriceLabel.textContent = 'R60';
      if (aramexPriceLabel) aramexPriceLabel.textContent = 'R100';
    }

    if (cartSubtotalEl) cartSubtotalEl.textContent = formatPrice(totals.subtotal);
    if (cartShippingEl) cartShippingEl.textContent = totals.shippingFee === 0 && totals.subtotal >= 300 && cart.length > 0 ? 'FREE' : formatPrice(totals.shippingFee);
    if (cartTotalEl) cartTotalEl.textContent = formatPrice(totals.total);
    if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;
  }

  function updateCartUI() {
    if (cartCountEl) cartCountEl.textContent = cart.length;
    if (cartDrawerCountEl) cartDrawerCountEl.textContent = cart.length;

    if (cartItemsList) {
      cartItemsList.innerHTML = '';

      if (cart.length === 0) {
        const emptyEl = document.createElement('p');
        emptyEl.className = 'cart-empty';
        emptyEl.textContent = 'Your basket is empty.';
        cartItemsList.appendChild(emptyEl);
      } else {
        cart.forEach(item => {
          const itemEl = document.createElement('div');
          itemEl.classList.add('cart-item');
          itemEl.innerHTML = `
            <div class="cart-item-info">
              <h5>${item.title}</h5>
              <p>Size: ${item.size} | ${formatPrice(item.price)}</p>
            </div>
            <button type="button" class="cart-item-remove" data-id="${item.id}" aria-label="Remove ${item.title} from basket">Remove</button>
          `;
          cartItemsList.appendChild(itemEl);
        });
      }
    }

    saveCart();
    updateCartTotals();
    updateAddButtons();
  }

  function addToCart(card) {
    const item = getProductFromCard(card);

    if (isSold(item.status)) {
      showToast(`${item.title} is marked as sold.`);
      return;
    }

    if (cart.some(cartItem => cartItem.id === item.id)) {
      showToast(`${item.title} is already in your basket.`);
      return;
    }

    cart.push(item);
    updateCartUI();
    showToast(`${item.title} added to your basket.`);
    openCart();
  }

  function initialiseProductCards() {
    document.querySelectorAll('.product-card').forEach(card => {
      const button = card.querySelector('.btn-add-cart');

      if (button) {
        button.addEventListener('click', (event) => {
          event.stopPropagation();
          addToCart(card);
        });
      }
    });
  }

  function initialiseCarousels() {
    document.querySelectorAll('[data-carousel]').forEach(carousel => {
      const allSlideImages = Array.from(carousel.querySelectorAll('.carousel-slides img'));
      const slides = allSlideImages.filter(img => getImageSrc(img) !== '');
      const card = carousel.closest('.product-card');
      const product = card ? getProductFromCard(card) : null;
      const prevBtn = carousel.querySelector('.carousel-btn.prev');
      const nextBtn = carousel.querySelector('.carousel-btn.next');
      const dotsContainer = carousel.querySelector('.carousel-dots');
      const slidesContainer = carousel.querySelector('.carousel-slides');
      let currentIndex = 0;

      allSlideImages.forEach(img => {
        const isEmpty = getImageSrc(img) === '';
        img.classList.toggle('is-empty', isEmpty);
        if (isEmpty) img.setAttribute('aria-hidden', 'true');
      });

      if (slides.length === 0) return;

      if (dotsContainer) {
        dotsContainer.innerHTML = '';
        slides.forEach((_, idx) => {
          const dot = document.createElement('div');
          dot.classList.add('dot');
          if (idx === 0) dot.classList.add('active');
          dotsContainer.appendChild(dot);
        });
      }

      const dots = dotsContainer ? dotsContainer.querySelectorAll('.dot') : [];
      const hasFutureImageSlots = allSlideImages.length > 1;
      nextBtn?.classList.toggle('is-hidden', !hasFutureImageSlots);
      prevBtn?.classList.toggle('is-hidden', true);

      function showSlide(index) {
        currentIndex = (index + slides.length) % slides.length;
        allSlideImages.forEach(img => img.classList.remove('active'));
        slides[currentIndex].classList.add('active');
        dots.forEach((dot, i) => dot.classList.toggle('active', i === currentIndex));
      }

      function nextSlide() {
        showSlide(currentIndex + 1);
      }

      function prevSlide() {
        showSlide(currentIndex - 1);
      }

      nextBtn?.addEventListener('click', (event) => {
        event.stopPropagation();
        nextSlide();
      });

      prevBtn?.addEventListener('click', (event) => {
        event.stopPropagation();
        prevSlide();
      });

      if (slidesContainer) {
        slidesContainer.addEventListener('click', () => {
          openLightbox(slides, currentIndex, product);
        });

        let touchStartX = 0;
        let touchEndX = 0;

        slidesContainer.addEventListener('touchstart', (event) => {
          touchStartX = event.changedTouches[0].screenX;
        }, { passive: true });

        slidesContainer.addEventListener('touchend', (event) => {
          touchEndX = event.changedTouches[0].screenX;
          const swipeThreshold = 40;
          if (touchEndX < touchStartX - swipeThreshold) {
            nextSlide();
          } else if (touchEndX > touchStartX + swipeThreshold) {
            prevSlide();
          }
        }, { passive: true });
      }

      showSlide(0);
    });
  }

  menuToggle?.addEventListener('click', openMenu);
  closeMenu?.addEventListener('click', closeSideMenu);
  menuOverlay?.addEventListener('click', closeSideMenu);
  sideNavLinks.forEach(link => link.addEventListener('click', closeSideMenu));

  openCartBtn?.addEventListener('click', openCart);
  closeCartBtn?.addEventListener('click', closeCart);
  cartOverlay?.addEventListener('click', closeCart);

  cartItemsList?.addEventListener('click', (event) => {
    const removeButton = event.target.closest('.cart-item-remove');
    if (!removeButton) return;

    const id = removeButton.dataset.id;
    const removedItem = cart.find(item => item.id === id);
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
    if (removedItem) showToast(`${removedItem.title} removed from your basket.`);
  });

  pepRadio?.addEventListener('change', updateShippingFields);
  aramexRadio?.addEventListener('change', updateShippingFields);

  lightbox?.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  lightboxClose?.addEventListener('click', closeLightbox);
  lightboxNext?.addEventListener('click', (event) => {
    event.stopPropagation();
    nextLightboxSlide();
  });
  lightboxPrev?.addEventListener('click', (event) => {
    event.stopPropagation();
    prevLightboxSlide();
  });

  if (lightbox) {
    let lbTouchStartX = 0;
    let lbTouchEndX = 0;

    lightbox.addEventListener('touchstart', (event) => {
      lbTouchStartX = event.changedTouches[0].screenX;
    }, { passive: true });

    lightbox.addEventListener('touchend', (event) => {
      lbTouchEndX = event.changedTouches[0].screenX;
      const swipeThreshold = 40;
      if (lbTouchEndX < lbTouchStartX - swipeThreshold) {
        nextLightboxSlide();
      } else if (lbTouchEndX > lbTouchStartX + swipeThreshold) {
        prevLightboxSlide();
      }
    }, { passive: true });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeLightbox();
      closeCart();
      closeSideMenu();
    }

    if (lightbox?.classList.contains('active')) {
      if (event.key === 'ArrowRight') nextLightboxSlide();
      if (event.key === 'ArrowLeft') prevLightboxSlide();
    }
  });

  // =========================================================
  // UPDATED CHECKOUT FORM SUBMISSION WITH AWS & YOCO
  // =========================================================
  const checkoutForm = document.getElementById('checkoutForm');
  checkoutForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!validateCheckoutForm()) return;

    const orderPayload = buildOrderPayload();
    if (orderPayloadInput) orderPayloadInput.value = JSON.stringify(orderPayload);
    window.localStorage.setItem(LAST_ORDER_STORAGE_KEY, JSON.stringify(orderPayload));

    const originalBtnText = checkoutBtn ? checkoutBtn.textContent : 'Checkout';
    if (checkoutBtn) {
      checkoutBtn.disabled = true;
      checkoutBtn.textContent = 'Processing...';
    }
    
    setFeedback(checkoutMessage, 'Saving your order securely...', 'success');

    try {
      // Step 1: Save order to DynamoDB via AWS API Gateway
      if (API_GATEWAY_URL && API_GATEWAY_URL !== 'YOUR_API_GATEWAY_URL_HERE') {
        const response = await fetch(API_GATEWAY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload)
        });

        if (!response.ok) throw new Error('Failed to save order to AWS database.');
      }

      // Step 2: Clear the basket since the order is confirmed
      cart = [];
      updateCartUI();

      // Step 3: Redirect to Yoco for payment
      if (PAYMENT_LINK && PAYMENT_LINK !== 'YOUR_YOCO_PAYMENT_LINK_HERE' && PAYMENT_LINK !== '') {
        setFeedback(checkoutMessage, 'Redirecting to secure payment...', 'success');
        window.location.href = PAYMENT_LINK;
      } else {
        setFeedback(checkoutMessage, 'Order saved! Connect your Yoco payment link to take live payments.', 'success');
        showToast('Order saved successfully.');
        console.log('DustyThrifts order payload:', orderPayload);
      }

    } catch (error) {
      console.error(error);
      setFeedback(checkoutMessage, 'There was an error saving your order. Please try again.', 'error');
      showToast('Error saving order.');
    } finally {
      if (checkoutBtn) {
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = originalBtnText;
      }
    }
  });

  const contactForm = document.getElementById('contactform');
  const formMessage = document.getElementById('formMessage');
  const submitBtn = document.getElementById('submitBtn');

  contactForm?.addEventListener('submit', async function(event) {
    event.preventDefault();

    const nameEl = document.getElementById('name');
    const emailEl = document.getElementById('email');
    const reasonEl = document.getElementById('reason');
    const messageEl = document.getElementById('message');
    let isValid = true;

    setFieldError(nameEl, 'nameError', '');
    setFieldError(emailEl, 'emailError', '');
    setFieldError(reasonEl, 'reasonError', '');
    setFieldError(messageEl, 'messageError', '');
    clearFeedback(formMessage);

    if (!nameEl?.value.trim()) {
      setFieldError(nameEl, 'nameError', 'Please enter your name.');
      isValid = false;
    }

    if (emailEl?.value.trim() && !emailEl.checkValidity()) {
      setFieldError(emailEl, 'emailError', 'Please enter a valid email address.');
      isValid = false;
    }

    if (!reasonEl?.value) {
      setFieldError(reasonEl, 'reasonError', 'Please select a subject.');
      isValid = false;
    }

    if (!messageEl?.value.trim()) {
      setFieldError(messageEl, 'messageError', 'Please enter your message.');
      isValid = false;
    }

    if (!isValid) return;

    const formData = {
      name: nameEl.value.trim(),
      email: emailEl.value.trim(),
      reason: reasonEl.value,
      message: messageEl.value.trim()
    };

    setFeedback(formMessage, 'Sending message...', 'success');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const response = await fetch('https://bq2qjcazw9.execute-api.us-east-1.amazonaws.com/prod/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed');

      setFeedback(formMessage, 'Thank you! We will get back to you shortly.', 'success');
      contactForm.reset();
    } catch (error) {
      setFeedback(formMessage, 'Error sending message. Please try again.', 'error');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  initialiseProductCards();
  initialiseCarousels();
  updateShippingFields();
  updateCartUI();
});
