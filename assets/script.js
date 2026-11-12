/* ==========================================================
   Alif Hakimi - Portfolio JavaScript
   ========================================================== */


/* ===== 0. LOADING SCREEN =====
   Fades the splash out once everything has loaded, then takes it out of the
   DOM so it cannot catch keyboard focus or sit on top of anything. */

const loader = document.getElementById("loader");

if (loader) {
  const MIN_SHOWN = 2700;  // a cached page loads instantly, don't just flash
  const MAX_WAIT = 6000;   // never hold the page back on one slow asset

  const startedAt = Date.now();
  let loaderGone = false;

  document.body.style.overflow = "hidden"; // no scrolling behind the splash

  function hideLoader() {
    if (loaderGone) {
      return;
    }

    loaderGone = true;
    document.body.style.overflow = "";
    loader.classList.add("done");

    // Matches the fade in the stylesheet
    setTimeout(function () {
      loader.remove();
    }, 600);
  }

  function finishLoading() {
    const waited = Date.now() - startedAt;
    setTimeout(hideLoader, Math.max(0, MIN_SHOWN - waited));
  }

  if (document.readyState === "complete") {
    finishLoading();
  } else {
    window.addEventListener("load", finishLoading);
  }

  // A font or an image that never arrives should not keep the site hidden
  setTimeout(hideLoader, MAX_WAIT);
}


/* ===== 1. DARK MODE TOGGLE ===== */

const themeBtn = document.getElementById("theme-btn");

// The dark-mode class itself is set by the small script in the <head>, before
// the page paints, so returning dark mode users never get a white flash.
// This only keeps the button's label and state in step with it.
function syncThemeButton() {
  const dark = document.documentElement.classList.contains("dark-mode");

  themeBtn.setAttribute("aria-pressed", dark ? "true" : "false");
  themeBtn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
}

syncThemeButton();

themeBtn.addEventListener("click", function () {
  document.documentElement.classList.toggle("dark-mode");

  if (document.documentElement.classList.contains("dark-mode")) {
    localStorage.setItem("theme", "dark");
  } else {
    localStorage.setItem("theme", "light");
  }

  syncThemeButton();
  drawTower(); // redraw the canvas so it picks up the new colours
});


/* ===== 2. MOBILE MENU ===== */

const menuBtn = document.getElementById("menu-btn");
const navLinks = document.getElementById("nav-links");

function setMenu(open) {
  navLinks.classList.toggle("open", open);
  menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
  menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}

menuBtn.addEventListener("click", function () {
  setMenu(!navLinks.classList.contains("open"));
});

// Close the menu again after tapping a link
const allNavLinks = document.querySelectorAll("#nav-links a");

allNavLinks.forEach(function (link) {
  link.addEventListener("click", function () {
    setMenu(false);
  });
});

// Escape closes it too, and puts focus back on the button that opened it
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape" && navLinks.classList.contains("open")) {
    setMenu(false);
    menuBtn.focus();
  }
});

// Tapping anywhere outside the open menu closes it
document.addEventListener("click", function (event) {
  if (!navLinks.classList.contains("open")) {
    return;
  }

  if (!navLinks.contains(event.target) && !menuBtn.contains(event.target)) {
    setMenu(false);
  }
});


/* ===== 3. SCROLL BAR, ACTIVE LINK, BACK TO TOP ===== */

const scrollBar = document.getElementById("scroll-bar");
const topBtn = document.getElementById("top-btn");
const sections = document.querySelectorAll("section[id]");

