/* ============================================================
   Mahmoud Ahmed Mobarak — portfolio interactions
   Vanilla JavaScript, no dependencies.
   ============================================================ */

// Set this to a real address to enable the email link + static-hosting
// fallback for the contact form. Left empty on purpose: the form works
// through the local admin server, and the site never ships a fake address.
const CONTACT_EMAIL = '';

/* ------------------------------------------------------------
   1. Reveal on scroll
------------------------------------------------------------ */
const revealEls = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const parent = el.parentElement;
        const idx = parent ? [...parent.children].indexOf(el) : 0;
        el.style.transitionDelay = `${Math.min(idx * 0.06, 0.45)}s`;
        el.classList.add('active');
        setTimeout(() => { el.style.transitionDelay = ''; }, 900);
        revealObserver.unobserve(el);
      });
    },
    { threshold: 0, rootMargin: '0px 0px -60px 0px' }
  );

  revealEls.forEach((el) => revealObserver.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('active'));
}

/* ------------------------------------------------------------
   2. Navbar: scroll spy + mobile menu
------------------------------------------------------------ */
const navLinks = document.querySelectorAll('.nav-links a, .nav-mobile a');
const spySections = document.querySelectorAll('main section[id]');

function updateActiveLink() {
  let currentId = '';
  spySections.forEach((sec) => {
    if (window.scrollY >= sec.offsetTop - 160) currentId = sec.id;
  });

  if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 80) {
    const last = spySections[spySections.length - 1];
    if (last) currentId = last.id;
  }

  navLinks.forEach((a) => {
    const isActive = a.getAttribute('href') === `#${currentId}`;
    a.classList.toggle('active', isActive);
    if (isActive) a.setAttribute('aria-current', 'true');
    else a.removeAttribute('aria-current');
  });
}

window.addEventListener('scroll', updateActiveLink, { passive: true });
updateActiveLink();

(function mobileNav() {
  const toggle = document.getElementById('navToggle');
  const panel = document.getElementById('navMobile');
  if (!toggle || !panel) return;

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    panel.hidden = !open;
  };

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  panel.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      const target = href && href.startsWith('#') ? document.querySelector(href) : null;

      setOpen(false);

      // Hiding the menu before the browser handles the anchor can cancel the
      // jump, so scroll explicitly after closing it.
      if (target) {
        e.preventDefault();
        if (history.pushState) history.pushState(null, '', href);
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1080) setOpen(false);
  });
})();

/* ------------------------------------------------------------
   3. Typing effect
------------------------------------------------------------ */
document.querySelectorAll('.typing-text').forEach((el) => {
  const text = el.dataset.text;
  if (!text) return;

  const delay = parseInt(el.dataset.delay || '0', 10);

  setTimeout(() => {
    let i = 0;
    el.textContent = '';

    const interval = setInterval(() => {
      el.textContent += text.charAt(i);
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        const caret = document.createElement('span');
        caret.className = 'typing-caret';
        el.appendChild(caret);
      }
    }, 26);
  }, delay);
});

