/* ==========================================================================
   3D BIRTHDAY EXPERIENCE - DƯƠNG BẢO NGỌC (TUỔI 18)
   Frameworks: Three.js, GSAP, Canvas Confetti
   ========================================================================== */

// Config & Audio URL Variable
const MUSIC_URL = "music.mp3";
let isMusicPlaying = false;
let audioContext, audioAnalyser, audioSource;

// State Variables
let scene, camera, renderer;
let cakeGroup, candleFlames = [], candleLights = [];
let floatingIconsGroup;
let isCandlesBlown = false;

// Mouse tracking
const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

// DOM Elements
const loadingScreen = document.getElementById('loading-screen');
const progressBar = document.getElementById('progress-bar');
const wishInput = document.getElementById('wish-input');
const btnSendWish = document.getElementById('btn-send-wish');
const lastWishDisplay = document.getElementById('last-wish-display');
const savedWishText = document.getElementById('saved-wish-text');
const btnBlow = document.getElementById('btn-blow');
const btnMusic = document.getElementById('btn-music');
const bgMusic = document.getElementById('bg-music');
const countdownOverlay = document.getElementById('countdown-overlay');
const countdownNumber = document.getElementById('countdown-number');
const toast = document.getElementById('toast');

/* ==========================================================================
   1. INITIALIZATION & THREE.JS SETUP
   ========================================================================== */
window.addEventListener('DOMContentLoaded', () => {
    initThreeJS();
    createProceduralCake();
    create18Candles();
    createFloatingMathAndBdayIcons();
    createStarfieldAndNebula();
    setupCursorParticles();
    initTypingEffects();
    checkSavedWish();
    setupEventListeners();

    // Simulate Asset Loading Progress
    let progress = 0;
    const interval = setInterval(() => {
        progress += 15;
        progressBar.style.width = `${Math.min(progress, 100)}%`;
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                loadingScreen.style.visibility = 'hidden';
            }, 500);
        }
    }, 150);
});

function initThreeJS() {
    const container = document.getElementById('canvas-container');

    // Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x04091a, 0.015);

    // Camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 3.5, 12);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xfff5ea, 0.8);
    scene.add(ambientLight);

    const mainSpotLight = new THREE.SpotLight(0xffd700, 2.5);
    mainSpotLight.position.set(5, 12, 8);
    mainSpotLight.angle = Math.PI / 4;
    mainSpotLight.penumbra = 0.5;
    mainSpotLight.castShadow = true;
    mainSpotLight.shadow.mapSize.width = 2048;
    mainSpotLight.shadow.mapSize.height = 2048;
    scene.add(mainSpotLight);

    const purpleFillLight = new THREE.PointLight(0xa855f7, 1.8, 20);
    purpleFillLight.position.set(-6, 4, -4);
    scene.add(purpleFillLight);

    const pinkRimLight = new THREE.PointLight(0xffb7c5, 1.5, 20);
    pinkRimLight.position.set(6, -2, -5);
    scene.add(pinkRimLight);

    // Animation Loop
    animate();
}

/* ==========================================================================
   2. PROCEDURAL 3D CAKE BUILDER (Three.js PBR Materials)
   ========================================================================== */