function onScroll() {
  const scrolled = window.scrollY;

  // Progress bar under the navbar. A page shorter than the window would make
  // this divide by zero, so guard it, and never let it run past 100%.
  const pageHeight = document.documentElement.scrollHeight - window.innerHeight;
  const percent = pageHeight > 0 ? (scrolled / pageHeight) * 100 : 0;
  scrollBar.style.width = Math.min(100, Math.max(0, percent)) + "%";

  // Show the back to top button after 400px
  if (scrolled > 400) {
    topBtn.classList.add("show");
  } else {
    topBtn.classList.remove("show");
  }

  // Highlight the nav link of the section currently on screen
  let current = "";

  sections.forEach(function (section) {
    if (scrolled >= section.offsetTop - 120) {
      current = section.getAttribute("id");
    }
  });

  allNavLinks.forEach(function (link) {
    const isCurrent = link.getAttribute("href") === "#" + current;

    link.classList.toggle("active", isCurrent);

    // Tells a screen reader which of the four is the section you are in
    if (isCurrent) {
      link.setAttribute("aria-current", "true");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

// Scroll fires far faster than the screen refreshes, so do the work once per
// frame instead of once per event. Without this the bar and the nav stutter.
let scrollQueued = false;

window.addEventListener("scroll", function () {
  if (scrollQueued) {
    return;
  }

  scrollQueued = true;

  requestAnimationFrame(function () {
    scrollQueued = false;
    onScroll();
  });
}, { passive: true });

onScroll(); // set the right state for a page loaded part way down

topBtn.addEventListener("click", function () {
  window.scrollTo({ top: 0, behavior: "smooth" });
});


/* ===== 4. SKILL BARS ===== */

// Each bar has a data-percent attribute in the HTML, e.g. data-percent="88"
const skillFills = document.querySelectorAll(".skill-fill");

function fillSkillBars() {
  skillFills.forEach(function (bar) {
    bar.style.width = bar.getAttribute("data-percent") + "%";
  });
}

// Only animate them once the skills section is actually visible. An observer
// does this without adding a third thing to the scroll handler, and it also
// covers the case where the section is already on screen at load.
const skillsSection = document.getElementById("skills");

const skillsWatcher = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting) {
      fillSkillBars();
      skillsWatcher.disconnect(); // only needs to happen once
    }
  });
}, { threshold: 0.1 });

skillsWatcher.observe(skillsSection);


/* ===== 5. PROJECT FILTER ===== */

const filterBtns = document.querySelectorAll(".filter-btn");
const projectCards = document.querySelectorAll(".project-card");
const noResults = document.getElementById("no-results");

filterBtns.forEach(function (btn) {
  btn.addEventListener("click", function () {
    const chosen = btn.getAttribute("data-filter");
    let visible = 0;

    // Move the active class onto the button that was clicked
    filterBtns.forEach(function (b) {
      b.classList.remove("active");
      b.setAttribute("aria-pressed", "false");
    });
    btn.classList.add("active");
    btn.setAttribute("aria-pressed", "true");

    projectCards.forEach(function (card) {
      // Split rather than includes, so a card tagged "java" is not matched
      // by a filter for "ava", and a card with no tag does not throw
      const categories = (card.getAttribute("data-category") || "").split(" ");

      if (chosen === "all" || categories.indexOf(chosen) !== -1) {
        card.classList.remove("hidden");
        visible++;
      } else {
        card.classList.add("hidden");
      }
    });

    // Show a message instead of an empty grid
    if (visible === 0) {
      noResults.style.display = "block";
    } else {
      noResults.style.display = "none";
    }
  });
});


/* ===== 6. PROJECT DETAILS ===== */

const detailsBtns = document.querySelectorAll(".details-btn");

// Opens or closes one card. Split out from the click handler so that
// opening a card can also close whichever other one was open.
function setDetails(btn, open) {
  // The button sits in the card footer, so go up to the card first
  const card = btn.closest(".project-card");
  const details = card.querySelector(".project-details");

  details.classList.toggle("show", open);

  btn.textContent = open ? "Hide details" : "Details";
  btn.setAttribute("aria-expanded", open ? "true" : "false");
}

