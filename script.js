const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let dpr = window.devicePixelRatio || 1;
let gameWidth = window.innerWidth;
let gameHeight = window.innerHeight;

// --- QUẢN LÝ TÀI KHOẢN ---
let currentAccountId = null;

function initializeAccount() {
    const stored = localStorage.getItem('accounts');
    const accounts = stored ? JSON.parse(stored) : [];

    if (accounts.length === 0) {
        const newId = Date.now().toString();
        accounts.push({ id: newId, name: 'Account 1' });
        localStorage.setItem('accounts', JSON.stringify(accounts));
        currentAccountId = newId;
    } else {
        const lastAccountId = localStorage.getItem('lastAccount');
        currentAccountId = lastAccountId || accounts[0].id;
    }

    localStorage.setItem('lastAccount', currentAccountId);
    updateAccountSelect();
}

function updateAccountSelect() {
    const stored = localStorage.getItem('accounts');
    const accounts = stored ? JSON.parse(stored) : [];
    const select = document.getElementById('accountSelect');

    select.innerHTML = '';
    accounts.forEach(acc => {
        const option = document.createElement('option');
        option.value = acc.id;
        option.textContent = acc.name;
        if (acc.id === currentAccountId) option.selected = true;
        select.appendChild(option);
    });
}

function switchAccount(accountId) {
    currentAccountId = accountId;
    localStorage.setItem('lastAccount', accountId);
    loadWormsFromStorage();
    worms = [];
    eggs = [];
    selectedWorm = null;
}

function createNewAccount() {
    const stored = localStorage.getItem('accounts');
    const accounts = stored ? JSON.parse(stored) : [];
    const count = accounts.length + 1;
    const newId = Date.now().toString();

    accounts.push({ id: newId, name: `Account ${count}` });
    localStorage.setItem('accounts', JSON.stringify(accounts));

    switchAccount(newId);
    updateAccountSelect();
}

function saveWormsToStorage() {
    if (!currentAccountId) return;

    const wormsData = worms.map(w => ({
        name: w.name,
        genes: w.genes,
        x: w.x,
        y: w.y
    }));

    localStorage.setItem(`worms_${currentAccountId}`, JSON.stringify(wormsData));
}

function loadWormsFromStorage() {
    if (!currentAccountId) return [];

    const stored = localStorage.getItem(`worms_${currentAccountId}`);
    if (!stored) return [];

    const wormsData = JSON.parse(stored);
    worms = wormsData.map(data => {
        const w = new Worm(data.genes);
        w.x = data.x;
        w.y = data.y;
        return w;
    });
}

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

// Tải các ảnh bộ phận - lưu tất cả variants
const imageVariants = {
    head: {},
    body: {},
    tail: {}
};
const images = {
    shadow: new Image(),
    hole: new Image(),
    egg: new Image(),
    eggShadow: new Image()
};

const variants = ['normal', 'car', 'pirate', 'wizard'];

let loadedCount = 0;
const totalImages = variants.length * 3 + 4; // 3 parts * variants + shadow + hole + egg + eggShadow

function checkLoad() {
    loadedCount++;
    if (loadedCount === totalImages) {
        initializeAccount();

        loadWormsFromStorage();
        if (worms.length === 0) {
            worms = [new Worm()];
        }

        updateWormList();
        requestAnimationFrame(update);

        setInterval(() => {
            eggs.push(new Egg(worms[0].genes));
        }, 20000);
    }
}

images.shadow.onload = checkLoad;
images.hole.onload = checkLoad;
images.egg.onload = checkLoad;
images.eggShadow.onload = checkLoad;
images.shadow.src = 'sâu/another/shadow.png';
images.hole.src = 'sâu/another/hole.png';
images.egg.src = 'sâu/egg/egg nor.png';
images.eggShadow.src = 'sâu/egg/shadow egg.png';

