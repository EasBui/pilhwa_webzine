import { loadCalendarManifest, renderSimpleMarkdown } from "./site-content.js";

const currentLabelElement = document.querySelector("#calendar-current-label");
const gridElement = document.querySelector("#calendar-grid");
const detailElement = document.querySelector("#calendar-detail");
const modalElement = document.querySelector("#calendar-modal");
const modalBackdrop = document.querySelector("#calendar-modal-backdrop");
const modalCloseButton = document.querySelector("#calendar-modal-close");
const prevYearButton = document.querySelector("#calendar-prev-year");
const prevMonthButton = document.querySelector("#calendar-prev-month");
const nextMonthButton = document.querySelector("#calendar-next-month");
const nextYearButton = document.querySelector("#calendar-next-year");

let events = [];
let eventMap = new Map();
let currentYear;
let currentMonth;
let selectedDateKey = "";

initCalendarPage();

async function initCalendarPage() {
  if (!gridElement || !detailElement || !currentLabelElement) {
    return;
  }

  try {
    events = await loadCalendarManifest();
    eventMap = buildEventMap(events);

    const today = new Date();
    currentYear = today.getFullYear();
    currentMonth = today.getMonth();
    selectedDateKey = findInitialDateKey(today) || formatDateKey(currentYear, currentMonth + 1, today.getDate());

    bindControls();
    renderCalendar();
  } catch (error) {
    gridElement.innerHTML = `<p class="content-placeholder">${escapeHtml(error.message)}</p>`;
    detailElement.innerHTML = `<p class="content-placeholder">${escapeHtml(error.message)}</p>`;
  }
}

function bindControls() {
  prevYearButton?.addEventListener("click", () => changeMonth(-12));
  prevMonthButton?.addEventListener("click", () => changeMonth(-1));
  nextMonthButton?.addEventListener("click", () => changeMonth(1));
  nextYearButton?.addEventListener("click", () => changeMonth(12));
  modalBackdrop?.addEventListener("click", closeDetailModal);
  modalCloseButton?.addEventListener("click", closeDetailModal);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeDetailModal();
    }
  });
}

function changeMonth(offset) {
  const nextDate = new Date(currentYear, currentMonth + offset, 1);
  currentYear = nextDate.getFullYear();
  currentMonth = nextDate.getMonth();

  if (!selectedDateKey.startsWith(`${currentYear}${pad(currentMonth + 1)}`)) {
    selectedDateKey = findDateKeyInMonth(currentYear, currentMonth) || formatDateKey(currentYear, currentMonth + 1, 1);
  }

  renderCalendar();
}