function createProceduralCake() {
    cakeGroup = new THREE.Group();
    cakeGroup.position.set(0, -1.2, 0);
    scene.add(cakeGroup);

    // Materials
    const goldPlateMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.85,
        roughness: 0.2,
        envMapIntensity: 1.0
    });

    const creamPinkMat = new THREE.MeshStandardMaterial({
        color: 0xfce7f3, // Soft Pastel Pink
        roughness: 0.35,
        metalness: 0.05
    });

    const creamWhiteMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.25,
        metalness: 0.02
    });

    const chocolateDripMat = new THREE.MeshPhysicalMaterial({
        color: 0x3d1c02,
        roughness: 0.1,
        metalness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1
    });

    const cherryMat = new THREE.MeshPhysicalMaterial({
        color: 0xd90429,
        roughness: 0.05,
        metalness: 0.1,
        clearcoat: 1.0
    });

    // 0. Cake Plate Base
    const plateGeo = new THREE.CylinderGeometry(4.2, 4.4, 0.2, 64);
    const plateMesh = new THREE.Mesh(plateGeo, goldPlateMat);
    plateMesh.position.y = -0.1;
    plateMesh.receiveShadow = true;
    cakeGroup.add(plateMesh);

    // Tier Heights & Radii
    const tiers = [
        { radius: 3.2, height: 1.4, y: 0.7, mat: creamPinkMat },  // Bottom
        { radius: 2.3, height: 1.2, y: 2.0, mat: creamWhiteMat }, // Middle
        { radius: 1.5, height: 1.0, y: 3.1, mat: creamPinkMat }   // Top
    ];

    tiers.forEach((tier, idx) => {
        // Tier Body
        const tierGeo = new THREE.CylinderGeometry(tier.radius, tier.radius, tier.height, 64);
        const tierMesh = new THREE.Mesh(tierGeo, tier.mat);
        tierMesh.position.y = tier.y;
        tierMesh.castShadow = true;
        tierMesh.receiveShadow = true;
        cakeGroup.add(tierMesh);

        // Piping Pearls (Cream borders around base of each tier)
        const pearlCount = Math.floor(tier.radius * 24);
        for (let i = 0; i < pearlCount; i++) {
            const angle = (i / pearlCount) * Math.PI * 2;
            const pearlGeo = new THREE.SphereGeometry(0.1, 16, 16);
            const pearlMesh = new THREE.Mesh(pearlGeo, creamWhiteMat);
            pearlMesh.position.set(
                Math.cos(angle) * (tier.radius + 0.02),
                tier.y - tier.height / 2 + 0.05,
                Math.sin(angle) * (tier.radius + 0.02)
            );
            cakeGroup.add(pearlMesh);
        }

        // Chocolate Drip Rim for Tier 1 & 2
        if (idx < 2) {
            const dripRingGeo = new THREE.TorusGeometry(tier.radius + 0.03, 0.08, 16, 64);
            const dripRingMesh = new THREE.Mesh(dripRingGeo, chocolateDripMat);
            dripRingMesh.rotation.x = Math.PI / 2;
            dripRingMesh.position.y = tier.y + tier.height / 2 - 0.02;
            cakeGroup.add(dripRingMesh);
        }
    });

    // Toppings: Macarons & Cherries on Middle/Bottom Tier
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        // Cherries
        const cherryGeo = new THREE.SphereGeometry(0.14, 16, 16);
        const cherry = new THREE.Mesh(cherryGeo, cherryMat);
        cherry.position.set(
            Math.cos(angle) * 2.0,
            2.62,
            Math.sin(angle) * 2.0
        );
        cherry.castShadow = true;
        cakeGroup.add(cherry);
    }

    // Dynamic Text on Cake (Canvas Texture wrapped on top/middle tier)
    addCakeText();
}

/* 3D Cream Text Rendering via Dynamic Canvas */
function addCakeText() {
    // Canvas 1: "Happy Birthday"
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 1024, 256);
    ctx.font = 'bold 55px "Dancing Script", cursive';
    ctx.fillStyle = '#d97706'; // Gold/Bronze Cream color
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
    ctx.shadowBlur = 10;
    ctx.fillText('Happy Birthday', 512, 100);
    ctx.font = 'bold 48px "Playfair Display", serif';
    ctx.fillText('Dương Bảo Ngọc', 512, 175);

    const texture = new THREE.CanvasTexture(canvas);
    const textMat = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        roughness: 0.3
    });

    const textPlaneGeo = new THREE.CylinderGeometry(2.32, 2.32, 1.1, 64, 1, true, -Math.PI / 3, (2 * Math.PI) / 3);
    const textMesh = new THREE.Mesh(textPlaneGeo, textMat);
    textMesh.position.y = 2.0;
    textMesh.rotation.y = Math.PI; // Face front
    cakeGroup.add(textMesh);

    // Canvas 2: "23 • 07 • 2008" on Bottom Tier
    const canvas2 = document.createElement('canvas');
    canvas2.width = 1024;
    canvas2.height = 256;
    const ctx2 = canvas2.getContext('2d');
    ctx2.font = 'bold 50px "Plus Jakarta Sans", sans-serif';
    ctx2.fillStyle = '#a855f7';
    ctx2.textAlign = 'center';
    ctx2.fillText('23 • 07 • 2008', 512, 140);

    const texture2 = new THREE.CanvasTexture(canvas2);
    const textMat2 = new THREE.MeshStandardMaterial({ map: texture2, transparent: true });
    const textPlaneGeo2 = new THREE.CylinderGeometry(3.22, 3.22, 1.2, 64, 1, true, -Math.PI / 3, (2 * Math.PI) / 3);
    const textMesh2 = new THREE.Mesh(textPlaneGeo2, textMat2);
    textMesh2.position.y = 0.7;
    textMesh2.rotation.y = Math.PI;
    cakeGroup.add(textMesh2);
}