/* ------------------------------------------------------------
   4. Quote slideshow
------------------------------------------------------------ */
const quotes = [
  { text: 'The only limit to our realization of tomorrow is our doubts of today.', author: 'Franklin D. Roosevelt' },
  { text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill' },
  { text: 'Education is the most powerful weapon which you can use to change the world.', author: 'Nelson Mandela' },
  { text: 'Stay hungry, stay foolish.', author: 'Steve Jobs' },
  { text: 'If you can dream it, you can do it.', author: 'Walt Disney' }
];

let quoteIndex = 0;
const quoteText = document.querySelector('.quote-text');
const quoteAuthor = document.querySelector('.quote-author');
const quoteBubble = document.querySelector('.quote-bubble');
const prevQuote = document.querySelector('.quote-controls .prev');
const nextQuote = document.querySelector('.quote-controls .next');

function updateQuote(direction) {
  if (!quoteText || !quoteAuthor) return;
  quoteText.textContent = `“${quotes[quoteIndex].text}”`;
  quoteAuthor.textContent = `– ${quotes[quoteIndex].author}`;
  if (quoteBubble) {
    quoteBubble.classList.remove('slide-right', 'slide-left');
    void quoteBubble.offsetWidth;
    quoteBubble.classList.add(direction >= 0 ? 'slide-right' : 'slide-left');
  }
}

if (prevQuote && nextQuote) {
  prevQuote.addEventListener('click', () => {
    quoteIndex = (quoteIndex - 1 + quotes.length) % quotes.length;
    updateQuote(-1);
  });

  nextQuote.addEventListener('click', () => {
    quoteIndex = (quoteIndex + 1) % quotes.length;
    updateQuote(1);
  });

  setInterval(() => {
    quoteIndex = (quoteIndex + 1) % quotes.length;
    updateQuote(1);
  }, 9000);
}

/* ------------------------------------------------------------
   5. Academic year filter
------------------------------------------------------------ */
function filterReports(selectedYear) {
  const cards = document.querySelectorAll('.report-card');
  const tabs = document.querySelectorAll('.year-tab');

  tabs.forEach((tab) => {
    tab.classList.toggle('active', tab.getAttribute('data-year') === String(selectedYear));
  });

  cards.forEach((card) => {
    const show = card.getAttribute('data-year') === String(selectedYear);
    card.style.display = show ? '' : 'none';
    card.classList.toggle('hidden', !show);
  });
}

const yearTabs = document.querySelectorAll('.year-tab');
if (yearTabs.length > 0) {
  yearTabs.forEach((tab) => {
    tab.addEventListener('click', () => filterReports(tab.getAttribute('data-year')));
  });
  filterReports(yearTabs[0].getAttribute('data-year'));
}

/* ------------------------------------------------------------
   6. Contact form
   Works with the local admin server (/api/contact). When the site is
   hosted statically there is no endpoint, so it falls back to a mailto
   link if CONTACT_EMAIL is configured, or a clear message if not.
------------------------------------------------------------ */
const contactForm = document.getElementById('contactForm');
const confirmationPopup = document.getElementById('confirmationPopup');
const closePopup = document.getElementById('closePopup');

(function wireContactEmail() {
  const link = document.getElementById('contactEmailLink');
  if (!link || !CONTACT_EMAIL) return;
  link.hidden = false;
  link.href = `mailto:${CONTACT_EMAIL}`;
})();

if (contactForm && confirmationPopup && closePopup) {
  const setPopup = (title, message) => {
    const h = confirmationPopup.querySelector('h2');
    const p = confirmationPopup.querySelector('p');
    if (h) h.textContent = title;
    if (p) p.textContent = message;
  };

  const openPopup = () => confirmationPopup.classList.add('active');
  const closePopupDialog = () => confirmationPopup.classList.remove('active');

  closePopup.addEventListener('click', closePopupDialog);
  confirmationPopup.addEventListener('click', (e) => {
    if (e.target === confirmationPopup) closePopupDialog();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePopupDialog();
  });

  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!this.checkValidity()) {
      this.reportValidity();
      return;
    }

    const submitBtn = this.querySelector('.submit-btn');
    const originalLabel = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    const body = {
      firstName: this.firstName.value.trim(),
      lastName: this.lastName.value.trim(),
      email: this.email.value.trim(),
      subject: this.subject.value.trim(),
      message: this.message.value.trim()
    };

    const fallbackToEmail = () => {
      const summary = `${body.message}\n\n— ${body.firstName} ${body.lastName} (${body.email})`;
      if (CONTACT_EMAIL) {
        const href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(body.subject)}&body=${encodeURIComponent(summary)}`;
        window.location.href = href;
        setPopup('Your email app is opening', 'The message is ready to send from your mail app. If nothing opened, use the email link on this page.');
      } else {
        setPopup('Message not sent', 'The live site is static, so the form needs the local admin server to deliver messages. Message me on GitHub and I will reply there.');
      }
      openPopup();
    };

    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
      .then(async (res) => {
        const type = res.headers.get('content-type') || '';
        if (!res.ok || !type.includes('application/json')) throw new Error('No contact endpoint');
        return res.json();
      })
      .then((result) => {
        if (!result || !result.success) throw new Error((result && result.error) || 'Rejected');
        setPopup('Message sent', "Thank you for reaching out. I'll try to respond as fast as I can.");
        openPopup();
        contactForm.reset();
      })
      .catch(() => fallbackToEmail())
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
      });
  });
}

/* ------------------------------------------------------------
   7. Image lightbox
------------------------------------------------------------ */
(function lightbox() {
  const box = document.getElementById('imageLightbox');
  const imgEl = document.getElementById('lightboxImg');
  const caption = document.getElementById('lightboxCaption');
  const closeBtn = document.getElementById('lightboxClose');
  const overlay = document.getElementById('lightboxOverlay');
  const prevBtn = document.getElementById('lightboxPrev');
  const nextBtn = document.getElementById('lightboxNext');
  const counter = document.getElementById('lightboxCounter');

  if (!box || !imgEl) return;

  let gallery = [];
  let index = 0;

  function render() {
    const item = gallery[index];
    if (!item) return;
    imgEl.src = item.src;
    imgEl.alt = item.alt || 'Preview';
    imgEl.classList.remove('zoomed');
    if (caption) caption.textContent = item.alt || '';
    if (counter) counter.textContent = gallery.length > 1 ? `${index + 1} / ${gallery.length}` : '';
    const multi = gallery.length > 1;
    if (prevBtn) prevBtn.style.display = multi ? 'grid' : 'none';
    if (nextBtn) nextBtn.style.display = multi ? 'grid' : 'none';
  }

  function openLightbox(img, allImages) {
    const list = allImages && allImages.length ? allImages : [img];
    gallery = list.map((el) => ({ src: el.src, alt: el.alt }));
    index = Math.max(0, list.indexOf(img));
    render();
    box.classList.add('active');
    box.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    box.classList.remove('active');
    box.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(() => { imgEl.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; }, 250);
  }

  function step(dir) {
    if (!gallery.length) return;
    index = (index + dir + gallery.length) % gallery.length;
    render();
  }

  function groupFor(img) {
    const card = img.closest('.report-card, .cert-card, .extra-card');
    const scope = card ? card.parentElement : document;
    return [...scope.querySelectorAll('.report-images img, .cert-card img, .extra-photo img')];
  }

  function wireImages() {
    document.querySelectorAll('.report-images img, .cert-card img, .extra-photo img').forEach((img) => {
      if (img.dataset.lightboxWired) return;
      img.dataset.lightboxWired = '1';
      img.addEventListener('click', () => openLightbox(img, groupFor(img)));
    });
  }

  function wireZoomButtons() {
    document.querySelectorAll('.report-zoom-btn').forEach((btn) => {
      if (btn.dataset.zoomWired) return;
      btn.dataset.zoomWired = '1';
      btn.addEventListener('click', () => {
        const card = btn.closest('.report-card');
        const img = card ? card.querySelector('.report-images img') : null;
        if (img) openLightbox(img, groupFor(img));
      });
    });
  }

  wireImages();
  wireZoomButtons();

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  if (overlay) overlay.addEventListener('click', closeLightbox);
  if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); step(-1); });
  if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); step(1); });

  imgEl.addEventListener('click', (e) => {
    e.stopPropagation();
    imgEl.classList.toggle('zoomed');
  });

  document.addEventListener('keydown', (e) => {
    if (!box.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
})();

/* ------------------------------------------------------------
   8. Keep the GitHub button in sync with saved content
------------------------------------------------------------ */
(function projectsViewToggle() {
  const button = document.getElementById('projectsViewToggle');
  const list = document.querySelector('#projects .projects-list');
  if (!button || !list) return;

  const label = button.querySelector('span');
  const STORAGE_KEY = 'portfolio:projects-scroller';

  const apply = (scroller) => {
    list.classList.toggle('is-scroller', scroller);
    button.setAttribute('aria-pressed', String(scroller));
    if (label) label.textContent = scroller ? 'Stacked view' : 'Scroll sideways';
  };

  let initial = false;
  try {
    initial = window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch (err) {
    initial = false;
  }
  apply(initial);

  button.addEventListener('click', () => {
    const next = !list.classList.contains('is-scroller');
    apply(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    } catch (err) {
      /* private mode — keep the toggle working for this visit */
    }
    if (next) list.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
})();

/* ------------------------------------------------------------
   9. Card pointer sheen (subtle, solid colours only)
------------------------------------------------------------ */
(function cardSheen() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.querySelectorAll('.card, .cert-card, .extra-card, .leadership-card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 4;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 4;
      card.style.transform = `translateY(-4px) rotateX(${(-y).toFixed(2)}deg) rotateY(${x.toFixed(2)}deg)`;
    });
    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  });
})();
