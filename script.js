/* =========================
   REVEAL ON SCROLL
   Everything pops up as you scroll down the single page.
========================= */
const revealEls = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;

      // Small stagger so cards pop in one after another
      const parent = el.parentElement;
      const idx = parent ? [...parent.children].indexOf(el) : 0;
      el.style.transitionDelay = `${Math.min(idx * 0.07, 0.6)}s`;
      el.classList.add("active");

      // After the pop finishes, drop the delay so hover effects stay snappy
      setTimeout(() => {
        el.style.transitionDelay = "";
      }, 900);

      revealObserver.unobserve(el);
    });
  },
  { threshold: 0, rootMargin: "0px 0px -60px 0px" }
);

revealEls.forEach((el) => revealObserver.observe(el));

/* =========================
   NAVBAR SCROLL SPY
   Highlights the nav link of the section currently in view.
========================= */
const navLinks = document.querySelectorAll(".nav-links a");
const spySections = document.querySelectorAll("main section[id]");

function updateActiveLink() {
  let currentId = "";

  spySections.forEach((sec) => {
    if (window.scrollY >= sec.offsetTop - 150) currentId = sec.id;
  });

  // Near the bottom of the page, always highlight the last section
  if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 80) {
    const last = spySections[spySections.length - 1];
    if (last) currentId = last.id;
  }

  navLinks.forEach((a) => {
    a.classList.toggle("active", a.getAttribute("href") === `#${currentId}`);
  });
}

window.addEventListener("scroll", updateActiveLink, { passive: true });
updateActiveLink();

/* =========================
   MILESTONE RAIL (right-side checkpoints)
========================= */
const milestones = document.querySelectorAll(".milestone");
const milestoneLine = document.querySelector(".milestone-line");

// Reuse the scroll-spy: whenever the active nav link changes,
// move the rail's active dot and fill the line up to it.
function updateMilestones() {
  let currentId = "";

  spySections.forEach((sec) => {
    if (window.scrollY >= sec.offsetTop - 150) currentId = sec.id;
  });

  if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 80) {
    const last = spySections[spySections.length - 1];
    if (last) currentId = last.id;
  }

  let activeIndex = -1;
  milestones.forEach((m, i) => {
    const isActive = m.getAttribute("data-target") === currentId;
    m.classList.toggle("active", isActive);
    if (isActive) activeIndex = i;
  });

  // fill the line up to the ACTIVE checkpoint, not the raw scroll percent,
  // so the glow always ends exactly on the current dot
  if (milestoneLine) {
    let fill = 0;
    if (activeIndex >= 0) {
      const line = milestoneLine.getBoundingClientRect();
      const dot = milestones[activeIndex].getBoundingClientRect();
      const lineH = line.height || 1;
      fill = Math.max(0, Math.min(100, ((dot.top + dot.height / 2 - line.top) / lineH) * 100));
    }
    milestoneLine.style.setProperty("--fill", `${fill}%`);
  }
}

// clicking a checkpoint glides to that part of the page
milestones.forEach((m) => {
  m.addEventListener("click", (e) => {
    e.preventDefault();
    const target = document.getElementById(m.getAttribute("data-target"));
    if (!target) return;
    const top = target.offsetTop - 70; // leave room for the navbar
    window.scrollTo({ top, behavior: "smooth" });
  });
});

window.addEventListener("scroll", updateMilestones, { passive: true });
window.addEventListener("resize", updateMilestones);
updateMilestones();

/* =========================
   TYPING EFFECT
========================= */
const typingTexts = document.querySelectorAll(".typing-text");

typingTexts.forEach(p => {
  const text = p.dataset.text;
  if (!text) return;

  const delay = parseInt(p.dataset.delay || "0", 10);

  setTimeout(() => {
    let i = 0;
    p.textContent = "";

    const interval = setInterval(() => {
      p.textContent += text.charAt(i);
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        // blinking caret at the end of the typed text
        const caret = document.createElement("span");
        caret.className = "typing-caret";
        p.appendChild(caret);
      }
    }, 27);
  }, delay);
});