/* ==========================================================================
   3. 18 CANDLES & REAL 3D FLAMES
   ========================================================================== */
function create18Candles() {
    const candleCount = 18;
    const radius = 1.1; // Arranged on top tier
    const topTierY = 3.6;

    const candleMat = new THREE.MeshStandardMaterial({
        color: 0xffb7c5,
        roughness: 0.2
    });

    const wickMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

    for (let i = 0; i < candleCount; i++) {
        const angle = (i / candleCount) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        // Candle Body
        const candleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.45, 16);
        const candleMesh = new THREE.Mesh(candleGeo, candleMat);
        candleMesh.position.set(x, topTierY + 0.225, z);
        candleMesh.castShadow = true;
        cakeGroup.add(candleMesh);

        // Wick
        const wickGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.08, 8);
        const wickMesh = new THREE.Mesh(wickGeo, wickMat);
        wickMesh.position.set(x, topTierY + 0.45 + 0.04, z);
        cakeGroup.add(wickMesh);

        // Flame Mesh (3D Cone)
        const flameGeo = new THREE.ConeGeometry(0.05, 0.16, 12);
        flameGeo.translate(0, 0.08, 0);
        const flameMat = new THREE.MeshBasicMaterial({
            color: 0xff7700,
            transparent: true,
            opacity: 0.95
        });
        const flameMesh = new THREE.Mesh(flameGeo, flameMat);
        flameMesh.position.set(x, topTierY + 0.48, z);
        cakeGroup.add(flameMesh);
        candleFlames.push(flameMesh);

        // Candle PointLight for Real Flicker Shadow
        const light = new THREE.PointLight(0xffaa00, 0.6, 2.5);
        light.position.set(x, topTierY + 0.55, z);
        cakeGroup.add(light);
        candleLights.push(light);
    }
}

/* ==========================================================================
   4. ORBITING MATH & BIRTHDAY ICONS (Canvas Textures)
   ========================================================================== */
function createFloatingMathAndBdayIcons() {
    floatingIconsGroup = new THREE.Group();
    scene.add(floatingIconsGroup);

    const symbols = [
        '🎂', '🎁', '🎈', '🎉', '✨', '⭐', '🌸', '💖', '🦋',
        '📚', '📖', '📐', '📏', '✏️', '🧮', '➕', '➖', '×', '÷', '√', 'π', 'Σ', '∞', '∫', 'f(x)'
    ];

    const iconCount = 120; // Hundreds of items in orbit

    for (let i = 0; i < iconCount; i++) {
        const symbol = symbols[i % symbols.length];

        // Create canvas texture for crisp vector-like emoji/symbols
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.font = '70px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 15;
        ctx.fillText(symbol, 64, 64);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.85
        });

        const sprite = new THREE.Sprite(spriteMat);
        
        // Random 3D Orbit coordinates
        const radius = 4.5 + Math.random() * 5.0;
        const theta = Math.random() * Math.PI * 2;
        const phi = (Math.random() - 0.5) * Math.PI * 0.8;

        sprite.position.set(
            radius * Math.cos(theta) * Math.cos(phi),
            radius * Math.sin(phi) + 1.5,
            radius * Math.sin(theta) * Math.cos(phi)
        );

        const scale = 0.35 + Math.random() * 0.35;
        sprite.scale.set(scale, scale, 1);

        // Custom userdata for unique orbit speeds
        sprite.userData = {
            orbitRadius: radius,
            angle: theta,
            speed: 0.003 + Math.random() * 0.006,
            verticalSpeed: 0.005 + Math.random() * 0.01,
            yOffset: sprite.position.y
        };

        floatingIconsGroup.add(sprite);
    }
}

/* ==========================================================================
   5. STARFIELD, NEBULA & BACKGROUND PARTICLES
   ========================================================================== */
function createStarfieldAndNebula() {
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 2500;
    const posArray = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
        posArray[i] = (Math.random() - 0.5) * 120;
        posArray[i + 1] = (Math.random() - 0.5) * 120;
        posArray[i + 2] = (Math.random() - 0.5) * 120;
    }

    starsGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const starsMat = new THREE.PointsMaterial({
        size: 0.12,
        color: 0xffffff,
        transparent: true,
        opacity: 0.8
    });

    const starField = new THREE.Points(starsGeo, starsMat);
    scene.add(starField);
}

