/* =========================
   DAILY PULSE JAVASCRIPT
========================= */

(() => {
    "use strict";

    const $ = (s, scope = document) => scope.querySelector(s);
    const $$ = (s, scope = document) => [...scope.querySelectorAll(s)];

    // Lowercase and strip accents so searches are forgiving
    const normalize = (t = "") =>
        t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    const debounce = (fn, delay = 150) => {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    };

    /* ---------- Date and footer year ---------- */
    const dateEl = $("#current-date");
    if (dateEl) {
        dateEl.textContent = new Date().toLocaleDateString("ms-MY", {
            weekday: "long", day: "numeric", month: "long", year: "numeric"
        });
    }
    $$("[data-year]").forEach(el => (el.textContent = new Date().getFullYear()));

    /* ---------- Mobile menu ---------- */
    const menuToggle = $("#menu-toggle");
    const mainNav = $("#main-nav");

    if (menuToggle && mainNav) {
        const setMenu = open => {
            mainNav.classList.toggle("open", open);
            menuToggle.setAttribute("aria-expanded", String(open));
        };
        menuToggle.addEventListener("click", () => setMenu(!mainNav.classList.contains("open")));
        $$("a", mainNav).forEach(a => a.addEventListener("click", () => setMenu(false)));
    }

    /* ---------- Search ---------- */
    const searchToggle = $("#search-toggle");
    const searchBox = $("#search-box");
    const searchInput = $("#search-input");
    const searchSubmit = $("#search-submit");
    const newsSection = $("#latest");
    const newsGrid = $(".news-grid");
    const newsCards = $$(".news-card");

    const noResults = document.createElement("p");
    noResults.className = "no-results";
    noResults.setAttribute("role", "status");
    noResults.hidden = true;
    newsGrid?.after(noResults);

    const setSearch = open => {
        if (!searchBox) return;
        searchBox.classList.toggle("open", open);
        searchToggle?.setAttribute("aria-expanded", String(open));
        if (open) searchInput?.focus();
    };

    function filterNews(raw) {
        const words = normalize(raw).split(/\s+/).filter(Boolean);
        let visible = 0;

        newsCards.forEach(card => {
            const text = normalize(`${card.textContent} ${card.dataset.search || ""}`);
            const match = words.every(w => text.includes(w));
            card.classList.toggle("hidden", !match);
            if (match) visible++;
        });

        const empty = words.length > 0 && visible === 0;
        noResults.hidden = !empty;
        noResults.textContent = empty
            ? `Tiada berita ditemui untuk “${raw.trim()}”. Cuba kata kunci lain.`
            : "";
    }

    const runSearch = () => {
        if (!searchInput) return;

        // On a story page there are no cards, so send the search to the front page
        if (!newsCards.length) {
            location.href = "index.html?q=" + encodeURIComponent(searchInput.value.trim());
            return;
        }

        filterNews(searchInput.value);
        newsSection?.scrollIntoView({ behavior: "smooth" });
    };

    searchToggle?.addEventListener("click", () =>
        setSearch(!searchBox.classList.contains("open"))
    );
    searchSubmit?.addEventListener("click", runSearch);

    if (searchInput) {
        searchInput.addEventListener("input", debounce(() => filterNews(searchInput.value)));
        searchInput.addEventListener("keydown", e => {
            if (e.key === "Enter") { e.preventDefault(); runSearch(); }
            if (e.key === "Escape") {
                searchInput.value = "";
                filterNews("");
                setSearch(false);
                searchToggle?.focus();
            }
        });
    }

    // Search coming from a story page (index.html?q=pahang)
    const startQuery = new URLSearchParams(location.search).get("q");
    if (startQuery && newsCards.length && searchInput) {
        searchInput.value = startQuery;
        setSearch(true);
        filterNews(startQuery);
    }

    // Press "/" to open search when not typing in a field
    document.addEventListener("keydown", e => {
        const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);
        if (e.key === "/" && !typing && searchInput) {
            e.preventDefault();
            setSearch(true);
        }
    });

    // Click outside closes search
    document.addEventListener("click", e => {
        if (searchBox?.classList.contains("open") &&
            !searchBox.contains(e.target) && !searchToggle?.contains(e.target)) {
            setSearch(false);
        }
    });
})();