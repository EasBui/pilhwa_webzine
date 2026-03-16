const NAV_GROUPS = [
  {
    key: "intro",
    label: "소개",
    items: [
      { key: "greeting", href: "intro.html", label: "인사" },
      {
        key: "join",
        href: "https://forms.gle/VjEBUtseMVTgzyPb6",
        label: "가입신청",
      },
    ],
  },
  {
    key: "content",
    label: "컨텐츠",
    items: [
      { key: "webzine", href: "content.html", label: "웹진 <필화>" },
      { key: "critique", href: "critique.html", label: "한줄 비평" },
    ],
  },
  {
    key: "activity",
    label: "활동",
    items: [
      { key: "gallery", href: "gallery.html", label: "갤러리" },
      { key: "calendar", href: "calendar.html", label: "캘린더" },
    ],
  },
  {
    key: "resource",
    label: "자료",
    items: [{ key: "resource", href: "resource.html", label: "홍보 및 모집" }],
  },
];

class SiteHeader extends HTMLElement {
  connectedCallback() {
    this.current = this.getAttribute("current");
    this.render();
    this.bindEvents();
  }

  disconnectedCallback() {
    document.removeEventListener("click", this.handleDocumentClick);
  }

  render() {
    this.innerHTML = `
      <header class="site-header">
        <div class="site-brand">
          <a class="brand-mark" href="index.html">필화</a>
          <p class="brand-sub">서울대학교 언론비평 동아리</p>
        </div>
        <nav class="site-nav" aria-label="주요 메뉴">
          ${NAV_GROUPS.map((group) => renderNavGroup(group, this.current)).join("")}
        </nav>
      </header>
    `;
  }

  bindEvents() {
    const groups = Array.from(this.querySelectorAll(".site-nav-group"));
    groups.forEach((group) => {
      group.addEventListener("toggle", () => {
        if (!group.open) {
          return;
        }

        groups.forEach((otherGroup) => {
          if (otherGroup !== group) {
            otherGroup.open = false;
          }
        });
      });

      group.querySelectorAll(".site-nav-link").forEach((link) => {
        link.addEventListener("click", () => {
          group.open = false;
        });
      });
    });

    this.handleDocumentClick = (event) => {
      if (this.contains(event.target)) {
        return;
      }

      groups.forEach((group) => {
        group.open = false;
      });
    };

    document.addEventListener("click", this.handleDocumentClick);
  }
}

function renderNavGroup(group, current) {
  const isActive =
    group.key === current || group.items.some((item) => item.key === current);
  const className = isActive ? "site-nav-group is-active" : "site-nav-group";

  return `
    <details class="${className}">
      <summary class="site-nav-trigger">${group.label}</summary>
      <div class="site-nav-menu">
        ${group.items.map((item) => renderNavItem(item, current)).join("")}
      </div>
    </details>
  `;
}

function renderNavItem(item, current) {
  const isActive = item.key === current;
  const className = isActive ? "site-nav-link is-active" : "site-nav-link";
  const aria = isActive ? ' aria-current="page"' : "";
  return `<a class="${className}" href="${item.href}"${aria}>${item.label}</a>`;
}

customElements.define("site-header", SiteHeader);
