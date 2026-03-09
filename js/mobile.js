(function () {
    "use strict";

    var BP = 768;
    function isMobile() { return window.innerWidth <= BP; }
    function qs(s, r) { return (r || document).querySelector(s); }

    var drawerBuilt = false;
    var openDrawerRow = null;

    function findListComp() {
        var el = qs('.page-list');
        while (el) {
            var c = el.__vueParentComponent;
            if (c && c.proxy && c.proxy.showThumbnails !== undefined) return c.proxy;
            el = el.parentElement;
        }
        return null;
    }

    function buildDrawer() {
        if (drawerBuilt) return;
        drawerBuilt = true;

        var nav = qs('header.new .nav');
        if (!nav) return;

        /* Menu button — sits after .nav inside header.new */
        var menuBtn = document.createElement('button');
        menuBtn.id = 'mobile-menu-btn';
        menuBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
        nav.parentElement.appendChild(menuBtn);
        menuBtn.addEventListener('click', openDrawerMenu);

        /* Overlay shell */
        var overlay = document.createElement('div');
        overlay.id = 'mobile-drawer-overlay';

        var backdrop = document.createElement('div');
        backdrop.id = 'mobile-drawer-backdrop';
        backdrop.addEventListener('click', closeDrawerMenu);
        overlay.appendChild(backdrop);

        var drawer = document.createElement('div');
        drawer.id = 'mobile-drawer';

        /* Drawer header */
        var dh = document.createElement('div');
        dh.id = 'mobile-drawer-header';
        dh.innerHTML = '<span>Menu</span>';
        var closeX = document.createElement('button');
        closeX.id = 'mobile-drawer-close';
        closeX.innerHTML = '&times;';
        closeX.addEventListener('click', closeDrawerMenu);
        dh.appendChild(closeX);
        drawer.appendChild(dh);

        /* Section: Display */
        drawer.appendChild(mkSectionTitle('Display'));
        var dispSect = document.createElement('div');
        dispSect.className = 'mobile-drawer-section';
        dispSect.appendChild(makeToggleRow('Thumbnails', 'thumb'));
        dispSect.appendChild(makeToggleRow('Level colors', 'color'));
        drawer.appendChild(dispSect);

        /* Section: Filters */
        drawer.appendChild(mkSectionTitle('Filters'));
        var filterSect = document.createElement('div');
        filterSect.className = 'mobile-drawer-section';
        filterSect.id = 'mobile-filter-section';
        buildFilters(filterSect);
        drawer.appendChild(filterSect);

        /* Section: Info (single button) */
        drawer.appendChild(mkSectionTitle('Info'));
        var infoSect = document.createElement('div');
        infoSect.className = 'mobile-drawer-section';
        var infoBtn = document.createElement('button');
        infoBtn.className = 'mobile-drawer-info-btn';
        infoBtn.innerHTML = '<span>Legend, Guidelines &amp; Editors</span><span class="arrow">&#8250;</span>';
        infoBtn.addEventListener('click', function () { closeDrawerMenu(); openInfoOverlay(); });
        infoSect.appendChild(infoBtn);
        drawer.appendChild(infoSect);

        overlay.appendChild(drawer);
        document.body.appendChild(overlay);

        setTimeout(function () {
            wireToggle('thumb', 'showThumbnails');
            wireToggle('color', 'showColors');
        }, 400);
    }

    function mkSectionTitle(text) {
        var d = document.createElement('div');
        d.className = 'mobile-drawer-section-title';
        d.textContent = text;
        return d;
    }

    function makeToggleRow(label, key) {
        var row = document.createElement('div');
        row.className = 'mobile-drawer-toggle';
        var pill = document.createElement('div');
        pill.className = 'mobile-toggle-pill on';
        pill.id = 'mobile-pill-' + key;
        row.innerHTML = '<span>' + label + '</span>';
        row.appendChild(pill);
        return row;
    }

    function wireToggle(key, prop) {
        var pill = qs('#mobile-pill-' + key);
        if (!pill) return;
        var c = findListComp();
        if (c) pill.classList.toggle('on', !!c[prop]);
        pill.parentElement.addEventListener('click', function () {
            var c2 = findListComp();
            if (!c2) return;
            c2[prop] = !c2[prop];
            pill.classList.toggle('on', !!c2[prop]);
        });
    }

    function buildFilters(container) {
        var decRow = document.createElement('div');
        decRow.className = 'mobile-drawer-numeric';
        decRow.innerHTML = '<label>Min decoration %</label><input id="mob-dec" type="number" min="0" max="100" placeholder="0">';
        container.appendChild(decRow);

        var verRow = document.createElement('div');
        verRow.className = 'mobile-drawer-numeric';
        verRow.innerHTML = '<label>Min verification %</label><input id="mob-ver" type="number" min="0" max="100" placeholder="0">';
        container.appendChild(verRow);

        setTimeout(function () {
            var di = qs('#mob-dec'), vi = qs('#mob-ver');
            if (di) di.addEventListener('input', function () {
                var c = findListComp();
                if (c) { c.minDecoration = Number(di.value) || 0; if (c.applyFilters) c.applyFilters(); }
            });
            if (vi) vi.addEventListener('input', function () {
                var c = findListComp();
                if (c) { c.minVerification = Number(vi.value) || 0; if (c.applyFilters) c.applyFilters(); }
            });
        }, 500);

        setTimeout(function () {
            var c = findListComp();
            if (!c || !c.filtersList) return;
            c.filtersList.forEach(function (item, idx) {
                if (item.separator) { container.appendChild(mkSep()); return; }
                var row = document.createElement('div');
                row.className = 'mobile-drawer-filter' + (item.active ? ' active' : '');
                row.innerHTML = '<span>' + item.name + '</span><span class="check">&#10003;</span>';
                row.addEventListener('click', function () {
                    var fc = findListComp();
                    if (!fc) return;
                    fc.useFilter(idx);
                    row.classList.toggle('active', !!fc.filtersList[idx].active);
                });
                container.appendChild(row);
            });
        }, 500);
    }

    function mkSep() {
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

    /* ---- Combined info overlay (3 tabs) ---- */
    function openInfoOverlay() {
        var existing = qs('#mobile-info-overlay');
        if (existing) existing.remove();

        var el = document.createElement('div');
        el.className = 'mobile-overlay';
        el.id = 'mobile-info-overlay';

        /* Header */
        var hdr = document.createElement('div');
        hdr.className = 'mobile-overlay__header';
        hdr.innerHTML = '<span class="mobile-overlay__title">Info</span>';
        var cx = document.createElement('button');
        cx.className = 'mobile-overlay__close';
        cx.innerHTML = '&times;';
        cx.addEventListener('click', function () {
            el.classList.remove('visible');
            el.addEventListener('transitionend', function () {
                el.remove();
                document.body.style.overflow = '';
            }, { once: true });
        });
        hdr.appendChild(cx);
        el.appendChild(hdr);

        /* Tab bar */
        var tabBar = document.createElement('div');
        tabBar.className = 'mobile-info-tabs';
        el.appendChild(tabBar);

        /* Body */
        var body = document.createElement('div');
        body.className = 'mobile-overlay__body';
        el.appendChild(body);

        var tabDefs = [
            { key: 'legend',     label: 'Legend' },
            { key: 'guidelines', label: 'Guidelines' },
            { key: 'editors',    label: 'Editors' }
        ];
        var panels = {};

        tabDefs.forEach(function (t, i) {
            /* Tab button */
            var btn = document.createElement('button');
            btn.className = 'mobile-info-tab' + (i === 0 ? ' active' : '');
            btn.textContent = t.label;
            btn.addEventListener('click', function () {
                tabBar.querySelectorAll('.mobile-info-tab').forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                Object.keys(panels).forEach(function (k) { panels[k].classList.remove('active'); });
                panels[t.key].classList.add('active');
            });
            tabBar.appendChild(btn);

            /* Panel */
            var panel = document.createElement('div');
            panel.className = 'mobile-info-panel' + (i === 0 ? ' active' : '');
            panel.innerHTML = getInfoHTML(t.key);
            panels[t.key] = panel;
            body.appendChild(panel);
        });

        document.body.appendChild(el);
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(function () {
            requestAnimationFrame(function () { el.classList.add('visible'); });
        });
    }

    function getInfoHTML(id) {
        /* Clone content from hidden meta-container */
        var metaEl = qs('.meta-container');
        if (id === 'legend') {
            if (metaEl) {
                var prev = metaEl.style.display;
                metaEl.style.display = '';
                var legendEl = qs('.legend', metaEl);
                var html = legendEl ? legendEl.innerHTML : fallbackLegend();
                metaEl.style.display = prev || 'none';
                return '<ul class="legend-list">' + html + '</ul>';
            }
            return fallbackLegend();
        }
        if (id === 'guidelines') {
            return '<p>The guidelines explain how each aspect of the Upcoming Level List works.</p>'
                 + '<a href="https://docs.google.com/document/d/13dmRfx2OCiLEaM2EcgEd-mKdok11_k8k7HsA5a-K6nY/edit?usp=sharing"'
                 + ' target="_blank" rel="noopener"'
                 + ' style="display:inline-block;padding:0.6rem 1rem;background:var(--color-primary);color:var(--color-on-primary);border-radius:0.4rem;font-weight:600;text-decoration:none;font-family:\'Lexend Deca\',sans-serif;">'
                 + 'View guidelines</a>';
        }
        if (id === 'editors') {
            if (metaEl) {
                var prev2 = metaEl.style.display;
                metaEl.style.display = '';
                var editorsEl = qs('.editors', metaEl);
                var html2 = editorsEl ? editorsEl.outerHTML : '<p>Not loaded yet.</p>';
                metaEl.style.display = prev2 || 'none';
                return html2;
            }
            return '<p>Not loaded yet.</p>';
        }
        return '';
    }

    function fallbackLegend() {
        var items = [
            ['#5599ff','On layout state'],['#33dddd','Deco 1-29%'],
            ['#55ee55','Deco 30-69%'],['#ffee55','Deco 70-99%'],
            ['#ffaa44','Finished'],['#ff6622','Verification 30-59%'],
            ['#ff5555','Verification 60-99%'],['#bbbbbb','Verified, not rated'],
            ['#ffffff','Verified and rated']
        ];
        return items.map(function (i) {
            var border = i[0] === '#ffffff' ? ' border:1px solid #888;' : '';
            return '<li><span class="legend-dot" style="background:' + i[0] + ';' + border + '"></span>'
                 + '<span class="legend-text">' + i[1] + '</span></li>';
        }).join('');
    }

    /* ---- Inline level drawers ---- */
    function bindListRows() {
        if (!isMobile()) return;
        document.querySelectorAll('.page-list .list tr:not(.mobile-drawer-tr)').forEach(function (row) {
            if (row.dataset.mobileBound) return;
            row.dataset.mobileBound = '1';
            var btn = row.querySelector('button');
            if (!btn) return;
            btn.addEventListener('click', function () {
                setTimeout(function () { toggleInlineDrawer(row); }, 80);
            });
        });
    }

    function toggleInlineDrawer(row) {
        if (openDrawerRow === row) { removeInlineDrawer(); return; }
        removeInlineDrawer();

        var lc = qs('.level-container');
        if (!lc) return;
        var prev = lc.style.display;
        lc.style.display = '';
        var levelEl = qs('.level', lc);
        if (!levelEl) { lc.style.display = prev || 'none'; return; }
        var clone = levelEl.cloneNode(true);
        lc.style.display = prev || 'none';

        var tr = document.createElement('tr');
        tr.className = 'mobile-drawer-tr';
        var td = document.createElement('td');
        td.colSpan = 3;
        var drw = document.createElement('div');
        drw.className = 'mobile-level-drawer';
        drw.appendChild(clone);
        td.appendChild(drw);
        tr.appendChild(td);
        row.insertAdjacentElement('afterend', tr);
        openDrawerRow = row;
        requestAnimationFrame(function () {
            requestAnimationFrame(function () { drw.classList.add('open'); });
        });
    }

    function removeInlineDrawer() {
        if (!openDrawerRow) return;
        var next = openDrawerRow.nextElementSibling;
        if (next && next.classList.contains('mobile-drawer-tr')) next.remove();
        openDrawerRow = null;
    }

    function watchLevelContainer() {
        var lc = qs('.level-container');
        if (!lc || lc._mw) return;
        lc._mw = true;
        new MutationObserver(function () {
            if (!openDrawerRow || !isMobile()) return;
            var dtr = openDrawerRow.nextElementSibling;
            if (!dtr || !dtr.classList.contains('mobile-drawer-tr')) return;
            var lc2 = qs('.level-container');
            if (!lc2) return;
            var p = lc2.style.display;
            lc2.style.display = '';
            var le = qs('.level', lc2);
            if (!le) { lc2.style.display = p || 'none'; return; }
            var cl = le.cloneNode(true);
            lc2.style.display = p || 'none';
            var newDrw = document.createElement('div');
            newDrw.className = 'mobile-level-drawer open';
            newDrw.appendChild(cl);
            var newTd = document.createElement('td');
            newTd.colSpan = 3;
            newTd.appendChild(newDrw);
            var newTr = document.createElement('tr');
            newTr.className = 'mobile-drawer-tr';
            newTr.appendChild(newTd);
            dtr.replaceWith(newTr);
        }).observe(lc, { childList: true, subtree: true, characterData: true });
    }

    var booted = false;

    function boot() {
        if (!isMobile() || booted) return;
        if (!qs('header.new .nav')) return;
        booted = true;
        buildDrawer();
        bindListRows();
        watchLevelContainer();
        var tbl = qs('.page-list .list');
        if (tbl) new MutationObserver(bindListRows).observe(tbl, { childList: true });
    }

    var iv = setInterval(function () {
        if (qs('header.new .nav') && qs('.page-list')) { clearInterval(iv); boot(); }
    }, 100);

    window.addEventListener('resize', function () { if (isMobile() && !booted) boot(); });

    window.addEventListener('hashchange', function () {
        booted = false; drawerBuilt = false; openDrawerRow = null;
        ['#mobile-menu-btn','#mobile-drawer-overlay','#mobile-info-overlay'].forEach(function (s) {
            var e = qs(s); if (e) e.remove();
        });
        setTimeout(function () {
            var iv2 = setInterval(function () {
                if (qs('header.new .nav') && qs('.page-list')) { clearInterval(iv2); boot(); }
            }, 100);
        }, 200);
    });

}());