/* ==========================================================================
   6. CURSOR TRAIL PARTICLES (2D Canvas Effect)
   ========================================================================== */
function setupCursorParticles() {
    const cCanvas = document.getElementById('cursor-canvas');
    const ctx = cCanvas.getContext('2d');
    let particles = [];

    function resizeCanvas() {
        cCanvas.width = window.innerWidth;
        cCanvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    window.addEventListener('mousemove', (e) => {
        for (let i = 0; i < 3; i++) {
            particles.push({
                x: e.clientX,
                y: e.clientY,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2 - 1,
                size: Math.random() * 4 + 2,
                color: Math.random() > 0.5 ? '#ffd700' : '#ffb7c5',
                alpha: 1
            });
        }
    });

    function renderCursor() {
        ctx.clearRect(0, 0, cCanvas.width, cCanvas.height);
        particles.forEach((p, idx) => {
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.02;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(p.alpha, 0);
            ctx.fill();

            if (p.alpha <= 0) particles.splice(idx, 1);
        });
        requestAnimationFrame(renderCursor);
    }
    renderCursor();
}

/* ==========================================================================
   7. ANIMATION & RENDER LOOP (60FPS)
   ========================================================================== */
function animate() {
    requestAnimationFrame(animate);

    // 1. Slow Cake Rotation
    if (cakeGroup) {
        cakeGroup.rotation.y += 0.003;
    }

    // 2. Candle Flame Flicker & Scale Animation
    if (!isCandlesBlown) {
        const time = Date.now() * 0.008;
        candleFlames.forEach((flame, i) => {
            flame.scale.y = 1 + Math.sin(time + i) * 0.15;
            flame.scale.x = 1 + Math.cos(time * 1.2 + i) * 0.1;
        });
        candleLights.forEach((light, i) => {
            light.intensity = 0.5 + Math.sin(time * 2 + i) * 0.25;
        });
    }

    // 3. Orbit Floating Icons
    if (floatingIconsGroup) {
        floatingIconsGroup.children.forEach((sprite) => {
            const data = sprite.userData;
            data.angle += data.speed;
            sprite.position.x = data.orbitRadius * Math.cos(data.angle);
            sprite.position.z = data.orbitRadius * Math.sin(data.angle);
            sprite.position.y = data.yOffset + Math.sin(data.angle * 2) * 0.3;
        });
    }

    // 4. Parallax Camera Motion on Mouse Move
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    camera.position.x = mouse.x * 1.5;
    camera.position.y = 3.5 + mouse.y * 0.8;
    camera.lookAt(0, 1.5, 0);

    // 5. Audio Visualizer Updating
    renderVisualizer();

    renderer.render(scene, camera);
}

/* ==========================================================================
   8. TYPING EFFECTS & STORYWRITING
   ========================================================================== */
function initTypingEffects() {
    typeWriter('typing-title', '🎉 Happy Birthday 🎉', 80, () => {
        typeWriter('typing-name', 'Dương Bảo Ngọc', 100, () => {
            startLetterTyping();
        });
    });
}

function typeWriter(elementId, text, speed, callback) {
    let i = 0;
    const elem = document.getElementById(elementId);
    elem.innerHTML = '';
    function type() {
        if (i < text.length) {
            elem.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        } else if (callback) {
            callback();
        }
    }
    type();
}

function startLetterTyping() {
    const letterText = `Chúc mừng sinh nhật Dương Bảo Ngọc!

Chúc bạn bước sang tuổi 18 với thật nhiều niềm vui, sức khỏe và hạnh phúc.

Hy vọng mày sẽ luôn giữ được niềm đam mê học tập, không ngừng cố gắng để chinh phục kỳ thi quan trọng trong sắp tới.

Mong rằng ước mơ trở thành một giáo viên dạy giỏi sẽ từng bước trở thành hiện thực.

Chúc mày sẽ luôn mạnh mẽ, tự tin và một ngày nào đó sẽ đứng trên bục giảng, truyền cảm hứng cho thật nhiều học sinh bằng tình yêu với những con số.

Happy Birthday!`;

    typeWriter('typing-letter', letterText, 25);
}

/* ==========================================================================
   9. INTERACTIVE ACTIONS (BLOW CANDLES, WISHES, MUSIC)
   ========================================================================== */
function setupEventListeners() {
    // Parallax mouse move listener
    window.addEventListener('mousemove', (e) => {
        mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // Window Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Blow Candles Button Click
    btnBlow.addEventListener('click', blowCandlesSequence);

    // Send Wish Button
    btnSendWish.addEventListener('click', handleSendWish);

    // Music Toggle Button
    btnMusic.addEventListener('click', toggleMusic);
}

/* Blow Candles Sequence */
function blowCandlesSequence() {
    if (isCandlesBlown) {
        showToast("🕯️ Nến đã được thổi tắt rồi! Chúc điều ước của Ngọc thành hiện thực!");
        return;
    }

    countdownOverlay.classList.remove('hidden');
    let count = 3;
    countdownNumber.innerText = count;

    const timer = setInterval(() => {
        count--;
        if (count > 0) {
            countdownNumber.innerText = count;
        } else {
            clearInterval(timer);
            countdownOverlay.classList.add('hidden');

            // Extinguish Candles in Three.js
            candleFlames.forEach((flame) => {
                gsap.to(flame.scale, { x: 0, y: 0, z: 0, duration: 0.4 });
            });
            candleLights.forEach((light) => {
                gsap.to(light, { intensity: 0, duration: 0.4 });
            });

            isCandlesBlown = true;
            showToast("✨ Nến đã tắt! Pháo hoa chúc mừng tuổi 18!");

            // Trigger Fireworks & Confetti Explosion
            setTimeout(() => {
                launchFireworks();
            }, 500);
        }
    }, 1000);
}

/* Confetti & Fireworks Trigger */
function launchFireworks() {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);

        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, {
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        }));
        confetti(Object.assign({}, defaults, {
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        }));
    }, 250);
}

