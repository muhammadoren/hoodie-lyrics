// ═══════════════════════════════════════════════════════════════════════════
// 🎵 AUDIO CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════
// Enter your MP3 file name here (for example: "TheScript.mp3" or "hoodie.mp3").
// To run automatically without an audio file, leave it empty: const AUDIO_FILE = "";
const AUDIO_FILE = 'assets/hoodie.mp3';

// ═══════════════════════════════════════════════════════════════════════════
// ⚡ MASTER SPEED (GLOBAL)
// ═══════════════════════════════════════════════════════════════════════════
// Set the overall playback speed (1.0 = normal, 1.2 = fast, 0.8 = slow):
let MASTER_SPEED = 1.0;

// ═══════════════════════════════════════════════════════════════════════════
// 🎬 END-OF-SONG SETTINGS (BLACK PAUSE & LOOP)
// ═══════════════════════════════════════════════════════════════════════════
// Duration of the black screen pause (in seconds) after the lyrics finish before looping:
const BLACK_PAUSE_END = 3.5;

// Automatically loop the song and lyrics from the beginning after the black pause:
const AUTO_LOOP = true;
// ═══════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// 1. LYRIC TIMELINE DATA: "Hoodie"
// NO MANUAL 'time' VALUES! Just set:
// • speed : Typing speed (1.0 = normal, 1.2 = faster, 0.8 = slower)
// • pause : Idle pause (in seconds) after typing finishes before continuing
// ─────────────────────────────────────────────────────────────────────────────
const timeline = [
  // ── VERSE ──
  { speed: 0.82, pause: 0.72, text: 'it.makes( "me_think" ){ about: "you", so: "i_wear_it_when_i_sleep" };',  zoom: false, zoomOut: false, glitch: false },
  { speed: 0.68, pause: 0.72, text: 'i.kept( "the_broken_zipper" ){ and: "cigarette_burns" };',           zoom: false, zoomOut: false, glitch: false },
  { speed: 0.81, pause: 0.70, text: 'still.rocking( "your_hoodie" ){ baby: "even_though", it: "hurts" };',  zoom: false, zoomOut: false, glitch: false },
  { speed: 1.12, pause: 0.65, text: 'still.rocking( "your" ){ ...',                                       zoom: false, zoomOut: false, glitch: false },

  // ── HOOK ──
  { speed: 1.19, pause: 0.65, text: 'if( "you_want" ){ it: "back" };',                                    zoom: false, zoomOut: false, glitch: false },
  { speed: 1.13, pause: 0.70, text: 'if( "you_want" ){ it: "back", im: "here_waiting" };',                zoom: false, zoomOut: false, glitch: false },
  { speed: 1.32, pause: 0.70, text: 'come.and( "take" ){ it: "back" };',                                  zoom: false, zoomOut: false, glitch: false },
  { speed: 1.32, pause: 0.55, text: 'come.and( "take" ){ it: "back" };',                                  zoom: false, zoomOut: false, glitch: false },

  // ── OUTRO ──
  { speed: 1.60, pause: 0.50, text: '// xylle bubwit calaycay marquez', zoom: false, zoomOut: false, glitch: false },
];