detailsBtns.forEach(function (btn) {
  btn.addEventListener("click", function () {
    const card = btn.closest(".project-card");
    const wasOpen = card.querySelector(".project-details").classList.contains("show");

    // Only one card stays open at a time, so close the others first
    detailsBtns.forEach(function (other) {
      if (other !== btn) {
        setDetails(other, false);
      }
    });

    // Clicking the card that is already open closes it again
    setDetails(btn, !wasOpen);
  });
});


/* ===== 7. COPY BUTTONS ===== */

const toast = document.getElementById("toast");
const copyBtns = document.querySelectorAll(".copy-btn");

let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  // Clear the old timer first, otherwise a second click hides the toast
  // early, on the timer the first click started
  clearTimeout(toastTimer);

  toastTimer = setTimeout(function () {
    toast.classList.remove("show");
  }, 2000);
}

// The clipboard API only exists on https and localhost, so a page opened
// straight off the disk needs the old textarea trick as a fallback
function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }

  return new Promise(function (resolve, reject) {
    const box = document.createElement("textarea");

    box.value = text;
    box.setAttribute("readonly", "");
    box.style.position = "fixed";
    box.style.opacity = "0";
    document.body.appendChild(box);
    box.select();

    try {
      document.execCommand("copy") ? resolve() : reject();
    } catch (err) {
      reject(err);
    } finally {
      document.body.removeChild(box);
    }
  });
}

copyBtns.forEach(function (btn) {
  btn.addEventListener("click", function () {
    const text = btn.getAttribute("data-copy");

    copyText(text)
      .then(function () {
        showToast("Copied: " + text);
      })
      .catch(function () {
        showToast("Could not copy, please select the text instead");
      });
  });
});


/* ===== 8. CONTACT FORM ===== */

const CONTACT_EMAIL = "alifhakimii2005@gmail.com";

const form = document.getElementById("contact-form");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const messageInput = document.getElementById("message");
const successMsg = document.getElementById("success-msg");

// Adds or removes the error class on the box around an input
function setError(input, isValid) {
  const group = input.parentElement;

  if (isValid) {
    group.classList.remove("error");
    input.removeAttribute("aria-invalid");
  } else {
    group.classList.add("error");
    input.setAttribute("aria-invalid", "true");
  }

  return isValid;
}

const sendBtn = document.getElementById("send-btn");

// Shows one line under the form. "failed" turns it red and may carry a link.
function setStatus(html, failed) {
  successMsg.innerHTML = html;
  successMsg.classList.toggle("failed", !!failed);
  successMsg.classList.add("show");
}

// If the POST cannot go through, at least let them reach me another way
function mailtoFallback(name, email, message) {
  const subject = "Portfolio enquiry from " + name;
  const body = message + "\n\nFrom: " + name + "\nEmail: " + email;

  return "mailto:" + CONTACT_EMAIL +
    "?subject=" + encodeURIComponent(subject) +
    "&body=" + encodeURIComponent(body);
}

