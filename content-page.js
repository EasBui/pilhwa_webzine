import { contentUrl, formatDate, loadWebzineManifest } from "./site-content.js";

const listElement = document.querySelector("#content-list");
const countElement = document.querySelector("#content-count");
const paginationElement = document.querySelector("#content-pagination");
const PAGE_SIZE = 8;

async function initContentPage() {
  if (!listElement) {
    return;
  }

  try {
    const manifest = await loadWebzineManifest();
    const totalPages = Math.max(1, Math.ceil(manifest.length / PAGE_SIZE));
    const currentPage = getCurrentPage(totalPages);
    const pageItems = manifest.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    if (countElement) {
      countElement.textContent = `총 ${manifest.length}편 · ${currentPage} / ${totalPages} 페이지`;
    }

    if (!manifest.length) {
      listElement.innerHTML = `
        <article class="content-grid-card content-grid-card--loading">
          <p class="content-placeholder">표시할 콘텐츠가 없습니다.</p>
        </article>
      `;
      if (paginationElement) {
        paginationElement.innerHTML = "";
      }
      return;
    }

    listElement.innerHTML = pageItems
      .map(
        (item) => `
          <a class="content-grid-card" href="${contentUrl(item.slug)}">
            <div class="content-grid-card-media">
              ${
                item.cover
                  ? `<img src="${item.cover}" alt="${escapeHtml(item.title)} 대표 이미지" />`
                  : `<div class="content-grid-card-fallback"></div>`
              }
            </div>
            <div class="content-grid-card-body">
              <strong class="content-grid-card-title">${escapeHtml(item.title)}</strong>
              <div class="content-grid-card-meta">${escapeHtml(item.author)}</div>
              <p class="content-grid-card-summary">${escapeHtml(item.summary)}</p>
              <span class="content-grid-card-date">${formatCardDate(item.date)}</span>
            </div>
          </a>
        `
      )
      .join("");

    renderPagination(currentPage, totalPages);
  } catch (error) {
    listElement.innerHTML = `
      <article class="content-grid-card content-grid-card--loading">
        <p class="content-placeholder">${escapeHtml(error.message)}</p>
      </article>
    `;
  }
}

function renderPagination(currentPage, totalPages) {
  if (!paginationElement) {
    return;
  }

  if (totalPages <= 1) {
    paginationElement.innerHTML = "";
    return;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  paginationElement.innerHTML = pages
    .map((page) => {
      const className =
        page === currentPage ? "pagination-link is-current" : "pagination-link";
      return `<a class="${className}" href="?page=${page}" aria-label="${page}페이지로 이동">${page}</a>`;
    })
    .join("");
}

function getCurrentPage(totalPages) {
  const params = new URLSearchParams(window.location.search);
  const value = Number(params.get("page"));

  if (!Number.isInteger(value) || value < 1) {
    return 1;
  }

  return Math.min(value, totalPages);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatCardDate(dateString) {
  return formatDate(dateString).replace(/\./g, "/");
}

initContentPage();
