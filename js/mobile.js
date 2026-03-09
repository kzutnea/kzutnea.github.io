/**
 * mobile.js
 * ─────────
 * Handles the three mobile-only UI additions:
 *
 *  1. Info-menu button  — appears in the header controls area
 *     alongside the existing thumbnail / colors / filters buttons.
 *     Tapping it shows a small dropdown with:
 *       • Legend
 *       • List Guidelines
 *       • List Editors
 *
 *  2. Full-screen overlay panels — each menu item opens one,
 *     which slides up from the bottom and covers the whole
 *     screen. Content is cloned from the hidden .meta-container.
 *
 *  3. Inline level-detail drawers — the detail card that normally
 *     lives in .level-container is instead shown in a collapsible
 *     row immediately below the clicked list entry.  We watch for
 *     Vue DOM updates so the drawer always reflects the selected
 *     level, then move it to the right position in the list.
 *
 * This script self-initialises after the Vue app has finished
 * mounting.  It re-runs its DOM queries on a short interval so
 * it can adapt to Vue reactivity changes (new level selected,
 * list re-rendered, etc.).
 */

(function () {
    "use strict";

    const MOBILE_BP = 768;

    /* ── helpers ─────────────────────────────────────────────── */

    function isMobile() {
        return window.innerWidth <= MOBILE_BP;
    }

    function qs(sel, root) {
        return (root || document).querySelector(sel);
    }

    function qsa(sel, root) {
        return Array.from((root || document).querySelectorAll(sel));
    }


    /* ══════════════════════════════════════════════════════════
       PART 1 — Info-menu button + overlays
       ══════════════════════════════════════════════════════════ */

    let infoMenuInjected = false;

    function injectInfoMenu() {
        if (!isMobile()) return;
        if (infoMenuInjected) return;

        // Find the .filters element in the header — insert our
        // wrapper just before it.
        const filtersEl = qs("header .filters");
        if (!filtersEl) return;          // Vue hasn't rendered yet

        infoMenuInjected = true;

        /* ── wrapper (relative-positioned parent for dropdown) ── */
        const wrapper = document.createElement("div");
        wrapper.id = "mobile-info-wrapper";

        /* ── the ℹ button ─────────────────────────────────────── */
        const btn = document.createElement("button");
        btn.id = "mobile-info-btn";
        btn.title = "Legend, Guidelines & Editors";
        btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"
                 viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>`;

        /* ── dropdown menu ────────────────────────────────────── */
        const menu = document.createElement("div");
        menu.id = "mobile-info-menu";

        const items = [
            {
                id: "legend",
                label: "Legend",
                icon: `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17"
                         viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                       <circle cx="12" cy="12" r="10"/>
                       <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                       <line x1="12" y1="17" x2="12.01" y2="17"/>
                       </svg>`,
            },
            {
                id: "guidelines",
                label: "List Guidelines",
                icon: `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17"
                         viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                       <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                       <polyline points="14 2 14 8 20 8"/>
                       <line x1="16" y1="13" x2="8" y2="13"/>
                       <line x1="16" y1="17" x2="8" y2="17"/>
                       <polyline points="10 9 9 9 8 9"/>
                       </svg>`,
            },
            {
                id: "editors",
                label: "List Editors",
                icon: `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17"
                         viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                       <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                       <circle cx="9" cy="7" r="4"/>
                       <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                       <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                       </svg>`,
            },
        ];

        items.forEach(({ id, label, icon }) => {
            const itemBtn = document.createElement("button");
            itemBtn.innerHTML = `${icon}<span>${label}</span>`;
            itemBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                menu.classList.remove("open");
                openOverlay(id, label);
            });
            menu.appendChild(itemBtn);
        });

        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            menu.classList.toggle("open");
        });

        document.addEventListener("click", () => {
            menu.classList.remove("open");
        });

        wrapper.appendChild(btn);
        wrapper.appendChild(menu);
        filtersEl.parentNode.insertBefore(wrapper, filtersEl);
    }


    /* ── Overlay factory ─────────────────────────────────────── */

    function buildOverlay(id, title, bodyHTML) {
        const el = document.createElement("div");
        el.className = "mobile-overlay";
        el.id = `mobile-overlay-${id}`;
        el.innerHTML = `
            <div class="mobile-overlay__header">
                <span class="mobile-overlay__title">${title}</span>
                <button class="mobile-overlay__close" aria-label="Close">✕</button>
            </div>
            <div class="mobile-overlay__body">
                ${bodyHTML}
            </div>`;

        el.querySelector(".mobile-overlay__close").addEventListener("click",
            () => closeOverlay(el));

        // Also close on backdrop swipe-down (simple touch detection)
        let touchY = 0;
        el.addEventListener("touchstart", (e) => { touchY = e.touches[0].clientY; }, { passive: true });
        el.addEventListener("touchend", (e) => {
            if (e.changedTouches[0].clientY - touchY > 80) closeOverlay(el);
        }, { passive: true });

        document.body.appendChild(el);
        return el;
    }

    function openOverlay(id, title) {
        // Remove any existing overlay for this id
        const existing = qs(`#mobile-overlay-${id}`);
        if (existing) existing.remove();

        const bodyHTML = getOverlayContent(id);
        const overlay = buildOverlay(id, title, bodyHTML);

        // Animate in
        requestAnimationFrame(() => {
            requestAnimationFrame(() => overlay.classList.add("visible"));
        });

        // Prevent body scroll while overlay is open
        document.body.style.overflow = "hidden";
    }

    function closeOverlay(el) {
        el.classList.remove("visible");
        el.addEventListener("transitionend", () => {
            el.remove();
            // Restore scroll only if no overlays left
            if (!qs(".mobile-overlay")) {
                document.body.style.overflow = "";
            }
        }, { once: true });
    }

    /* ── Content extraction from .meta-container ─────────────── */

    function getOverlayContent(id) {
        // Temporarily un-hide meta-container to clone its content
        const metaEl = qs(".meta-container");
        if (!metaEl) return "<p>Content not available yet.</p>";

        // Temporarily make it render-able (not displayed in DOM)
        const wasHidden = metaEl.style.display;
        metaEl.style.display = "";  // briefly un-hide

        let html = "<p>Content not available.</p>";

        if (id === "legend") {
            const legendEl = qs(".legend", metaEl);
            if (legendEl) {
                html = legendEl.outerHTML;
            } else {
                html = `
                <div class="legend">
                  <h3>Legend</h3>
                  <ul class="legend-list">
                    <li><span class="legend-dot" style="background:#5599ff"></span><span class="legend-text">On layout state</span></li>
                    <li><span class="legend-dot" style="background:#33dddd"></span><span class="legend-text">Deco is 1%–29% finished</span></li>
                    <li><span class="legend-dot" style="background:#55ee55"></span><span class="legend-text">Deco is 30%–69% finished</span></li>
                    <li><span class="legend-dot" style="background:#ffee55"></span><span class="legend-text">Deco is 70%–99% finished</span></li>
                    <li><span class="legend-dot" style="background:#ffaa44"></span><span class="legend-text">Finished</span></li>
                    <li><span class="legend-dot" style="background:#ff6622"></span><span class="legend-text">Verification progress 30%–59%</span></li>
                    <li><span class="legend-dot" style="background:#ff5555"></span><span class="legend-text">Verification progress 60%–99%</span></li>
                    <li><span class="legend-dot" style="background:#bbbbbb"></span><span class="legend-text">Verified, not rated</span></li>
                    <li><span class="legend-dot" style="background:#ffffff; border:1px solid #555;"></span><span class="legend-text">Verified and rated</span></li>
                    <li><span style="font-size:0.75rem;margin-left:-1px;">🚫</span><span class="legend-text">Pending for removal</span></li>
                  </ul>
                </div>`;
            }
        } else if (id === "guidelines") {
            html = `
            <div>
              <p style="margin-bottom:1rem;line-height:1.7;">
                The guidelines explain how each aspect of the Upcoming Level List works.
              </p>
              <a href="https://docs.google.com/document/d/13dmRfx2OCiLEaM2EcgEd-mKdok11_k8k7HsA5a-K6nY/edit?usp=sharing"
                 target="_blank"
                 style="display:inline-block;padding:0.75rem 1.25rem;background:var(--color-primary);color:var(--color-on-primary);border-radius:0.5rem;font-weight:600;text-decoration:none;">
                View List Guidelines ↗
              </a>
            </div>`;
        } else if (id === "editors") {
            const editorsEl = qs(".editors", metaEl);
            const h3 = qs("h3", metaEl);
            if (editorsEl) {
                html = `<h3 style="margin-bottom:0.75rem;">${h3 ? h3.textContent : "List Editors"}</h3>` + editorsEl.outerHTML;
            } else {
                html = "<p>Editor list not loaded yet. Try again in a moment.</p>";
            }
        }

        metaEl.style.display = wasHidden || "none";
        return html;
    }


    /* ══════════════════════════════════════════════════════════
       PART 2 — Inline level-detail drawers
       ══════════════════════════════════════════════════════════
       Strategy:
       • The existing .level-container is hidden by CSS.
       • We watch each list row's <button> for clicks.
       • On click we:
           1. Close any open drawer.
           2. Clone the .level-container > .level node.
           3. Insert it as a new <tr><td> immediately after the
              clicked row.
       • Vue re-renders when the selected level changes, so we
         also watch .level-container mutations to refresh the
         open drawer if its content changes.
    ═══════════════════════════════════════════════════════════ */

    let openDrawerRow = null;   // the <tr> whose drawer is open

    function refreshDrawers() {
        if (!isMobile()) return;

        const table = qs(".page-list .list");
        if (!table) return;

        const rows = qsa("tr:not(.mobile-drawer-tr)", table);

        rows.forEach((row) => {
            if (row.dataset.drawerBound) return;
            row.dataset.drawerBound = "1";

            const btn = qs("button", row);
            if (!btn) return;

            btn.addEventListener("click", () => {
                // Small delay lets Vue update the level-container
                setTimeout(() => toggleDrawer(row), 60);
            });
        });
    }

    function toggleDrawer(row) {
        // If this row's drawer is already open, close it
        if (openDrawerRow === row) {
            removeOpenDrawer();
            return;
        }

        // Close any previously open drawer
        removeOpenDrawer();

        // Build new drawer
        const drawerTr = buildDrawerRow();
        if (!drawerTr) return;

        row.insertAdjacentElement("afterend", drawerTr);
        openDrawerRow = row;

        // Animate open
        const drawer = drawerTr.querySelector(".mobile-level-drawer");
        requestAnimationFrame(() => {
            requestAnimationFrame(() => drawer.classList.add("open"));
        });
    }

    function removeOpenDrawer() {
        if (!openDrawerRow) return;
        const existing = openDrawerRow.nextElementSibling;
        if (existing && existing.classList.contains("mobile-drawer-tr")) {
            existing.remove();
        }
        openDrawerRow = null;
    }

    function buildDrawerRow() {
        const levelContainer = qs(".level-container");
        if (!levelContainer) return null;

        // Temporarily un-hide to clone
        const prev = levelContainer.style.display;
        levelContainer.style.display = "";
        const levelEl = qs(".level", levelContainer);
        if (!levelEl) {
            levelContainer.style.display = prev || "none";
            return null;
        }
        const clone = levelEl.cloneNode(true);
        levelContainer.style.display = prev || "none";

        const tr = document.createElement("tr");
        tr.className = "mobile-drawer-tr";

        const td = document.createElement("td");
        td.colSpan = 3;

        const drawer = document.createElement("div");
        drawer.className = "mobile-level-drawer";
        drawer.appendChild(clone);

        td.appendChild(drawer);
        tr.appendChild(td);
        return tr;
    }

    /* Watch .level-container for DOM changes (Vue re-renders)  */
    function watchLevelContainer() {
        const container = qs(".level-container");
        if (!container) return;

        const obs = new MutationObserver(() => {
            if (openDrawerRow && isMobile()) {
                const drawerTr = openDrawerRow.nextElementSibling;
                if (drawerTr && drawerTr.classList.contains("mobile-drawer-tr")) {
                    const fresh = buildDrawerRow();
                    if (fresh) {
                        const freshDrawer = fresh.querySelector(".mobile-level-drawer");
                        freshDrawer.classList.add("open");
                        drawerTr.replaceWith(fresh);
                    }
                }
            }
        });

        obs.observe(container, { childList: true, subtree: true, characterData: true });
    }


    /* ══════════════════════════════════════════════════════════
       PART 3 — Bootstrapping: wait for Vue to render
       ══════════════════════════════════════════════════════════ */

    let booted = false;

    function boot() {
        if (booted) return;
        if (!qs(".page-list .list-container")) return;  // not ready

        booted = true;
        injectInfoMenu();
        refreshDrawers();
        watchLevelContainer();

        // Re-scan rows whenever Vue adds new ones (list scroll, etc.)
        const listObs = new MutationObserver(() => {
            refreshDrawers();
        });
        const table = qs(".page-list .list");
        if (table) listObs.observe(table, { childList: true, subtree: false });
    }

    // Poll until Vue has rendered, then boot
    const bootInterval = setInterval(() => {
        if (qs(".page-list .list-container")) {
            clearInterval(bootInterval);
            boot();
        }
    }, 120);

    // Also re-init on resize (desktop ↔ mobile)
    window.addEventListener("resize", () => {
        if (isMobile()) {
            boot();
        }
    });

    // Re-check after route changes (Vue Router)
    window.addEventListener("hashchange", () => {
        booted = false;
        infoMenuInjected = false;
        openDrawerRow = null;
        const old = qs("#mobile-info-wrapper");
        if (old) { old.remove(); }
        setTimeout(() => {
            const interval = setInterval(() => {
                if (qs(".page-list .list-container")) {
                    clearInterval(interval);
                    boot();
                }
            }, 120);
        }, 200);
    });

})();
