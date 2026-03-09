(function () {
    "use strict";

    var BP = 768;
    function isMobile() { return window.innerWidth <= BP; }
    function qs(s, r) { return (r || document).querySelector(s); }

    var drawerBuilt = false;
    var openDrawerRow = null;
    var listObserver = null;

    function getStore() {
        var root = document.getElementById('app');
        if (!root || !root.__vue_app__) return null;
        var inst = root.__vue_app__._instance;
        if (inst && inst.proxy && inst.proxy.store) return inst.proxy.store;
        return null;
    }

    function getRouter() {
        var app = document.getElementById('app');
        if (!app || !app.__vue_app__) return null;
        return app.__vue_app__.config.globalProperties.$router;
    }

    function currentHash() {
        return location.hash || '#/';
    }

    var listOptions = [
        { label: 'All Levels',   hash: '#/',             matches: ['#/', '#/listmain', '#/listfuture', ''] },
        { label: 'Main List',    hash: '#/listmain',     matches: ['#/listmain'] },
        { label: 'Future List',  hash: '#/listfuture',   matches: ['#/listfuture'] },
        { label: 'Leaderboard',  hash: '#/leaderboard',  matches: ['#/leaderboard'] },
        { label: 'Pending List', hash: '#/pending',      matches: ['#/pending'] }
    ];

    function buildDrawer() {
        if (drawerBuilt) return;
        drawerBuilt = true;

        var navParent = qs('header.surface');
        if (!navParent) return;

        var menuBtn = document.createElement('button');
        menuBtn.id = 'mobile-menu-btn';
        menuBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
        navParent.appendChild(menuBtn);
        menuBtn.addEventListener('click', openDrawerMenu);

        var overlay = document.createElement('div');
        overlay.id = 'mobile-drawer-overlay';

        var backdrop = document.createElement('div');
        backdrop.id = 'mobile-drawer-backdrop';
        backdrop.addEventListener('click', closeDrawerMenu);
        overlay.appendChild(backdrop);

        var drawer = document.createElement('div');
        drawer.id = 'mobile-drawer';

        var dh = document.createElement('div');
        dh.id = 'mobile-drawer-header';
        dh.innerHTML = '<span>Menu</span>';
        var closeX = document.createElement('button');
        closeX.id = 'mobile-drawer-close';
        closeX.innerHTML = '&times;';
        closeX.addEventListener('click', closeDrawerMenu);
        dh.appendChild(closeX);
        drawer.appendChild(dh);

        drawer.appendChild(mkSectionTitle('Lists'));
        var listSect = document.createElement('div');
        listSect.className = 'mobile-drawer-section';
        listSect.id = 'mobile-list-section';
        buildListSwitcher(listSect);
        drawer.appendChild(listSect);

        drawer.appendChild(mkSectionTitle('Settings'));
        var settingsSect = document.createElement('div');
        settingsSect.className = 'mobile-drawer-section';
        settingsSect.appendChild(makeDarkModeRow());
        var discordBtn = document.createElement('a');
        discordBtn.className = 'mobile-drawer-info-btn';
        discordBtn.href = 'https://discord.gg/9wVWSgJSe8';
        discordBtn.target = '_blank';
        discordBtn.rel = 'noopener';
        discordBtn.style.textDecoration = 'none';
        discordBtn.innerHTML = '<span>Discord</span><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style="opacity:0.35"><path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028z"/></svg>';
        settingsSect.appendChild(discordBtn);
        drawer.appendChild(settingsSect);

        drawer.appendChild(mkSectionTitle('Info'));
        var infoSect = document.createElement('div');
        infoSect.className = 'mobile-drawer-section';
        var infoBtn = document.createElement('button');
        infoBtn.className = 'mobile-drawer-info-btn';
        infoBtn.innerHTML = '<span>Info</span><span class="arrow">&#8250;</span>';
        infoBtn.addEventListener('click', function () { closeDrawerMenu(); openInfoOverlay(); });
        infoSect.appendChild(infoBtn);
        drawer.appendChild(infoSect);

        overlay.appendChild(drawer);
        document.body.appendChild(overlay);
    }

    function buildListSwitcher(container) {
        var h = currentHash();
        listOptions.forEach(function (opt) {
            var row = document.createElement('div');
            row.className = 'mobile-drawer-filter' + (opt.matches.indexOf(h) !== -1 ? ' active' : '');
            row.innerHTML = '<span>' + opt.label + '</span><span class="check">&#10003;</span>';
            row.addEventListener('click', function () {
                closeDrawerMenu();
                removeInlineDrawer();
                var router = getRouter();
                var path = opt.hash.replace(/^#/, '');
                if (router) {
                    router.push(path).catch(function () {});
                } else {
                    location.hash = opt.hash;
                }
                setTimeout(updateListActive, 350);
                setTimeout(rebindAfterRouteChange, 450);
            });
            container.appendChild(row);
        });
    }

    function updateListActive() {
        var h = currentHash();
        var rows = document.querySelectorAll('#mobile-list-section .mobile-drawer-filter');
        rows.forEach(function (row, i) {
            var opt = listOptions[i];
            if (!opt) return;
            row.classList.toggle('active', opt.matches.indexOf(h) !== -1);
        });
    }

    function mkSectionTitle(text) {
        var d = document.createElement('div');
        d.className = 'mobile-drawer-section-title';
        d.textContent = text;
        return d;
    }

    function makeDarkModeRow() {
        var row = document.createElement('div');
        row.className = 'mobile-drawer-toggle';
        var pill = document.createElement('div');
        pill.className = 'mobile-toggle-pill';
        pill.id = 'mobile-pill-darkmode';
        row.innerHTML = '<span>Dark mode</span>';
        row.appendChild(pill);

        function isDark() {
            var root = qs('.root');
            return root ? root.classList.contains('dark') : false;
        }

        setTimeout(function () { pill.classList.toggle('on', isDark()); }, 300);

        row.addEventListener('click', function () {
            var store = getStore();
            if (store && typeof store.toggleDark === 'function') {
                store.toggleDark();
            } else {
                var btn = qs('.nav__actions .nav__icon');
                if (btn) btn.click();
            }
            setTimeout(function () { pill.classList.toggle('on', isDark()); }, 80);
        });
        return row;
    }

    function openDrawerMenu() {
        updateListActive();
        var o = qs('#mobile-drawer-overlay');
        if (o) o.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeDrawerMenu() {
        var o = qs('#mobile-drawer-overlay');
        if (o) o.classList.remove('open');
        document.body.style.overflow = '';
    }

    function openInfoOverlay() {
        var existing = qs('#mobile-info-overlay');
        if (existing) existing.remove();

        var el = document.createElement('div');
        el.className = 'mobile-overlay';
        el.id = 'mobile-info-overlay';

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

        var tabBar = document.createElement('div');
        tabBar.className = 'mobile-info-tabs';
        el.appendChild(tabBar);

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

    function bindListRows() {
        if (!isMobile()) return;
        document.querySelectorAll('.page-list .list tr:not(.mobile-drawer-tr)').forEach(function (row) {
            if (row.dataset.mobileBound) return;
            row.dataset.mobileBound = '1';
            var btn = row.querySelector('button');
            if (!btn) return;
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
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

    function rebindAfterRouteChange() {
        removeInlineDrawer();
        if (listObserver) { listObserver.disconnect(); listObserver = null; }
        var attempts = 0;
        var poll = setInterval(function () {
            attempts++;
            var tbl = qs('.page-list .list');
            if (tbl) {
                clearInterval(poll);
                tbl.querySelectorAll('tr:not(.mobile-drawer-tr)').forEach(function (r) {
                    delete r.dataset.mobileBound;
                });
                bindListRows();
                watchLevelContainer();
                listObserver = new MutationObserver(function () {
                    tbl.querySelectorAll('tr:not(.mobile-drawer-tr)').forEach(function (r) {
                        if (r.dataset.mobileBound) return;
                        delete r.dataset.mobileBound;
                    });
                    bindListRows();
                });
                listObserver.observe(tbl, { childList: true });
            }
            if (attempts > 50) clearInterval(poll);
        }, 100);
    }

    var booted = false;

    function boot() {
        if (!isMobile() || booted) return;
        if (!qs('header.surface')) return;
        booted = true;
        buildDrawer();
        rebindAfterRouteChange();
    }

    var bootPoll = setInterval(function () {
        if (qs('header.surface') && qs('.page-list')) { clearInterval(bootPoll); boot(); }
    }, 100);

    window.addEventListener('resize', function () { if (isMobile() && !booted) boot(); });

    window.addEventListener('hashchange', function () {
        updateListActive();
        removeInlineDrawer();
        rebindAfterRouteChange();
    });

}());