form.addEventListener("submit", function (event) {
  event.preventDefault(); // the fetch below handles it, no page reload

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const message = messageInput.value.trim();

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const nameOk = setError(nameInput, name.length > 1);
  const emailOk = setError(emailInput, emailPattern.test(email));
  const messageOk = setError(messageInput, message.length >= 10);

  if (!nameOk || !emailOk || !messageOk) {
    successMsg.classList.remove("show");

    // Put the cursor in the first field that needs fixing
    if (!nameOk) {
      nameInput.focus();
    } else if (!emailOk) {
      emailInput.focus();
    } else {
      messageInput.focus();
    }

    return;
  }

  sendBtn.disabled = true;
  setStatus("Sending\u2026", false);

  // Built from the form itself, so the hidden FormSubmit fields and the spam
  // trap come along without being listed twice.
  const payload = new FormData(form);
  payload.set("_subject", "Portfolio enquiry from " + name);

  // The /ajax/ endpoint answers with JSON instead of redirecting away, so the
  // visitor stays on the page. Sending FormData rather than a JSON string is
  // deliberate: a JSON content type makes the browser send a CORS preflight
  // first, which is a second round trip and one more thing to fail.
  fetch("https://formsubmit.co/ajax/" + CONTACT_EMAIL, {
    method: "POST",
    headers: { "Accept": "application/json" },
    body: payload
  })
    .then(function (response) {
      return response.json().catch(function () {
        return {};
      });
    })
    .then(function (data) {
      // FormSubmit answers with success as the string "true"
      if (String(data.success) === "true") {
        form.reset();
        setStatus("Thank you. Your message has been sent, I reply within two working days.", false);
      } else {
        throw new Error(data.message || "FormSubmit rejected the message");
      }
    })
    .catch(function (error) {
      // FormSubmit explains refusals properly ("needs activation", "open this
      // page through a web server"). The visitor does not need to read that,
      // but I do when something stops working, so it goes to the console.
      console.warn("Contact form could not send:", error.message);

      // Offline, blocked, or the endpoint is down. Hand them the email instead
      // of pretending it went through.
      setStatus(
        "Sorry, that did not send. Please email me directly at " +
          '<a href="' + mailtoFallback(name, email, message) + '">' + CONTACT_EMAIL + "</a>.",
        true
      );
    })
    .then(function () {
      sendBtn.disabled = false;
    });
});


// Clear the red border as soon as they start fixing the field
const formInputs = document.querySelectorAll("#contact-form input, #contact-form textarea");

formInputs.forEach(function (input) {
  input.addEventListener("input", function () {
    input.parentElement.classList.remove("error");
    input.removeAttribute("aria-invalid");
  });
});


/* ===== 9. CANVAS - PETRONAS TOWER FLOOR PLAN =====
   The Twin Towers floor plan is a Rub el Hizb: two squares, one turned 45
   degrees on top of the other, which makes an eight pointed star.
   Here it is drawn as 11 stars getting smaller towards the middle,
   one for every 8 of the 88 floors. Star number 6 is the skybridge. */

const canvas = document.getElementById("tower-canvas");
const ctx = canvas.getContext("2d");

let angle = 0;

// CSS pixels, which is what the drawing below works in. Set by sizeCanvas().
let cssWidth = 0;
let cssHeight = 0;

// Setting canvas.width is what makes a canvas blurry on a phone or a retina
// screen: the backing store ends up smaller than the pixels it is stretched
// over. Multiply by the device ratio and scale the context back down. It also
// wipes the canvas and reallocates, so this is kept out of the draw loop and
// only run on load and on resize.
function sizeCanvas() {
  const ratio = window.devicePixelRatio || 1;

  cssWidth = canvas.offsetWidth;
  cssHeight = canvas.offsetHeight;

  canvas.width = Math.round(cssWidth * ratio);
  canvas.height = Math.round(cssHeight * ratio);

  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

// Draws the two squares that make one star
function drawStar(centreX, centreY, radius, rotation) {
  for (let square = 0; square < 2; square++) {
    ctx.beginPath();

    for (let corner = 0; corner < 4; corner++) {
      // Quarter turn between corners, plus an eighth turn for the second square
      const a = rotation + (square * Math.PI / 4) + (corner * Math.PI / 2);
      const x = centreX + Math.cos(a) * radius;
      const y = centreY + Math.sin(a) * radius;

      if (corner === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.closePath();
    ctx.stroke();
  }
}

function drawTower() {
  const centreX = cssWidth / 2;
  const centreY = cssHeight / 2;
  const biggest = Math.min(cssWidth, cssHeight) * 0.4;

  // Read the theme colours out of the CSS so dark mode works too
  const styles = getComputedStyle(document.documentElement);
  const green = styles.getPropertyValue("--primary-light").trim();
  const grey = styles.getPropertyValue("--border").trim();

  ctx.clearRect(0, 0, cssWidth, cssHeight);

  for (let i = 0; i < 11; i++) {
    const step = i / 10;

    if (i === 5) {
      ctx.strokeStyle = green; // skybridge level
      ctx.lineWidth = 2;
    } else {
      ctx.strokeStyle = grey;
      ctx.lineWidth = 1;
    }

    // Inner stars are smaller and spin slightly faster
    drawStar(centreX, centreY, biggest * (1 - step * 0.6), angle * (1 + step));
  }

  // Outline of the widest floor
  ctx.strokeStyle = green;
  ctx.lineWidth = 1.5;
  drawStar(centreX, centreY, biggest, angle);
}

function animate() {
  angle += 0.002;
  drawTower();
  requestAnimationFrame(animate);
}

// Skip the spinning if the user prefers reduced motion
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

sizeCanvas();

if (reducedMotion) {
  drawTower();
} else {
  animate();
}

// Resizing is the only time the canvas needs measuring again
let resizeTimer;

window.addEventListener("resize", function () {
  clearTimeout(resizeTimer);

  resizeTimer = setTimeout(function () {
    sizeCanvas();
    drawTower();
  }, 150);
});


/* ===== 10. SCROLL REVEAL =====
   Fades sections in as they come up the page. The class on the body tells
   the stylesheet that JavaScript is running, so without it nothing hides. */

document.body.classList.add("js-ready");

const revealItems = document.querySelectorAll(".reveal");

const revealWatcher = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealWatcher.unobserve(entry.target); // only needs to happen once
    }
  });
}, { threshold: 0.15 });

