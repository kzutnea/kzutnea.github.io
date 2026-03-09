(function () {
    "use strict";

    var BP = 768;
    function isMobile() { return window.innerWidth <= BP; }
    function qs(s, r) { return (r || document).querySelector(s); }

    var openDrawerRow = null;
    var listObserver = null;
    var levelObserver = null;
    var booted = false;

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

    function currentHash() { return location.hash || '#/'; }

    var listOptions = [
        { label: 'All Levels',   hash: '#/',            matches: ['#/', '#/listmain', '#/listfuture', ''] },
        { label: 'Main List',    hash: '#/listmain',    matches: ['#/listmain'] },
        { label: 'Future List',  hash: '#/listfuture',  matches: ['#/listfuture'] },
        { label: 'Leaderboard',  hash: '#/leaderboard', matches: ['#/leaderboard'] },
        { label: 'Pending List', hash: '#/pending',     matches: ['#/pending'] }
    ];

    function boot() {
        if (!isMobile() || booted) return;
        if (!qs('header.surface')) return;
        booted = true;
        buildHeader();
        buildBottomBar();
        rebind();
    }

    function buildHeader() {
        var header = qs('header.surface');
        if (!header || qs('#mob-menu-btn')) return;
        var btn = document.createElement('button');
        btn.id = 'mob-menu-btn';
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
        header.appendChild(btn);
        btn.addEventListener('click', toggleBar);
    }

    function buildBottomBar() {
        if (qs('#mob-bar')) return;

        var bar = document.createElement('div');
        bar.id = 'mob-bar';

        var tabRow = document.createElement('div');
        tabRow.id = 'mob-tabs';

        var panelWrap = document.createElement('div');
        panelWrap.id = 'mob-panels';

        var tabs = [
            { id: 'lists',   label: 'Lists' },
            { id: 'filters', label: 'Filters' },
            { id: 'info',    label: 'Info' }
        ];

        tabs.forEach(function (t, i) {
            var btn = document.createElement('button');
            btn.className = 'mob-tab' + (i === 0 ? ' active' : '');
            btn.textContent = t.label;
            btn.dataset.tab = t.id;
            btn.addEventListener('click', function () {
                bar.querySelectorAll('.mob-tab').forEach(function (b) { b.classList.remove('active'); });
                bar.querySelectorAll('.mob-panel').forEach(function (p) { p.classList.remove('active'); });
                btn.classList.add('active');
                qs('#mob-panel-' + t.id).classList.add('active');
            });
            tabRow.appendChild(btn);

            var panel = document.createElement('div');
            panel.className = 'mob-panel' + (i === 0 ? ' active' : '');
            panel.id = 'mob-panel-' + t.id;
            panelWrap.appendChild(panel);
        });

        bar.appendChild(tabRow);
        bar.appendChild(panelWrap);
        document.body.appendChild(bar);

        buildListsPanel(qs('#mob-panel-lists'));
        buildFiltersPanel(qs('#mob-panel-filters'));
        buildInfoPanel(qs('#mob-panel-info'));
    }

    function toggleBar() {
        var bar = qs('#mob-bar');
        if (!bar) return;
        bar.classList.toggle('open');
        updateListActive();
    }

    function closeBar() {
        var bar = qs('#mob-bar');
        if (bar) bar.classList.remove('open');
    }

    function buildListsPanel(container) {
        var h = currentHash();
        listOptions.forEach(function (opt) {
            var row = document.createElement('div');
            row.className = 'mob-row' + (opt.matches.indexOf(h) !== -1 ? ' active' : '');
            row.dataset.listHash = opt.hash;
            row.innerHTML = '<span>' + opt.label + '</span><span class="mob-check">&#10003;</span>';
            row.addEventListener('click', function () {
                closeBar();
                removeInlineDrawer();
                var router = getRouter();
                var path = opt.hash.replace(/^#/, '');
                if (router) {
                    router.push(path).catch(function () {});
                } else {
                    location.hash = opt.hash;
                }
                setTimeout(updateListActive, 300);
                setTimeout(rebind, 400);
            });
            container.appendChild(row);
        });
    }

    function updateListActive() {
        var h = currentHash();
        document.querySelectorAll('#mob-panel-lists .mob-row').forEach(function (row, i) {
            var opt = listOptions[i];
            if (!opt) return;
            row.classList.toggle('active', opt.matches.indexOf(h) !== -1);
        });
    }

    function buildFiltersPanel(container) {
        var sep = document.createElement('div');
        sep.className = 'mob-sep';

        setTimeout(function () {
            var c = findListComp();
            if (!c || !c.filtersList) return;
            c.filtersList.forEach(function (item, idx) {
                if (item.separator) {
                    container.appendChild(mkSep());
                    return;
                }
                var row = document.createElement('div');
                row.className = 'mob-row' + (item.active ? ' active' : '');
                row.innerHTML = '<span>' + item.name + '</span><span class="mob-check">&#10003;</span>';
                row.addEventListener('click', function () {
                    var fc = findListComp();
                    if (!fc) return;
                    fc.useFilter(idx);
                    row.classList.toggle('active', !!fc.filtersList[idx].active);
                });
                container.appendChild(row);
            });
        }, 600);
    }

    function buildInfoPanel(container) {
        var darkRow = document.createElement('div');
        darkRow.className = 'mob-toggle-row';
        var pill = document.createElement('div');
        pill.className = 'mob-pill';
        pill.id = 'mob-dark-pill';
        darkRow.innerHTML = '<span>Dark mode</span>';
        darkRow.appendChild(pill);

        function isDark() {
            var root = qs('.root');
            return root ? root.classList.contains('dark') : false;
        }
        setTimeout(function () { pill.classList.toggle('on', isDark()); }, 300);
        darkRow.addEventListener('click', function () {
            var store = getStore();
            if (store && typeof store.toggleDark === 'function') {
                store.toggleDark();
            } else {
                var btn = qs('.nav__actions .nav__icon');
                if (btn) btn.click();
            }
            setTimeout(function () { pill.classList.toggle('on', isDark()); }, 80);
        });
        container.appendChild(darkRow);

        container.appendChild(mkSep());

        var discordRow = document.createElement('a');
        discordRow.className = 'mob-row';
        discordRow.href = 'https://discord.gg/9wVWSgJSe8';
        discordRow.target = '_blank';
        discordRow.rel = 'noopener';
        discordRow.innerHTML = '<span>Discord</span><span class="mob-ext">&#8599;</span>';
        container.appendChild(discordRow);

        container.appendChild(mkSep());

        var infoRow = document.createElement('div');
        infoRow.className = 'mob-row';
        infoRow.innerHTML = '<span>Info</span><span class="mob-ext">&#8250;</span>';
        infoRow.addEventListener('click', function () { closeBar(); openInfoOverlay(); });
        container.appendChild(infoRow);
    }

    function mkSep() {
        var s = document.createElement('div');
        s.className = 'mob-sep';
        return s;
    }

    function findListComp() {
        var el = qs('.page-list');
        while (el) {
            var c = el.__vueParentComponent;
            if (c && c.proxy && c.proxy.showThumbnails !== undefined) return c.proxy;
            el = el.parentElement;
        }
        return null;
    }

    function openInfoOverlay() {
        var existing = qs('#mob-info-overlay');
        if (existing) existing.remove();

        var el = document.createElement('div');
        el.className = 'mob-info-overlay';
        el.id = 'mob-info-overlay';

        var hdr = document.createElement('div');
        hdr.className = 'mob-info-header';
        hdr.innerHTML = '<span class="mob-info-title">Info</span>';
        var cx = document.createElement('button');
        cx.className = 'mob-info-close';
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
        tabBar.className = 'mob-info-tabs';
        el.appendChild(tabBar);

        var body = document.createElement('div');
        body.className = 'mob-info-body';
        el.appendChild(body);

        var tabDefs = [
            { key: 'legend',     label: 'Legend' },
            { key: 'guidelines', label: 'Guidelines' },
            { key: 'editors',    label: 'Editors' }
        ];
        var panels = {};

        tabDefs.forEach(function (t, i) {
            var btn = document.createElement('button');
            btn.className = 'mob-info-tab' + (i === 0 ? ' active' : '');
            btn.textContent = t.label;
            btn.addEventListener('click', function () {
                tabBar.querySelectorAll('.mob-info-tab').forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                Object.keys(panels).forEach(function (k) { panels[k].classList.remove('active'); });
                panels[t.key].classList.add('active');
            });
            tabBar.appendChild(btn);

            var panel = document.createElement('div');
            panel.className = 'mob-info-panel' + (i === 0 ? ' active' : '');
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
            if (row.dataset.mb) return;
            row.dataset.mb = '1';
            var btn = row.querySelector('button');
            if (!btn) return;
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                setTimeout(function () { toggleDrawer(row); }, 80);
            });
        });
    }

    function clearBound() {
        document.querySelectorAll('.page-list .list tr[data-mb]').forEach(function (r) {
            r.removeAttribute('data-mb');
        });
    }

    function toggleDrawer(row) {
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

    function watchLevel() {
        if (levelObserver) { levelObserver.disconnect(); levelObserver = null; }
        var lc = qs('.level-container');
        if (!lc) return;
        levelObserver = new MutationObserver(function () {
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
        });
        levelObserver.observe(lc, { childList: true, subtree: true, characterData: true });
    }

    function rebind() {
        removeInlineDrawer();
        if (listObserver) { listObserver.disconnect(); listObserver = null; }
        var attempts = 0;
        var poll = setInterval(function () {
            attempts++;
            var tbl = qs('.page-list .list');
            if (tbl) {
                clearInterval(poll);
                clearBound();
                bindListRows();
                watchLevel();
                listObserver = new MutationObserver(function () {
                    clearBound();
                    bindListRows();
                });
                listObserver.observe(tbl, { childList: true });
            }
            if (attempts > 50) clearInterval(poll);
        }, 100);
    }

    var bootPoll = setInterval(function () {
        if (qs('header.surface') && qs('.page-list')) { clearInterval(bootPoll); boot(); }
    }, 100);

    window.addEventListener('resize', function () { if (isMobile() && !booted) boot(); });

    window.addEventListener('hashchange', function () {
        updateListActive();
        removeInlineDrawer();
        rebind();
    });

}());
