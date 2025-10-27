(function(){
    const key = "site-theme";
    const btn = document.getElementById("themeToggle");
    const root = document.documentElement;

    function apply(mode){
        if (mode === "light" || mode === "dark"){
            root.setAttribute("data-theme", mode);
        } else {
            root.setAttribute("data-theme", "auto");
        }
        localStorage.setItem(key, mode);
    }

    function labelFor(mode){
        return mode === "dark" ? "Lyst tema"
            : mode === "light" ? "Auto tema"
                : "Mørkt tema";
    }

    // Apply saved mode if present
    const saved = localStorage.getItem(key);
    if (saved) apply(saved);

    // Setup toggle button
    if (btn){
        const current = root.getAttribute("data-theme") || "auto";
        btn.textContent = labelFor(current);
        btn.addEventListener("click", () => {
            const cur = root.getAttribute("data-theme") || "auto";
            const next = cur === "dark" ? "light" : cur === "light" ? "auto" : "dark";
            apply(next);
            btn.textContent = labelFor(next);
        });
    }

    // Footer year
    const yearEl = document.getElementById("y");
    if (yearEl){ yearEl.textContent = new Date().getFullYear(); }
})();