import { loadCritiqueManifest } from "./site-content.js";

const listElement = document.querySelector("#critique-list");
const DEFAULT_IMAGE = "default-article.svg";
const previewCache = new Map();

initCritiquePage();

async function initCritiquePage() {
  if (!listElement) {
    return;
  }

  try {
    const items = await loadCritiqueManifest();

    if (!items.length) {
      listElement.innerHTML = `
        <article class="critique-card critique-card--loading">
          <p class="content-placeholder">등록된 한줄 비평이 없습니다.</p>
        </article>
      `;
      return;
    }

    listElement.innerHTML = items
      .map((item, index) => renderCritiqueCard(item, fallbackPreview(item.src), index))
      .join("");

    await Promise.all(
      items.map(async (item, index) => {
        const preview = await fetchArticlePreview(item.src);
        const card = listElement.querySelector(`[data-critique-index="${index}"]`);

        if (!card) {
          return;
        }

        card.outerHTML = renderCritiqueCard(item, preview, index);
      })
    );
  } catch (error) {
    listElement.innerHTML = `
      <article class="critique-card critique-card--loading">
        <p class="content-placeholder">${escapeHtml(error.message)}</p>
      </article>
    `;
  }
}

function renderCritiqueCard(item, preview, index) {
  return `
    <a
      class="critique-card"
      href="${escapeAttribute(item.src)}"
      data-critique-index="${index}"
      target="_blank"
      rel="noreferrer"
    >
      <div class="critique-card-media">
        <img src="${escapeAttribute(preview.image || DEFAULT_IMAGE)}" alt="${escapeAttribute(
    preview.title
  )}" loading="lazy" />
      </div>
      <div class="critique-card-body">
        <p class="critique-card-domain">${escapeHtml(preview.domain)}</p>
        <strong class="critique-card-title">${escapeHtml(preview.title)}</strong>
        <p class="critique-card-comment">${escapeHtml(item.comment)}</p>
      </div>
    </a>
  `;
}

async function fetchArticlePreview(src) {
  if (previewCache.has(src)) {
    return previewCache.get(src);
  }

  const fallback = fallbackPreview(src);

  const request = fetch(`https://api.microlink.io/?url=${encodeURIComponent(src)}`)
    .then(async (response) => {
      if (!response.ok) {
        return fallback;
      }

      const payload = await response.json();
      const data = payload.data || {};

      return {
        title: data.title || fallback.title,
        image: data.image?.url || fallback.image,
        domain: fallback.domain,
      };
    })
    .catch(() => fallback);

  previewCache.set(src, request);
  return request;
}

function fallbackPreview(src) {
  let domain = "원문 기사";

  try {
    domain = new URL(src).hostname.replace(/^www\./, "");
  } catch {
    domain = "원문 기사";
  }

  return {
    title: "기사 제목을 불러오는 중입니다.",
    image: DEFAULT_IMAGE,
    domain,
  };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
