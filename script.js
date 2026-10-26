document.addEventListener('DOMContentLoaded', async () => {
  // =========================================================================
  // NOTE 1: CONFIGURATION & KEYS (LOOK HERE TO UPDATE ENDPOINTS OR PUBLIC KEYS)
  // =========================================================================
  // Start fresh after correcting previously ambiguous catalogue IDs.
  const CART_STORAGE_KEY = 'dustythriftsCart-v2';
  const CATALOGUE_URL = 'catalogue.json';

  // AWS API Gateway endpoint for processing & saving order details
  const API_GATEWAY_URL = 'https://3gccheg515.execute-api.us-east-1.amazonaws.com/processDustyThriftsOrder'; 
  
  // Yoco Live Public Key (Matches your Yoco Dashboard)
  //const YOCO_PUBLIC_KEY = 'pk_live_549ca2fb668zKwD30c24';

  // =========================================================================
  // STATE MANAGEMENT & DOM ELEMENTS
  // =========================================================================
  let cart = loadCart();
  let toastTimer = null;
  let lastFocusedElement = null;

  // Navigation Menu Elements
  const menuToggle = document.getElementById('menuToggle');
  const sideMenu = document.getElementById('sideMenu');
  const menuOverlay = document.getElementById('menuOverlay');
  const closeMenu = document.getElementById('closeMenu');
  const sideNavLinks = document.querySelectorAll('.nav-list-side a');

  // Lightbox Viewer Elements
  const lightbox = document.getElementById('imageLightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxDetails = document.getElementById('lightboxDetails');

  // Cart Drawer & Checkout Elements
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
  const productsGrid = document.getElementById('productsGrid');
  const legalModal = document.getElementById('legalModal');
  const legalModalTitle = document.getElementById('legalModalTitle');
  const legalModalBody = document.getElementById('legalModalBody');
  const legalModalClose = document.getElementById('legalModalClose');
  const legalModalTriggers = document.querySelectorAll('[data-legal-modal]');

  // Shipping Selection Inputs
  const pepRadio = document.querySelector('input[value="pep"]');
  const aramexRadio = document.querySelector('input[value="aramex"]');
  const pepField = document.getElementById('pepField');
  const aramexField = document.getElementById('aramexField');
  const pepInput = document.getElementById('pepStore');
  const aramexInput = document.getElementById('homeAddress');

  let currentLightboxImages = [];
  let currentLightboxIndex = 0;
  let currentLightboxProduct = null;
  let catalogueProducts = [];
  let availabilityReady = false;
  let availabilityRequest = null;
  let checkoutInFlight = false;
  const legalModalContent = {
    about: {
      title: 'About DustyThrifts',
      templateId: 'aboutModalContent'
    },
    privacy: {
      title: 'Privacy Policy',
      items: [
        'Order details: we collect your Full Name, Email Address, Phone/WhatsApp Number, and delivery details (PEP Paxi store or Aramex address) to process and fulfil your order.',
        'Enquiries: the contact form collects the name, email address if supplied, subject and message you submit so we can respond. Please do not send card details or other sensitive financial information.',
        'We use these details for order communication, delivery, refunds, support and business records, not unrelated purposes.',
        'Your email address is used for order confirmations and order-related updates, not marketing.',
        'We do not sell or trade your data. AWS provides hosting, order storage and email services; Yoco processes payments; and your chosen courier receives the recipient details needed for delivery. These providers process information for their respective services.',
        'Order storage and email services currently use AWS infrastructure in the United States. Information may therefore be processed outside South Africa.',
        'Bank card details are entered on Yoco checkout, not collected or stored by DustyThrifts.',
        'We retain information for order fulfilment, support, business records and applicable legal obligations. Contact us to request access, correction or deletion where permitted by law; some records may need to be retained.',
        'You can raise a privacy concern through our contact form or lodge a complaint with the Information Regulator of South Africa.'
      ]
    },
    terms: {
      title: 'Terms & Conditions',
      items: [
        'About the business: DustyThrifts is operated by Ayibongwe Bralton as a sole proprietor in South Africa. Please use the contact form for order enquiries, returns and concerns.',
        'Our items: all items are curated, pre-loved vintage pieces, with one of each item. Please review the photographs, measurements and condition description before ordering. Pre-loved status does not remove your statutory rights.',
        'Prices and payment: prices are in ZAR. Your basket shows the item subtotal, shipping charge and total before payment through Yoco. Review and correct your basket and delivery details before proceeding.',
        'Availability: adding an item to a basket or opening a checkout does not reserve it. The first verified successful payment allocated by our system secures the item. If a paid basket cannot be fulfilled because an item has sold, we will contact you and arrange a full refund for that basket, including shipping; refunds are not automatic.',
        'Shipping: PEP Paxi costs R60 and Aramex Courier costs R100 within South Africa. Shipping is free when the item subtotal is R300 or more. The charge is shown before payment.',
        'Dispatch: we hand confirmed, allocated orders to the courier within 2 working days after payment, excluding weekends and South African public holidays. Courier transit time is additional and depends on the service and destination.',
        'Courier updates: after dispatch, PEP Paxi sends collection updates by SMS and Aramex sends shipment updates by SMS or email using the recipient details supplied. Please check these details when ordering and contact us with any delivery concerns.',
        'Payment confirmation: returning from Yoco is not proof of payment. Keep your order email as your transaction record. Contact us if you need help or a copy. If you have paid but have not received an email, please check your spam folder and contact us before paying again.',
        'Cooling-off returns: where section 44 of the Electronic Communications and Transactions Act applies, you may cancel without a reason or penalty within 7 days after receiving the goods. Only the direct return cost may be charged, and payments are refunded within 30 days of cancellation. Statutory exceptions apply.',
        'Faulty or incorrectly supplied goods: your rights under the Consumer Protection Act and other applicable law remain intact. Where its six-month implied warranty applies, qualifying defective goods may be returned at our risk and expense for your choice of an applicable repair, replacement or refund. Disclosed and accepted condition, reasonable wear and misuse are considered as the law permits.',
        'Other returns: requests outside statutory rights are considered case by case. Any agreed return costs will be explained before the return. A store voucher is optional and will never replace a refund you are legally entitled to receive.',
        'Returns and complaints: contact us with your order reference and the issue so we can arrange the next steps. These terms do not limit applicable statutory rights or access to the relevant consumer authorities.'
      ]
    }
  };

  // =========================================================================
  // HELPER FUNCTIONS (FORMATTING & DATA PARSING)
  // =========================================================================
  function formatPrice(amount) {
    return `R${Number(amount || 0).toFixed(0)}`;
  }

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));
  }

  function normaliseStatus(status) {
    return (status || 'available').trim().toLowerCase();
  }

  function displayStatus(status) {
    const value = normaliseStatus(status);
    return value === 'available' ? 'Available' : value === 'sold' ? 'Sold' : 'Unavailable';
  }

  function isSold(status) {
    return normaliseStatus(status) === 'sold';
  }

  function canPurchase(status) {
    return normaliseStatus(status) === 'available';
  }

  function unavailableBasketMessage() {
    const names = cart.filter(item => !canPurchase(item.status)).map(item => item.title);
    if (!names.length) return '';
    return `${names.join('; ')} ${names.length === 1 ? 'is' : 'are'} no longer available. Please remove the unavailable items from your basket to continue.`;
  }

  function applyAvailability(products) {
    const statuses = new Map(products.map(product => [product.id, product.status]));
    catalogueProducts.forEach(product => {
      product.status = product.catalogueStatus === 'sold' ? 'sold' : statuses.get(product.id) || 'unavailable';
    });
    document.querySelectorAll('.product-card').forEach(card => {
      const product = findCatalogueProductById(card.dataset.id);
      if (product) card.dataset.status = product.status;
    });
    syncCartWithCatalogue();
    updateCartUI();
    if (currentLightboxProduct) {
      const product = findCatalogueProductById(currentLightboxProduct.id);
      if (product) currentLightboxProduct.status = product.status;
    }
  }

  async function refreshAvailability() {
    if (availabilityRequest) return availabilityRequest;
    availabilityRequest = (async () => {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch(API_GATEWAY_URL, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'availability' }), signal: controller.signal,
          cache: 'no-store'
        });
        if (!response.ok) throw new Error('Availability could not be checked.');
        const data = await response.json();
        if (!Array.isArray(data.products) || data.products.some(product =>
          typeof product.id !== 'string' || !['available', 'sold'].includes(product.status)
        ) || new Set(data.products.map(product => product.id)).size !== data.products.length) {
          throw new Error('Invalid availability response.');
        }
        availabilityReady = true;
        applyAvailability(data.products);
        return true;
      } catch (error) {
        availabilityReady = false;
        updateCartUI();
        return false;
      } finally {
        window.clearTimeout(timer);
      }
    })();
    try {
      return await availabilityRequest;
    } finally {
      availabilityRequest = null;
    }
  }

  function normaliseProduct(product, index) {
    const fallbackId = String.fromCharCode(97 + index);
    const images = Array.isArray(product.images) ? product.images : [];

    return {
      id: String(product.id || fallbackId).trim().toLowerCase(),
      legacyIds: Array.isArray(product.legacyIds) ? product.legacyIds.map(id => String(id).trim()) : [],
      title: String(product.title || 'Untitled Item').trim(),
      displayTitle: String(product.displayTitle || product.title || 'Untitled Item').trim(),
      price: Number(product.price || 0),
      size: String(product.size || '').trim(),
      status: normaliseStatus(product.status),
      catalogueStatus: normaliseStatus(product.status),
      measurements: String(product.measurements || '').trim(),
      fabric: String(product.fabric || '').trim(),
      condition: String(product.condition || '').trim(),
      images: images
        .map(image => {
          if (typeof image === 'string') {
            return { src: image.trim(), alt: `${product.title || 'Product'} image` };
          }

          return {
            src: String(image?.src || '').trim(),
            alt: String(image?.alt || product.title || 'Product image').trim()
          };
        })
        .filter(image => image.src !== '')
    };
  }

  function getProductSizeText(size) {
    if (!size) return 'Size: To be added';
    return size.toLowerCase().startsWith('size') || size.toLowerCase() === 'one size' ? size : `Size: ${size}`;
  }

  function getPrimaryImage(product) {
    return product.images[0]?.src || '';
  }

  function findCatalogueProductById(id) {
    const lookupId = String(id || '').trim();
    return catalogueProducts.find(product => product.id === lookupId || product.legacyIds.includes(lookupId));
  }

  function renderCatalogueMessage(message, type = '') {
    if (!productsGrid) return;
    productsGrid.innerHTML = `<p class="catalogue-message ${type}">${escapeHTML(message)}</p>`;
  }

  function createProductCard(product) {
    const article = document.createElement('article');
    article.className = 'product-card';
    article.dataset.id = product.id;
    article.dataset.title = product.title;
    article.dataset.displayTitle = product.displayTitle;
    article.dataset.price = String(product.price);
    article.dataset.size = product.size;
    article.dataset.status = product.status;
    article.dataset.measurements = product.measurements;
    article.dataset.fabric = product.fabric;
    article.dataset.condition = product.condition;

    const imageMarkup = product.images.map((image, index) => `
      <img src="${escapeHTML(image.src)}" alt="${escapeHTML(image.alt)}" class="${index === 0 ? 'active' : ''}" loading="lazy" decoding="async" width="600" height="800" />
    `).join('');

    article.innerHTML = `
      <div class="carousel" data-carousel aria-label="Product images for ${escapeHTML(product.title)}">
        <div class="carousel-slides">
          ${imageMarkup}
        </div>
        <button type="button" class="carousel-btn next" aria-label="Next image">&rsaquo;</button>
        <div class="carousel-dots" aria-hidden="true"></div>
      </div>
      <div class="product-info">
        <div class="product-header-row">
          <h4 class="product-title">${escapeHTML(product.displayTitle)}</h4>
          <span class="product-price">${formatPrice(product.price)}</span>
        </div>
        <div class="product-meta-row">
          <span class="product-size">${escapeHTML(getProductSizeText(product.size))}</span>
          <span class="product-status">${escapeHTML(displayStatus(product.status))}</span>
        </div>
        <div class="product-action-row">
          <button type="button" class="btn-add-cart" aria-label="Add ${escapeHTML(product.title)} to basket">+</button>
        </div>
      </div>
    `;

    return article;
  }

  function renderCatalogue(products) {
    if (!productsGrid) return;

    productsGrid.innerHTML = '';

    if (products.length === 0) {
      renderCatalogueMessage('No products are listed yet.');
      return;
    }

    products.forEach(product => {
      productsGrid.appendChild(createProductCard(product));
    });
  }

  async function loadCatalogue() {
    if (!productsGrid) return;

    try {
      const response = await fetch(CATALOGUE_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Catalogue request failed: ${response.status}`);

      const catalogue = await response.json();
      const rawProducts = Array.isArray(catalogue) ? catalogue : catalogue.products;
      if (!Array.isArray(rawProducts)) throw new Error('Catalogue must contain a products array.');

      catalogueProducts = rawProducts.map(normaliseProduct).filter(product => product.id && product.title);
      await refreshAvailability();
      renderCatalogue(catalogueProducts);
    } catch (error) {
      console.error(error);
      renderCatalogueMessage('The catalogue could not be loaded. Please refresh the page.', 'error');
    }
  }

  function syncCartWithCatalogue() {
    if (catalogueProducts.length === 0) return;

    cart = cart
      .map(item => {
        const product = findCatalogueProductById(item.id);
        if (!product) return { ...item, status: 'unavailable' };

        return {
          id: product.id,
          title: product.title,
          price: product.price,
          size: product.size,
          status: product.status,
          measurements: product.measurements,
          fabric: product.fabric,
          condition: product.condition,
          image: getPrimaryImage(product)
        };
      })
      .filter(Boolean);

    saveCart();
  }

  function getImageSrc(img) {
    if (!img) return '';
    return (img.getAttribute('src') || img.dataset.src || '').trim();
  }

  function getProductFromCard(card) {
    const firstImage = card.querySelector('.carousel-slides img[src]') || card.querySelector('.carousel-slides img');
    const rawId = card.dataset.id || card.id || card.dataset.title || `prod-${Math.random().toString(36).substring(2, 9)}`;

    return {
      id: rawId.trim(),
      title: card.dataset.title || 'Untitled Item',
      displayTitle: card.dataset.displayTitle || card.dataset.title || 'Untitled Item',
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

  // =========================================================================
  // NOTE 2: LOCAL STORAGE (BASKET & ORDER HISTORY MANAGEMENT)
  // =========================================================================
  function loadCart() {
    try {
      const savedCart = window.localStorage.getItem(CART_STORAGE_KEY);
      const parsed = savedCart ? JSON.parse(savedCart) : [];
      return Array.isArray(parsed) ? parsed.filter(item => item && typeof item.id === 'string') : [];
    } catch (error) {
      return [];
    }
  }

  function saveCart() {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      // Keep the shop usable even if a browser blocks local storage.
    }
  }

  // =========================================================================
  // UI OVERLAY ACCESSIBILITY & LOCKS (MENU, LIGHTBOX, CART)
  // =========================================================================
  function updatePageLock() {
    const hasOpenLayer =
      sideMenu?.classList.contains('active') ||
      cartDrawer?.classList.contains('active') ||
      lightbox?.classList.contains('active') ||
      legalModal?.classList.contains('active');

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

  // =========================================================================
  // LIGHTBOX MODAL HANDLERS
  // =========================================================================
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

  // =========================================================================
  // LEGAL MODAL HANDLERS
  // =========================================================================
  function openLegalModal(type) {
    const content = legalModalContent[type];
    if (!legalModal || !legalModalTitle || !legalModalBody || !content) return;

    if (!legalModal.classList.contains('active')) rememberFocus();
    legalModalTitle.textContent = content.title;
    if (content.templateId) {
      legalModalBody.replaceChildren(document.getElementById(content.templateId).content.cloneNode(true));
    } else {
      legalModalBody.innerHTML = `<ul>${content.items.map(item => `<li>${escapeHTML(item)}</li>`).join('')}</ul>`;
    }
    const contactLink = document.createElement('a');
    contactLink.href = '#contact';
    contactLink.className = 'information-contact-link';
    contactLink.textContent = 'Contact DustyThrifts';
    contactLink.addEventListener('click', closeLegalModal);
    legalModalBody.append(contactLink);
    legalModalBody.scrollTop = 0;
    legalModal.classList.add('active');
    legalModal.setAttribute('aria-hidden', 'false');
    legalModalClose?.focus();
    updatePageLock();
  }

  function closeLegalModal() {
    if (!legalModal || !legalModal.classList.contains('active')) return;

    legalModal.classList.remove('active');
    legalModal.setAttribute('aria-hidden', 'true');
    if (legalModalBody) legalModalBody.innerHTML = '';
    if (Object.hasOwn(legalModalContent, window.location.hash.slice(1))) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    updatePageLock();
    restoreFocus();
  }

  // =========================================================================
  // CHECKOUT & FORM VALIDATION HELPERS
  // =========================================================================
  function setFieldError(field, errorId, message) {
    const errorEl = document.getElementById(errorId);
    if (field) field.classList.toggle('input-error', Boolean(message));
    if (errorEl) errorEl.textContent = message || '';
  }

  function clearCheckoutErrors() {
    setFieldError(document.getElementById('custName'), 'custNameError', '');
    setFieldError(document.getElementById('custPhone'), 'custPhoneError', '');
    setFieldError(document.getElementById('custEmail'), 'custEmailError', '');
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
    const isPepSelected = pepRadio?.checked ?? true;
    const shippingFee = cart.length === 0 ? 0 : isFreeShipping ? 0 : isPepSelected ? 60 : 100;
    const total = cart.length > 0 ? subtotal + shippingFee : 0;

    return { subtotal, shippingFee, total, isFreeShipping };
  }

  function buildOrderPayload() {
    const isPepSelected = pepRadio?.checked ?? true;
    const shippingMethod = isPepSelected ? 'PEP Paxi' : 'Aramex Courier';
    const destination = isPepSelected ? pepInput?.value.trim() : aramexInput?.value.trim();

    return {
      customer: {
        name: document.getElementById('custName')?.value.trim() || '',
        phone: document.getElementById('custPhone')?.value.trim() || '',
        ...(document.getElementById('custEmail') ? { email: document.getElementById('custEmail').value.trim() } : {})
      },
      shipping: {
        method: shippingMethod,
        destination: destination || ''
      },
      items: cart.map(item => ({
        id: item.id,
        quantity: 1
      }))
    };
  }

  function validateCheckoutForm() {
    clearCheckoutErrors();
    clearFeedback(checkoutMessage);

    const nameEl = document.getElementById('custName');
    const phoneEl = document.getElementById('custPhone');
    const emailEl = document.getElementById('custEmail');
    const name = nameEl?.value.trim() || '';
    const phone = phoneEl?.value.trim() || '';
    const phoneDigits = phone.replace(/\D/g, '');
    let isValid = true;

    if (cart.length === 0) {
      setFeedback(checkoutMessage, 'Your basket is empty.', 'error');
      return false;
    }
    if (!availabilityReady) {
      setFeedback(checkoutMessage, 'Availability could not be checked. Please try again shortly.', 'error');
      return false;
    }
    if (unavailableBasketMessage()) {
      setFeedback(checkoutMessage, unavailableBasketMessage(), 'error');
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

    if (emailEl && (!emailEl.value.trim() || !emailEl.checkValidity()
        || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value.trim()))) {
      setFieldError(emailEl, 'custEmailError', 'Please enter a valid email address.');
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

  // =========================================================================
  // DYNAMIC UI UPDATES (ADD BUTTONS, SHIPPING CALCULATOR & CART DISPLAY)
  // =========================================================================
  function updateAddButtons() {
    document.querySelectorAll('.product-card').forEach(card => {
      const product = getProductFromCard(card);
      const button = card.querySelector('.btn-add-cart');
      const statusEl = card.querySelector('.product-status');
      const alreadyInCart = cart.some(cartItem => cartItem.id === product.id);
      const sold = isSold(product.status);
      const unavailable = !canPurchase(product.status);

      if (statusEl) {
        statusEl.textContent = !availabilityReady && !sold ? 'Unavailable' : displayStatus(product.status);
        statusEl.classList.toggle('is-sold', sold);
      }

      if (!button) return;

      if (unavailable || !availabilityReady) {
        button.textContent = sold ? 'Sold' : 'Unavailable';
        button.disabled = true;
        button.classList.add('is-added');
        button.setAttribute('aria-label', `${product.title} is ${sold ? 'sold' : 'unavailable'}`);
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
    if (checkoutBtn) checkoutBtn.disabled = cart.length === 0 || checkoutInFlight
      || !availabilityReady || cart.some(item => !canPurchase(item.status));
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
              <h5>${escapeHTML(item.title)}</h5>
              <p>Size: ${escapeHTML(item.size)} | ${formatPrice(item.price)}</p>
              ${!canPurchase(item.status) ? '<p class="cart-stock-error">No longer available</p>' : ''}
            </div>
            <button type="button" class="cart-item-remove" data-id="${escapeHTML(item.id)}" aria-label="Remove ${escapeHTML(item.title)} from basket">Remove</button>
          `;
          cartItemsList.appendChild(itemEl);
        });
      }
    }

    saveCart();
    updateCartTotals();
    updateAddButtons();
    if (!checkoutInFlight && cart.length && !availabilityReady) {
      setFeedback(checkoutMessage, 'Availability could not be checked. Please try again shortly.', 'error');
    } else if (!checkoutInFlight && unavailableBasketMessage()) {
      setFeedback(checkoutMessage, unavailableBasketMessage(), 'error');
    } else if (!checkoutInFlight && checkoutMessage?.dataset.stockError === 'true') {
      clearFeedback(checkoutMessage);
    }
    if (checkoutMessage) checkoutMessage.dataset.stockError = String(
      !checkoutInFlight && ((!availabilityReady && cart.length > 0) || Boolean(unavailableBasketMessage()))
    );
  }

  function addToCart(card) {
    const item = getProductFromCard(card);

    if (!availabilityReady || !canPurchase(item.status)) {
      showToast(`${item.title} is currently unavailable.`);
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

  // =========================================================================
  // BIND GLOBAL UI EVENT LISTENERS
  // =========================================================================
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

  legalModalTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      openLegalModal(trigger.dataset.legalModal);
    });
  });

  legalModalClose?.addEventListener('click', closeLegalModal);
  legalModal?.addEventListener('click', (event) => {
    if (event.target === legalModal) closeLegalModal();
  });

  function openInformationFromHash() {
    const type = window.location.hash.slice(1);
    if (Object.hasOwn(legalModalContent, type)) openLegalModal(type);
  }
  window.addEventListener('hashchange', openInformationFromHash);
  openInformationFromHash();

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
    if (event.key === 'Tab' && legalModal?.classList.contains('active')) {
      const controls = [...legalModal.querySelectorAll('button, a[href]')];
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!legalModal.contains(document.activeElement) || (event.shiftKey && document.activeElement === first)) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    if (event.key === 'Escape') {
      closeLightbox();
      closeLegalModal();
      closeCart();
      closeSideMenu();
    }

    if (lightbox?.classList.contains('active')) {
      if (event.key === 'ArrowRight') nextLightboxSlide();
      if (event.key === 'ArrowLeft') prevLightboxSlide();
    }
  });

  // =========================================================================
  // NOTE 3: CHECKOUT FORM SUBMISSION & YOCO INTEGRATION (LOOK HERE FOR PAYMENTS)
  // =========================================================================
  // =========================================================================
