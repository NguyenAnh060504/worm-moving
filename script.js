const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let dpr = window.devicePixelRatio || 1;
let gameWidth = window.innerWidth;
let gameHeight = window.innerHeight;

function resize() {
    dpr = window.devicePixelRatio || 1;
    gameWidth = window.innerWidth;
    gameHeight = window.innerHeight;

    canvas.width = gameWidth * dpr;
    canvas.height = gameHeight * dpr;
    canvas.style.width = `${gameWidth}px`;
    canvas.style.height = `${gameHeight}px`;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
}
window.addEventListener('resize', resize);
resize();

// Tải các ảnh bộ phận
const images = {
    head: new Image(),
    body: new Image(),
    tail: new Image()
};

let loadedCount = 0;
function checkLoad() {
    loadedCount++;
    if (loadedCount === 3) {
        wormX = gameWidth / 2;
        wormY = gameHeight / 2;
        requestAnimationFrame(update);
    }
}

images.head.onload = checkLoad;
images.body.onload = checkLoad;
images.tail.onload = checkLoad;

images.head.src = 'sâu/sâu nor/đầu.png';
images.body.src = 'sâu/sâu nor/thân.png';
images.tail.src = 'sâu/sâu nor/đuôi.png';

let wormX = 0;
let wormY = 0;
const speed = 1.5;
const scale = 0.1;

const directions = [
    { vx: 1, vy: 0 }, { vx: 1, vy: 1 }, { vx: 0, vy: 1 }, { vx: -1, vy: 1 },
    { vx: -1, vy: 0 }, { vx: -1, vy: -1 }, { vx: 0, vy: -1 }, { vx: 1, vy: -1 }
];

let vx = -1;
let vy = 0;
let facingX = 1; 

let isMoving = true;
let lastDecisionTime = 0;
const decisionInterval = 1000;

let walkCycle = 0;

// --- TƯƠNG TÁC KÉO THẢ VÀ HIỆU ỨNG NHẤC LÊN ---
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
let liftHeight = 0; // Biến giả lập Z-axis (chiều cao nhấc lên)

function getMousePos(e) {
    if (e.touches && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
}

function handleDown(e) {
    const pos = getMousePos(e);
    
    // Tọa độ thực tế của thân sâu trên màn hình
    const bodyX = wormX;
    const bodyY = wormY - liftHeight;
    
    // Vùng chạm (hitbox) ước tính
    const hitRadius = (images.body.width * scale) * 1.5; 
    const dist = Math.hypot(pos.x - bodyX, pos.y - bodyY);
    
    // Nếu click trúng sâu
    if (dist < hitRadius) {
        isDragging = true;
        // Tính khoảng cách từ chuột tới trung tâm sâu để khi kéo không bị giật về chuột
        dragOffsetX = wormX - pos.x;
        dragOffsetY = (wormY - liftHeight) - pos.y;
    }
}

function handleMove(e) {
    if (isDragging) {
        const pos = getMousePos(e);
        wormX = pos.x + dragOffsetX;
        wormY = pos.y + dragOffsetY + liftHeight; // Giữ nguyên khoảng cách nhấc
    }
}

function handleUp(e) {
    if (isDragging) {
        isDragging = false;
        // Cập nhật lại thời gian quyết định để nó không chạy lung tung ngay lập tức
        lastDecisionTime = performance.now();
    }
}

// Gắn sự kiện chuột
canvas.addEventListener('mousedown', handleDown);
window.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleUp);

// Gắn sự kiện cảm ứng trên điện thoại
canvas.addEventListener('touchstart', handleDown, {passive: false});
window.addEventListener('touchmove', handleMove, {passive: false});
window.addEventListener('touchend', handleUp);

function drawWormParts() {
    ctx.drawImage(images.tail, -images.tail.width * scale / 2, -images.tail.height * scale / 2, images.tail.width * scale, images.tail.height * scale);
    ctx.drawImage(images.body, -images.body.width * scale / 2, -images.body.height * scale / 2, images.body.width * scale, images.body.height * scale);
    ctx.drawImage(images.head, -images.head.width * scale / 2, -images.head.height * scale / 2, images.head.width * scale, images.head.height * scale);
}