/* =========================
   QUOTES SLIDESHOW
========================= */
const quotes = [
  { text: "The only limit to our realization of tomorrow is our doubts of today.", author: "Franklin D. Roosevelt" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
  { text: "If you can dream it, you can do it.", author: "Walt Disney" }
];

let quoteIndex = 0;
const quoteText = document.querySelector(".quote-text");
const quoteAuthor = document.querySelector(".quote-author");
const prevBtn = document.querySelector(".prev");
const nextBtn = document.querySelector(".next");

const quoteBubble = document.querySelector(".quote-bubble");

function updateQuote(direction) {
  if (!quoteText || !quoteAuthor) return;
  quoteText.textContent = `“${quotes[quoteIndex].text}”`;
  quoteAuthor.textContent = `– ${quotes[quoteIndex].author}`;
  if (quoteBubble) {
    quoteBubble.classList.remove("slide-right", "slide-left");
    void quoteBubble.offsetWidth; // restart the slide animation
    quoteBubble.classList.add(direction >= 0 ? "slide-right" : "slide-left");
  }
}

setInterval(() => {
  quoteIndex = (quoteIndex + 1) % quotes.length;
  updateQuote(1);
}, 8000);

if (prevBtn && nextBtn) {
  prevBtn.addEventListener("click", () => {
    quoteIndex = (quoteIndex - 1 + quotes.length) % quotes.length;
    updateQuote(-1);
  });

  nextBtn.addEventListener("click", () => {
    quoteIndex = (quoteIndex + 1) % quotes.length;
    updateQuote(1);
  });

  updateQuote(1);
}

/* =========================
   ACADEMICS YEAR FILTER
========================= */
function filterReports(selectedYear) {
  const cards = document.querySelectorAll(".report-card");
  const tabs = document.querySelectorAll(".year-tab");

  // Sync active state on tab buttons
  tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.getAttribute("data-year") === String(selectedYear));
  });

  // Show only report cards belonging to the selected year
  cards.forEach((card) => {
    const cardYear = card.getAttribute("data-year");
    if (cardYear === String(selectedYear)) {
      card.style.display = "";
      card.classList.remove("hidden");
    } else {
      card.style.display = "none";
      card.classList.add("hidden");
    }
  });
}

// Attach listeners to year tab buttons and initialize on load
const yearTabs = document.querySelectorAll(".year-tab");
if (yearTabs.length > 0) {
  yearTabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      filterReports(this.getAttribute("data-year"));
    });
  });

  // Display initial selected year (default: first tab)
  filterReports(yearTabs[0].getAttribute("data-year"));
}

/* =========================
   CONTACT FORM (EmailJS)
========================= */
const contactForm = document.getElementById('contactForm');
const confirmationPopup = document.getElementById('confirmationPopup');
const closePopup = document.getElementById('closePopup');

if (contactForm && confirmationPopup && closePopup) {
  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();

    // Collect form data safely
    const formData = {
      firstName: this.firstName.value.trim(),
      lastName: this.lastName.value.trim(),
      email: this.email.value.trim(),
      subject: this.subject.value.trim(),
      message: this.message.value.trim()
    };

    // Disable submit button while sending
    const submitBtn = this.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";

    emailjs.send("service_fkjzmlq", "template_52z4b6i", formData)
      .then((response) => {
        console.log("Email sent successfully!", response);
        confirmationPopup.classList.add('active');
        contactForm.reset();
        submitBtn.disabled = false;
        submitBtn.textContent = "Send Message";
      })
      .catch((error) => {
        console.error("EmailJS error:", error);
        alert("Oops! Something went wrong. Check console for details.");
        submitBtn.disabled = false;
        submitBtn.textContent = "Send Message";
      });
  });

  // Close popup
  closePopup.addEventListener('click', () => {
    confirmationPopup.classList.remove('active');
  });
}

/* =========================
   ROTATING CARDS — arrows trigger the animation
   Each click slides one card to the front with a smooth animated swap.
========================= */
(function () {
  const wrap = document.querySelector(".wrap_card");
  const prev = document.getElementById("cardsPrev");
  const next = document.getElementById("cardsNext");
  if (!wrap || !prev || !next) return;

  const cards = Array.from(wrap.querySelectorAll(".card"));

  // The five fixed slots: 0 = front center, 1 = right inner, 2 = right outer,
  // 3 = left outer, 4 = left inner. Card i sits at slot (i - active) mod 5.
  const SLOTS = [
    { z: 3, top: "0", left: "var(--to-center)", right: "var(--to-center)", transform: "rotate(0deg) scale(1.06)" },
    { z: 1, top: "var(--t-card)", left: "var(--x2)", right: "var(--x1)", transform: "var(--to-right)" },
    { z: 0, top: "calc(var(--t-card) * 1.5)", left: "var(--x2)", right: "var(--x1)", transform: "var(--to-right)" },
    { z: 0, top: "calc(var(--t-card) * 1.5)", left: "var(--x1)", right: "var(--x2)", transform: "var(--to-left)" },
    { z: 1, top: "var(--t-card)", left: "var(--x1)", right: "var(--x2)", transform: "var(--to-left)" }
  ];

  let active = 0; // card index currently at the front

  function render() {
    cards.forEach((card, i) => {
      const s = SLOTS[(i - active + 5) % 5];
      card.style.zIndex = s.z;
      card.style.top = s.top;
      card.style.left = s.left;
      card.style.right = s.right;
      card.style.transform = s.transform;
    });
  }

  next.addEventListener("click", () => {
    active = (active + 1) % 5;
    render();
  });

  prev.addEventListener("click", () => {
    active = (active + 4) % 5;
    render();
  });

  // Fun tooltip: hover a card's button for 2 seconds to reveal a message
  cards.forEach((card) => {
    const btn = card.querySelector(".card-btn");
    if (!btn) return;
    let hoverTimer = null;
    btn.addEventListener("mouseenter", () => {
      hoverTimer = setTimeout(() => btn.classList.add("show-tip"), 2000);
    });
    btn.addEventListener("mouseleave", () => {
      clearTimeout(hoverTimer);
      btn.classList.remove("show-tip");
    });
  });

  render(); // start with card 1 at the front
})();

