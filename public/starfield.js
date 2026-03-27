// 🍊 snowfield — particles spread across the whole screen, drifting outward
// at constant speed (no perspective acceleration). Self-initializing.

const SF_CONFIG = {
    COUNT: 200,
    MIN_SIZE: 3,
    MAX_SIZE: 16,
    DRIFT_SPEED: 0.44,   // base px/frame outward
    DEPTH_RATE: 0.0012,  // how fast a particle "approaches" (size/alpha growth)
    EMOJI: '🍊',
};

let _sfCanvas, _sfCtx, _sfCx, _sfCy;
let _stars = [];
let _sfResizeTimer = null;
let _sfFontCache = {};

function sfGetFont(px) {
    if (!_sfFontCache[px]) _sfFontCache[px] = px + 'px serif';
    return _sfFontCache[px];
}

function resetStar(s, stagger) {
    // Place anywhere across the full screen
    s.x = Math.random() * _sfCanvas.width;
    s.y = Math.random() * _sfCanvas.height;
    s.d = stagger ? Math.random() : 0;  // depth: 0=far/small, 1=near/large

    // Constant-speed drift outward from viewport center
    const angle = Math.atan2(s.y - _sfCy, s.x - _sfCx);
    s.vx = Math.cos(angle) * SF_CONFIG.DRIFT_SPEED;
    s.vy = Math.sin(angle) * SF_CONFIG.DRIFT_SPEED;
}

function drawStarfield() {
    requestAnimationFrame(drawStarfield);
    _sfCtx.clearRect(0, 0, _sfCanvas.width, _sfCanvas.height);

    for (const s of _stars) {
        const size  = Math.round(SF_CONFIG.MIN_SIZE + s.d * (SF_CONFIG.MAX_SIZE - SF_CONFIG.MIN_SIZE));
        const alpha = s.d * 0.28 + 0.02;

        _sfCtx.globalAlpha = alpha;
        _sfCtx.font = sfGetFont(size);
        _sfCtx.fillText(SF_CONFIG.EMOJI, s.x, s.y);

        // Near particles move faster — parallax depth cue
        const speedScale = 0.15 + s.d * 2.2;
        s.x += s.vx * speedScale;
        s.y += s.vy * speedScale;
        s.d += SF_CONFIG.DEPTH_RATE;

        if (s.d >= 1 || s.x < -40 || s.x > _sfCanvas.width + 40
                     || s.y < -40 || s.y > _sfCanvas.height + 40) {
            resetStar(s, false);
        }
    }

    _sfCtx.globalAlpha = 1;
}

function updateSfDimensions() {
    _sfCanvas.width  = window.innerWidth;
    _sfCanvas.height = window.innerHeight;
    _sfCx = _sfCanvas.width  / 2;
    _sfCy = _sfCanvas.height / 2;
    _sfCtx.textBaseline = 'middle';
    _sfCtx.textAlign    = 'center';
    // Recompute drift directions for new center
    for (const s of _stars) {
        const angle = Math.atan2(s.y - _sfCy, s.x - _sfCx);
        s.vx = Math.cos(angle) * SF_CONFIG.DRIFT_SPEED;
        s.vy = Math.sin(angle) * SF_CONFIG.DRIFT_SPEED;
    }
}

function initStarfield() {
    _sfCanvas    = document.createElement('canvas');
    _sfCanvas.id = 'starfield-canvas';
    document.body.prepend(_sfCanvas);

    _sfCtx = _sfCanvas.getContext('2d');
    _sfCtx.textBaseline = 'middle';
    _sfCtx.textAlign    = 'center';

    updateSfDimensions();

    for (let i = 0; i < SF_CONFIG.COUNT; i++) {
        const s = {};
        resetStar(s, true);  // stagger=true: randomize starting depth on load
        _stars.push(s);
    }

    window.addEventListener('resize', () => {
        clearTimeout(_sfResizeTimer);
        _sfResizeTimer = setTimeout(updateSfDimensions, 150);
    });

    requestAnimationFrame(drawStarfield);
}

initStarfield();