function update(timestamp) {
    if (!lastDecisionTime) lastDecisionTime = timestamp;

    // Hiệu ứng "nhấc lên" và "thả xuống" (lerp physics)
    const targetLift = isDragging ? 80 : 0; // Nhấc cao lên 80 pixel
    liftHeight += (targetLift - liftHeight) * 0.2; // Tốc độ rơi/nhấc

    if (!isDragging) {
        // AI di chuyển tự động (chỉ chạy khi KHÔNG bị nhấc)
        if (timestamp - lastDecisionTime >= decisionInterval) {
            isMoving = Math.random() < 0.5;
            if (Math.random() < 0.5) {
                const randomDir = directions[Math.floor(Math.random() * directions.length)];
                vx = randomDir.vx;
                vy = randomDir.vy;
            }
            lastDecisionTime = timestamp;
        }

        if (isMoving) {
            const length = Math.hypot(vx, vy);
            wormX += (vx / length) * speed;
            wormY += (vy / length) * speed;
            walkCycle += 0.15; // Nhịp đi nhanh
        } else {
            walkCycle += 0.05; // Thở nhẹ
        }

        // Kiểm tra chạm biên (chỉ bật khi không bị nhấc)
        const padding = (images.body.width * scale) / 2;
        if (wormX > gameWidth - padding) { wormX = gameWidth - padding; vx *= -1; }
        else if (wormX < padding) { wormX = padding; vx *= -1; }

        if (wormY > gameHeight - padding) { wormY = gameHeight - padding; vy *= -1; }
        else if (wormY < padding) { wormY = padding; vy *= -1; }

    } else {
        // KHI BỊ NHẤC LÊN: Nằm im không nhúc nhích
        // (Bỏ phần giãy giụa để khỏi bị lú)
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (vx > 0) facingX = -1;
    else if (vx < 0) facingX = 1;

    // Co bóp thân sâu
    // Khi bị nhấc lên, sẽ ép biên độ co bóp về 0 để con sâu duỗi thẳng nằm im
    const squashAmplitude = isDragging ? 0 : (isMoving ? 0.15 : 0.03); 
    const stretchWave = Math.abs(Math.sin(walkCycle)) * squashAmplitude;
    
    let scaleX = 1;
    let scaleY = 1;

    // Nếu đang bị kéo thả, giãn theo hướng bất kỳ (ví dụ giãn dọc) để nhìn buồn cười
    if (vx === 0 || isDragging) {
        scaleX = 1 - stretchWave * 0.5;
        scaleY = 1 + stretchWave;
    } else {
        scaleX = 1 + stretchWave;
        scaleY = 1 - stretchWave * 0.5;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // === VẼ BÓNG ===
    ctx.save();
    const shadowYOffset = 40; 
    const shadowXOffset = facingX * 10; 

    // Bóng ở lại trên mặt đất (không cộng liftHeight)
    ctx.translate(wormX + shadowXOffset, wormY + shadowYOffset);
    
    // Khi nhấc lên cao, bóng thu nhỏ lại và mờ nhòe đi
    const shadowPopScale = 1 - (liftHeight / 80) * 0.6; // Thu nhỏ tới 60%
    ctx.scale(scaleX * shadowPopScale, 1 * shadowPopScale);

    ctx.beginPath();
    const shadowRx = (images.body.width * scale) * 0.7 / 3; 
    const shadowRy = (images.body.width * scale) * 0.25 / 3; 
    ctx.ellipse(0, 2, shadowRx, shadowRy, 0, 0, Math.PI * 2);

    // Mờ đi và nhòe hơn tùy độ cao nhấc
    ctx.fillStyle = `rgba(0, 0, 0, ${0.3 * (1 - (liftHeight/80)*0.8)})`;
    ctx.filter = `blur(${1 + (liftHeight/80)*8}px)`; 
    ctx.fill();
    ctx.restore();

    // === VẼ CON SÂU CHÍNH ===
    ctx.save();
    // Thân sâu bị nhấc lên không trung (trừ đi liftHeight)
    ctx.translate(wormX, wormY - liftHeight);
    
    // Khi nhấc lên, con sâu trông to ra một chút do lại gần camera
    const wormPopScale = 1 + (liftHeight / 80) * 0.2; 
    ctx.scale(facingX * scaleX * wormPopScale, scaleY * wormPopScale);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    drawWormParts();
    ctx.restore();

    ctx.restore();
    requestAnimationFrame(update);
}
