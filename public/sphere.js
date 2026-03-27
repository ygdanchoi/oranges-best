// 3D Orange Emoji Particle Sphere Background
// Self-initializing — just include this script and it runs.

const SPHERE_CONFIG = {
    PARTICLE_COUNT: 300,
    ROTATION_SPEED: 0.003,   // radians per frame (~10s per revolution at 60fps)
    TILT_ANGLE: 0.30,        // X-axis tilt in radians (~17°), gives globe feel
    FOCAL_LENGTH: 1500,
    BASE_EMOJI_SIZE: 22,     // px at front face
    MIN_EMOJI_SIZE: 6,       // px at back face
    MAX_ALPHA: 0.55,
    MIN_ALPHA: 0.08,
    EMOJI: '🍊',
};

let _canvas, _ctx;
let _particles = [];  // [{theta, phi}]
let _rotAngle = 0;
let _sphereRadius = 1;
let _cx = 0, _cy = 0;
let _fontCache = {};
let _resizeTimer = null;

function applyDisplacement(theta, phi, time) {
    return { dTheta: 0, dPhi: 0, dR: 0 };
}

function getFont(px) {
    if (!_fontCache[px]) _fontCache[px] = px + 'px serif';
    return _fontCache[px];
}

function generateParticles() {
    _particles = [];
    const N = SPHERE_CONFIG.PARTICLE_COUNT;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~2.39996 rad
    for (let i = 0; i < N; i++) {
        const y = 1 - (2 * (i + 0.5) / N);
        const r = Math.sqrt(Math.max(0, 1 - y * y));
        const angle = i * goldenAngle;
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;
        const phi   = Math.acos(Math.max(-1, Math.min(1, y)));
        const theta = Math.atan2(z, x);
        _particles.push({ theta, phi });
    }
}

function buildRotationMatrix(rotY, rotX) {
    const cy = Math.cos(rotY), sy = Math.sin(rotY);
    const cx = Math.cos(rotX), sx = Math.sin(rotX);
    return [
        cy,       0,    sy,
        sx * sy,  cx,  -sx * cy,
       -cx * sy,  sx,   cx * cy
    ];
}

function rotatePt(m, px, py, pz) {
    return {
        x: m[0] * px + m[1] * py + m[2] * pz,
        y: m[3] * px + m[4] * py + m[5] * pz,
        z: m[6] * px + m[7] * py + m[8] * pz,
    };
}

function projectParticle(particle, matrix, time) {
    const { theta, phi } = particle;
    const { dTheta, dPhi, dR } = applyDisplacement(theta, phi, time);

    const phi2   = phi   + dPhi;
    const theta2 = theta + dTheta;
    const r      = _sphereRadius + dR;

    const sinPhi = Math.sin(phi2);
    const ux = sinPhi * Math.cos(theta2);
    const uy = Math.cos(phi2);
    const uz = sinPhi * Math.sin(theta2);

    const world = rotatePt(matrix, ux * r, uy * r, uz * r);

    const w = SPHERE_CONFIG.FOCAL_LENGTH / (SPHERE_CONFIG.FOCAL_LENGTH + world.z);
    const screenX = _cx + world.x * w;
    const screenY = _cy + world.y * w;

    // depth: 0 = back, 1 = front
    const depth = (world.z + _sphereRadius) / (2 * _sphereRadius);
    const alpha = SPHERE_CONFIG.MIN_ALPHA + depth * (SPHERE_CONFIG.MAX_ALPHA - SPHERE_CONFIG.MIN_ALPHA);
    const size  = Math.round(SPHERE_CONFIG.MIN_EMOJI_SIZE + depth * (SPHERE_CONFIG.BASE_EMOJI_SIZE - SPHERE_CONFIG.MIN_EMOJI_SIZE));

    return { screenX, screenY, worldZ: world.z, alpha, size };
}

function draw(timestamp) {
    requestAnimationFrame(draw);

    _rotAngle += SPHERE_CONFIG.ROTATION_SPEED;
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);

    const matrix = buildRotationMatrix(_rotAngle, SPHERE_CONFIG.TILT_ANGLE);
    const projected = _particles.map(p => projectParticle(p, matrix, timestamp));

    // Painter's algorithm: draw back particles first
    projected.sort((a, b) => a.worldZ - b.worldZ);

    for (const p of projected) {
        _ctx.globalAlpha = p.alpha;
        _ctx.font = getFont(p.size);
        _ctx.fillText(SPHERE_CONFIG.EMOJI, p.screenX, p.screenY);
    }
    _ctx.globalAlpha = 1;
}

function updateDimensions() {
    _canvas.width  = window.innerWidth;
    _canvas.height = window.innerHeight;
    _cx = _canvas.width  / 2;
    _cy = _canvas.height / 2;
    _sphereRadius = Math.min(_cx, _cy) * 1.05;
    _ctx.textBaseline = 'middle';
    _ctx.textAlign    = 'center';
}

function onResize() {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(updateDimensions, 150);
}

function initSphere() {
    _canvas = document.createElement('canvas');
    _canvas.id = 'orange-sphere-canvas';
    document.body.prepend(_canvas);

    _ctx = _canvas.getContext('2d');
    _ctx.textBaseline = 'middle';
    _ctx.textAlign    = 'center';

    updateDimensions();
    generateParticles();

    window.addEventListener('resize', onResize);
    requestAnimationFrame(draw);
}

initSphere();
