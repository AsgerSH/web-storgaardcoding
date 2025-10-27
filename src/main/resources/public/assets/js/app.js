// ---- Samples for faste previews ----
const samplePhonyfySongs = [
    {
        songId: 1,
        songName: "One More Time",
        genre: "Electronic",
        featuredArtist: "No featured artist",
        duration: "5:20",
        mainArtistId: 1,
        mainArtistName: "Daft Punk",
        albumId: 1,
        albumName: "Discovery"
    },
    {
        songId: 2,
        songName: "Digital Love",
        genre: "Electronic",
        featuredArtist: "No featured artist",
        duration: "4:58",
        mainArtistId: 1,
        mainArtistName: "Daft Punk",
        albumId: 1,
        albumName: "Discovery"
    }
];

const sampleHotel = [
    {
        id: 1,
        hotelName: "Hotel California",
        hotelAddress: "California",
        hotelType: "LUXURY",
        rooms: [
            { id: 6, roomNumber: 104, roomPrice: 3200, roomType: "DOUBLE" },
            { id: 1, roomNumber: 102, roomPrice: 2520, roomType: "SINGLE" },
            { id: 3, roomNumber: 105, roomPrice: 4500, roomType: "SUITE"  },
            { id: 2, roomNumber: 100, roomPrice: 2520, roomType: "SINGLE" },
            { id: 5, roomNumber: 101, roomPrice: 2520, roomType: "SINGLE" },
            { id: 4, roomNumber: 103, roomPrice: 2520, roomType: "SINGLE" }
        ]
    }
];

const projects = [
    {
        name: "Phonyfy API",
        host: "phonyfy.storgaardcoding.dk",
        rootUrl: "https://phonyfy.storgaardcoding.dk/",
        endpoints: [
            {label: "GET /api/songs", path: "/api/songs", sample: samplePhonyfySongs}
        ],
        description: "E-commerce phone shop API demo."
    },
    {
        name: "Hotel API",
        host: "hotels.storgaardcoding.dk",
        rootUrl: "https://hotels.storgaardcoding.dk/",
        endpoints: [
            {label: "GET /api/hotels", path: "/api/hotels", sample: sampleHotel}
        ],
        description: "Hotel booking API demo."
    }
];

// ---- Sikker JSON -> HTML renderer (ingen 'k' artefakter) ----
const esc = s => String(s).replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));

function renderJSON(val, depth=0){
    const pad = '  '.repeat(depth);
    if (val === null) return '<span class="b">null</span>';
    const t = typeof val;
    if (t === 'number') return `<span class="n">${val}</span>`;
    if (t === 'boolean') return `<span class="b">${val}</span>`;
    if (t === 'string') return `<span class="s">"${esc(val)}"</span>`;

    if (Array.isArray(val)) {
        if (!val.length) return '[]';
        let out = '[\n';
        val.forEach((item, i) => {
            out += pad + '  ' + renderJSON(item, depth+1);
            if (i < val.length - 1) out += '<span class="p">,</span>';
            out += '\n';
        });
        return out + pad + ']';
    }

    const keys = Object.keys(val);
    if (!keys.length) return '{}';
    let out = '{\n';
    keys.forEach((k, i) => {
        out += pad + '  ' +
            `<span class="s">"</span><span class="k">${esc(k)}</span><span class="s">"</span>` +
            `<span class="p">: </span>` +
            renderJSON(val[k], depth+1);
        if (i < keys.length - 1) out += '<span class="p">,</span>';
        out += '\n';
    });
    return out + pad + '}';
}

// ---- DOM helper ----
function el(tag, attrs={}, ...children){
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v])=>{
        if(k==='class') e.className = v;
        else if(k==='html') e.innerHTML = v;
        else e.setAttribute(k,v);
    });
    children.forEach(c => e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
    return e;
}

// ---- Render kort ----
const apps = document.getElementById('apps');

projects.forEach(project => {
    const card = el('article', {class:'card'});
    const tag = el('div', {class:'tag'}, project.host);
    const title = el('div', {class:'title'}, project.name);
    const desc = el('p', {class:'desc'}, project.description);

    const toggle = el('div', {class:'toggle'});
    const btnSample = el('button', {'aria-pressed':'true', type:'button'}, 'Sample');
    const btnLive   = el('button', {'aria-pressed':'false', type:'button'}, 'Prøv live');
    toggle.append(btnSample, btnLive);

    const pre = el('pre', {html: renderJSON(project.endpoints[0].sample)});
    let showingSample = true;
    let currentEndpoint = project.endpoints[0];

    btnSample.onclick = () => {
        showingSample = true;
        btnSample.setAttribute('aria-pressed','true');
        btnLive.setAttribute('aria-pressed','false');
        pre.innerHTML = renderJSON(currentEndpoint.sample);
    };

    btnLive.onclick = async () => {
        showingSample = false;
        btnSample.setAttribute('aria-pressed','false');
        btnLive.setAttribute('aria-pressed','true');
        pre.textContent = 'Henter live response…';
        try{
            const res = await fetch(project.rootUrl.replace(/\/$/,'') + currentEndpoint.path, {redirect:'follow'});
            const text = await res.text();
            pre.textContent = text.slice(0, 4000) || '(tom respons)';
        }catch(e){
            pre.textContent = '(Kunne ikke hente live data — sandsynligvis CORS). Viser sample nedenfor.)\n\n' +
                JSON.stringify(currentEndpoint.sample, null, 2);
        }
    };

    // Endpoint-pills
    const epRow = el('div', {class:'actions'});
    project.endpoints.forEach(ep => {
        const pill = el('button', {class:'btn', type:'button'}, ep.label);
        pill.onclick = () => {
            currentEndpoint = ep;
            showingSample ? (pre.innerHTML = renderJSON(ep.sample)) : btnLive.click();
        };
        epRow.appendChild(pill);
    });

    // Links
    const actions = el('div', {class:'actions'});
    const openRoot = el('a', {class:'btn primary', href:project.rootUrl, target:'_blank', rel:'noopener'}, 'Åbn');
    const openEp   = el('a', {
        class:'btn',
        href:project.rootUrl.replace(/\/$/,'') + project.endpoints[0].path,
        target:'_blank', rel:'noopener'
    }, 'Åbn endpoint');
    const copy = el('button', {class:'btn', type:'button'}, 'Kopiér URL');
    copy.onclick = async () => {
        try{ await navigator.clipboard.writeText(project.rootUrl); copy.textContent='Kopieret!'; setTimeout(()=>copy.textContent='Kopiér URL',1200); }
        catch{ alert('Kopiering fejlede'); }
    };
    actions.append(openRoot, openEp, copy);

    card.append(tag, title, desc, epRow, toggle, pre, actions);
    apps.appendChild(card);
});
