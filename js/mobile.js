/**
 * mobile.js — single ☰ menu that contains:
 *   • Thumbnails toggle
 *   • Colors toggle
 *   • Filters (numeric + tag chips)
 *   • Legend  → opens full-screen overlay
 *   • List Guidelines → opens full-screen overlay
 *   • List Editors    → opens full-screen overlay
 *
 * Also handles inline level-detail drawers in the list.
 */
(function () {
    "use strict";

    const BP = 768;
    function isMobile() { return window.innerWidth <= BP; }
    function qs(s, r) { return (r || document).querySelector(s); }

    /* ── grab Vue component instance (for reactivity) ── */
    function getVueInstance() {
        const el = qs('.page-list') || qs('[class*="page-list"]');
        return el && el.__vue_app__
            ? el.__vue_app__._instance
            : null;
    }
    // Walk up from a DOM element to find its Vue component
    function getVueComp(el) {
        let cur = el;
        while (cur) {
            if (cur.__vueParentComponent) return cur.__vueParentComponent;
            cur = cur.parentElement;
        }
        return null;
    }

    /* ═══════════════════════════════════════════════════
       BUILD DRAWER DOM (once)
    ═══════════════════════════════════════════════════ */
    let drawerBuilt = false;

    function buildDrawer() {
        if (drawerBuilt) return;
        drawerBuilt = true;

        /* ── ☰ button ── */
        const menuBtn = document.createElement('button');
        menuBtn.id = 'mobile-menu-btn';
        menuBtn.title = 'Menu';
        menuBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"
            viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2.2" stroke-linecap="round">
            <line x1="3" y1="6"  x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>`;

        const nav = qs('header.new .nav');
        if (!nav) return;
        // Append after nav (or as sibling)
        nav.parentElement.appendChild(menuBtn);

        menuBtn.addEventListener('click', openDrawer);

        /* ── overlay wrapper ── */
        const overlay = document.createElement('div');
        overlay.id = 'mobile-drawer-overlay';

        const backdrop = document.createElement('div');
        backdrop.id = 'mobile-drawer-backdrop';
        backdrop.addEventListener('click', closeDrawer);

        const drawer = document.createElement('div');
        drawer.id = 'mobile-drawer';

        /* header */
        const dh = document.createElement('div');
        dh.id = 'mobile-drawer-header';
        dh.innerHTML = `<span>Menu</span>`;
        const closeBtn = document.createElement('button');
        closeBtn.id = 'mobile-drawer-close';
        closeBtn.textContent = '✕';
        closeBtn.addEventListener('click', closeDrawer);
        dh.appendChild(closeBtn);
        drawer.appendChild(dh);

        /* ── Section: Display ── */
        drawer.appendChild(sectionTitle('Display'));
        const displaySection = document.createElement('div');
        displaySection.className = 'mobile-drawer-section';

        // Thumbnails toggle
        const thumbToggle = makeToggle('Thumbnails', 'thumb');
        displaySection.appendChild(thumbToggle);

        // Colors toggle
        const colorToggle = makeToggle('Level Colors', 'color');
        displaySection.appendChild(colorToggle);
        drawer.appendChild(displaySection);

        /* ── Section: Filters ── */
        drawer.appendChild(sectionTitle('Filters'));
        const filterSection = document.createElement('div');
        filterSection.className = 'mobile-drawer-section';
        filterSection.id = 'mobile-filter-section';
        buildFilterSection(filterSection);
        drawer.appendChild(filterSection);

        /* ── Section: Info ── */
        drawer.appendChild(sectionTitle('Info'));
        const infoSection = document.createElement('div');
        infoSection.className = 'mobile-drawer-section';

        const infos = [
            { id: 'legend',     label: 'Legend' },
            { id: 'guidelines', label: 'List Guidelines' },
            { id: 'editors',    label: 'List Editors' },
        ];
        infos.forEach(({ id, label }) => {
            const btn = document.createElement('button');
            btn.className = 'mobile-drawer-info-btn';
            btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round">
                <polyline points="9 18 15 12 9 6"/>
            </svg><span>${label}</span>`;
            btn.addEventListener('click', () => { closeDrawer(); openOverlay(id, label); });
            infoSection.appendChild(btn);
        });
        drawer.appendChild(infoSection);

        overlay.appendChild(backdrop);
        overlay.appendChild(drawer);
        document.body.appendChild(overlay);

        // Wire up toggle actions after a tick (Vue needs to be ready)
        setTimeout(() => {
            wireToggle(thumbToggle, 'showThumbnails', 'thumb');
            wireToggle(colorToggle, 'showColors', 'color');
        }, 500);
    }

    function sectionTitle(text) {
        const d = document.createElement('div');
        d.className = 'mobile-drawer-section-title';
        d.textContent = text;
        return d;
    }

    function makeToggle(label, key) {
        const row = document.createElement('div');
        row.className = 'mobile-drawer-toggle';
        row.dataset.toggleKey = key;
        const pill = document.createElement('div');
        pill.className = 'mobile-toggle-pill on';
        pill.id = `mobile-pill-${key}`;
        row.innerHTML = `<span>${label}</span>`;
        row.appendChild(pill);
        return row;
    }

    function wireToggle(row, vueProp, key) {
        const pill = qs(`#mobile-pill-${key}`);
        if (!pill) return;

        // Read initial value from Vue component
        const comp = findListComp();
        if (comp && comp[vueProp] !== undefined) {
            pill.classList.toggle('on', !!comp[vueProp]);
        }

        row.addEventListener('click', () => {
            const c = findListComp();
            if (!c) return;
            c[vueProp] = !c[vueProp];
            pill.classList.toggle('on', !!c[vueProp]);
        });
    }

    function findListComp() {
        // Try to find the Vue component that owns showThumbnails
        const listEl = qs('.page-list');
        if (!listEl) return null;
        let el = listEl;
        while (el) {
            const comp = el.__vueParentComponent;
            if (comp && comp.data && comp.data.showThumbnails !== undefined) return comp.data;
            if (comp && comp.setupState && comp.setupState.showThumbnails !== undefined) return comp.setupState;
            // Also try exposed/proxy
            if (comp && comp.proxy && comp.proxy.showThumbnails !== undefined) return comp.proxy;
            el = el.parentElement;
        }
        // fallback: walk all vnode instances
        return null;
    }

    function buildFilterSection(container) {
        // Numeric filters
        const numericBlock = document.createElement('div');

        const decRow = document.createElement('div');
        decRow.className = 'mobile-drawer-numeric';
        decRow.innerHTML = `<label>Min Decoration %</label>
            <input id="mobile-min-dec" type="number" min="0" max="100" placeholder="0">`;
        numericBlock.appendChild(decRow);

        const verRow = document.createElement('div');
        verRow.className = 'mobile-drawer-numeric';
        verRow.innerHTML = `<label>Min Verification %</label>
            <input id="mobile-min-ver" type="number" min="0" max="100" placeholder="0">`;
        numericBlock.appendChild(verRow);
        container.appendChild(numericBlock);

        // Wire up numeric inputs after Vue is ready
        setTimeout(() => {
            const decInput = qs('#mobile-min-dec');
            const verInput = qs('#mobile-min-ver');
            if (decInput) decInput.addEventListener('input', () => {
                const c = findListComp();
                if (c) { c.minDecoration = Number(decInput.value) || 0; c.applyFilters && c.applyFilters(); }
            });
            if (verInput) verInput.addEventListener('input', () => {
                const c = findListComp();
                if (c) { c.minVerification = Number(verInput.value) || 0; c.applyFilters && c.applyFilters(); }
            });
        }, 600);

        // Tag filters — built from the filtersList in Vue
        setTimeout(() => {
            const c = findListComp();
            if (!c || !c.filtersList) return;
            const sep = document.createElement('div');
            sep.className = 'mobile-drawer-separator';
            container.appendChild(sep);

            c.filtersList.forEach((item, index) => {
                if (item.separator) {
                    const s = document.createElement('div');
                    s.className = 'mobile-drawer-separator';
                    container.appendChild(s);
                    return;
                }
                const row = document.createElement('div');
                row.className = 'mobile-drawer-filter' + (item.active ? ' active' : '');
                row.dataset.filterIndex = index;
                row.innerHTML = `<span>${item.name}</span><span class="check">✓</span>`;
                row.addEventListener('click', () => {
                    const fc = findListComp();
                    if (!fc) return;
                    fc.useFilter(index);
                    row.classList.toggle('active', !!fc.filtersList[index].active);
                });
                container.appendChild(row);
            });
        }, 600);
    }

    function openDrawer() {
        qs('#mobile-drawer-overlay').classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
        qs('#mobile-drawer-overlay').classList.remove('open');
        document.body.style.overflow = '';
    }

    /* ═══════════════════════════════════════════════════
       FULL-SCREEN OVERLAYS
    ═══════════════════════════════════════════════════ */
    function openOverlay(id, title) {
        const existing = qs(`#mobile-overlay-${id}`);
        if (existing) existing.remove();

        const el = document.createElement('div');
        el.className = 'mobile-overlay';
        el.id = `mobile-overlay-${id}`;
        el.innerHTML = `
            <div class="mobile-overlay__header">
                <span class="mobile-overlay__title">${title}</span>
                <button class="mobile-overlay__close">✕</button>
            </div>
            <div class="mobile-overlay__body">${getOverlayHTML(id)}</div>`;

        el.querySelector('.mobile-overlay__close').addEventListener('click', () => {
            el.classList.remove('visible');
            el.addEventListener('transitionend', () => { el.remove(); document.body.style.overflow = ''; }, { once: true });
        });

        document.body.appendChild(el);
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('visible')));
    }

    function getOverlayHTML(id) {
        if (id === 'legend') {
            // Try to clone from hidden meta-container first
            const metaEl = qs('.meta-container');
            if (metaEl) {
                const prev = metaEl.style.display;
                metaEl.style.display = '';
                const legendEl = qs('.legend', metaEl);
                const html = legendEl ? legendEl.outerHTML : fallbackLegend();
                metaEl.style.display = prev || 'none';
                return html;
            }
            return fallbackLegend();
        }
        if (id === 'guidelines') {
            return `<p style="margin-bottom:1rem;">The guidelines explain how each aspect of the Upcoming Level List works.</p>
                <a href="https://docs.google.com/document/d/13dmRfx2OCiLEaM2EcgEd-mKdok11_k8k7HsA5a-K6nY/edit?usp=sharing"
                   target="_blank"
                   style="display:inline-block;padding:0.7rem 1.1rem;background:var(--color-primary);color:var(--color-on-primary);border-radius:0.5rem;font-weight:600;text-decoration:none;">
                    View List Guidelines ↗
                </a>`;
        }
        if (id === 'editors') {
            const metaEl = qs('.meta-container');
            if (metaEl) {
                const prev = metaEl.style.display;
                metaEl.style.display = '';
                const editorsEl = qs('.editors', metaEl);
                const html = editorsEl ? `<h3 style="margin-bottom:0.75rem;">List Editors</h3>` + editorsEl.outerHTML : '<p>Not loaded yet.</p>';
                metaEl.style.display = prev || 'none';
                return html;
            }
            return '<p>Not loaded yet — try again in a moment.</p>';
        }
        return '';
    }

    function fallbackLegend() {
        return `<div class="legend"><h3>Legend</h3><ul class="legend-list">
            <li><span class="legend-dot" style="background:#5599ff"></span><span>On layout state</span></li>
            <li><span class="legend-dot" style="background:#33dddd"></span><span>Deco 1%–29%</span></li>
            <li><span class="legend-dot" style="background:#55ee55"></span><span>Deco 30%–69%</span></li>
            <li><span class="legend-dot" style="background:#ffee55"></span><span>Deco 70%–99%</span></li>
            <li><span class="legend-dot" style="background:#ffaa44"></span><span>Finished</span></li>
            <li><span class="legend-dot" style="background:#ff6622"></span><span>Verification 30%–59%</span></li>
            <li><span class="legend-dot" style="background:#ff5555"></span><span>Verification 60%–99%</span></li>
            <li><span class="legend-dot" style="background:#bbbbbb"></span><span>Verified, not rated</span></li>
            <li><span class="legend-dot" style="background:#ffffff;border:1px solid #555;"></span><span>Verified and rated</span></li>
            <li><span style="font-size:0.7rem;">🚫</span><span>Pending for removal</span></li>
        </ul></div>`;
    }

    /* ═══════════════════════════════════════════════════
       INLINE LEVEL DRAWERS
    ═══════════════════════════════════════════════════ */
    let openDrawerRow = null;

    function bindListRows() {
        if (!isMobile()) return;
        const rows = document.querySelectorAll('.page-list .list tr:not(.mobile-drawer-tr)');
        rows.forEach(row => {
            if (row.dataset.mobileBound) return;
            row.dataset.mobileBound = '1';
            const btn = row.querySelector('button');
            if (!btn) return;
            btn.addEventListener('click', () => setTimeout(() => toggleInlineDrawer(row), 80));
        });
    }

    function toggleInlineDrawer(row) {
        if (openDrawerRow === row) { removeInlineDrawer(); return; }
        removeInlineDrawer();

        const levelContainer = qs('.level-container');
        if (!levelContainer) return;

        const prevDisplay = levelContainer.style.display;
        levelContainer.style.display = '';
        const levelEl = qs('.level', levelContainer);
        if (!levelEl) { levelContainer.style.display = prevDisplay || 'none'; return; }
        const clone = levelEl.cloneNode(true);
        levelContainer.style.display = prevDisplay || 'none';

        const drawerTr = document.createElement('tr');
        drawerTr.className = 'mobile-drawer-tr';
        const td = document.createElement('td');
        td.colSpan = 3;
        const drawer = document.createElement('div');
        drawer.className = 'mobile-level-drawer';
        drawer.appendChild(clone);
        td.appendChild(drawer);
        drawerTr.appendChild(td);
        row.insertAdjacentElement('afterend', drawerTr);
        openDrawerRow = row;

        requestAnimationFrame(() => requestAnimationFrame(() => drawer.classList.add('open')));
    }

    function removeInlineDrawer() {
        if (!openDrawerRow) return;
        const next = openDrawerRow.nextElementSibling;
        if (next && next.classList.contains('mobile-drawer-tr')) next.remove();
        openDrawerRow = null;
    }

    /* Watch level-container for Vue re-renders and refresh open drawer */
    function watchLevelContainer() {
        const container = qs('.level-container');
        if (!container || container._mobileWatched) return;
        container._mobileWatched = true;
        new MutationObserver(() => {
            if (!openDrawerRow || !isMobile()) return;
            const drawerTr = openDrawerRow.nextElementSibling;
            if (!drawerTr || !drawerTr.classList.contains('mobile-drawer-tr')) return;
            const levelContainer = qs('.level-container');
            if (!levelContainer) return;
            const prev = levelContainer.style.display;
            levelContainer.style.display = '';
            const levelEl = qs('.level', levelContainer);
            if (!levelEl) { levelContainer.style.display = prev || 'none'; return; }
            const clone = levelEl.cloneNode(true);
            levelContainer.style.display = prev || 'none';
            const newDrawer = document.createElement('div');
            newDrawer.className = 'mobile-level-drawer open';
            newDrawer.appendChild(clone);
            const td = document.createElement('td');
            td.colSpan = 3;
            td.appendChild(newDrawer);
            const newTr = document.createElement('tr');
            newTr.className = 'mobile-drawer-tr';
            newTr.appendChild(td);
            drawerTr.replaceWith(newTr);
        }).observe(container, { childList: true, subtree: true, characterData: true });
    }

    /* ═══════════════════════════════════════════════════
       BOOT
    ═══════════════════════════════════════════════════ */
    let booted = false;

    function boot() {
        if (!isMobile()) return;
        if (booted) return;
        if (!qs('header.new .nav')) return;
        booted = true;
        buildDrawer();
        bindListRows();
        watchLevelContainer();

        // Watch for new rows added by Vue
        const table = qs('.page-list .list');
        if (table) {
            new MutationObserver(() => bindListRows()).observe(table, { childList: true });
        }
    }

    const bootInterval = setInterval(() => {
        if (qs('header.new .nav') && qs('.page-list')) {
            clearInterval(bootInterval);
            boot();
        }
    }, 100);

    window.addEventListener('resize', () => {
        if (isMobile() && !booted) boot();
    });

    // Re-init on hash/route changes
    window.addEventListener('hashchange', () => {
        booted = false;
        drawerBuilt = false;
        openDrawerRow = null;
        const old = qs('#mobile-menu-btn');
        const oldOverlay = qs('#mobile-drawer-overlay');
        if (old) old.remove();
        if (oldOverlay) oldOverlay.remove();
        setTimeout(() => {
            const iv = setInterval(() => {
                if (qs('header.new .nav') && qs('.page-list')) {
                    clearInterval(iv);
                    boot();
                }
            }, 100);
        }, 200);
    });

})();