variants.forEach(variant => {
    imageVariants.head[variant] = new Image();
    imageVariants.body[variant] = new Image();
    imageVariants.tail[variant] = new Image();

    imageVariants.head[variant].onload = checkLoad;
    imageVariants.body[variant].onload = checkLoad;
    imageVariants.tail[variant].onload = checkLoad;

    imageVariants.head[variant].src = `sâu/head/${variant}.png`;
    imageVariants.body[variant].src = `sâu/body/${variant}.png`;
    imageVariants.tail[variant].src = `sâu/tail/${variant}.png`;
});

const speed = 1.5;
const scale = 0.1;

const directions = [
    { vx: 1, vy: 0 }, { vx: 1, vy: 1 }, { vx: 0, vy: 1 }, { vx: -1, vy: 1 },
    { vx: -1, vy: 0 }, { vx: -1, vy: -1 }, { vx: 0, vy: -1 }, { vx: 1, vy: -1 }
];

const decisionInterval = 1000;

// --- QUẢN LÝ NHIỀU CON SÂU ---
let worms = [];
let eggs = [];
let draggedWorm = null;
let selectedWorm = null;
const holeX = gameWidth / 2;
const holeY = gameHeight / 2;
const holeRadius = 50;

function updateWormList() {
    const wormList = document.getElementById('wormList');
    wormList.innerHTML = '';

    worms.forEach((worm, index) => {
        const li = document.createElement('li');
        const isPure = worm.name !== 'sâu lai';

        li.innerHTML = `<span style="color: ${isPure ? '#9c27b0' : '#333'}; font-weight: ${isPure ? 'bold' : 'normal'}">${worm.name}</span> #${index + 1}`;
        li.dataset.index = index;

        if (selectedWorm === worm) {
            li.classList.add('active');
        }

        li.addEventListener('click', () => {
            selectedWorm = worm;
            updateWormList();
            showGeneInfo(worm);
        });

        wormList.appendChild(li);
    });

    if (worms.length === 0) {
        const geneInfo = document.getElementById('geneInfo');
        geneInfo.innerHTML = '<p>Không có sâu nào</p>';
    }
}

function showGeneInfo(worm) {
    const geneInfo = document.getElementById('geneInfo');
    geneInfo.innerHTML = `
        <h4>Thông tin gen</h4>
        <p><strong>Đầu:</strong> ${worm.genes.head}</p>
        <p><strong>Thân:</strong> ${worm.genes.body}</p>
        <p><strong>Đuôi:</strong> ${worm.genes.tail}</p>
        <p><strong>Màu:</strong> RGB(${Math.round(worm.genes.color[0])}, ${Math.round(worm.genes.color[1])}, ${Math.round(worm.genes.color[2])})</p>
        <p><strong>Vị trí:</strong> (${Math.round(worm.x)}, ${Math.round(worm.y)})</p>
    `;
}

class Worm {
    constructor(parentGenes = null) {
        this.genes = parentGenes ? this.mutate(parentGenes) : this.randomGenes();
        this.name = this.getWormName();
        this.x = Math.random() * gameWidth;
        this.y = Math.random() * gameHeight;
        this.vx = -1;
        this.vy = 0;
        this.facingX = 1;
        this.isMoving = true;
        this.lastDecisionTime = 0;
        this.walkCycle = 0;
        this.isDragging = false;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.liftHeight = 0;
    }

    getWormName() {
        const { head, body, tail } = this.genes;
        if (head === body && body === tail) {
            return head; // Normal, Wizard, etc.
        }
        return 'sâu lai'; // Hybrid
    }

    randomGenes() {
        return {
            head: 'normal',
            body: 'normal',
            tail: 'normal',
            color: [255, 255, 255]
        };
    }

    mutatePart(parentVariant) {
        if (Math.random() < 0.4) {
            const otherVariants = variants.filter(v => v !== parentVariant);
            return otherVariants[Math.floor(Math.random() * otherVariants.length)];
        }
        return parentVariant;
    }

