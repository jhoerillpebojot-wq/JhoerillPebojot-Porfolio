const moduleButtons = document.querySelectorAll("[data-target]");
const modules = document.querySelectorAll("[data-module]");
const navItems = document.querySelectorAll(".nav-item");
const stage = document.querySelector(".stage");
const themeToggle = document.querySelector("#themeToggle");
const themeIcon = document.querySelector("#themeIcon");
const menuToggle = document.querySelector("#menuToggle");
const contactForm = document.querySelector("#contactForm");
const ratingForm = document.querySelector("#ratingForm");
const reviewList = document.querySelector("#reviewList");
const ratingAverage = document.querySelector("#ratingAverage");
const ratingCount = document.querySelector("#ratingCount");
const typingText = document.querySelector("#typingText");
const reviewStatus = document.querySelector("#reviewStatus");
const reviewsApiUrl = "/api/reviews";

const starterReviews = [
  {
    name: "Mika Reyes",
    role: "Project client",
    rating: 5,
    comment: "Clear updates, polished UI, and the final page felt custom.",
    date: "May 2026",
  },
  {
    name: "Aaron Cruz",
    role: "Teammate",
    rating: 5,
    comment: "Fast builder with a good eye for layout and small details.",
    date: "May 2026",
  },
];

let reviews = getStoredReviews() || starterReviews;
let moduleSwitchTimer;
const typingPhrases = ["everyday work", "clean systems", "useful screens", "organized data"];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function getStoredReviews() {
  try {
    const storedReviews = JSON.parse(localStorage.getItem("portfolioReviews") || "null");
    return Array.isArray(storedReviews) ? storedReviews : null;
  } catch {
    return null;
  }
}

function saveStoredReviews(nextReviews) {
  localStorage.setItem("portfolioReviews", JSON.stringify(nextReviews));
}

function setReviewStatus(message, type = "") {
  if (!reviewStatus) return;

  reviewStatus.textContent = message;
  reviewStatus.classList.toggle("is-error", type === "error");
  reviewStatus.classList.toggle("is-success", type === "success");
}