/* Wish Submission & LocalStorage Handling */
function handleSendWish() {
    const wish = wishInput.value.trim();
    if (!wish) {
        showToast("⚠️ Bạn chưa nhập điều ước mà!");
        return;
    }

    // Save to LocalStorage
    localStorage.setItem('duong_bao_ngoc_wish', wish);

    // Star Launch Animation Effect
    showToast("✨ Điều ước đã được gửi tới bầu trời. Chúc điều ước của bạn sẽ trở thành hiện thực.");
    wishInput.value = '';
    checkSavedWish();

    // Trigger celebratory mini confetti
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
}

function checkSavedWish() {
    const saved = localStorage.getItem('duong_bao_ngoc_wish');
    if (saved) {
        lastWishDisplay.classList.remove('hidden');
        savedWishText.innerText = `"${saved}"`;
    }
}

/* Music & Visualizer Functions */
function toggleMusic() {
    if (!isMusicPlaying) {
        bgMusic.play().then(() => {
            isMusicPlaying = true;
            document.getElementById('music-text').innerText = "⏸️ Pause Music";
            setupAudioVisualizer();
        }).catch(() => {
            showToast("🎵 Vui lòng kiểm tra file audio 'music.mp3'");
        });
    } else {
        bgMusic.pause();
        isMusicPlaying = false;
        document.getElementById('music-text').innerText = "🎵 Play Music";
    }
}

function setupAudioVisualizer() {
    if (audioContext) return;
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioAnalyser = audioContext.createAnalyser();
        audioSource = audioContext.createMediaElementSource(bgMusic);
        audioSource.connect(audioAnalyser);
        audioAnalyser.connect(audioContext.destination);
        audioAnalyser.fftSize = 64;
    } catch (e) {
        console.log("Audio Context visualizer initialization error.");
    }
}

function renderVisualizer() {
    if (!audioAnalyser) return;
    const vCanvas = document.getElementById('visualizer-canvas');
    const ctx = vCanvas.getContext('2d');
    vCanvas.width = window.innerWidth;
    vCanvas.height = 80;

    const bufferLength = audioAnalyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    audioAnalyser.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, vCanvas.width, vCanvas.height);
    const barWidth = (vCanvas.width / bufferLength) * 2.5;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * vCanvas.height;
        ctx.fillStyle = `rgba(255, 215, 0, ${dataArray[i] / 255})`;
        ctx.fillRect(x, vCanvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 2;
    }
}

/* Toast Utility */
function showToast(message) {
    document.getElementById('toast-message').innerText = message;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3500);
}