(() => {
  const cameraEl = document.getElementById('camera');
  const rowsContainer = document.getElementById('rows-container');
  const viewportEl = document.getElementById('viewport');
  const blackCurtain = document.getElementById('black-curtain');

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const GLITCH_GLYPHS = "!@#$%^&*()_+-=[]{}|;:,.<>?/01XZ#~";

  // ───────────────────────────────────────────────────────────────────────────
  // 2. SYNTAX HIGHLIGHTING & TOKEN PARSER
  // ───────────────────────────────────────────────────────────────────────────
  const CONTROL_KW = new Set([
    'if', 'else', 'return', 'for', 'while', 'why', 'cause', "'cause", 'because',
    'and', 'but', 'in', 'how', 'its', 'oh', 'as', 'to', 'try', 'catch', 'throw',
    'so', 'still'
  ]);
  const TYPE_KW = new Set([
    'const', 'let', 'var', 'function', 'class', 'new', 'this', 'true', 'false',
    'null', 'undefined', 'not', 'error'
  ]);

  const TOKEN_RE = /(\/\/.*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$'][A-Za-z0-9_$']*)(?=\s*\()|([A-Za-z_$'][A-Za-z0-9_$']*)|([(){}[\]])|([.,;:=<>!&|+\-*\/?%]+)|(\s+)|([\s\S])/g;

  function tokenizeLine(text) {
    const tokens = [];

    // If this is a comment line (starts with //)
    // Tokenize each word so it doesn't become one large block that crosses line numbers and the cursor!
    if (text.trimStart().startsWith('//')) {
      const matchLeading = text.match(/^\s*/)[0];
      if (matchLeading) {
        tokens.push({ raw: matchLeading, cls: '', isWord: false, length: matchLeading.length });
      }
      tokens.push({ raw: '//', cls: 'c-com', isWord: false, length: 2 });
      
      const rest = text.slice(matchLeading.length + 2);
      const COMMENT_RE = /(\s+)|([A-Za-z0-9_@'#$\-]+)|([^\s\w]+)/g;
      let m;
      while ((m = COMMENT_RE.exec(rest)) !== null) {
        if (m[1]) {
          tokens.push({ raw: m[1], cls: '', isWord: false, length: m[1].length });
        } else if (m[2]) {
          tokens.push({ raw: m[2], cls: 'c-com', isWord: true, length: m[2].length });
        } else if (m[3]) {
          tokens.push({ raw: m[3], cls: 'c-com', isWord: false, length: m[3].length });
        }
      }
      return tokens;
    }

    TOKEN_RE.lastIndex = 0;
    let match;

    while ((match = TOKEN_RE.exec(text)) !== null) {
      const raw = match[0];
      let cls = 'c-punc';
      let isWord = false;

      if (match[1]) {
        cls = 'c-com';
        isWord = false;
      } else if (match[2]) {
        cls = 'c-str';
        isWord = true;
      } else if (match[3]) {
        cls = 'c-num';
        isWord = true;
      } else if (match[4]) {
        const id = match[4].toLowerCase();
        cls = CONTROL_KW.has(id) ? 'c-kw' : (TYPE_KW.has(id) ? 'c-type' : 'c-fn');
        isWord = true;
      } else if (match[5]) {
        const id = match[5].toLowerCase();
        cls = CONTROL_KW.has(id) ? 'c-kw' : (TYPE_KW.has(id) ? 'c-type' : 'c-var');
        isWord = true;
      } else if (match[6]) {
        cls = 'c-b';
      } else if (match[8]) {
        cls = '';
      }

      tokens.push({
        raw,
        cls,
        isWord,
        length: raw.length
      });
    }
    return tokens;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 3. AUTO-COMPUTE TIMELINE & BUILD DOM NODES
  // Timing is calculated automatically from typing 'speed' + the idle 'pause'!
  // No need to manually enter or calculate 'time' values!
  // ───────────────────────────────────────────────────────────────────────────
  const START_DELAY = 0.05;     // Initial seconds before the first lyric starts
  const BASE_CHAR_TIME = 0.052; // Seconds per character at normal speed (1.0)

  let cursorTime = START_DELAY;
  timeline.forEach((item) => {
    const spd = (typeof item.speed === 'number' && item.speed > 0)
      ? item.speed
      : 1.0;
    
    const pause = (typeof item.pause === 'number' && item.pause >= 0)
      ? item.pause
      : 0.4;

    const charCount = Math.max(1, item.text.length);
    const typingDuration = Math.max(0.3, (charCount * BASE_CHAR_TIME) / spd);
    const totalLineDuration = typingDuration + pause;

    item._start = cursorTime;
    item._typingTime = typingDuration;
    item._duration = totalLineDuration;
    item._end = item._start + totalLineDuration;

    cursorTime = item._end;
  });

  const TOTAL_LINES = timeline.length;
  const lineNodes = [];

  const cursorEl = document.createElement('span');
  cursorEl.className = 'neon-cursor';

  timeline.forEach((item, lineIndex) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'row' + (item.glitch ? ' glitch-row' : '');

    const lnEl = document.createElement('span');
    lnEl.className = 'ln';
    lnEl.textContent = lineIndex + 1;

    const codeLineEl = document.createElement('div');
    codeLineEl.className = 'code-line';

    const tokens = tokenizeLine(item.text);
    const lineStartTime = item._start;
    const typeTotalTime = item._typingTime;
    const lineDuration = item._duration;
    const totalChars = item.text.length || 1;
    let accumulatedTime = 0;

    const tokenData = tokens.map((tok) => {
      const tokSpan = document.createElement('span');
      tokSpan.className = 'tok ' + tok.cls;
      tokSpan.textContent = ''; // progressively typed

      codeLineEl.appendChild(tokSpan);

      const tokDuration = (tok.length / totalChars) * typeTotalTime;
      const tokStart = lineStartTime + accumulatedTime;
      const tokEnd = tokStart + tokDuration;
      accumulatedTime += tokDuration;

      return {
        el: tokSpan,
        raw: tok.raw,
        cls: tok.cls,
        isWord: tok.isWord,
        start: tokStart,
        end: tokEnd,
        length: tok.length,
        typedCount: 0
      };
    });

    rowEl.appendChild(lnEl);
    rowEl.appendChild(codeLineEl);
    rowsContainer.appendChild(rowEl);

    lineNodes.push({
      rowEl,
      codeLineEl,
      tokens: tokenData,
      start: lineStartTime,
      end: lineStartTime + lineDuration,
      text: item.text,
      zoom: item.zoom,
      zoomOut: item.zoomOut,
      glitch: item.glitch
    });
  });

  lineNodes[0].codeLineEl.appendChild(cursorEl);
  const totalLyricsDuration = lineNodes[TOTAL_LINES - 1].end;
  let isResetting = false;
  let loopTimer = null;

  // ───────────────────────────────────────────────────────────────────────────
  // 4. AUDIO & MASTER CLOCK ENGINE (Auto-Play & HUD Speed Support)
  // ───────────────────────────────────────────────────────────────────────────
  const speedBadge = document.getElementById('speed-badge');
  let speedBadgeTimer = null;

  function showSpeedBadge(val) {
    if (!speedBadge) return;
    speedBadge.textContent = `SPEED: ${val.toFixed(2)}x`;
    speedBadge.classList.add('show');
    clearTimeout(speedBadgeTimer);
    speedBadgeTimer = setTimeout(() => {
      speedBadge.classList.remove('show');
    }, 1500);
  }

  function setMasterSpeed(newSpeed) {
    MASTER_SPEED = Math.max(0.2, Math.min(3.0, Number(newSpeed.toFixed(2))));
    if (audioEl) {
      audioEl.playbackRate = MASTER_SPEED;
    }
    showSpeedBadge(MASTER_SPEED);
  }

  let audioEl = null;
  let hasAudio = false;

  if (typeof AUDIO_FILE !== 'undefined' && AUDIO_FILE.trim() !== '') {
    audioEl = new Audio(AUDIO_FILE);
    audioEl.preload = 'auto';
    audioEl.autoplay = true;
    audioEl.playbackRate = MASTER_SPEED;

    const playAudio = () => {
      audioEl.playbackRate = MASTER_SPEED;
      audioEl.play().then(() => {
        hasAudio = true;
      }).catch(() => {
        // Autoplay policy prevented immediate playback; waiting for user gesture
      });
    };

    audioEl.addEventListener('canplaythrough', playAudio, { once: true });
    playAudio();

    // Auto loop on audio end
    audioEl.addEventListener('ended', () => {
      if (pauseOffset < totalLyricsDuration) return; // lyrics still running (e.g. credit line): the frame loop handles the ending
      if (blackCurtain) blackCurtain.classList.add('fade-black');
      if (AUTO_LOOP && !isResetting) {
        clearTimeout(loopTimer);
        loopTimer = setTimeout(() => {
          restartExperience();
        }, BLACK_PAUSE_END * 1000);
      }
    });

    // Instant unlock on first click or tap anywhere
    const unlockAudio = () => {
      if (audioEl && audioEl.paused) {
        audioEl.playbackRate = MASTER_SPEED;
        audioEl.play().then(() => {
          hasAudio = true;
        }).catch(() => {});
      }
    };
    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
    window.addEventListener('pointerdown', unlockAudio, { once: true });
  }

  let isPaused = false;
  let pauseOffset = 0;
  let lastClockPerf = performance.now();
  let lastFrameTime = performance.now();

  function getCurrentTime() {
    if (hasAudio && audioEl && !audioEl.paused) {
      pauseOffset = audioEl.currentTime;
      lastClockPerf = performance.now(); // keep the fallback clock in sync (no time jump when audio ends)
      return audioEl.currentTime;
    }
    if (isPaused) return pauseOffset;
    const now = performance.now();
    const dt = (now - lastClockPerf) / 1000;
    lastClockPerf = now;
    pauseOffset += dt * MASTER_SPEED;
    return pauseOffset;
  }

  let curCamX = 0, curCamY = 0, curCamScale = 1.16;
  let targetCamX = 0, targetCamY = 0, targetCamScale = 1.16;
  let activeLineIndex = 0;
  let isInitialFrame = true;

  // Helper to calculate exact absolute X coordinate inside #camera
  function getAbsoluteX(el) {
    let x = 0;
    let curr = el;
    while (curr && curr !== cameraEl) {
      x += curr.offsetLeft;
      curr = curr.offsetParent;
    }
    return x;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 5. ANIMATION & RENDER LOOP
  // ───────────────────────────────────────────────────────────────────────────
  function updateFrame(now) {
    requestAnimationFrame(updateFrame);

    const dt = Math.min(0.05, (now - lastFrameTime) / 1000);
    lastFrameTime = now;

    const currentTime = getCurrentTime();

    // ── END OF SONG BLACK PAUSE TRANSITION & AUTO-LOOP ──
    if (currentTime >= totalLyricsDuration) {
      if (blackCurtain) {
        blackCurtain.classList.add('fade-black');
      }
      if (AUTO_LOOP && !isResetting && currentTime >= (totalLyricsDuration + BLACK_PAUSE_END)) {
        restartExperience();
        return;
      }
    }

    // Find active line index
    let currentLineIdx = -1;
    for (let i = 0; i < TOTAL_LINES; i++) {
      if (lineNodes[i].start <= currentTime) {
        currentLineIdx = i;
      } else {
        break;
      }
    }
    currentLineIdx = Math.max(0, currentLineIdx);
    activeLineIndex = currentLineIdx;

    const activeLine = lineNodes[activeLineIndex];
    let targetFocusToken = null;

    // Glitch Shock Burst: violent shake during first 1.3s of a glitch line
    const isViolentGlitch = (activeLine.glitch && currentTime >= activeLine.start && currentTime <= (activeLine.start + 1.3));

    // Toggle Hacked Glitch Mode on body/viewport (stays red throughout climax)
    if (activeLine.glitch) {
      document.body.classList.add('hacked-mode');
    } else {
      document.body.classList.remove('hacked-mode');
    }

    // ── STRICT CURSOR ANCHOR: Ensure cursor is ALWAYS inside activeLine ──
    if (cursorEl.parentElement !== activeLine.codeLineEl) {
      activeLine.codeLineEl.appendChild(cursorEl);
    }

    // Update lines and tokens
    for (let i = 0; i < TOTAL_LINES; i++) {
      const line = lineNodes[i];
      const isPast = (i < currentLineIdx);
      const isActive = (i === currentLineIdx);
      const isFuture = (i > currentLineIdx);

      // Line state
      if (isActive) {
        line.rowEl.className = 'row active-line' + (line.glitch ? ' glitch-row' : '') + (isViolentGlitch ? ' violent-glitch' : '');
      } else if (isPast) {
        line.rowEl.className = 'row past-line' + (line.glitch ? ' glitch-row' : '');
      } else {
        line.rowEl.className = 'row' + (line.glitch ? ' glitch-row' : '');
      }

      for (let j = 0; j < line.tokens.length; j++) {
        const tok = line.tokens[j];

        if (isPast) {
          if (tok.typedCount !== tok.length) {
            tok.el.textContent = tok.raw;
            tok.typedCount = tok.length;
          }
          tok.el.classList.remove('word-zoom');
        } else if (isFuture) {
          if (tok.typedCount !== 0) {
            tok.el.textContent = '';
            tok.typedCount = 0;
          }
          tok.el.classList.remove('word-zoom');
        } else {
          // Active Line
          if (currentTime >= tok.end) {
            if (tok.typedCount !== tok.length) {
              tok.el.textContent = tok.raw;
              tok.typedCount = tok.length;
            }
            tok.el.classList.remove('word-zoom');
          } else if (currentTime >= tok.start) {
            // CURRENT ACTIVE WORD
            const progress = clamp((currentTime - tok.start) / (tok.end - tok.start), 0, 1);
            const charsToShow = Math.max(1, Math.floor(progress * tok.length));
            
            // Hacker Scramble Effect in Glitch Mode
            if (line.glitch && charsToShow < tok.length && Math.random() > 0.4) {
              const base = tok.raw.slice(0, charsToShow - 1);
              const glitchChar = GLITCH_GLYPHS[Math.floor(Math.random() * GLITCH_GLYPHS.length)];
              tok.el.textContent = base + glitchChar;
            } else if (tok.typedCount !== charsToShow) {
              tok.el.textContent = tok.raw.slice(0, charsToShow);
              tok.typedCount = charsToShow;
            }

            if (tok.isWord) {
              tok.el.classList.add('word-zoom');
            } else {
              tok.el.classList.remove('word-zoom');
            }

            targetFocusToken = tok;

            // Cursor follows active token inside active line
            if (cursorEl.previousSibling !== tok.el) {
              tok.el.parentNode.insertBefore(cursorEl, tok.el.nextSibling);
            }
          } else {
            if (tok.typedCount !== 0) {
              tok.el.textContent = '';
              tok.typedCount = 0;
            }
            tok.el.classList.remove('word-zoom');
          }
        }
      }
    }

    // If line has finished typing or no word active, place cursor at end of active line
    if (!targetFocusToken && activeLine.codeLineEl.lastElementChild !== cursorEl) {
      activeLine.codeLineEl.appendChild(cursorEl);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. CAMERA POSITIONING: CLOSE-UP ZOOM & HORIZONTAL KEYWORD TRACKING
    // Text stays large and close-up while the camera smoothly follows the words!
    // ─────────────────────────────────────────────────────────────────────────
    const viewW = viewportEl.clientWidth;
    const viewH = viewportEl.clientHeight;

    // Stable, calm camera scale (Zero dizzying zoom-in / zoom-out pumping!)
    let preferredScale = 1.16;
    if (activeLine.glitch) {
      preferredScale = 1.20; // Subtle intensity boost for Chorus
    }
    targetCamScale = preferredScale;

    const lineRowEl = activeLine.rowEl;
    const gutterLeft = getAbsoluteX(lineRowEl);

    // Exact vertical line center coordinate: locked dead-center at 50% screen height
    const lineCenterY = lineRowEl.offsetTop + lineRowEl.offsetHeight / 2;
    targetCamY = (viewH / 2) - (lineCenterY * targetCamScale);

    // ─────────────────────────────────────────────────────────────────────────
    // HORIZONTAL STABILITY: Calm, left-aligned code editor feel (No motion sickness)
    // ─────────────────────────────────────────────────────────────────────────
    const leftMargin = clamp(24, viewW * 0.05, 75);
    const baseCamX = leftMargin - (gutterLeft * targetCamScale);

    // Camera stays steady at baseCamX; only gently nudges if a line reaches right side
    let desiredCamX = baseCamX;
    if (cursorEl && cursorEl.offsetWidth > 0) {
      const cursorAbsX = getAbsoluteX(cursorEl);
      const cursorScreenX = (cursorAbsX * targetCamScale) + baseCamX;
      const rightLimit = viewW * 0.78;
      if (cursorScreenX > rightLimit) {
        desiredCamX = baseCamX - (cursorScreenX - rightLimit);
      }
    }
    targetCamX = desiredCamX;

    // Camera micro-tremor ONLY during the initial violent glitch burst
    let tremorX = 0, tremorY = 0;
    if (isViolentGlitch) {
      tremorX = (Math.random() - 0.5) * 4.0;
      tremorY = (Math.random() - 0.5) * 4.0;
    }

    // Initialize first frame instantly with no jump
    if (isInitialFrame) {
      curCamX = targetCamX;
      curCamY = targetCamY;
      curCamScale = targetCamScale;
      isInitialFrame = false;
    }

    // Silky smooth exponential lerp (Calm, cinema steadicam)
    const smoothLerpY = 1 - Math.exp(-dt * 3.8);
    const smoothLerpX = 1 - Math.exp(-dt * 3.2);
    const smoothLerpScale = 1 - Math.exp(-dt * 3.0);

    curCamY += (targetCamY - curCamY) * smoothLerpY;
    curCamX += (targetCamX - curCamX) * smoothLerpX;
    curCamScale += (targetCamScale - curCamScale) * smoothLerpScale;

    // Apply viewport transform (with micro-tremor in glitch mode)
    const finalCamX = curCamX + tremorX;
    const finalCamY = curCamY + tremorY;

    cameraEl.style.transform = `translate3d(${finalCamX.toFixed(2)}px, ${finalCamY.toFixed(2)}px, 0) scale(${curCamScale.toFixed(4)})`;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 6. RESTART EXPERIENCE (SMOOTH RESET FOR AUTO-LOOP & KEYBOARD 'R')
  // ───────────────────────────────────────────────────────────────────────────
  function restartExperience() {
    if (isResetting) return;
    isResetting = true;
    clearTimeout(loopTimer); // cancel pending audio-ended restart (prevents double restart)

    // Reset audio if available
    if (audioEl) {
      audioEl.currentTime = 0;
      audioEl.playbackRate = MASTER_SPEED;
      audioEl.play().catch(() => {});
    }

    // Reset timing clock
    pauseOffset = 0;
    lastClockPerf = performance.now();
    lastFrameTime = performance.now();
    isPaused = false;
    activeLineIndex = 0;
    isInitialFrame = true;

    // Remove hacked glitch mode
    document.body.classList.remove('hacked-mode');

    // Reset all lines and tokens
    for (let i = 0; i < TOTAL_LINES; i++) {
      const line = lineNodes[i];
      line.rowEl.className = 'row' + (line.glitch ? ' glitch-row' : '');
      for (let j = 0; j < line.tokens.length; j++) {
        const tok = line.tokens[j];
        tok.el.textContent = '';
        tok.typedCount = 0;
        tok.el.classList.remove('word-zoom');
      }
    }

    // Re-anchor cursor to line 0
    lineNodes[0].codeLineEl.appendChild(cursorEl);

    // Reposition camera immediately to line 0
    const lineRowEl = lineNodes[0].rowEl;
    const gutterLeft = getAbsoluteX(lineRowEl);
    const viewW = viewportEl.clientWidth;
    const viewH = viewportEl.clientHeight;
    const lineCenterY = lineRowEl.offsetTop + lineRowEl.offsetHeight / 2;
    const targetScale = lineNodes[0].glitch ? 1.20 : 1.16;
    const leftMargin = clamp(24, viewW * 0.05, 75);
    curCamX = leftMargin - (gutterLeft * targetScale);
    curCamY = (viewH / 2) - (lineCenterY * targetScale);
    curCamScale = targetScale;
    cameraEl.style.transform = `translate3d(${curCamX.toFixed(2)}px, ${curCamY.toFixed(2)}px, 0) scale(${curCamScale.toFixed(4)})`;

    // Smoothly fade out black curtain after DOM reset
    setTimeout(() => {
      if (blackCurtain) {
        blackCurtain.classList.remove('fade-black');
      }
      isResetting = false;
    }, 400);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 7. KEYBOARD SHORTCUTS
  // ───────────────────────────────────────────────────────────────────────────
  window.addEventListener('keydown', (e) => {
    // Space: Play / Pause
    if (e.code === 'Space') {
      e.preventDefault();
      if (audioEl && hasAudio) {
        if (audioEl.paused) {
          audioEl.play().catch(() => {});
          isPaused = false;
        } else {
          audioEl.pause();
          isPaused = true;
        }
      } else {
        if (!isPaused) {
          pauseOffset = getCurrentTime();
          isPaused = true;
        } else {
          isPaused = false;
        }
      }
    }
    // R: Smooth Restart
    else if (e.key === 'r' || e.key === 'R') {
      restartExperience();
    }
    // Arrow Right: Skip 3s
    else if (e.code === 'ArrowRight') {
      if (audioEl && hasAudio) {
        audioEl.currentTime = Math.min(audioEl.duration || 999, audioEl.currentTime + 3.0);
      } else {
        pauseOffset = getCurrentTime() + 3.0;
      }
    }
    // Arrow Left: Rewind 3s
    else if (e.code === 'ArrowLeft') {
      if (audioEl && hasAudio) {
        audioEl.currentTime = Math.max(0, audioEl.currentTime - 3.0);
      } else {
        pauseOffset = Math.max(0, getCurrentTime() - 3.0);
      }
    }
    // + or =: Speed Up (+0.1x)
    else if (e.key === '+' || e.key === '=') {
      setMasterSpeed(MASTER_SPEED + 0.1);
    }
    // - or _: Speed Down (-0.1x)
    else if (e.key === '-' || e.key === '_') {
      setMasterSpeed(MASTER_SPEED - 0.1);
    }
    // 0: Reset Speed (1.0x)
    else if (e.key === '0') {
      setMasterSpeed(1.0);
    }
  });

  // Start immediately!
  requestAnimationFrame(updateFrame);
})();
