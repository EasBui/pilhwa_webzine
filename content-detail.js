import {
  formatDate,
  loadWebzineManifest,
  normalizeContentHtml,
} from "./site-content.js";

const readerElement = document.querySelector("#content-reader");

async function initContentDetailPage() {
  if (!readerElement) {
    return;
  }

  try {
    const manifest = await loadWebzineManifest();
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug");
    const item = manifest.find((entry) => entry.slug === slug) ?? manifest[0];

    if (!item) {
      renderMessage("표시할 콘텐츠가 없습니다.");
      return;
    }

    const html = normalizeContentHtml(item.body, item.path);

    readerElement.innerHTML = `
      <div class="content-reader-shell">
        <header class="content-reader-header">
          <h1>${escapeHtml(item.title)}</h1>
          <p class="content-reader-byline">${escapeHtml(item.author)} (${formatDate(item.date)})</p>
        </header>
        <hr class="content-divider" />
        <div class="content-reader-body content-document">
          ${html}
        </div>
      </div>
    `;
  } catch (error) {
    renderMessage(error.message);
  }
}

function renderMessage(message) {
  readerElement.innerHTML = `
    <div class="content-reader-shell">
      <p class="content-placeholder">${escapeHtml(message)}</p>
    </div>
  `;
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

initContentDetailPage();