function renderCalendar() {
  const monthLabel = `${currentYear}.${pad(currentMonth + 1)}`;
  currentLabelElement.textContent = monthLabel;

  const firstDay = new Date(currentYear, currentMonth, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
  const cells = [];

  const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;

  for (let index = 0; index < totalCells; index += 1) {
    const dayOffset = index - startWeekday + 1;
    let cellYear = currentYear;
    let cellMonth = currentMonth;
    let cellDay = dayOffset;
    let outside = false;

    if (dayOffset <= 0) {
      const prevDate = new Date(currentYear, currentMonth - 1, daysInPrevMonth + dayOffset);
      cellYear = prevDate.getFullYear();
      cellMonth = prevDate.getMonth();
      cellDay = prevDate.getDate();
      outside = true;
    } else if (dayOffset > daysInMonth) {
      const nextDate = new Date(currentYear, currentMonth + 1, dayOffset - daysInMonth);
      cellYear = nextDate.getFullYear();
      cellMonth = nextDate.getMonth();
      cellDay = nextDate.getDate();
      outside = true;
    }

    const dateKey = formatDateKey(cellYear, cellMonth + 1, cellDay);
    const dayEvents = eventMap.get(dateKey) || [];
    const isSelected = selectedDateKey === dateKey;
    const isToday = isTodayDate(cellYear, cellMonth, cellDay);
    const classNames = [
      "calendar-cell",
      outside ? "is-outside" : "",
      dayEvents.length ? "has-events" : "",
      isSelected ? "is-selected" : "",
      isToday ? "is-today" : "",
    ]
      .filter(Boolean)
      .join(" ");

    cells.push(`
      <button
        class="${classNames}"
        type="button"
        data-year="${cellYear}"
        data-month="${cellMonth + 1}"
        data-day="${cellDay}"
        data-date-key="${dateKey}"
        aria-label="${cellYear}년 ${cellMonth + 1}월 ${cellDay}일 일정 보기"
      >
        <span class="calendar-cell-day">${cellDay}</span>
        <span class="calendar-cell-events">
          ${dayEvents.slice(0, 2).map((item) => `<span class="calendar-cell-event">${escapeHtml(item.title)}</span>`).join("")}
          ${dayEvents.length > 2 ? `<span class="calendar-cell-more">+${dayEvents.length - 2}</span>` : ""}
        </span>
      </button>
    `);
  }

  gridElement.innerHTML = cells.join("");
  bindCellButtons();
}

function bindCellButtons() {
  gridElement?.querySelectorAll(".calendar-cell").forEach((button) => {
    button.addEventListener("click", () => {
      currentYear = Number(button.dataset.year);
      currentMonth = Number(button.dataset.month) - 1;
      selectedDateKey = String(button.dataset.dateKey || "");
      renderCalendar();
      openDetailModal();
    });
  });
}

function openDetailModal() {
  renderDetail();

  if (!modalElement) {
    return;
  }

  modalElement.classList.add("is-open");
  modalElement.setAttribute("aria-hidden", "false");
  document.body.classList.add("calendar-modal-open");
}

function closeDetailModal() {
  if (!modalElement) {
    return;
  }

  modalElement.classList.remove("is-open");
  modalElement.setAttribute("aria-hidden", "true");
  document.body.classList.remove("calendar-modal-open");
}

function renderDetail() {
  const items = eventMap.get(selectedDateKey) || [];
  const title = formatDetailDate(selectedDateKey);

  if (!items.length) {
    detailElement.innerHTML = `
      <header class="calendar-detail-header">
        <p class="calendar-detail-date">${title}</p>
      </header>
      <p class="calendar-detail-empty">등록된 일정이 없습니다.</p>
    `;
    return;
  }

  detailElement.innerHTML = `
    <header class="calendar-detail-header">
      <p class="calendar-detail-date">${title}</p>
    </header>
    <div class="calendar-detail-list">
      ${items
        .map(
          (item) => `
            <article class="calendar-detail-item">
              <h3>${escapeHtml(item.title)}</h3>
              <div class="calendar-detail-body content-document">
                ${renderSimpleMarkdown(item.content)}
              </div>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function buildEventMap(items) {
  const map = new Map();

  items.forEach((item) => {
    if (!map.has(item.date)) {
      map.set(item.date, []);
    }

    map.get(item.date).push(item);
  });

  return map;
}

function findInitialDateKey(today) {
  const todayKey = formatDateKey(today.getFullYear(), today.getMonth() + 1, today.getDate());
  if (eventMap.has(todayKey)) {
    return todayKey;
  }

  return findDateKeyInMonth(currentYear, currentMonth) || events[0]?.date || "";
}

function findDateKeyInMonth(year, month) {
  const prefix = `${year}${pad(month + 1)}`;
  return events.find((item) => item.date.startsWith(prefix))?.date || "";
}

function formatDateKey(year, month, day) {
  return `${year}${pad(month)}${pad(day)}`;
}

function formatDetailDate(dateKey) {
  if (!dateKey || dateKey.length !== 8) {
    return "일정";
  }

  return `${dateKey.slice(0, 4)}.${dateKey.slice(4, 6)}.${dateKey.slice(6, 8)}`;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function isTodayDate(year, month, day) {
  const today = new Date();
  return (
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day
  );
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