// NOTE 3: CHECKOUT FORM SUBMISSION (HOSTED CHECKOUT REDIRECT)
// =========================================================================
const checkoutForm = document.getElementById('checkoutForm');
checkoutForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (checkoutInFlight) return;
  checkoutInFlight = true;
  window.clearTimeout(toastTimer);
  document.getElementById('siteToast')?.classList.remove('active');
  let redirecting = false;
  const originalBtnText = checkoutBtn ? checkoutBtn.textContent : 'Checkout';
  if (checkoutBtn) {
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'Checking availability...';
  }

  try {
    if (!await refreshAvailability()) {
      setFeedback(checkoutMessage, 'Availability could not be checked. Please try again shortly.', 'error');
      return;
    }
    if (!validateCheckoutForm()) return;
    if (getTotals().total <= 0) {
      setFeedback(checkoutMessage, 'Your basket is empty or invalid.', 'error');
      return;
    }
    const orderPayload = buildOrderPayload();
    if (orderPayloadInput) orderPayloadInput.value = JSON.stringify(orderPayload);
    if (checkoutBtn) checkoutBtn.textContent = 'Redirecting to Yoco...';
    setFeedback(checkoutMessage, 'Preparing secure checkout...', 'success');
    // Send order to AWS API Gateway -> Lambda
    const response = await fetch(API_GATEWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });

    const data = await response.json();

    if (!response.ok || !data.redirectUrl) {
      if (data.code === 'ITEMS_UNAVAILABLE' && Array.isArray(data.unavailableItems)) {
        const unavailableIds = new Set(data.unavailableItems.map(item => item.id));
        applyAvailability(catalogueProducts.map(product => ({
          id: product.id, status: unavailableIds.has(product.id) ? 'sold' : product.status
        })));
      }
      setFeedback(checkoutMessage, data.error || 'Unable to prepare checkout. Please try again.', 'error');
      checkoutMessage?.scrollIntoView({ block: 'nearest' });
      return;
    }

    // Redirect the customer directly to Yoco's hosted secure checkout page
    redirecting = true;
    window.location.href = data.redirectUrl;

  } catch (error) {
    redirecting = false;
    console.error(error);
    setFeedback(checkoutMessage, 'There was an error creating your payment session. Please try again.', 'error');
  } finally {
    if (!redirecting) {
      checkoutInFlight = false;
      if (checkoutBtn) checkoutBtn.textContent = originalBtnText;
      if (checkoutMessage && (!availabilityReady || unavailableBasketMessage())) {
        checkoutMessage.dataset.stockError = 'true';
      }
    }
    updateCartTotals();
  }
});
  // =========================================================================
  // NOTE 4: CONTACT FORM SUBMISSION (AWS API GATEWAY ENDPOINT)
  // =========================================================================
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

  // Footer Year Auto-Update
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Initialize Page Component States
  await loadCatalogue();
  syncCartWithCatalogue();
  initialiseProductCards();
  initialiseCarousels();
  updateShippingFields();
  updateCartUI();
  window.setInterval(() => {
    if (!document.hidden && !checkoutInFlight) refreshAvailability();
  }, 30000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !checkoutInFlight) refreshAvailability();
  });
});
