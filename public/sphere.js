// 3D Orange Emoji Particle Sphere Background
// Self-initializing — just include this script and it runs.

const SPHERE_CONFIG = {
    PARTICLE_COUNT: 80,
    ROTATION_SPEED: 0.003,   // radians per frame (~10s per revolution at 60fps)
    TILT_ANGLE: 0.30,        // X-axis tilt in radians (~17°), gives globe feel
    FOCAL_LENGTH: 1500,
    BASE_EMOJI_SIZE: 30,     // px at front face
    MIN_EMOJI_SIZE: 9,       // px at back face
    MAX_ALPHA: 0.80,
    MIN_ALPHA: 0.18,
    EMOJI: '🍊',
};

let _canvas, _ctx;
let _particles = [];  // [{theta, phi}]
let _edges = [];      // [{i, j}] pre-computed neighbor pairs
let _rotAngle = 0;
let _sphereRadius = 1;
let _cx = 0, _cy = 0;
let _fontCache = {};
let _resizeTimer = null;

function applyDisplacement(theta, phi, time) {
    return { dTheta: 0, dPhi: 0, dR: 0 };
}

function angularDist(p1, p2) {
    const x1 = Math.sin(p1.phi) * Math.cos(p1.theta);
    const y1 = Math.cos(p1.phi);
    const z1 = Math.sin(p1.phi) * Math.sin(p1.theta);
    const x2 = Math.sin(p2.phi) * Math.cos(p2.theta);
    const y2 = Math.cos(p2.phi);
    const z2 = Math.sin(p2.phi) * Math.sin(p2.theta);
    return Math.acos(Math.max(-1, Math.min(1, x1*x2 + y1*y2 + z1*z2)));
}

function buildEdges() {
    _edges = [];
    const N = _particles.length;
    const THRESHOLD = 0.55; // radians — ~1.4× avg nearest-neighbor distance for N=80
    for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
            if (angularDist(_particles[i], _particles[j]) < THRESHOLD) {
                _edges.push({ i, j });
            }
        }
    }
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
    // Keep original index order so edges can look up by particle index
    const projected = _particles.map(p => projectParticle(p, matrix, timestamp));

    // Pass 1: edges, back to front
    const edgesSorted = _edges.map(({ i, j }) => {
        const a = projected[i], b = projected[j];
        return { a, b, worldZ: (a.worldZ + b.worldZ) / 2 };
    }).sort((x, y) => x.worldZ - y.worldZ);

    _ctx.strokeStyle = 'rgb(255, 140, 0)';
    _ctx.lineWidth = 1.5;
    for (const { a, b } of edgesSorted) {
        _ctx.globalAlpha = (a.alpha + b.alpha) / 2 * 0.5;
        _ctx.beginPath();
        _ctx.moveTo(a.screenX, a.screenY);
        _ctx.lineTo(b.screenX, b.screenY);
        _ctx.stroke();
    }

    // Pass 2: particles on top, back to front
    const particlesSorted = projected.slice().sort((a, b) => a.worldZ - b.worldZ);
    for (const p of particlesSorted) {
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
    _cy = _canvas.height / 2 + 40;
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
    buildEdges();

    window.addEventListener('resize', onResize);
    requestAnimationFrame(draw);
}

initSphere();