revealItems.forEach(function (item) {
  revealWatcher.observe(item);
});


/* ===== 11. COUNTING NUMBERS =====
   Counts the stat boxes up from zero the first time you scroll past them. */

// Only the boxes given a data-target are animated
const statNumbers = document.querySelectorAll(".stat-number[data-target]");

function countUp(element) {
  const target = parseFloat(element.getAttribute("data-target"));
  const decimals = parseInt(element.getAttribute("data-decimals")) || 0;
  const suffix = element.getAttribute("data-suffix") || "";
  const steps = 45;

  // Counting up is decoration, so skip straight to the number if the
  // visitor has asked for less movement
  if (reducedMotion) {
    element.textContent = target.toFixed(decimals) + suffix;
    return;
  }

  let current = 0;
  let step = 0;

  element.textContent = (0).toFixed(decimals) + suffix; // start from zero now that we know JS is running

  const timer = setInterval(function () {
    step++;
    current = (target / steps) * step;

    if (step >= steps) {
      current = target;
      clearInterval(timer);
    }

    element.textContent = current.toFixed(decimals) + suffix;
  }, 20);
}

const statsWatcher = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting) {
      countUp(entry.target);
      statsWatcher.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

statNumbers.forEach(function (number) {
  statsWatcher.observe(number);
});


/* ===== 12. ROTATING TEXT IN THE HERO =====
   Types out each phrase, pauses, deletes it, then moves to the next one. */

const roleText = document.getElementById("role-text");

const phrases = [
  "Sunway University",
  "PETRONAS PESP Scholar",
  "Java & Python",
  "Open to internships"
];

let phraseIndex = 0;
let letterIndex = 0;
let deleting = false;

function typeEffect() {
  const phrase = phrases[phraseIndex];

  if (deleting) {
    letterIndex--;
  } else {
    letterIndex++;
  }

  roleText.textContent = phrase.substring(0, letterIndex);

  let wait = deleting ? 40 : 90;

  if (!deleting && letterIndex === phrase.length) {
    wait = 1800;      // hold the finished phrase for a moment
    deleting = true;
  } else if (deleting && letterIndex === 0) {
    deleting = false;
    phraseIndex = (phraseIndex + 1) % phrases.length; // back to the start after the last one
    wait = 400;
  }

  setTimeout(typeEffect, wait);
}

// Reduced motion means no typing, just show the first phrase
if (reducedMotion) {
  roleText.textContent = phrases[0];
} else {
  typeEffect();
}