    mutate(parentGenes) {
        return {
            head: this.mutatePart(parentGenes.head),
            body: this.mutatePart(parentGenes.body),
            tail: this.mutatePart(parentGenes.tail),
            color: [
                Math.max(0, Math.min(255, parentGenes.color[0] + (Math.random() - 0.5) * 50)),
                Math.max(0, Math.min(255, parentGenes.color[1] + (Math.random() - 0.5) * 50)),
                Math.max(0, Math.min(255, parentGenes.color[2] + (Math.random() - 0.5) * 50))
            ]
        };
    }

    update(timestamp) {
        if (!this.lastDecisionTime) this.lastDecisionTime = timestamp;

        const targetLift = this.isDragging ? 80 : 0;
        this.liftHeight += (targetLift - this.liftHeight) * 0.2;

        if (!this.isDragging) {
            if (timestamp - this.lastDecisionTime >= decisionInterval) {
                this.isMoving = Math.random() < 0.5;
                if (Math.random() < 0.5) {
                    const randomDir = directions[Math.floor(Math.random() * directions.length)];
                    this.vx = randomDir.vx;
                    this.vy = randomDir.vy;
                }
                this.lastDecisionTime = timestamp;
            }

            if (this.isMoving) {
                const length = Math.hypot(this.vx, this.vy);
                this.x += (this.vx / length) * speed;
                this.y += (this.vy / length) * speed;
                this.walkCycle += 0.15;
            } else {
                this.walkCycle += 0.05;
            }

            const padding = (imageVariants.body[this.genes.body].width * scale) / 2;
            if (this.x > gameWidth - padding) { this.x = gameWidth - padding; this.vx *= -1; }
            else if (this.x < padding) { this.x = padding; this.vx *= -1; }

            if (this.y > gameHeight - padding) { this.y = gameHeight - padding; this.vy *= -1; }
            else if (this.y < padding) { this.y = padding; this.vy *= -1; }
        }

        if (this.vx > 0) this.facingX = -1;
        else if (this.vx < 0) this.facingX = 1;
    }

    draw() {
        const headImg = imageVariants.head[this.genes.head];
        const bodyImg = imageVariants.body[this.genes.body];
        const tailImg = imageVariants.tail[this.genes.tail];

        const squashAmplitude = this.isDragging ? 0 : (this.isMoving ? 0.15 : 0.03);
        const stretchWave = Math.abs(Math.sin(this.walkCycle)) * squashAmplitude;

        let scaleX = 1;
        let scaleY = 1;

        if (this.vx === 0 || this.isDragging) {
            scaleX = 1 - stretchWave * 0.5;
            scaleY = 1 + stretchWave;
        } else {
            scaleX = 1 + stretchWave;
            scaleY = 1 - stretchWave * 0.5;
        }

        ctx.save();
        const shadowYOffset = 1;
        const shadowXOffset = this.facingX * 1;

        ctx.translate(this.x + shadowXOffset, this.y + shadowYOffset);

        const shadowPopScale = 1 - (this.liftHeight / 80) * 0.2;
        ctx.scale(this.facingX * scaleX * shadowPopScale, scaleY * shadowPopScale);

        ctx.globalAlpha = 1 - (this.liftHeight / 80) * 0.5;
        ctx.drawImage(
            images.shadow,
            -images.shadow.width * scale / 2,
            -images.shadow.height * scale / 2,
            images.shadow.width * scale,
            images.shadow.height * scale
        );
        ctx.restore();

        ctx.save();
        ctx.translate(this.x, this.y - this.liftHeight);

        const wormPopScale = 1 + (this.liftHeight / 80) * 0.2;
        ctx.scale(this.facingX * scaleX * wormPopScale, scaleY * wormPopScale);

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(tailImg, -tailImg.width * scale / 2, -tailImg.height * scale / 2, tailImg.width * scale, tailImg.height * scale);
        ctx.drawImage(bodyImg, -bodyImg.width * scale / 2, -bodyImg.height * scale / 2, bodyImg.width * scale, bodyImg.height * scale);
        ctx.drawImage(headImg, -headImg.width * scale / 2, -headImg.height * scale / 2, headImg.width * scale, headImg.height * scale);
        ctx.restore();
    }
}