/* Leadership Wallet — card click interactions */
function openCard(event, card) {
  event.stopPropagation();
  const wallet = document.querySelector('.leadership-wallet');
  if (!wallet) return;

  if (card.classList.contains('is-active')) {
    card.classList.remove('is-active');
    wallet.classList.remove('has-active-card');
  } else {
    document.querySelectorAll('.lw-card').forEach(c => c.classList.remove('is-active'));
    card.classList.add('is-active');
    wallet.classList.add('has-active-card');
  }
}

/* Close wallet cards when clicking outside */
document.addEventListener('click', function(e) {
  const wallet = document.querySelector('.leadership-wallet');
  if (!wallet) return;
  if (!wallet.contains(e.target)) {
    wallet.querySelectorAll('.lw-card').forEach(c => c.classList.remove('is-active'));
    wallet.classList.remove('has-active-card');
  }
});

/* =========================
   IMAGE LIGHTBOX / GALLERY
   One unified viewer for report cards, certificates and extracurricular
   photos — with prev/next arrows, a counter, keyboard support and zoom.
========================= */
(function () {
  const lightbox = document.getElementById("imageLightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxCaption = document.getElementById("lightboxCaption");
  const lightboxClose = document.getElementById("lightboxClose");
  const lightboxOverlay = document.getElementById("lightboxOverlay");
  const prevBtn = document.getElementById("lightboxPrev");
  const nextBtn = document.getElementById("lightboxNext");
  const counter = document.getElementById("lightboxCounter");

  if (!lightbox || !lightboxImg) return;

  let gallery = [];   // [{ src, alt }] for the current category
  let index = 0;

  function render() {
    const item = gallery[index];
    if (!item) return;
    lightboxImg.src = item.src;
    lightboxImg.alt = item.alt || "Preview";
    lightboxImg.classList.remove("zoomed");
    if (lightboxCaption) lightboxCaption.textContent = item.alt || "";
    if (counter) {
      counter.textContent = gallery.length > 1 ? `${index + 1} / ${gallery.length}` : "";
    }
    const multi = gallery.length > 1;
    if (prevBtn) prevBtn.style.display = multi ? "flex" : "none";
    if (nextBtn) nextBtn.style.display = multi ? "flex" : "none";
  }

  function openLightbox(img, allImages) {
    const list = (allImages && allImages.length) ? allImages : [img];
    gallery = list.map(el => ({ src: el.src, alt: el.alt }));
    index = Math.max(0, list.indexOf(img));
    render();
    lightbox.classList.add("active");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.classList.remove("active");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    setTimeout(() => { lightboxImg.src = ""; }, 250);
  }

  function step(dir) {
    if (!gallery.length) return;
    index = (index + dir + gallery.length) % gallery.length;
    render();
  }

  // Group clickable images by section so arrows only move within one group
  function groupFor(img) {
    const card = img.closest(".report-card, .cert-card, .extra-card");
    const scope = card ? card.parentElement : document;
    return [...scope.querySelectorAll(".report-images img, .cert-card img, .extra-photo img")]
      .filter(i => i.offsetParent !== null || i.closest(".report-card, .cert-card, .extra-card"));
  }

  function wire() {
    document.querySelectorAll(".report-images img, .cert-card img, .extra-photo img").forEach((img) => {
      if (img.dataset.lightboxWired) return;
      img.dataset.lightboxWired = "1";
      img.addEventListener("click", () => openLightbox(img, groupFor(img)));
    });
  }

  // Report card "View Full Size" buttons join the same gallery
  document.querySelectorAll(".report-zoom-btn").forEach((btn) => {
    if (btn.dataset.zoomWired) return;
    btn.dataset.zoomWired = "1";
    btn.addEventListener("click", () => {
      const card = btn.closest(".report-card");
      const img = card ? card.querySelector(".report-images img") : null;
      if (img) openLightbox(img, groupFor(img));
    });
  });

  wire();

  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
  if (lightboxOverlay) lightboxOverlay.addEventListener("click", closeLightbox);
  if (prevBtn) prevBtn.addEventListener("click", (e) => { e.stopPropagation(); step(-1); });
  if (nextBtn) nextBtn.addEventListener("click", (e) => { e.stopPropagation(); step(1); });

  // Click the enlarged image again to zoom in / out further
  lightboxImg.addEventListener("click", (e) => {
    e.stopPropagation();
    lightboxImg.classList.toggle("zoomed");
  });

  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("active")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });
})();
