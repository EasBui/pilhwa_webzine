const GALLERY_INDEX_PATH = "gallery/gallery.json";
const CHUNK_SIZE = 8;

const archiveElement = document.querySelector("#gallery-archive");
const statusElement = document.querySelector("#gallery-feed-status");
const sentinelElement = document.querySelector("#gallery-sentinel");
const lightboxElement = document.querySelector("#gallery-lightbox");
const lightboxBackdrop = document.querySelector("#gallery-lightbox-backdrop");
const lightboxCloseButton = document.querySelector("#gallery-lightbox-close");
const lightboxImage = document.querySelector("#gallery-lightbox-image");
const lightboxCaption = document.querySelector("#gallery-lightbox-caption");

let items = [];
let visibleCount = 0;
let observer;

initGalleryPage();

async function initGalleryPage() {
  if (!archiveElement) {
    return;
  }

  bindLightboxEvents();

  try {
    items = await loadGalleryIndex();

    if (!items.length) {
      archiveElement.innerHTML = `<p class="content-placeholder">표시할 사진이 없습니다.</p>`;
      updateFeedStatus();
      return;
    }

    visibleCount = Math.min(CHUNK_SIZE, items.length);
    renderVisibleItems();
    createObserver();
  } catch (error) {
    archiveElement.innerHTML = `<p class="content-placeholder">${escapeHtml(error.message)}</p>`;
    updateFeedStatus(error.message);
  }
}

async function loadGalleryIndex() {
  const response = await fetch(GALLERY_INDEX_PATH);
  if (!response.ok) {
    throw new Error("갤러리 목록을 불러오지 못했습니다.");
  }

  const payload = await response.json();
  return payload
    .slice()
    .sort((left, right) => {
      const leftValue = `${left.year}${left.month}${left.day}${left.src}`;
      const rightValue = `${right.year}${right.month}${right.day}${right.src}`;
      return rightValue.localeCompare(leftValue);
    });
}

function renderVisibleItems() {
  const visibleItems = items.slice(0, visibleCount);
  const groups = groupByMonth(visibleItems);
  archiveElement.innerHTML = groups.map((group) => renderMonthGroup(group)).join("");
  updateFeedStatus();
}

function groupByMonth(list) {
  const map = new Map();

  list.forEach((item) => {
    const key = `${item.year}-${item.month}`;
    if (!map.has(key)) {
      map.set(key, {
        year: item.year,
        month: item.month,
        items: [],
      });
    }

    map.get(key).items.push(item);
  });

  return Array.from(map.values());
}

function renderMonthGroup(group) {
  return `
    <section class="gallery-month-section">
      <p class="gallery-month-label">${group.year} / ${group.month}</p>
      <div class="gallery-photo-grid">
        ${group.items.map((item, index) => renderPhotoCell(item, index)).join("")}
      </div>
    </section>
  `;
}

function renderPhotoCell(item, index) {
  const label = `${item.year}.${item.month}.${item.day} 활동 사진 ${index + 1}`;
  return `
    <button
      class="gallery-photo-button"
      type="button"
      data-src="${item.src}"
      data-label="${label}"
      aria-label="${label}"
    >
      <img src="${item.src}" alt="${label}" loading="lazy" />
    </button>
  `;
}

function createObserver() {
  if (!sentinelElement) {
    return;
  }

  observer?.disconnect();
  observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) {
        return;
      }

      loadMore();
    },
    { rootMargin: "240px 0px" }
  );

  observer.observe(sentinelElement);
}

function loadMore() {
  if (visibleCount >= items.length) {
    observer?.disconnect();
    updateFeedStatus();
    return;
  }

  visibleCount = Math.min(visibleCount + CHUNK_SIZE, items.length);
  renderVisibleItems();

  if (visibleCount >= items.length) {
    observer?.disconnect();
  }
}

function updateFeedStatus(errorMessage = "") {
  if (!statusElement) {
    return;
  }

  if (errorMessage) {
    statusElement.textContent = errorMessage;
    return;
  }

  if (!items.length) {
    statusElement.textContent = "";
    return;
  }

  if (visibleCount < items.length) {
    statusElement.textContent = `${visibleCount} / ${items.length}장 표시 중`;
    return;
  }

  statusElement.textContent = `총 ${items.length}장`;
}

function bindLightboxEvents() {
  archiveElement?.addEventListener("click", (event) => {
    const button = event.target.closest(".gallery-photo-button");
    if (!button) {
      return;
    }

    openLightbox({
      src: button.dataset.src,
      label: button.dataset.label,
    });
  });

  lightboxBackdrop?.addEventListener("click", closeLightbox);
  lightboxCloseButton?.addEventListener("click", closeLightbox);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeLightbox();
    }
  });
}

function openLightbox(item) {
  if (!lightboxElement || !lightboxImage || !lightboxCaption) {
    return;
  }

  lightboxImage.src = item.src;
  lightboxImage.alt = item.label;
  lightboxCaption.textContent = item.label;
  lightboxElement.classList.add("is-open");
  lightboxElement.setAttribute("aria-hidden", "false");
  document.body.classList.add("gallery-lightbox-open");
}

function closeLightbox() {
  if (!lightboxElement || !lightboxImage || !lightboxCaption) {
    return;
  }

  lightboxElement.classList.remove("is-open");
  lightboxElement.setAttribute("aria-hidden", "true");
  lightboxImage.removeAttribute("src");
  lightboxImage.alt = "";
  lightboxCaption.textContent = "";
  document.body.classList.remove("gallery-lightbox-open");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
