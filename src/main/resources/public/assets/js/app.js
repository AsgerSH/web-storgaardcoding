/* ==========================================================================
   StorgaardCoding — Frontend JS
   ========================================================================== */
(() => {
    const html = document.documentElement;
    const navToggle = document.querySelector('.nav-toggle');
    const navList   = document.querySelector('#primary-nav');
    const themeBtn  = document.getElementById('theme-toggle');

    html.classList.add('js-ready');

    html.setAttribute('data-theme', 'dark');
    html.style.colorScheme = 'dark';
    try { localStorage.setItem('theme', 'dark'); } catch {}

    /* ---------- Mobile nav ---------- */
    navToggle?.addEventListener('click', () => {
        const open = navList.getAttribute('data-open') === 'true';
        navList.setAttribute('data-open', String(!open));
        navToggle.setAttribute('aria-expanded', String(!open));
    });
    navList?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        if (navList.getAttribute('data-open') === 'true') {
            navList.setAttribute('data-open', 'false');
            navToggle.setAttribute('aria-expanded', 'false');
        }
    }));

    /* ---------- Scroll spy ---------- */
    const navLinks = Array.from(document.querySelectorAll('[data-nav]'));
    const sections = navLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    const spy = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            const id = '#' + entry.target.id;
            const link = navLinks.find(l => l.getAttribute('href') === id);
            if (link) link.setAttribute('aria-current', entry.isIntersecting ? 'page' : 'false');
        });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: [0, 1] });
    sections.forEach(s => spy.observe(s));

    /* ---------- Reveal animations ---------- */
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

    /* ---------- Simple uptime check (no-cors) ---------- */
    async function probeReachable(url, timeoutMs = 4000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeoutMs);
        try {
            await fetch(url, { mode: 'no-cors', cache: 'no-store', signal: controller.signal });
            clearTimeout(id);
            return true;
        } catch {
            clearTimeout(id);
            return false;
        }
    }
    async function updateProjectStatuses() {
        const cards = document.querySelectorAll('.project-card');
        for (const card of cards) {
            const pill = card.querySelector('[data-status]');
            const url  = card.getAttribute('data-url');
            if (!pill || !url) continue;
            try {
                const ok = await probeReachable(url);
                pill.textContent = ok ? 'Online' : 'Offline?';
                pill.classList.toggle('status-online', ok);
                pill.classList.toggle('status-offline', !ok);
            } catch {
                pill.textContent = 'Unknown';
            }
        }
    }
    updateProjectStatuses();

    /* ---------- API Preview: tabs + cURL + headers + fallback ---------- */
    (function(){
        const q  = (sel, el=document) => el.querySelector(sel);
        const qa = (sel, el=document) => [...el.querySelectorAll(sel)];
        const toCurl = (method, url) => `curl -s -X ${method} "${url}" -H "Accept: application/json"`;
        const pretty = (obj) => { try { return JSON.stringify(obj, null, 2); } catch { return String(obj); } };

        async function fetchPreview(url, method='GET') {
            const t0 = performance.now();
            const res = await fetch(url, { method, headers: { 'Accept':'application/json' }, cache: 'no-store' });
            const t1 = performance.now();
            const latency = Math.round(t1 - t0);

            const headers = {};
            res.headers.forEach((v, k) => headers[k] = v);

            const text = await res.text();
            let body = text;
            try { body = JSON.stringify(JSON.parse(text), null, 2); } catch {}

            return { ok: res.ok, status: res.status, latency, headers, body };
        }

        function wireTabs(card) {
            qa('.api-tab', card).forEach(btn => {
                btn.addEventListener('click', () => {
                    qa('.api-tab', card).forEach(b => b.classList.toggle('active', b === btn));
                    qa('.api-output', card).forEach(o => o.classList.toggle('hidden', o.dataset.tab !== btn.dataset.tab));
                });
            });
        }

        async function renderCard(card) {
            const method = card.dataset.method || 'GET';
            const select = q('.api-endpoint', card);
            const openBtn = q('[data-open]', card);

            async function run(url) {
                const pathEl = q('.api-path', card);
                try { pathEl.textContent = new URL(url).pathname; } catch { pathEl.textContent = url; }

                // Fill cURL immediately
                q('.api-output[data-tab="curl"] code', card).textContent = toCurl(method, url);

                // Reset UI
                const dot = q('.api-dot', card);
                const latencyEl = q('.api-latency', card);
                const respOut = q('.api-output[data-tab="response"] code', card);
                const hdrOut  = q('.api-output[data-tab="headers"] code', card);
                respOut.textContent = '{ loading: true }';
                hdrOut.textContent = '';

                try {
                    const { ok, latency, headers, body } = await fetchPreview(url, method);
                    latencyEl.textContent = ok ? `${latency} ms` : '—';
                    dot?.classList.toggle('up', ok);
                    dot?.classList.toggle('down', !ok);
                    hdrOut.textContent = pretty(headers);
                    respOut.textContent = body;
                    // If blocked by CORS, auto switch to cURL tab
                    if (!ok) q('.api-tab[data-tab="curl"]', card)?.click();
                } catch (err) {
                    latencyEl.textContent = '—';
                    dot?.classList.remove('up'); dot?.classList.add('down');
                    respOut.textContent = '{ /* Preview blocked by CORS or offline. Use the cURL tab. */ }';
                    hdrOut.textContent = pretty({ error: String(err) });
                    q('.api-tab[data-tab="curl"]', card)?.click();
                }
            }

            // Initial
            await run(select.value);

            // On change
            select.addEventListener('change', () => run(select.value));

            // Open button
            openBtn?.addEventListener('click', () => { window.open(select.value, '_blank', 'noopener'); });

            // Tabs
            wireTabs(card);

            // Copy cURL button
            q('.btn-mini[data-copy="curl"]', card)?.addEventListener('click', async (e) => {
                await navigator.clipboard.writeText(toCurl(method, select.value));
                const btn = e.currentTarget;
                const old = btn.textContent;
                btn.textContent = 'Copied!';
                setTimeout(() => btn.textContent = old, 900);
            });
        }

        function boot() {
            qa('.api-preview-card').forEach(renderCard);
        }
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
        else boot();
    })();

    /* ---------- Footer year ---------- */
    const y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
})();