class Egg {
    constructor(parentGenes) {
        this.genes = new Worm(parentGenes).genes;
        this.x = Math.random() * gameWidth;
        this.y = Math.random() * gameHeight;
        this.createdTime = performance.now();
        this.rotation = 0;
        this.isDragging = false;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.liftHeight = 0;
    }

    update(timestamp) {
        const elapsedTime = timestamp - this.createdTime;
        const targetLift = this.isDragging ? 80 : 0;
        this.liftHeight += (targetLift - this.liftHeight) * 0.2;

        // Bắt đầu xoay sau 5 giây, lặp lại mỗi 4s
        if (elapsedTime > 5000) {
            const cycleTime = (elapsedTime - 5000) % 4000; // 0-4000ms loop

            if (cycleTime < 1000) {
                // Xoay trong 1s
                const rotateProgress = cycleTime / 1000; // 0 to 1

                if (rotateProgress < 1/3) {
                    // 0-333ms: xoay sang trái -10°
                    this.rotation = -(rotateProgress * 3) * 10;
                } else if (rotateProgress < 2/3) {
                    // 333-667ms: xoay sang phải +20°
                    const midProgress = (rotateProgress - 1/3) * 3;
                    this.rotation = -10 + midProgress * 30;
                } else {
                    // 667-1000ms: xoay lại -10°
                    const endProgress = (rotateProgress - 2/3) * 3;
                    this.rotation = 20 - endProgress * 30;
                }
            } else {
                // Nghỉ 3s
                this.rotation = 0;
            }
        }

        return 'alive';
    }

    draw() {
        ctx.save();
        const shadowYOffset = 1;
        const shadowXOffset = 1;

        ctx.translate(this.x + shadowXOffset, this.y + shadowYOffset);

        const shadowPopScale = 1 - (this.liftHeight / 80) * 0.2;
        ctx.scale(shadowPopScale, shadowPopScale);

        ctx.globalAlpha = 1 - (this.liftHeight / 80) * 0.5;
        ctx.drawImage(
            images.eggShadow,
            -images.eggShadow.width * scale / 2,
            -images.eggShadow.height * scale / 2,
            images.eggShadow.width * scale,
            images.eggShadow.height * scale
        );
        ctx.restore();

        ctx.save();
        ctx.translate(this.x, this.y - this.liftHeight);
        ctx.rotate((this.rotation * Math.PI) / 180); // Convert degrees to radians

        const wormPopScale = 1 + (this.liftHeight / 80) * 0.2;
        ctx.scale(wormPopScale, wormPopScale);

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(
            images.egg,
            -images.egg.width * scale / 2,
            -images.egg.height * scale / 2,
            images.egg.width * scale,
            images.egg.height * scale
        );
        ctx.restore();
    }
}

