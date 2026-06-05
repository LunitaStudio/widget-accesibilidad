/**
 * Widget de Accesibilidad — Gobierno de Río Negro
 *
 * Uso básico:   <script src="accesibilidad-rn.js"></script>
 * Configurable: <script src="accesibilidad-rn.js"
 *                  data-color="#005bbb" data-position="left"
 *                  data-lang="es-AR" data-title="Accesibilidad"></script>
 *
 * Genérico: funciona en cualquier web, sin depender de sus clases CSS.
 *
 * Funciones:
 * - Aumentar / reducir tamaño de letra
 * - Perfiles de color: Oscuro, Sepia, Daltonismo, Escala de grises (vía filtros, universales)
 * - Subrayar links
 * - Cursor grande
 * - Detener animaciones
 * - Lectura en voz alta (Web Speech API)
 *
 * Sin dependencias. Un solo archivo. Preferencias persistidas en localStorage.
 */
(function () {
    'use strict';

    // ===== CONFIG (data-* del <script>) =====
    // document.currentScript es válido sólo durante la ejecución síncrona: capturarlo ya.
    const SCRIPT = document.currentScript;
    function cfg(name, def) {
        const v = SCRIPT && SCRIPT.getAttribute('data-' + name);
        return (v === null || v === undefined || v === '') ? def : v;
    }
    const STORAGE_KEY = 'acc-rn-prefs';
    const ACCENT = cfg('color', '#8CC63F');
    const SIDE = (cfg('position', 'right') === 'left') ? 'left' : 'right';
    const LANG = cfg('lang', 'es-AR');
    const TITLE = cfg('title', 'Accesibilidad RN');

    // ===== STATE =====
    let prefs = loadPrefs();
    let panelOpen = false;
    let ttsActive = false;
    let savedSelection = '';
    let savedRange = null;
    let lastFocus = null;

    function loadPrefs() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        } catch { return {}; }
    }
    function savePrefs() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch {}
    }

    // ===== ESTILOS =====
    const css = document.createElement('style');
    css.textContent = `
        /* ===== Botón flotante ===== */
        .acc-rn-btn {
            position: fixed;
            bottom: 20px;
            ${SIDE}: 20px;
            z-index: 2147483646;
            width: 72px;
            height: 72px;
            padding: 0;
            border-radius: 50%;
            background: ${ACCENT};
            border: 3px solid #fff;
            box-shadow: 0 3px 14px rgba(0,0,0,0.35);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s;
        }
        .acc-rn-btn:hover, .acc-rn-btn:focus-visible { transform: scale(1.1); outline: 3px solid #fff; outline-offset: 2px; }
        .acc-rn-btn svg { width: 38px; height: 38px; fill: #fff; pointer-events: none; }

        /* ===== Panel ===== */
        .acc-rn-panel {
            position: fixed;
            bottom: 100px;
            ${SIDE}: 20px;
            z-index: 2147483647;
            width: 280px;
            max-width: calc(100vw - 40px);
            max-height: calc(100vh - 120px);
            overflow-y: auto;
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.2);
            font-family: 'Asap', Arial, Helvetica, sans-serif;
            color: #333;
            display: none;
        }
        .acc-rn-panel.open { display: block; }

        .acc-rn-header {
            background: #222;
            color: #fff;
            padding: 0.85rem 1rem;
            font-weight: 700;
            font-size: 1.05rem;
            border-radius: 12px 12px 0 0;
        }

        .acc-rn-body { padding: 0.5rem; }

        /* Filas: botones y contenedores comparten aspecto */
        .acc-rn-row {
            display: flex;
            align-items: center;
            gap: 0.6rem;
            width: 100%;
            box-sizing: border-box;
            padding: 0.55rem 0.75rem;
            border: none;
            border-radius: 6px;
            background: transparent;
            font-family: inherit;
            font-size: 0.88rem;
            text-align: left;
            color: #333;
            transition: background 0.15s;
        }
        button.acc-rn-row { cursor: pointer; }
        button.acc-rn-row:hover { background: #f0f0f0; }
        button.acc-rn-row:focus-visible { outline: 2px solid ${ACCENT}; outline-offset: -2px; background: #f0f0f0; }
        button.acc-rn-row[aria-pressed="true"] { background: #eee; font-weight: 700; }

        .acc-rn-icon {
            width: 28px;
            height: 28px;
            border-radius: 6px;
            background: #f0f0f0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
            flex-shrink: 0;
        }
        button.acc-rn-row[aria-pressed="true"] .acc-rn-icon { background: ${ACCENT}; color: #fff; }

        .acc-rn-label { flex: 1; }

        .acc-rn-mini-controls { display: flex; gap: 0.4rem; margin-left: auto; }
        .acc-rn-mini-btn {
            min-width: 30px;
            height: 30px;
            padding: 0 0.4rem;
            border-radius: 6px;
            border: 1px solid #ddd;
            background: #fff;
            cursor: pointer;
            font-weight: 700;
            font-size: 0.9rem;
            color: #333;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.15s;
        }
        .acc-rn-mini-btn:hover { border-color: ${ACCENT}; background: #f0f0f0; }
        .acc-rn-mini-btn:focus-visible { outline: 2px solid ${ACCENT}; outline-offset: 1px; }
        .acc-rn-mini-btn.speaking { background: ${ACCENT}; color: #fff; border-color: ${ACCENT}; }

        .acc-rn-divider { height: 1px; background: #eee; margin: 0.25rem 0.75rem; }

        .acc-rn-reset {
            display: block;
            width: calc(100% - 1.5rem);
            margin: 0.5rem 0.75rem;
            padding: 0.5rem;
            border: 1px solid #ddd;
            border-radius: 6px;
            background: #fff;
            cursor: pointer;
            font-family: inherit;
            font-size: 0.85rem;
            color: #666;
            text-align: center;
            transition: all 0.15s;
        }
        .acc-rn-reset:hover { border-color: #c0392b; color: #c0392b; }
        .acc-rn-reset:focus-visible { outline: 2px solid #c0392b; outline-offset: 1px; }

        /* ===== Perfiles de color (genéricos) =====
           Apuntan a los hijos directos del <body> y sus descendientes, EXCEPTO la UI del
           widget (.acc-rn-ui). No se mueve ningún nodo del DOM: seguro para SPAs (React/Next,
           Angular, etc.) y cubre también los modales/portales montados en el body.
           Oscuro y Sepia usan override forzado (fondo + texto), no inversión: así no quedan
           franjas de marca "al revés" ni textos con bajo contraste en páginas de gobierno. */

        /* --- Oscuro (dark forzado) --- */
        body.acc-dark { background-color: #121212 !important; }
        body.acc-dark > :not(.acc-rn-ui),
        body.acc-dark > :not(.acc-rn-ui) * {
            background-color: #1a1a1a !important;
            background-image: none !important;
            color: #e8e8e8 !important;
            border-color: #3a3a3a !important;
            box-shadow: none !important;
            text-shadow: none !important;
        }
        body.acc-dark > :not(.acc-rn-ui) :is(a, a *) { color: #6db3ff !important; }
        body.acc-dark > :not(.acc-rn-ui) :is(button, [type="submit"], [type="button"], [role="button"], .btn, .button) {
            background-color: #2a2a2a !important;
            color: #fff !important;
            border: 1px solid ${ACCENT} !important;
        }
        body.acc-dark > :not(.acc-rn-ui) :is(input, textarea, select) {
            background-color: #0f0f0f !important;
            color: #fff !important;
            border-color: #555 !important;
        }
        body.acc-dark > :not(.acc-rn-ui) ::placeholder { color: #999 !important; }
        body.acc-dark > :not(.acc-rn-ui) :is(img, picture, video, canvas) {
            background-color: transparent !important;
            opacity: 0.92;
        }
        body.acc-dark > :not(.acc-rn-ui) mark { background-color: #665500 !important; color: #ff0 !important; }

        /* --- Sepia (lectura prolongada, forzado) --- */
        body.acc-sepia { background-color: #efe0c2 !important; }
        body.acc-sepia > :not(.acc-rn-ui),
        body.acc-sepia > :not(.acc-rn-ui) * {
            background-color: #f5e6c8 !important;
            background-image: none !important;
            color: #3b2f1e !important;
            border-color: #d4bc8e !important;
            box-shadow: none !important;
        }
        body.acc-sepia > :not(.acc-rn-ui) :is(a, a *) { color: #7a4b00 !important; }
        body.acc-sepia > :not(.acc-rn-ui) :is(button, [type="submit"], [type="button"], [role="button"], .btn, .button) {
            background-color: #e3cfa1 !important;
            color: #3b2f1e !important;
            border: 1px solid #b9913f !important;
        }
        body.acc-sepia > :not(.acc-rn-ui) :is(input, textarea, select) {
            background-color: #fff8ea !important;
            color: #3b2f1e !important;
            border-color: #c4a46a !important;
        }
        body.acc-sepia > :not(.acc-rn-ui) :is(img, picture, video, canvas) { background-color: transparent !important; }

        /* --- Daltonismo: rota matices y los restaura en los medios --- */
        body.acc-daltonismo { background-color: #e8e8e8 !important; }
        body.acc-daltonismo > :not(.acc-rn-ui) { filter: hue-rotate(180deg); }
        body.acc-daltonismo > :not(.acc-rn-ui) :is(img, video, picture, canvas, [style*="background-image"]) {
            filter: hue-rotate(-180deg);
        }

        /* --- Escala de grises --- */
        body.acc-grayscale { background-color: #e8e8e8 !important; }
        body.acc-grayscale > :not(.acc-rn-ui) { filter: grayscale(1); }

        /* ===== Toggles (clases en body, genéricos) ===== */
        body.acc-links a { text-decoration: underline !important; text-underline-offset: 3px; }

        body.acc-cursor, body.acc-cursor * { cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cpath d='M8 4l28 20-12 2-8 16-4-18L8 4z' fill='%23fff' stroke='%23000' stroke-width='3' stroke-linejoin='round'/%3E%3C/svg%3E") 8 4, auto !important; }

        body.acc-no-animations > :not(.acc-rn-ui),
        body.acc-no-animations > :not(.acc-rn-ui) * {
            animation: none !important;
            transition: none !important;
            scroll-behavior: auto !important;
        }

        /* Respetar preferencia de movimiento reducido en el propio widget */
        @media (prefers-reduced-motion: reduce) {
            .acc-rn-btn, .acc-rn-row, .acc-rn-mini-btn, .acc-rn-reset { transition: none; }
        }
    `;
    document.head.appendChild(css);

    // ===== UI =====
    const accIcon = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm9 7h-6l-1.41 7.41L16 22h-2.5l-1.5-4.5L10.5 22H8l2.41-5.59L9 9H3V7h18v2z"/></svg>`;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'acc-rn-btn acc-rn-ui';
    btn.setAttribute('aria-label', 'Abrir opciones de accesibilidad');
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'acc-rn-panel');
    btn.innerHTML = accIcon;

    const panel = document.createElement('div');
    panel.className = 'acc-rn-panel acc-rn-ui';
    panel.id = 'acc-rn-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Opciones de accesibilidad');
    panel.innerHTML = `
        <div class="acc-rn-header">${escapeHtml(TITLE)}</div>
        <div class="acc-rn-body">
            <div class="acc-rn-row acc-rn-row--static">
                <span class="acc-rn-icon" aria-hidden="true">Aa</span>
                <span class="acc-rn-label" id="acc-rn-font-label">Tamaño de letra</span>
                <span class="acc-rn-mini-controls">
                    <button type="button" class="acc-rn-mini-btn" data-font="-1" aria-label="Reducir tamaño de letra">A-</button>
                    <button type="button" class="acc-rn-mini-btn" data-font="1" aria-label="Aumentar tamaño de letra">A+</button>
                </span>
            </div>
            <button type="button" class="acc-rn-row" data-action="color-profile" aria-pressed="false">
                <span class="acc-rn-icon" aria-hidden="true">◑</span>
                <span class="acc-rn-label acc-rn-profile-label">Perfil de color: Normal</span>
            </button>
            <button type="button" class="acc-rn-row" data-toggle="acc-links" aria-pressed="false">
                <span class="acc-rn-icon" aria-hidden="true">U̲</span>
                <span class="acc-rn-label">Subrayar links</span>
            </button>
            <button type="button" class="acc-rn-row" data-toggle="acc-cursor" aria-pressed="false">
                <span class="acc-rn-icon" aria-hidden="true">⊙</span>
                <span class="acc-rn-label">Cursor grande</span>
            </button>
            <button type="button" class="acc-rn-row" data-toggle="acc-no-animations" aria-pressed="false">
                <span class="acc-rn-icon" aria-hidden="true">▢</span>
                <span class="acc-rn-label">Detener animaciones</span>
            </button>
            <div class="acc-rn-divider"></div>
            <div class="acc-rn-row acc-rn-row--static">
                <span class="acc-rn-icon" aria-hidden="true">🔊</span>
                <span class="acc-rn-label">Lectura en voz alta</span>
                <span class="acc-rn-mini-controls">
                    <button type="button" class="acc-rn-mini-btn" data-tts="play" aria-label="Leer selección o página" title="Leer">▶</button>
                    <button type="button" class="acc-rn-mini-btn" data-tts="pause" aria-label="Pausar o reanudar lectura" title="Pausar/Reanudar">⏸</button>
                    <button type="button" class="acc-rn-mini-btn" data-tts="stop" aria-label="Detener lectura" title="Detener">⏹</button>
                </span>
            </div>
            <div class="acc-rn-divider"></div>
            <button type="button" class="acc-rn-reset">Restablecer todo</button>
        </div>
    `;

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, c => (
            { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
        ));
    }

    // ===== ABRIR / CERRAR PANEL =====
    function openPanel() {
        panelOpen = true;
        panel.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        lastFocus = document.activeElement;
        // Restaurar selección visual si la había
        if (savedRange) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(savedRange);
        }
        const first = panel.querySelector('button');
        if (first) first.focus();
    }
    function closePanel(returnFocus) {
        panelOpen = false;
        panel.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        if (returnFocus) (lastFocus || btn).focus();
    }
    function togglePanel() { panelOpen ? closePanel(false) : openPanel(); }

    btn.addEventListener('click', togglePanel);

    // Cerrar al hacer click afuera
    document.addEventListener('click', (e) => {
        if (panelOpen && !panel.contains(e.target) && !btn.contains(e.target)) closePanel(false);
    });

    // Escape cierra; Tab queda atrapado dentro del panel
    panel.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { e.preventDefault(); closePanel(true); return; }
        if (e.key !== 'Tab') return;
        const focusables = panel.querySelectorAll('button:not([disabled])');
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    // ===== TOGGLES =====
    panel.querySelectorAll('[data-toggle]').forEach(row => {
        row.addEventListener('click', () => {
            const cls = row.dataset.toggle;
            const active = document.body.classList.toggle(cls);
            row.setAttribute('aria-pressed', String(active));
            prefs[cls] = active;
            savePrefs();
        });
    });

    // ===== PERFILES DE COLOR (ciclo) =====
    const COLOR_PROFILES = [
        { cls: '', label: 'Normal' },
        { cls: 'acc-dark', label: 'Oscuro (baja visión)' },
        { cls: 'acc-sepia', label: 'Sepia (lectura)' },
        { cls: 'acc-daltonismo', label: 'Daltonismo' },
        { cls: 'acc-grayscale', label: 'Escala de grises' },
    ];
    let colorIndex = prefs.colorProfile || 0;
    if (colorIndex < 0 || colorIndex >= COLOR_PROFILES.length) colorIndex = 0;
    const profileLabel = panel.querySelector('.acc-rn-profile-label');
    const profileRow = panel.querySelector('[data-action="color-profile"]');

    function applyColorProfile() {
        COLOR_PROFILES.forEach(p => { if (p.cls) document.body.classList.remove(p.cls); });
        const profile = COLOR_PROFILES[colorIndex];
        if (profile.cls) document.body.classList.add(profile.cls);
        profileLabel.textContent = 'Color: ' + profile.label;
        profileRow.setAttribute('aria-pressed', String(colorIndex > 0));
        prefs.colorProfile = colorIndex;
        savePrefs();
    }
    profileRow.addEventListener('click', () => {
        colorIndex = (colorIndex + 1) % COLOR_PROFILES.length;
        applyColorProfile();
    });

    // ===== TAMAÑO DE LETRA =====
    let fontLevel = prefs.fontLevel || 0;
    function applyFontSize() {
        if (fontLevel === 0) document.documentElement.style.removeProperty('font-size');
        else document.documentElement.style.fontSize = (100 + fontLevel * 12) + '%';
    }
    panel.querySelectorAll('[data-font]').forEach(b => {
        b.addEventListener('click', (e) => {
            e.stopPropagation();
            fontLevel = Math.max(-3, Math.min(5, fontLevel + parseInt(b.dataset.font, 10)));
            prefs.fontLevel = fontLevel;
            savePrefs();
            applyFontSize();
        });
    });

    // ===== TTS (lectura en voz alta) =====
    document.addEventListener('mouseup', () => {
        const sel = window.getSelection();
        const text = sel.toString().trim();
        if (text) {
            savedSelection = text;
            try { savedRange = sel.getRangeAt(0).cloneRange(); } catch { savedRange = null; }
        }
    });

    function pickSpanishVoice() {
        try {
            const voices = speechSynthesis.getVoices() || [];
            return voices.find(v => v.lang && v.lang.toLowerCase().startsWith('es')) || null;
        } catch { return null; }
    }

    function getReadableText() {
        if (savedSelection) return savedSelection;
        const main = document.querySelector('main, article, [role="main"]');
        if (main) return (main.innerText || main.textContent || '').trim();
        // Sin <main>: leer los hijos del body salvo la UI del widget y scripts/estilos
        let text = '';
        for (const el of document.body.children) {
            if (el.classList.contains('acc-rn-ui') || el.tagName === 'SCRIPT' || el.tagName === 'STYLE') continue;
            text += ' ' + (el.innerText || '');
        }
        return text.trim();
    }

    function setSpeakingState(on) {
        ttsActive = on;
        const playBtn = panel.querySelector('[data-tts="play"]');
        if (playBtn) playBtn.classList.toggle('speaking', on);
    }

    function speak(text) {
        speechSynthesis.cancel();
        // Trocear por oraciones para evitar el corte de los navegadores en textos largos
        const chunks = (text.match(/[^.!?\n]+[.!?]*/g) || [text])
            .map(s => s.trim()).filter(Boolean);
        if (!chunks.length) return;
        const voice = pickSpanishVoice();
        let remaining = chunks.length;
        const done = () => { if (--remaining <= 0) setSpeakingState(false); };
        setSpeakingState(true);
        chunks.forEach(chunk => {
            const u = new SpeechSynthesisUtterance(chunk);
            u.lang = LANG;
            u.rate = 0.95;
            if (voice) u.voice = voice;
            u.onend = done;
            u.onerror = done;
            speechSynthesis.speak(u);
        });
    }

    panel.querySelectorAll('[data-tts]').forEach(ttsBtn => {
        ttsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = ttsBtn.dataset.tts;
            if (action === 'play') {
                const text = getReadableText();
                savedSelection = '';
                if (text) speak(text);
            } else if (action === 'pause') {
                if (speechSynthesis.speaking) {
                    speechSynthesis.paused ? speechSynthesis.resume() : speechSynthesis.pause();
                }
            } else if (action === 'stop') {
                speechSynthesis.cancel();
                setSpeakingState(false);
            }
        });
    });
    // Cargar voces (algunos navegadores las entregan asíncronamente)
    if ('speechSynthesis' in window) {
        speechSynthesis.onvoiceschanged = () => {};
    }

    // ===== RESET =====
    panel.querySelector('.acc-rn-reset').addEventListener('click', () => {
        ['acc-dark', 'acc-sepia', 'acc-daltonismo', 'acc-grayscale', 'acc-links', 'acc-cursor', 'acc-no-animations']
            .forEach(cls => document.body.classList.remove(cls));
        colorIndex = 0;
        applyColorProfile();
        fontLevel = 0;
        applyFontSize();
        panel.querySelectorAll('[aria-pressed]').forEach(r => r.setAttribute('aria-pressed', 'false'));
        speechSynthesis.cancel();
        setSpeakingState(false);
        prefs = {};
        savePrefs();
    });

    // ===== INIT =====
    function init() {
        document.body.appendChild(btn);
        document.body.appendChild(panel);

        // Restaurar preferencias
        applyColorProfile();
        applyFontSize();
        ['acc-links', 'acc-cursor', 'acc-no-animations'].forEach(cls => {
            if (prefs[cls]) {
                document.body.classList.add(cls);
                const row = panel.querySelector(`[data-toggle="${cls}"]`);
                if (row) row.setAttribute('aria-pressed', 'true');
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
