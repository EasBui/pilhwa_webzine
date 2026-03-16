import { contentUrl, formatDate, loadWebzineManifest } from "./site-content.js";

const GALLERY_INDEX_PATH = "gallery/gallery.json";
const GALLERY_PREVIEW_COUNT = 6;

const carouselElement = document.querySelector("#featured-story");
const paginationElement = document.querySelector("#hero-carousel-pagination");
const prevButton = document.querySelector("#hero-carousel-prev");
const nextButton = document.querySelector("#hero-carousel-next");
const galleryStripElement = document.querySelector("#landing-gallery-strip");

let items = [];
let currentIndex = 0;

async function initLandingPage() {
  if (!carouselElement && !galleryStripElement) {
    return;
  }

  prevButton?.addEventListener("click", () => move(-1));
  nextButton?.addEventListener("click", () => move(1));

  void initGalleryStrip();

  if (!carouselElement) {
    return;
  }

  try {
    items = await loadWebzineManifest();

    if (!items.length) {
      carouselElement.innerHTML = "";
      updatePagination();
      toggleButtons();
      return;
    }

    renderCurrentItem();
    updatePagination();
    toggleButtons();
  } catch (error) {
    carouselElement.innerHTML = `
      <article class="landing-carousel-card is-loading">
        <p>${escapeHtml(error.message)}</p>
      </article>
    `;
    updatePagination(true);
    toggleButtons(true);
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

function move(direction) {
  if (!items.length) {
    return;
  }

  currentIndex = (currentIndex + direction + items.length) % items.length;
  renderCurrentItem();
  updatePagination();
}

function renderCurrentItem() {
  const item = items[currentIndex];
  if (!item) {
    return;
  }

  carouselElement.innerHTML = `
    <article class="landing-carousel-card">
      <a class="landing-carousel-link" href="${contentUrl(item.slug)}">
        <div class="landing-carousel-media">
          ${
            item.cover
              ? `<img src="${item.cover}" alt="${escapeHtml(item.title)} 대표 이미지" />`
              : `<div class="landing-carousel-fallback"></div>`
          }
        </div>
        <div class="landing-carousel-body">
          <h2>${escapeHtml(item.title)}</h2>
          <p>${escapeHtml(item.summary)}</p>
          <div class="landing-carousel-meta">
            <span>${escapeHtml(item.author)}</span>
            <span>${formatDate(item.date)}</span>
          </div>
        </div>
      </a>
    </article>
  `;
}

function updatePagination(hasError = false) {
  if (!paginationElement) {
    return;
  }

  if (hasError || !items.length) {
    paginationElement.textContent = "0 / 0";
    return;
  }

  paginationElement.textContent = `${currentIndex + 1} / ${items.length}`;
}

function toggleButtons(forceDisable = false) {
  const disabled = forceDisable || items.length <= 1;
  if (prevButton) {
    prevButton.disabled = disabled;
  }
  if (nextButton) {
    nextButton.disabled = disabled;
  }
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
