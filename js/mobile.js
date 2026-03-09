(function () {
    "use strict";

    var BP = 768;
    function isMobile() { return window.innerWidth <= BP; }
    function qs(s, r) { return (r || document).querySelector(s); }

    var drawerBuilt = false;
    var openDrawerRow = null;

    function buildDrawer() {
        if (drawerBuilt) return;
        drawerBuilt = true;

        var menuBtn = document.createElement('button');
        menuBtn.id = 'mobile-menu-btn';
        menuBtn.title = 'Menu';
        menuBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';

        var nav = qs('header.new .nav');
        if (!nav) return;
        nav.parentElement.appendChild(menuBtn);
        menuBtn.addEventListener('click', openDrawerMenu);

        var overlay = document.createElement('div');
        overlay.id = 'mobile-drawer-overlay';

        var backdrop = document.createElement('div');
        backdrop.id = 'mobile-drawer-backdrop';
        backdrop.addEventListener('click', closeDrawerMenu);

        var drawer = document.createElement('div');
        drawer.id = 'mobile-drawer';

        var dh = document.createElement('div');
        dh.id = 'mobile-drawer-header';
        dh.innerHTML = '<span>Menu</span>';
        var closeBtn = document.createElement('button');
        closeBtn.id = 'mobile-drawer-close';
        closeBtn.textContent = 'x';
        closeBtn.addEventListener('click', closeDrawerMenu);
        dh.appendChild(closeBtn);
        drawer.appendChild(dh);

        drawer.appendChild(sectionTitle('Display'));
        var displaySection = document.createElement('div');
        displaySection.className = 'mobile-drawer-section';
        displaySection.appendChild(makeToggle('Thumbnails', 'thumb'));
        displaySection.appendChild(makeToggle('Level Colors', 'color'));
        drawer.appendChild(displaySection);

        drawer.appendChild(sectionTitle('Filters'));
        var filterSection = document.createElement('div');
        filterSection.className = 'mobile-drawer-section';
        filterSection.id = 'mobile-filter-section';
        buildFilterSection(filterSection);
        drawer.appendChild(filterSection);

        drawer.appendChild(sectionTitle('Info'));
        var infoSection = document.createElement('div');
        infoSection.className = 'mobile-drawer-section';
        var infos = [
            { id: 'legend', label: 'Legend' },
            { id: 'guidelines', label: 'List Guidelines' },
            { id: 'editors', label: 'List Editors' }
        ];
        infos.forEach(function(item) {
            var btn = document.createElement('button');
            btn.className = 'mobile-drawer-info-btn';
            btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg><span>' + item.label + '</span>';
            btn.addEventListener('click', function() { closeDrawerMenu(); openOverlay(item.id, item.label); });
            infoSection.appendChild(btn);
        });
        drawer.appendChild(infoSection);

        overlay.appendChild(backdrop);
        overlay.appendChild(drawer);
        document.body.appendChild(overlay);

        setTimeout(function() {
            wireToggle('thumb', 'showThumbnails');
            wireToggle('color', 'showColors');
        }, 500);
    }

    function sectionTitle(text) {
        var d = document.createElement('div');
        d.className = 'mobile-drawer-section-title';
        d.textContent = text;
        return d;
    }

    function makeToggle(label, key) {
        var row = document.createElement('div');
        row.className = 'mobile-drawer-toggle';
        row.dataset.toggleKey = key;
        var pill = document.createElement('div');
        pill.className = 'mobile-toggle-pill on';
        pill.id = 'mobile-pill-' + key;
        row.innerHTML = '<span>' + label + '</span>';
        row.appendChild(pill);
        return row;
    }

    function wireToggle(key, vueProp) {
        var pill = qs('#mobile-pill-' + key);
        if (!pill) return;
        var comp = findListComp();
        if (comp && comp[vueProp] !== undefined) {
            pill.classList.toggle('on', !!comp[vueProp]);
        }
        pill.parentElement.addEventListener('click', function() {
            var c = findListComp();
            if (!c) return;
            c[vueProp] = !c[vueProp];
            pill.classList.toggle('on', !!c[vueProp]);
        });
    }

    function findListComp() {
        var listEl = qs('.page-list');
        if (!listEl) return null;
        var el = listEl;
        while (el) {
            var comp = el.__vueParentComponent;
            if (comp) {
                if (comp.proxy && comp.proxy.showThumbnails !== undefined) return comp.proxy;
                if (comp.data && comp.data.showThumbnails !== undefined) return comp.data;
            }
            el = el.parentElement;
        }
        return null;
    }

    function buildFilterSection(container) {
        var decRow = document.createElement('div');
        decRow.className = 'mobile-drawer-numeric';
        decRow.innerHTML = '<label>Min Decoration %</label><input id="mobile-min-dec" type="number" min="0" max="100" placeholder="0">';
        container.appendChild(decRow);

        var verRow = document.createElement('div');
        verRow.className = 'mobile-drawer-numeric';
        verRow.innerHTML = '<label>Min Verification %</label><input id="mobile-min-ver" type="number" min="0" max="100" placeholder="0">';
        container.appendChild(verRow);

        setTimeout(function() {
            var decInput = qs('#mobile-min-dec');
            var verInput = qs('#mobile-min-ver');
            if (decInput) decInput.addEventListener('input', function() {
                var c = findListComp();
                if (c) { c.minDecoration = Number(decInput.value) || 0; if (c.applyFilters) c.applyFilters(); }
            });
            if (verInput) verInput.addEventListener('input', function() {
                var c = findListComp();
                if (c) { c.minVerification = Number(verInput.value) || 0; if (c.applyFilters) c.applyFilters(); }
            });
        }, 600);

        setTimeout(function() {
            var c = findListComp();
            if (!c || !c.filtersList) return;
            container.appendChild(makeSep());
            c.filtersList.forEach(function(item, index) {
                if (item.separator) { container.appendChild(makeSep()); return; }
                var row = document.createElement('div');
                row.className = 'mobile-drawer-filter' + (item.active ? ' active' : '');
                row.innerHTML = '<span>' + item.name + '</span><span class="check">v</span>';
                row.addEventListener('click', function() {
                    var fc = findListComp();
                    if (!fc) return;
                    fc.useFilter(index);
                    row.classList.toggle('active', !!fc.filtersList[index].active);
                });
                container.appendChild(row);
            });
        }, 600);
    }

    function makeSep() {
        var s = document.createElement('div');
        s.className = 'mobile-drawer-separator';
        return s;
    }

    function openDrawerMenu() {
        var o = qs('#mobile-drawer-overlay');
        if (o) o.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeDrawerMenu() {
        var o = qs('#mobile-drawer-overlay');
        if (o) o.classList.remove('open');
        document.body.style.overflow = '';
    }

    function openOverlay(id, title) {
        var existing = qs('#mobile-overlay-' + id);
        if (existing) existing.remove();

        var el = document.createElement('div');
        el.className = 'mobile-overlay';
        el.id = 'mobile-overlay-' + id;
        el.innerHTML = '<div class="mobile-overlay__header"><span class="mobile-overlay__title">' + title + '</span><button class="mobile-overlay__close">x</button></div><div class="mobile-overlay__body">' + getOverlayHTML(id) + '</div>';

        el.querySelector('.mobile-overlay__close').addEventListener('click', function() {
            el.classList.remove('visible');
            el.addEventListener('transitionend', function() { el.remove(); document.body.style.overflow = ''; }, { once: true });
        });

        document.body.appendChild(el);
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(function() { requestAnimationFrame(function() { el.classList.add('visible'); }); });
    }

    function getOverlayHTML(id) {
        if (id === 'legend') {
            var metaEl = qs('.meta-container');
            if (metaEl) {
                var prev = metaEl.style.display;
                metaEl.style.display = '';
                var legendEl = qs('.legend', metaEl);
                var html = legendEl ? legendEl.outerHTML : fallbackLegend();
                metaEl.style.display = prev || 'none';
                return html;
            }
            return fallbackLegend();
        }
        if (id === 'guidelines') {
            return '<p style="margin-bottom:1rem;">The guidelines explain how each aspect of the Upcoming Level List works.</p><a href="https://docs.google.com/document/d/13dmRfx2OCiLEaM2EcgEd-mKdok11_k8k7HsA5a-K6nY/edit?usp=sharing" target="_blank" style="display:inline-block;padding:0.7rem 1.1rem;background:var(--color-primary);color:var(--color-on-primary);border-radius:0.5rem;font-weight:600;text-decoration:none;">View List Guidelines</a>';
        }
        if (id === 'editors') {
            var metaEl2 = qs('.meta-container');
            if (metaEl2) {
                var prev2 = metaEl2.style.display;
                metaEl2.style.display = '';
                var editorsEl = qs('.editors', metaEl2);
                var html2 = editorsEl ? '<h3 style="margin-bottom:0.75rem;">List Editors</h3>' + editorsEl.outerHTML : '<p>Not loaded yet.</p>';
                metaEl2.style.display = prev2 || 'none';
                return html2;
            }
            return '<p>Not loaded yet.</p>';
        }
        return '';
    }

    function fallbackLegend() {
        return '<div class="legend"><h3>Legend</h3><ul class="legend-list"><li><span class="legend-dot" style="background:#5599ff"></span><span>On layout state</span></li><li><span class="legend-dot" style="background:#33dddd"></span><span>Deco 1-29%</span></li><li><span class="legend-dot" style="background:#55ee55"></span><span>Deco 30-69%</span></li><li><span class="legend-dot" style="background:#ffee55"></span><span>Deco 70-99%</span></li><li><span class="legend-dot" style="background:#ffaa44"></span><span>Finished</span></li><li><span class="legend-dot" style="background:#ff6622"></span><span>Verification 30-59%</span></li><li><span class="legend-dot" style="background:#ff5555"></span><span>Verification 60-99%</span></li><li><span class="legend-dot" style="background:#bbbbbb"></span><span>Verified, not rated</span></li><li><span class="legend-dot" style="background:#ffffff;border:1px solid #555;"></span><span>Verified and rated</span></li></ul></div>';
    }

    function bindListRows() {
        if (!isMobile()) return;
        var rows = document.querySelectorAll('.page-list .list tr:not(.mobile-drawer-tr)');
        rows.forEach(function(row) {
            if (row.dataset.mobileBound) return;
            row.dataset.mobileBound = '1';
            var btn = row.querySelector('button');
            if (!btn) return;
            btn.addEventListener('click', function() { setTimeout(function() { toggleInlineDrawer(row); }, 80); });
        });
    }

    function toggleInlineDrawer(row) {
        if (openDrawerRow === row) { removeInlineDrawer(); return; }
        removeInlineDrawer();

        var levelContainer = qs('.level-container');
        if (!levelContainer) return;
        var prevDisplay = levelContainer.style.display;
        levelContainer.style.display = '';
        var levelEl = qs('.level', levelContainer);
        if (!levelEl) { levelContainer.style.display = prevDisplay || 'none'; return; }
        var clone = levelEl.cloneNode(true);
        levelContainer.style.display = prevDisplay || 'none';

        var drawerTr = document.createElement('tr');
        drawerTr.className = 'mobile-drawer-tr';
        var td = document.createElement('td');
        td.colSpan = 3;
        var drawer = document.createElement('div');
        drawer.className = 'mobile-level-drawer';
        drawer.appendChild(clone);
        td.appendChild(drawer);
        drawerTr.appendChild(td);
        row.insertAdjacentElement('afterend', drawerTr);
        openDrawerRow = row;
        requestAnimationFrame(function() { requestAnimationFrame(function() { drawer.classList.add('open'); }); });
    }

    function removeInlineDrawer() {
        if (!openDrawerRow) return;
        var next = openDrawerRow.nextElementSibling;
        if (next && next.classList.contains('mobile-drawer-tr')) next.remove();
        openDrawerRow = null;
    }

    function watchLevelContainer() {
        var container = qs('.level-container');
        if (!container || container._mobileWatched) return;
        container._mobileWatched = true;
        new MutationObserver(function() {
            if (!openDrawerRow || !isMobile()) return;
            var drawerTr = openDrawerRow.nextElementSibling;
            if (!drawerTr || !drawerTr.classList.contains('mobile-drawer-tr')) return;
            var lc = qs('.level-container');
            if (!lc) return;
            var prev = lc.style.display;
            lc.style.display = '';
            var le = qs('.level', lc);
            if (!le) { lc.style.display = prev || 'none'; return; }
            var clone = le.cloneNode(true);
            lc.style.display = prev || 'none';
            var newDrawer = document.createElement('div');
            newDrawer.className = 'mobile-level-drawer open';
            newDrawer.appendChild(clone);
            var newTd = document.createElement('td');
            newTd.colSpan = 3;
            newTd.appendChild(newDrawer);
            var newTr = document.createElement('tr');
            newTr.className = 'mobile-drawer-tr';
            newTr.appendChild(newTd);
            drawerTr.replaceWith(newTr);
        }).observe(container, { childList: true, subtree: true, characterData: true });
    }

    var booted = false;

    function boot() {
        if (!isMobile() || booted) return;
        if (!qs('header.new .nav')) return;
        booted = true;
        buildDrawer();
        bindListRows();
        watchLevelContainer();
        var table = qs('.page-list .list');
        if (table) new MutationObserver(bindListRows).observe(table, { childList: true });
    }

    var bootInterval = setInterval(function() {
        if (qs('header.new .nav') && qs('.page-list')) {
            clearInterval(bootInterval);
            boot();
        }
    }, 100);

    window.addEventListener('resize', function() { if (isMobile() && !booted) boot(); });

    window.addEventListener('hashchange', function() {
        booted = false;
        drawerBuilt = false;
        openDrawerRow = null;
        var old = qs('#mobile-menu-btn');
        var oldOverlay = qs('#mobile-drawer-overlay');
        if (old) old.remove();
        if (oldOverlay) oldOverlay.remove();
        setTimeout(function() {
            var iv = setInterval(function() {
                if (qs('header.new .nav') && qs('.page-list')) { clearInterval(iv); boot(); }
            }, 100);
        }, 200);
    });

}());
