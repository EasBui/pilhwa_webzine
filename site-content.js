const WEBZINE_YAML_PATH = "contents/webzine.yaml";
const CRITIQUE_YAML_PATH = "contents/critique.yaml";
const CALENDAR_YAML_PATH = "contents/calendar.yaml";

let webzineCache;
let critiqueCache;
let calendarCache;

export async function loadWebzineManifest() {
  if (!webzineCache) {
    webzineCache = fetchYamlList(WEBZINE_YAML_PATH).then((entries) =>
      Promise.all(entries.map((entry) => buildWebzineItem(entry)))
    );
  }

  return webzineCache;
}

export async function loadCritiqueManifest() {
  if (!critiqueCache) {
    critiqueCache = fetchYamlList(CRITIQUE_YAML_PATH).then((entries) =>
      entries.map((entry) => ({
        src: entry.src,
        comment: entry.comment,
      }))
    );
  }

  return critiqueCache;
}

export async function loadCalendarManifest() {
  if (!calendarCache) {
    calendarCache = fetchYamlList(CALENDAR_YAML_PATH).then((entries) =>
      entries
        .filter((entry) => entry.date && entry.title)
        .map((entry) => ({
          date: String(entry.date),
          title: entry.title,
          content: entry.content || "",
        }))
    );
  }

  return calendarCache;
}

export async function loadMarkdownContent(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error("콘텐츠 본문을 불러오지 못했습니다.");
  }

  return response.text();
}

async function fetchYamlList(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error("콘텐츠 목록을 불러오지 못했습니다.");
  }

  return parseSimpleYamlList(await response.text());
}

async function buildWebzineItem(entry) {
  const markdownPath = entry.content;
  const markdown = await loadMarkdownContent(markdownPath);
  const body = stripFrontmatter(markdown);

  return {
    slug: deriveSlug(markdownPath),
    title: entry.title,
    author: entry.author,
    date: entry.date,
    path: markdownPath,
    body,
    summary: extractSummary(body),
    cover: extractCover(body, markdownPath),
  };
}

function parseSimpleYamlList(yaml) {
  const items = [];
  const lines = yaml.split(/\r?\n/);
  let current = null;

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const line = rawLine.replace(/\t/g, "  ");
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    if (trimmed.startsWith("- ")) {
      if (current) {
        items.push(current);
      }

      current = {};
      index = assignYamlPair(current, trimmed.slice(2), lines, index, 0);
      continue;
    }

    if (current && /^\s{2,}[^:#]+:/.test(line)) {
      const indent = line.match(/^(\s*)/)?.[1].length ?? 0;
      index = assignYamlPair(current, trimmed, lines, index, indent);
    }
  }

  if (current) {
    items.push(current);
  }

  return items;
}

function assignYamlPair(target, line, lines, index, indent) {
  const separatorIndex = line.indexOf(":");
  if (separatorIndex === -1) {
    return index;
  }

  const key = line.slice(0, separatorIndex).trim();
  const rawValue = line.slice(separatorIndex + 1).trim();
  const { value, nextIndex } = parseYamlValue(rawValue, lines, index, indent);
  target[key] = value;
  return nextIndex;
}

function parseYamlValue(rawValue, lines, index, indent) {
  if (rawValue === "|" || rawValue === ">") {
    const blockLines = [];
    let nextIndex = index + 1;

    while (nextIndex < lines.length) {
      const currentLine = lines[nextIndex].replace(/\t/g, "  ");
      const currentTrimmed = currentLine.trim();
      const currentIndent = currentLine.match(/^(\s*)/)?.[1].length ?? 0;

      if (currentTrimmed && currentIndent <= indent) {
        break;
      }

      blockLines.push(currentLine);
      nextIndex += 1;
    }

    return {
      value: normalizeYamlBlock(blockLines, rawValue === ">"),
      nextIndex: nextIndex - 1,
    };
  }

  return {
    value: parseYamlScalar(rawValue),
    nextIndex: index,
  };
}