/* === Starfield background (CodePen by @hakimel, adapted & seam-safe) === */
(function(){
    const initStarfield = () => {
        let canvas = document.getElementById('stars');
        if (!canvas) { canvas = document.createElement('canvas'); canvas.id = 'stars'; document.body.prepend(canvas); }
        const context = canvas.getContext('2d');

        const STAR_COLOR = '#fff';
        const STAR_SIZE = 3;
        const STAR_MIN_SCALE = 0.2;
        const OVERFLOW_THRESHOLD = 100;
        const STAR_COUNT = ( window.innerWidth + window.innerHeight ) / 5;

        let scale = 1, width, height;
        let stars = [];
        let pointerX, pointerY;
        let velocity = { x: 0, y: 0, tx: 0, ty: 0, z: 0.00025 };
        let touchInput = false;

        function generate() {
            stars.length = 0;
            for (let i = 0; i < STAR_COUNT; i++) {
                stars.push({ x: 0, y: 0, z: STAR_MIN_SCALE + Math.random() * (1 - STAR_MIN_SCALE) });
            }
        }
        function placeStar(star){ star.x = Math.random()*width; star.y = Math.random()*height; }
        function recycleStar(star){
            let direction = 'z', vx = Math.abs(velocity.x), vy = Math.abs(velocity.y);
            if (vx > 1 || vy > 1) {
                let axis = (vx > vy) ? (Math.random() < vx/(vx+vy) ? 'h':'v') : (Math.random() < vy/(vx+vy) ? 'v':'h');
                direction = axis==='h' ? (velocity.x > 0 ? 'l':'r') : (velocity.y > 0 ? 't':'b');
            }
            star.z = STAR_MIN_SCALE + Math.random() * (1 - STAR_MIN_SCALE);
            if (direction==='z'){ star.z=0.1; star.x=Math.random()*width; star.y=Math.random()*height; }
            else if(direction==='l'){ star.x=-OVERFLOW_THRESHOLD; star.y=height*Math.random(); }
            else if(direction==='r'){ star.x=width+OVERFLOW_THRESHOLD; star.y=height*Math.random(); }
            else if(direction==='t'){ star.x=width*Math.random(); star.y=-OVERFLOW_THRESHOLD; }
            else if(direction==='b'){ star.x=width*Math.random(); star.y=height+OVERFLOW_THRESHOLD; }
        }

        function resize() {
            const cssW = canvas.clientWidth;
            const cssH = canvas.clientHeight;
            scale = window.devicePixelRatio || 1;

            canvas.width  = Math.round(cssW * scale);
            canvas.height = Math.round(cssH * scale);

            context.setTransform(1, 0, 0, 1, 0, 0);
            context.scale(scale, scale);

            width  = cssW;
            height = cssH;

            stars.forEach(placeStar);
        }

        function update(){
            velocity.tx *= 0.90; velocity.ty *= 0.90;
            velocity.x += (velocity.tx - velocity.x)*0.6;
            velocity.y += (velocity.ty - velocity.y)*0.6;
            stars.forEach((star)=>{
                star.x += velocity.x * star.z; star.y += velocity.y * star.z;
                star.x += (star.x - width/2) * velocity.z * star.z;
                star.y += (star.y - height/2) * velocity.z * star.z;
                star.z += velocity.z;
                if (star.x < -OVERFLOW_THRESHOLD || star.x > width + OVERFLOW_THRESHOLD ||
                    star.y < -OVERFLOW_THRESHOLD || star.y > height + OVERFLOW_THRESHOLD) {
                    recycleStar(star);
                }
            });
        }

        function render() {
            const ctx = context;
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;
            paintBackdrop(ctx, width, height);

            stars.forEach((star) => {
                ctx.beginPath();
                ctx.lineCap = 'round';
                ctx.lineWidth = STAR_SIZE * star.z;
                ctx.globalAlpha = 0.35 + 0.35 * Math.random();
                ctx.strokeStyle = STAR_COLOR;
                ctx.moveTo(star.x, star.y);

                let tailX = velocity.x * 2, tailY = velocity.y * 2;
                if (Math.abs(tailX) < 0.1) tailX = 0.5;
                if (Math.abs(tailY) < 0.1) tailY = 0.5;

                ctx.lineTo(star.x + tailX, star.y + tailY);
                ctx.stroke();
            });

            ctx.globalAlpha = 1;
            requestAnimationFrame(loop);
        }

        function loop(){ update(); render(); }
        function movePointer(x,y){
            if (typeof pointerX === 'number' && typeof pointerY === 'number') {
                const ox = x - pointerX, oy = y - pointerY;
                velocity.tx += (ox / (40*scale)) * (touchInput ? 1 : -1);
                velocity.ty += (oy / (40*scale)) * (touchInput ? 1 : -1);
            }
            pointerX = x; pointerY = y;
        }
        function onMouseMove(e){ touchInput=false; movePointer(e.clientX, e.clientY); }
        function onTouchMove(e){ touchInput=true; movePointer(e.touches[0].clientX, e.touches[0].clientY); }
        function onMouseLeave(){ pointerX = null; pointerY = null; }

        window.addEventListener('resize', resize);

        const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

        if (isTouch) {
            // Let the page scroll; optional: light parallax on touch if you want
            document.addEventListener('touchmove', onTouchMove, { passive: true }); // note passive:true
            document.addEventListener('touchend', onMouseLeave, { passive: true });
        } else {
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseleave', onMouseLeave);
        }

        generate(); resize(); requestAnimationFrame(loop);
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initStarfield);
    else initStarfield();
})();

function paintBackdrop(ctx, w, h) {
    // base color from your scheme
    ctx.fillStyle = '#0b0d10';
    ctx.fillRect(-2, -2, w + 4, h + 4);

    // purple-ish glow (top-right)
    const g1 = ctx.createRadialGradient(w * 0.85, h * 0.0, 0, w * 0.85, h * 0.0, Math.max(w, h) * 0.9);
    g1.addColorStop(0, 'rgba(121,68,154,0.07)');
    g1.addColorStop(1, 'rgba(121,68,154,0)');
    ctx.fillStyle = g1; ctx.fillRect(0, 0, w, h);

    // cyan-ish glow (20% / 80%)
    const g2 = ctx.createRadialGradient(w * 0.20, h * 0.80, 0, w * 0.20, h * 0.80, Math.max(w, h) * 0.7);
    g2.addColorStop(0, 'rgba(41,196,255,0.07)');
    g2.addColorStop(1, 'rgba(41,196,255,0)');
    ctx.fillStyle = g2; ctx.fillRect(0, 0, w, h);
}
/* === /Starfield === */