function getMousePos(e) {
    if (e.touches && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
}

function handleDown(e) {
    const pos = getMousePos(e);

    // Check eggs first
    for (let egg of eggs) {
        const eggX = egg.x;
        const eggY = egg.y - egg.liftHeight;

        const hitRadius = (images.egg.width * scale) * 1.5;
        const dist = Math.hypot(pos.x - eggX, pos.y - eggY);

        if (dist < hitRadius) {
            egg.isDragging = true;
            egg.dragOffsetX = egg.x - pos.x;
            egg.dragOffsetY = (egg.y - egg.liftHeight) - pos.y;
            return;
        }
    }

    // Check worms
    for (let worm of worms) {
        const bodyX = worm.x;
        const bodyY = worm.y - worm.liftHeight;

        const hitRadius = (imageVariants.body[worm.genes.body].width * scale) * 1.5;
        const dist = Math.hypot(pos.x - bodyX, pos.y - bodyY);

        if (dist < hitRadius) {
            draggedWorm = worm;
            worm.isDragging = true;
            worm.dragOffsetX = worm.x - pos.x;
            worm.dragOffsetY = (worm.y - worm.liftHeight) - pos.y;
            break;
        }
    }
}

function handleMove(e) {
    if (draggedWorm && draggedWorm.isDragging) {
        const pos = getMousePos(e);
        draggedWorm.x = pos.x + draggedWorm.dragOffsetX;
        draggedWorm.y = pos.y + draggedWorm.dragOffsetY + draggedWorm.liftHeight;
    }

    for (let egg of eggs) {
        if (egg.isDragging) {
            const pos = getMousePos(e);
            egg.x = pos.x + egg.dragOffsetX;
            egg.y = pos.y + egg.dragOffsetY + egg.liftHeight;
        }
    }
}

function handleUp(e) {
    if (draggedWorm && draggedWorm.isDragging) {
        draggedWorm.isDragging = false;
        draggedWorm.lastDecisionTime = performance.now();
        draggedWorm = null;
    }

    for (let i = eggs.length - 1; i >= 0; i--) {
        const egg = eggs[i];
        if (egg.isDragging) {
            egg.isDragging = false;
            // Hiển thị modal chúc mừng
            showHatchModal(egg);
            eggs.splice(i, 1);
        }
    }
}

function showHatchModal(egg) {
    const hatchModal = document.getElementById('hatchModal');
    const headImg = document.getElementById('hatchHead');
    const bodyImg = document.getElementById('hatchBody');
    const tailImg = document.getElementById('hatchTail');

    headImg.src = imageVariants.head[egg.genes.head].src;
    bodyImg.src = imageVariants.body[egg.genes.body].src;
    tailImg.src = imageVariants.tail[egg.genes.tail].src;

    hatchModal.classList.add('active');

    document.getElementById('hatchOkBtn').onclick = () => {
        const newWorm = new Worm(egg.genes);
        newWorm.x = egg.x;
        newWorm.y = egg.y;
        worms.push(newWorm);
        updateWormList();
        saveWormsToStorage();
        hatchModal.classList.remove('active');
    };
}

canvas.addEventListener('mousedown', handleDown);
window.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleUp);

canvas.addEventListener('touchstart', handleDown, { passive: false });
window.addEventListener('touchmove', handleMove, { passive: false });
window.addEventListener('touchend', handleUp);

// --- TOGGLE MODAL ---
const modal = document.getElementById('modal');
const toggleBtn = document.getElementById('toggleBtn');
const closeBtn = document.querySelector('.close');

toggleBtn.addEventListener('click', () => {
    modal.classList.add('active');
});

closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
});

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('active');
    }
});

function update(timestamp) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(dpr, dpr);

    // Vẽ hố
    ctx.save();
    ctx.translate(holeX, holeY);
    ctx.drawImage(images.hole, -images.hole.width * scale / 2, -images.hole.height * scale / 2, images.hole.width * scale, images.hole.height * scale);
    ctx.restore();

    // Cập nhật và vẽ trứng, kiểm tra rơi vào hố
    for (let i = eggs.length - 1; i >= 0; i--) {
        const egg = eggs[i];
        egg.update(timestamp);
        const dist = Math.hypot(egg.x - holeX, egg.y - holeY);

        if (dist < holeRadius && !egg.isDragging) {
            eggs.splice(i, 1);
        } else {
            egg.draw();
        }
    }

    // Cập nhật và vẽ sâu, kiểm tra va chạm hố
    for (let i = worms.length - 1; i >= 0; i--) {
        const worm = worms[i];
        const dist = Math.hypot(worm.x - holeX, worm.y - holeY);

        if (dist < holeRadius && !worm.isDragging) {
            if (selectedWorm === worm) selectedWorm = null;
            worms.splice(i, 1);
            updateWormList();
            saveWormsToStorage();
        } else {
            worm.update(timestamp);
            worm.draw();
        }
    }

    ctx.restore();
    requestAnimationFrame(update);
}