function parseYamlScalar(value) {
  if (!value) {
    return "";
  }

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    try {
      return JSON.parse(value);
    } catch {
      return value.slice(1, -1);
    }
  }

  return value;
}

function normalizeYamlBlock(lines, fold) {
  const nonEmptyLines = lines.filter((line) => line.trim());
  const baseIndent = nonEmptyLines.length
    ? Math.min(...nonEmptyLines.map((line) => line.match(/^(\s*)/)?.[1].length ?? 0))
    : 0;

  const normalized = lines.map((line) => {
    if (!line.trim()) {
      return "";
    }

    return line.slice(baseIndent);
  });

  if (!fold) {
    return normalized.join("\n").trim();
  }

  return normalized.join(" ").replace(/\s+/g, " ").trim();
}

export function stripFrontmatter(markdown) {
  return markdown.replace(/^---\n[\s\S]*?\n---\n?/, "");
}

export function resolveAssetPath(basePath, relativePath) {
  return new URL(relativePath, new URL(basePath, window.location.href)).pathname;
}

export function normalizeContentHtml(body, markdownPath) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div class="content-document">${body}</div>`, "text/html");
  const root = doc.body.firstElementChild;

  if (!root) {
    return "";
  }

  root.querySelectorAll("[src], [href]").forEach((element) => {
    const attribute = element.hasAttribute("src") ? "src" : "href";
    const value = element.getAttribute(attribute);
    if (!value || /^(https?:|data:|#)/.test(value)) {
      return;
    }

    element.setAttribute(attribute, resolveAssetPath(markdownPath, value));
  });

  const contentHeader = root.querySelector(".content-header");
  if (contentHeader) {
    contentHeader.querySelector("h2")?.remove();
    contentHeader.querySelector(".content-meta")?.remove();
    contentHeader.querySelector(".accent-line")?.remove();
  }

  return root.innerHTML;
}

function extractSummary(body) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${body}</div>`, "text/html");
  const introText =
    doc.querySelector(".content-intro")?.textContent?.trim() ||
    doc.querySelector("p")?.textContent?.trim() ||
    "";

  return introText.replace(/\s+/g, " ");
}

function extractCover(body, markdownPath) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${body}</div>`, "text/html");
  const source = doc.querySelector("img")?.getAttribute("src");

  if (!source) {
    return "";
  }

  return resolveAssetPath(markdownPath, source);
}

function deriveSlug(markdownPath) {
  const parts = markdownPath.split("/");
  return parts[parts.length - 2] || markdownPath;
}

export function formatDate(dateString) {
  return dateString.replace(/-/g, ".");
}

export function contentUrl(slug) {
  return `content-detail.html?slug=${encodeURIComponent(slug)}`;
}

export function renderSimpleMarkdown(markdown) {
  const lines = String(markdown || "").replace(/\r\n/g, "\n").split("\n");
  const blocks = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();

    if (!line) {
      continue;
    }

    if (/^#{1,3}\s+/.test(line)) {
      const level = Math.min(3, line.match(/^#+/)?.[0].length ?? 1);
      const text = line.replace(/^#{1,3}\s+/, "");
      blocks.push(`<h${level}>${renderInlineMarkdown(text)}</h${level}>`);
      continue;
    }

    if (/^- /.test(line)) {
      const items = [];

      while (index < lines.length && /^- /.test(lines[index].trim())) {
        items.push(`<li>${renderInlineMarkdown(lines[index].trim().slice(2))}</li>`);
        index += 1;
      }

      index -= 1;
      blocks.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    const paragraph = [line];
    while (index + 1 < lines.length) {
      const nextLine = lines[index + 1].trim();
      if (!nextLine || /^#{1,3}\s+/.test(nextLine) || /^- /.test(nextLine)) {
        break;
      }

      paragraph.push(nextLine);
      index += 1;
    }

    blocks.push(`<p>${renderInlineMarkdown(paragraph.join(" "))}</p>`);
  }

  return blocks.join("");
}

function renderInlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
