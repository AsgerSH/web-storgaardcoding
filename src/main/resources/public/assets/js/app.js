/* StorgaardCoding frontend JS */

(() => {
    const html = document.documentElement;
    const navToggle = document.querySelector('.nav-toggle');
    const navList = document.querySelector('#primary-nav');
    const themeBtn = document.getElementById('theme-toggle');

    document.documentElement.classList.add('js-ready');


    // ---------- Theme handling ----------
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'light' || storedTheme === 'dark') {
        html.setAttribute('data-theme', storedTheme);
    } else {
        html.setAttribute('data-theme', 'system');
    }

    const applySystemChange = (e) => {
        if (html.getAttribute('data-theme') === 'system') {
            html.style.colorScheme = e.matches ? 'dark' : 'light';
        }
    };
    if (window.matchMedia) {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        mq.addEventListener('change', applySystemChange);
    }

    themeBtn?.addEventListener('click', () => {
        const current = html.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : current === 'light' ? 'system' : 'dark';
        html.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    });

    // ---------- Mobile nav ----------
    navToggle?.addEventListener('click', () => {
        const open = navList.getAttribute('data-open') === 'true';
        navList.setAttribute('data-open', String(!open));
        navToggle.setAttribute('aria-expanded', String(!open));
    });
    navList?.querySelectorAll('a')?.forEach(a => a.addEventListener('click', () => {
        if (navList.getAttribute('data-open') === 'true') {
            navList.setAttribute('data-open', 'false');
            navToggle.setAttribute('aria-expanded', 'false');
        }
    }));

    // ---------- Scroll spy ----------
    const navLinks = [...document.querySelectorAll('[data-nav]')];
    const sections = navLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    const spy = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            const id = '#' + entry.target.id;
            const link = navLinks.find(l => l.getAttribute('href') === id);
            if (link) link.setAttribute('aria-current', entry.isIntersecting ? 'page' : 'false');
        });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: [0, 1] });
    sections.forEach(s => spy.observe(s));

    // ---------- Reveal animations ----------
    const reveals = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    reveals.forEach(el => io.observe(el));

    // ---------- Simple uptime check (no-cors) ----------
    async function probeReachable(url, timeoutMs = 4000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeoutMs);
        try {
            await fetch(url, { mode: 'no-cors', cache: 'no-store', signal: controller.signal });
            clearTimeout(id);
            return true;
        } catch (e) {
            clearTimeout(id);
            return false;
        }
    }

    async function updateProjectStatuses() {
        const cards = document.querySelectorAll('.project-card');
        for (const card of cards) {
            const pill = card.querySelector('[data-status]');
            const url = card.getAttribute('data-url');
            if (!pill || !url) continue;
            try {
                const ok = await probeReachable(url);
                if (ok) {
                    pill.textContent = 'Online';
                    pill.classList.add('status-online');
                    pill.classList.remove('status-offline');
                } else {
                    pill.textContent = 'Offline?';
                    pill.classList.add('status-offline');
                    pill.classList.remove('status-online');
                }
            } catch {
                pill.textContent = 'Unknown';
            }
        }
    }
    updateProjectStatuses();

    // ---------- API JSON previews ----------
    async function loadApiPreviews() {
        const boxes = document.querySelectorAll('.api-preview');
        for (const pre of boxes) {
            const url = pre.dataset.endpoint;
            if (!url) continue;
            try {
                const res = await fetch(url, {
                    headers: { 'Accept': 'application/json' },
                    cache: 'no-store',
                });
                if (!res.ok) throw new Error('HTTP ' + res.status);
                const text = await res.text();
                // Pretty-print if JSON
                let output = text;
                try { output = JSON.stringify(JSON.parse(text), null, 2); } catch {}
                // Trim very long payloads
                const limit = 1200;
                pre.textContent = output.length > limit ? output.slice(0, limit) + '\n…' : output;
            } catch (err) {
                pre.textContent = 'Preview unavailable (likely CORS). Use the API link below to open it directly.';
            }
        }
    }
    loadApiPreviews();


    // ---------- Footer year ----------
    const y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
})();
