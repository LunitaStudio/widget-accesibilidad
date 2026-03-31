/**
 * Widget de Accesibilidad — Gobierno de Río Negro
 *
 * Uso: <script src="accesibilidad-rn.js"></script>
 *
 * Funciones:
 * - Aumentar / reducir tamaño de letra
 * - Alto contraste
 * - Escala de grises
 * - Subrayar links
 * - Cursor grande
 * - Detener animaciones
 * - Lectura en voz alta (Web Speech API)
 */
(function () {
    'use strict';

    // ===== CONFIG =====
    const STORAGE_KEY = 'acc-rn-prefs';
    const GREEN = '#8CC63F';

    // ===== STATE =====
    let prefs = loadPrefs();
    let panelOpen = false;
    let speaking = false;

    function loadPrefs() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        } catch { return {}; }
    }

    function savePrefs() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    }

    // ===== ESTILOS =====
    const css = document.createElement('style');
    css.textContent = `
        /* Widget button */
        .acc-rn-btn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 99999;
            width: 72px;
            height: 72px;
            border-radius: 50%;
            background: ${GREEN};
            border: 3px solid #fff;
            box-shadow: 0 3px 14px rgba(0,0,0,0.35);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s;
        }
        .acc-rn-btn:hover, .acc-rn-btn:focus { transform: scale(1.1); outline: 3px solid #fff; }
        .acc-rn-btn svg { width: 38px; height: 38px; fill: #fff; }

        /* Panel */
        .acc-rn-panel {
            position: fixed;
            bottom: 100px;
            right: 20px;
            z-index: 99998;
            width: 280px;
            max-height: calc(100vh - 120px);
            overflow-y: auto;
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.2);
            font-family: 'Asap', Arial, sans-serif;
            display: none;
            overflow: hidden;
        }
        .acc-rn-panel.open { display: block; }

        .acc-rn-header {
            background: #222;
            color: #fff;
            padding: 0.85rem 1rem;
            font-weight: 700;
            font-size: 1.05rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .acc-rn-header span { font-size: 0.8rem; opacity: 0.9; font-weight: 400; }

        .acc-rn-body { padding: 0.5rem; }

        .acc-rn-row {
            display: flex;
            align-items: center;
            gap: 0.6rem;
            padding: 0.55rem 0.75rem;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.88rem;
            color: #333;
            transition: background 0.15s;
            user-select: none;
        }
        .acc-rn-row:hover { background: #f0f9e8; }
        .acc-rn-row.active { background: #e4f4d4; font-weight: 700; }

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
        .acc-rn-row.active .acc-rn-icon { background: ${GREEN}; color: #fff; }

        .acc-rn-font-controls {
            display: flex;
            gap: 0.4rem;
            margin-left: auto;
        }
        .acc-rn-font-btn {
            width: 30px;
            height: 30px;
            border-radius: 6px;
            border: 1px solid #ddd;
            background: #fff;
            cursor: pointer;
            font-weight: 700;
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.15s;
        }
        .acc-rn-font-btn:hover { border-color: ${GREEN}; background: #f0f9e8; }

        .acc-rn-divider {
            height: 1px;
            background: #eee;
            margin: 0.25rem 0.75rem;
        }

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

        /* TTS controls */
        .acc-rn-tts-row {
            display: flex;
            gap: 0.3rem;
            margin-left: auto;
        }
        .acc-rn-tts-btn {
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            border: 1px solid #ddd;
            background: #fff;
            cursor: pointer;
            font-size: 0.75rem;
            transition: all 0.15s;
        }
        .acc-rn-tts-btn:hover { border-color: ${GREEN}; }
        .acc-rn-tts-btn.speaking { background: ${GREEN}; color: #fff; border-color: ${GREEN}; }

        /* ===== ACCESSIBILITY CLASSES ===== */

        /* --- Perfil: Oscuro (baja visión) --- */
        body.acc-dark, body.acc-dark main, body.acc-dark footer,
        body.acc-dark .hero-panel, body.acc-dark .card, body.acc-dark .info-card,
        body.acc-dark .norma-block, body.acc-dark .norma-contenido, body.acc-dark .norma-titulo,
        body.acc-dark .acto-block, body.acc-dark .acto-titulo, body.acc-dark .acto-contenido,
        body.acc-dark .acto-preview, body.acc-dark .contacto-block, body.acc-dark .contacto-body,
        body.acc-dark .contacto-instruccion, body.acc-dark .hero-panels,
        body.acc-dark #landing-results-wrapper, body.acc-dark .boletin-item {
            background: #111 !important;
            color: #e8e8e8 !important;
            border-color: #444 !important;
        }
        body.acc-dark header {
            background: #000 !important;
        }
        body.acc-dark nav { background: rgba(255,255,255,0.1) !important; }
        body.acc-dark h1, body.acc-dark h2, body.acc-dark h3, body.acc-dark h4,
        body.acc-dark .section-title, body.acc-dark .card-title,
        body.acc-dark .boletin-name, body.acc-dark .hero-search h2,
        body.acc-dark .hero-ultimo h3 { color: #fff !important; }
        body.acc-dark a, body.acc-dark .card-link, body.acc-dark .back-link { color: #ff0 !important; }
        body.acc-dark nav a { color: #fff !important; }
        body.acc-dark .btn-green, body.acc-dark .btn-leer { background: #555 !important; border-color: #888 !important; color: #fff !important; }
        body.acc-dark .btn-pdf, body.acc-dark .btn-accent, body.acc-dark .year-btn { border-color: #666 !important; color: #e8e8e8 !important; background: #222 !important; }
        body.acc-dark .year-btn:hover, body.acc-dark .year-btn.active { background: #555 !important; color: #fff !important; }
        body.acc-dark .boletin-year-badge, body.acc-dark .acto-badge { background: #555 !important; }
        body.acc-dark .seccion-header { background: #333 !important; }
        body.acc-dark .subseccion-header, body.acc-dark .contacto-header { background: #444 !important; }
        body.acc-dark input, body.acc-dark select { background: #222 !important; color: #fff !important; border-color: #555 !important; }
        body.acc-dark mark { background: #665500 !important; color: #ff0 !important; }
        body.acc-dark .hero-search p, body.acc-dark .hero-ultimo .lu-fecha { color: #aaa !important; }
        body.acc-dark .banner-link { background: #222 !important; border-color: #444 !important; }
        body.acc-dark .contacto-email { color: #ff0 !important; }

        /* --- Perfil: Sepia (lectura prolongada) --- */
        body.acc-sepia, body.acc-sepia main, body.acc-sepia footer,
        body.acc-sepia .hero-panel, body.acc-sepia .card, body.acc-sepia .info-card,
        body.acc-sepia .norma-block, body.acc-sepia .norma-contenido, body.acc-sepia .norma-titulo,
        body.acc-sepia .acto-block, body.acc-sepia .acto-titulo, body.acc-sepia .acto-contenido,
        body.acc-sepia .acto-preview, body.acc-sepia .contacto-block, body.acc-sepia .contacto-body,
        body.acc-sepia .contacto-instruccion, body.acc-sepia .hero-panels,
        body.acc-sepia #landing-results-wrapper, body.acc-sepia .boletin-item {
            background: #f5e6c8 !important;
            color: #3b2f1e !important;
            border-color: #d4bc8e !important;
        }
        body.acc-sepia header {
            background: #5c4a2a !important;
        }
        body.acc-sepia nav { background: rgba(0,0,0,0.15) !important; }
        body.acc-sepia h1, body.acc-sepia h2, body.acc-sepia h3, body.acc-sepia h4,
        body.acc-sepia .section-title, body.acc-sepia .card-title,
        body.acc-sepia .boletin-name, body.acc-sepia .hero-search h2,
        body.acc-sepia .hero-ultimo h3 { color: #2a1f0e !important; }
        body.acc-sepia a, body.acc-sepia .card-link, body.acc-sepia .back-link { color: #6b4400 !important; }
        body.acc-sepia .btn-green, body.acc-sepia .btn-leer { background: #8b6914 !important; border-color: #8b6914 !important; color: #fff !important; }
        body.acc-sepia .btn-pdf, body.acc-sepia .btn-accent, body.acc-sepia .year-btn { border-color: #c4a46a !important; color: #3b2f1e !important; background: #eedcb5 !important; }
        body.acc-sepia .boletin-year-badge, body.acc-sepia .acto-badge { background: #8b6914 !important; color: #fff !important; }
        body.acc-sepia .seccion-header { background: #3b2f1e !important; }
        body.acc-sepia .subseccion-header, body.acc-sepia .contacto-header { background: #8b6914 !important; }
        body.acc-sepia input, body.acc-sepia select { background: #eedcb5 !important; color: #3b2f1e !important; border-color: #c4a46a !important; }
        body.acc-sepia mark { background: #d4a017 !important; color: #2a1f0e !important; }
        body.acc-sepia .banner-link { background: #eedcb5 !important; border-color: #c4a46a !important; }

        /* --- Perfil: Daltonismo (reemplaza verdes por azules) --- */
        body.acc-daltonismo #acc-page-wrapper {
            filter: hue-rotate(210deg);
        }
        body.acc-daltonismo #acc-page-wrapper img,
        body.acc-daltonismo #acc-page-wrapper video,
        body.acc-daltonismo #acc-page-wrapper .banner-link {
            filter: hue-rotate(-210deg);
        }

        /* Escala de grises */
        body.acc-grayscale #acc-page-wrapper { filter: grayscale(1); }

        body.acc-links a { text-decoration: underline !important; text-underline-offset: 3px; }

        body.acc-cursor, body.acc-cursor * { cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cpath d='M8 4l28 20-12 2-8 16-4-18L8 4z' fill='%23fff' stroke='%23000' stroke-width='3' stroke-linejoin='round'/%3E%3C/svg%3E") 8 4, auto !important; }

        body.acc-no-animations, body.acc-no-animations * {
            animation: none !important;
            transition: none !important;
        }
    `;
    document.head.appendChild(css);

    // ===== BUILD UI =====
    // Accessibility icon (universal symbol)
    const accIcon = `<svg viewBox="0 0 24 24"><path d="M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm9 7h-6l-1.41 7.41L16 22h-2.5l-1.5-4.5L10.5 22H8l2.41-5.59L9 9H3V7h18v2z"/></svg>`;

    // Float button
    const btn = document.createElement('div');
    btn.className = 'acc-rn-btn';
    btn.setAttribute('aria-label', 'Accesibilidad');
    btn.setAttribute('role', 'button');
    btn.setAttribute('tabindex', '0');
    btn.innerHTML = accIcon;
    document.body.appendChild(btn);

    // Panel
    const panel = document.createElement('div');
    panel.className = 'acc-rn-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Opciones de accesibilidad');
    panel.innerHTML = `
        <div class="acc-rn-header">
            Accesibilidad RN
        </div>
        <div class="acc-rn-body">
            <div class="acc-rn-row" data-action="font">
                <div class="acc-rn-icon">Aa</div>
                <span>Tamaño de letra</span>
                <div class="acc-rn-font-controls">
                    <button class="acc-rn-font-btn" data-font="-1">A-</button>
                    <button class="acc-rn-font-btn" data-font="1">A+</button>
                </div>
            </div>
            <div class="acc-rn-row" data-action="color-profile">
                <div class="acc-rn-icon">◑</div>
                <span class="acc-rn-profile-label">Perfil de color: Normal</span>
            </div>
            <div class="acc-rn-row" data-toggle="acc-links">
                <div class="acc-rn-icon">U̲</div>
                <span>Subrayar links</span>
            </div>
            <div class="acc-rn-row" data-toggle="acc-cursor">
                <div class="acc-rn-icon">⊙</div>
                <span>Cursor grande</span>
            </div>
            <div class="acc-rn-row" data-toggle="acc-no-animations">
                <div class="acc-rn-icon">▢</div>
                <span>Detener animaciones</span>
            </div>
            <div class="acc-rn-divider"></div>
            <div class="acc-rn-row" data-action="tts">
                <div class="acc-rn-icon">🔊</div>
                <span>Lectura en voz alta</span>
                <div class="acc-rn-tts-row">
                    <button class="acc-rn-tts-btn" data-tts="play" title="Leer página">▶</button>
                    <button class="acc-rn-tts-btn" data-tts="pause" title="Pausar">⏸</button>
                    <button class="acc-rn-tts-btn" data-tts="stop" title="Detener">⏹</button>
                </div>
            </div>
            <div class="acc-rn-divider"></div>
            <button class="acc-rn-reset">Restablecer todo</button>
        </div>
    `;
    document.body.appendChild(panel);

    // ===== EVENTS =====
    btn.addEventListener('click', () => {
        panelOpen = !panelOpen;
        panel.classList.toggle('open', panelOpen);
        // Restaurar selección visual si había una
        if (savedRange) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(savedRange);
        }
    });

    btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (panelOpen && !panel.contains(e.target) && !btn.contains(e.target)) {
            panelOpen = false;
            panel.classList.remove('open');
        }
    });

    // Toggle classes
    panel.querySelectorAll('[data-toggle]').forEach(row => {
        row.addEventListener('click', () => {
            const cls = row.dataset.toggle;
            const active = document.body.classList.toggle(cls);
            row.classList.toggle('active', active);
            prefs[cls] = active;
            savePrefs();
        });
    });

    // Color profiles (cycle)
    const COLOR_PROFILES = [
        { cls: '', label: 'Normal' },
        { cls: 'acc-dark', label: 'Oscuro (baja visión)' },
        { cls: 'acc-sepia', label: 'Sepia (lectura)' },
        { cls: 'acc-daltonismo', label: 'Daltonismo' },
        { cls: 'acc-grayscale', label: 'Escala de grises' },
    ];
    let colorIndex = prefs.colorProfile || 0;
    const profileLabel = panel.querySelector('.acc-rn-profile-label');
    const profileRow = panel.querySelector('[data-action="color-profile"]');

    function applyColorProfile() {
        COLOR_PROFILES.forEach(p => { if (p.cls) document.body.classList.remove(p.cls); });
        const profile = COLOR_PROFILES[colorIndex];
        if (profile.cls) document.body.classList.add(profile.cls);
        profileLabel.textContent = 'Color: ' + profile.label;
        profileRow.classList.toggle('active', colorIndex > 0);
        prefs.colorProfile = colorIndex;
        savePrefs();
    }

    profileRow.addEventListener('click', () => {
        colorIndex = (colorIndex + 1) % COLOR_PROFILES.length;
        applyColorProfile();
    });

    applyColorProfile();

    // Font size
    let fontLevel = prefs.fontLevel || 0;
    applyFontSize();

    panel.querySelectorAll('[data-font]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const delta = parseInt(btn.dataset.font);
            fontLevel = Math.max(-3, Math.min(5, fontLevel + delta));
            prefs.fontLevel = fontLevel;
            savePrefs();
            applyFontSize();
        });
    });

    function applyFontSize() {
        if (fontLevel === 0) {
            document.documentElement.style.removeProperty('font-size');
        } else {
            document.documentElement.style.fontSize = (100 + fontLevel * 12) + '%';
        }
    }

    // TTS (Text-to-Speech)
    // Guardar selección y rango antes de que el click la borre
    let savedSelection = '';
    let savedRange = null;
    document.addEventListener('mouseup', () => {
        const sel = window.getSelection();
        const text = sel.toString().trim();
        if (text) {
            savedSelection = text;
            savedRange = sel.getRangeAt(0).cloneRange();
        }
    });

    panel.querySelectorAll('[data-tts]').forEach(ttsBtn => {
        ttsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = ttsBtn.dataset.tts;

            if (action === 'play') {
                // Read saved selection or main content
                let text = savedSelection || '';
                if (!text) {
                    const main = document.querySelector('main') || document.body;
                    text = main.innerText;
                }
                savedSelection = '';
                if (!text) return;

                speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'es-AR';
                utterance.rate = 0.9;

                utterance.onstart = () => {
                    speaking = true;
                    ttsBtn.classList.add('speaking');
                };
                utterance.onend = () => {
                    speaking = false;
                    ttsBtn.classList.remove('speaking');
                };

                speechSynthesis.speak(utterance);
            }

            if (action === 'pause') {
                if (speechSynthesis.paused) {
                    speechSynthesis.resume();
                } else {
                    speechSynthesis.pause();
                }
            }

            if (action === 'stop') {
                speechSynthesis.cancel();
                speaking = false;
                panel.querySelector('[data-tts="play"]').classList.remove('speaking');
            }
        });
    });

    // Reset
    panel.querySelector('.acc-rn-reset').addEventListener('click', () => {
        // Remove classes
        ['acc-dark', 'acc-sepia', 'acc-daltonismo', 'acc-grayscale', 'acc-links', 'acc-cursor', 'acc-no-animations']
            .forEach(cls => document.body.classList.remove(cls));
        // Reset color profile
        colorIndex = 0;
        applyColorProfile();
        // Reset font
        fontLevel = 0;
        document.documentElement.style.removeProperty('font-size');
        // Reset UI
        panel.querySelectorAll('.acc-rn-row').forEach(r => r.classList.remove('active'));
        // Stop TTS
        speechSynthesis.cancel();
        speaking = false;
        // Clear prefs
        prefs = {};
        savePrefs();
    });

    // ===== RESTORE PREFS ON LOAD =====
    ['acc-links', 'acc-cursor', 'acc-no-animations']
        .forEach(cls => {
            if (prefs[cls]) {
                document.body.classList.add(cls);
                const row = panel.querySelector(`[data-toggle="${cls}"]`);
                if (row) row.classList.add('active');
            }
        });
})();