function activateModule(nextModule) {
  modules.forEach((module) => {
    module.classList.toggle("is-active", module.dataset.module === nextModule);
  });

  navItems.forEach((item) => {
    item.classList.toggle("is-active", item.dataset.target === nextModule);
  });

  if (location.hash.slice(1) !== nextModule) {
    history.replaceState(null, "", `#${nextModule}`);
  }

  document.body.classList.remove("menu-open");
  menuToggle?.setAttribute("aria-expanded", "false");
  menuToggle?.setAttribute("aria-label", "Open menu");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setActiveModule(moduleName) {
  const moduleExists = [...modules].some((module) => module.dataset.module === moduleName);
  const nextModule = moduleExists ? moduleName : "home";
  const currentModule = document.querySelector(".module.is-active")?.dataset.module;

  window.clearTimeout(moduleSwitchTimer);

  if (!stage || !currentModule || currentModule === nextModule) {
    stage?.classList.remove("is-switching");
    activateModule(nextModule);
    return;
  }

  stage.classList.add("is-switching");
  moduleSwitchTimer = window.setTimeout(() => {
    activateModule(nextModule);
    window.requestAnimationFrame(() => stage.classList.remove("is-switching"));
  }, 130);
}

function applyTheme(theme) {
  document.body.classList.toggle("dark", theme === "dark");
  themeIcon.textContent = theme === "dark" ? "L" : "D";
  localStorage.setItem("portfolioTheme", theme);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function starsFor(score) {
  return `${"\u2605".repeat(score)}${"\u2606".repeat(5 - score)}`;
}

function renderReviews() {
  if (!reviewList || !ratingAverage || !ratingCount) return;

  const total = reviews.reduce((sum, review) => sum + Number(review.rating), 0);
  const average = reviews.length ? (total / reviews.length).toFixed(1) : "0.0";

  ratingAverage.textContent = average;
  ratingCount.textContent = reviews.length;
  reviewList.innerHTML = reviews
    .map(
      (review) => `
        <article class="review">
          <div class="review-header">
            <div>
              <strong>${escapeHtml(review.name)}</strong>
              <small>${escapeHtml(review.role)} - ${escapeHtml(review.date)}</small>
            </div>
            <span class="stars" aria-label="${review.rating} out of 5">${starsFor(Number(review.rating))}</span>
          </div>
          <p>${escapeHtml(review.comment)}</p>
        </article>
      `,
    )
    .join("");
}

async function loadSharedReviews() {
  try {
    const response = await fetch(reviewsApiUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) throw new Error("Reviews API is not available.");

    const data = await response.json();

    if (Array.isArray(data.reviews)) {
      reviews = data.reviews.length ? data.reviews : starterReviews;
      saveStoredReviews(reviews);
      renderReviews();
      setReviewStatus("");
    }
  } catch {
    renderReviews();
    setReviewStatus("Shared reviews are not connected yet. New reviews may only show on this device.", "error");
  }
}

async function saveSharedReview(review) {
  const response = await fetch(reviewsApiUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(review),
  });

  if (!response.ok) throw new Error("Review could not be saved online.");

  const data = await response.json();
  if (!Array.isArray(data.reviews)) throw new Error("Invalid reviews response.");
  return data.reviews;
}

function startTypingAnimation() {
  if (!typingText || reducedMotion) return;

  let phraseIndex = 0;
  let letterIndex = typingPhrases[phraseIndex].length;
  let deleting = true;

  function typeNext() {
    const phrase = typingPhrases[phraseIndex];
    typingText.textContent = phrase.slice(0, letterIndex) || "\u00a0";

    if (deleting) {
      letterIndex -= 1;

      if (letterIndex < 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % typingPhrases.length;
        window.setTimeout(typeNext, 260);
        return;
      }
    } else {
      letterIndex += 1;

      if (letterIndex > typingPhrases[phraseIndex].length) {
        deleting = true;
        window.setTimeout(typeNext, 1250);
        return;
      }
    }

    window.setTimeout(typeNext, deleting ? 46 : 76);
  }

  window.setTimeout(typeNext, 950);
}

moduleButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveModule(button.dataset.target));
});

themeToggle.addEventListener("click", () => {
  const nextTheme = document.body.classList.contains("dark") ? "light" : "dark";
  applyTheme(nextTheme);
});

menuToggle.addEventListener("click", () => {
  const isOpen = document.body.classList.toggle("menu-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
});

contactForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(contactForm);
  const name = formData.get("name").trim();
  const email = formData.get("email").trim();
  const subject = formData.get("subject").trim();
  const message = formData.get("message").trim();
  const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);

  window.location.href = `mailto:jhoerillpebojot@gmail.com?subject=${encodeURIComponent(subject)}&body=${body}`;
});

ratingForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(ratingForm);
  const submitButton = ratingForm.querySelector("button[type='submit']");
  const review = {
    name: formData.get("name").trim(),
    role: formData.get("role").trim(),
    rating: Number(formData.get("rating")),
    comment: formData.get("comment").trim(),
  };

  submitButton.disabled = true;
  submitButton.textContent = "Saving...";

  try {
    reviews = await saveSharedReview(review);
    saveStoredReviews(reviews);
    ratingForm.reset();
    renderReviews();
    setReviewStatus("Review saved. It will appear on other devices too.", "success");
  } catch {
    reviews = [
      {
        ...review,
        date: new Date().toLocaleDateString(undefined, {
          month: "short",
          year: "numeric",
        }),
      },
      ...reviews,
    ];
    saveStoredReviews(reviews);
    ratingForm.reset();
    renderReviews();
    setReviewStatus("Saved on this device only. Connect the Vercel review database so it appears everywhere.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit Review";
  }
});

applyTheme(localStorage.getItem("portfolioTheme") || "light");
setActiveModule(location.hash.replace("#", "") || "home");
renderReviews();
loadSharedReviews();
startTypingAnimation();
