import { contentUrl, formatDate, loadWebzineManifest } from "./site-content.js";

const GALLERY_INDEX_PATH = "gallery/gallery.json";
const GALLERY_PREVIEW_COUNT = 6;
const FEATURED_ITEM_COUNT = 5;

const featuredElement = document.querySelector("#featured-story");
const featuredPaginationElement = document.querySelector("#featured-story-pagination");
const featuredPrevButton = document.querySelector("#featured-story-prev");
const featuredNextButton = document.querySelector("#featured-story-next");
const galleryStripElement = document.querySelector("#landing-gallery-strip");
let featuredItems = [];
let currentFeaturedIndex = 0;
let featuredScrollFrame = 0;

async function initLandingPage() {
  if (!featuredElement && !galleryStripElement) {
    return;
  }

  featuredPrevButton?.addEventListener("click", () => moveFeatured(-1));
  featuredNextButton?.addEventListener("click", () => moveFeatured(1));
  featuredElement?.addEventListener("scroll", handleFeaturedScroll, { passive: true });

  void initGalleryStrip();

  if (!featuredElement) {
    return;
  }

  try {
    const items = await loadWebzineManifest();
    featuredItems = items.slice(0, FEATURED_ITEM_COUNT);

    if (!featuredItems.length) {
      featuredElement.innerHTML = "";
      updateFeaturedPagination();
      toggleFeaturedButtons();
      return;
    }

    featuredElement.innerHTML = featuredItems
      .map((item, index) => renderFeaturedItem(item, index))
      .join("");
    currentFeaturedIndex = 0;
    syncFeaturedCarousel();
  } catch (error) {
    featuredElement.innerHTML = `
      <article class="landing-featured-card is-loading">
        <p>${escapeHtml(error.message)}</p>
      </article>
    `;
    updateFeaturedPagination();
    toggleFeaturedButtons(true);
  }
}

async function initGalleryStrip() {
  if (!galleryStripElement) {
    return;
  }

  try {
    const galleryItems = await loadGalleryPreview();

    if (!galleryItems.length) {
      galleryStripElement.innerHTML = `<p class="content-placeholder">표시할 사진이 없습니다.</p>`;
      return;
    }

    galleryStripElement.innerHTML = galleryItems.map((item, index) => renderGalleryPreviewItem(item, index)).join("");
  } catch (error) {
    galleryStripElement.innerHTML = `<p class="content-placeholder">${escapeHtml(error.message)}</p>`;
  }
}

function renderFeaturedItem(item, index) {
  const cardClassName =
    index === 0 ? "landing-featured-card is-primary" : "landing-featured-card";
  const summary = item.summary || "본문 요약이 아직 준비되지 않았습니다.";

  return `
    <article class="${cardClassName}" data-featured-index="${index}">
      <a class="landing-featured-link" href="${contentUrl(item.slug)}">
        <div class="landing-featured-media">
          ${
            item.cover
              ? `<img src="${item.cover}" alt="${escapeHtml(item.title)} 대표 이미지" />`
              : `<div class="landing-featured-fallback"></div>`
          }
        </div>
        <div class="landing-featured-body">
          <p class="landing-kicker">Webzine</p>
          <h2>${escapeHtml(item.title)}</h2>
          <p class="landing-featured-summary">${escapeHtml(summary)}</p>
          <div class="landing-featured-meta">
            <span>${escapeHtml(item.author)}</span>
            <span>${formatDate(item.date)}</span>
          </div>
        </div>
      </a>
    </article>
  `;
}

function moveFeatured(direction) {
  if (featuredItems.length <= 1 || !featuredElement) {
    return;
  }

  currentFeaturedIndex =
    (currentFeaturedIndex + direction + featuredItems.length) % featuredItems.length;
  syncFeaturedCarousel({ behavior: "smooth" });
}

function syncFeaturedCarousel(options = {}) {
  updateFeaturedPagination();
  toggleFeaturedButtons();
  updateFeaturedActiveState();

  if (!featuredElement) {
    return;
  }

  const card = featuredElement.querySelector(`[data-featured-index="${currentFeaturedIndex}"]`);
  if (!card) {
    return;
  }

  featuredElement.scrollTo({
    left: card.offsetLeft,
    behavior: options.behavior || "auto",
  });
}

function updateFeaturedPagination() {
  if (!featuredPaginationElement) {
    return;
  }

  if (!featuredItems.length) {
    featuredPaginationElement.textContent = "0 / 0";
    return;
  }

  featuredPaginationElement.textContent = `${currentFeaturedIndex + 1} / ${featuredItems.length}`;
}

function toggleFeaturedButtons(forceDisable = false) {
  const disabled = forceDisable || featuredItems.length <= 1;
  if (featuredPrevButton) {
    featuredPrevButton.disabled = disabled;
  }
  if (featuredNextButton) {
    featuredNextButton.disabled = disabled;
  }
}

function updateFeaturedActiveState() {
  featuredElement?.querySelectorAll("[data-featured-index]").forEach((card, index) => {
    card.classList.toggle("is-active", index === currentFeaturedIndex);
  });
}

function handleFeaturedScroll() {
  if (!featuredElement || !featuredItems.length) {
    return;
  }

  if (featuredScrollFrame) {
    cancelAnimationFrame(featuredScrollFrame);
  }

  featuredScrollFrame = requestAnimationFrame(() => {
    featuredScrollFrame = 0;
    const cards = Array.from(featuredElement.querySelectorAll("[data-featured-index]"));
    if (!cards.length) {
      return;
    }

    const currentScrollLeft = featuredElement.scrollLeft;
    const nextIndex = cards.reduce((closestIndex, card, index) => {
      const closestDistance = Math.abs(cards[closestIndex].offsetLeft - currentScrollLeft);
      const currentDistance = Math.abs(card.offsetLeft - currentScrollLeft);
      return currentDistance < closestDistance ? index : closestIndex;
    }, 0);

    if (nextIndex !== currentFeaturedIndex) {
      currentFeaturedIndex = nextIndex;
      updateFeaturedPagination();
      updateFeaturedActiveState();
    }
  });
}

async function loadGalleryPreview() {
  const response = await fetch(GALLERY_INDEX_PATH);
  if (!response.ok) {
    throw new Error("갤러리 사진을 불러오지 못했습니다.");
  }

  const payload = await response.json();

  return payload
    .slice()
    .sort((left, right) => {
      const leftValue = `${left.year}${left.month}${left.day}${left.src}`;
      const rightValue = `${right.year}${right.month}${right.day}${right.src}`;
      return rightValue.localeCompare(leftValue);
    })
    .slice(0, GALLERY_PREVIEW_COUNT);
}

function renderGalleryPreviewItem(item, index) {
  const label = `${item.year}.${item.month}.${item.day} 활동 사진 ${index + 1}`;

  return `
    <a class="landing-gallery-item" href="gallery.html" aria-label="${escapeHtml(label)}">
      <img src="${item.src}" alt="${escapeHtml(label)}" loading="lazy" />
    </a>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

initLandingPage();
