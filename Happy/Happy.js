document.addEventListener('DOMContentLoaded', function() {
    const c = document.getElementById('c');
    const audio = document.getElementById('birthday-audio');
    const instruction = document.getElementById('instruction');
    
    let w = c.width = window.innerWidth;
    let h = c.height = window.innerHeight;
    let ctx = c.getContext('2d');

    let hw = w / 2;
    let hh = h / 2;

    const opts = {
        strings: ['HAPPY BIRTHDAY TO YOU!'],
        charSize: 30,
        charSpacing: 35,
        lineHeight: 40,
        fireworkPrevPoints: 10,
        fireworkBaseLineWidth: 5,
        fireworkAddedLineWidth: 8,
        fireworkSpawnTime: 200,
        fireworkBaseReachTime: 30,
        fireworkAddedReachTime: 30,
        fireworkCircleBaseSize: 20,
        fireworkCircleAddedSize: 10,
        fireworkCircleBaseTime: 30,
        fireworkCircleAddedTime: 30,
        fireworkCircleFadeBaseTime: 10,
        fireworkCircleFadeAddedTime: 5,
        fireworkBaseShards: 5,
        fireworkAddedShards: 5,
        fireworkShardPrevPoints: 3,
        fireworkShardBaseVel: 4,
        fireworkShardAddedVel: 2,
        fireworkShardBaseSize: 3,
        fireworkShardAddedSize: 3,
        gravity: .1,
        upFlow: -.1,
        letterContemplatingWaitTime: 360,
        balloonSpawnTime: 20,
        balloonBaseInflateTime: 10,
        balloonAddedInflateTime: 10,
        balloonBaseSize: 20,
        balloonAddedSize: 20,
        balloonBaseVel: .4,
        balloonAddedVel: .4,
        balloonBaseRadian: -(Math.PI / 2 - .5),
        balloonAddedRadian: -1,
    };

    const Tau = Math.PI * 2;
    const TauQuarter = Tau / 4;
    let letters = [];

    // --- LOGIKA AUDIO (FIXED) ---
    async function playMusic() {
        try {
            await audio.play();
            if (instruction) instruction.style.opacity = "0"; // Sembunyikan teks instruksi
            // Hapus listener agar tidak dijalankan berkali-kali
            window.removeEventListener('click', playMusic);
            window.removeEventListener('touchstart', playMusic);
            window.removeEventListener('keydown', playMusic);
        } catch (err) {
            console.log("Menunggu interaksi...");
        }
    }

    window.addEventListener('click', playMusic);
    window.addEventListener('touchstart', playMusic);
    window.addEventListener('keydown', playMusic);

    // --- LOGIKA ANIMASI ---
    function Letter(char, x, y) {
        this.char = char;
        this.x = x;
        this.y = y;
        this.dx = -ctx.measureText(char).width / 2;
        this.dy = +opts.charSize / 2;
        this.fireworkDy = this.y - hh;
        let hue = (x + (opts.charSpacing * opts.strings[0].length)/2) / (opts.charSpacing * opts.strings[0].length) * 360;
        this.color = `hsl(${hue},80%,50%)`;
        this.lightAlphaColor = `hsla(${hue},80%,light%,alp)`;
        this.lightColor = `hsl(${hue},80%,light%)`;
        this.alphaColor = `hsla(${hue},80%,50%,alp)`;
        this.reset();
    }

    Letter.prototype.reset = function() {
        this.phase = 'firework';
        this.tick = 0;
        this.spawned = false;
        this.spawningTime = opts.fireworkSpawnTime * Math.random() | 0;
        this.reachTime = opts.fireworkBaseReachTime + opts.fireworkAddedReachTime * Math.random() | 0;
        this.lineWidth = opts.fireworkBaseLineWidth + opts.fireworkAddedLineWidth * Math.random();
        this.prevPoints = [[0, hh, 0]];
    };

    Letter.prototype.step = function() {
        if (this.phase === 'firework') {
            if (!this.spawned) {
                if (++this.tick >= this.spawningTime) { this.tick = 0; this.spawned = true; }
            } else {
                ++this.tick;
                let lin = this.tick / this.reachTime,
                    arm = Math.sin(lin * TauQuarter),
                    px = lin * this.x,
                    py = hh + arm * this.fireworkDy;

                if (this.prevPoints.length > opts.fireworkPrevPoints) this.prevPoints.shift();
                this.prevPoints.push([px, py, lin * this.lineWidth]);

                for (let i = 1; i < this.prevPoints.length; ++i) {
                    ctx.strokeStyle = this.alphaColor.replace('alp', i / this.prevPoints.length);
                    ctx.lineWidth = this.prevPoints[i][2] * (1 / (this.prevPoints.length - 1)) * i;
                    ctx.beginPath();
                    ctx.moveTo(this.prevPoints[i][0], this.prevPoints[i][1]);
                    ctx.lineTo(this.prevPoints[i-1][0], this.prevPoints[i-1][1]);
                    ctx.stroke();
                }
                if (this.tick >= this.reachTime) this.setupContemplate();
            }
        } else if (this.phase === 'contemplate') {
            this.renderContemplate();
        } else if (this.phase === 'balloon') {
            this.renderBalloon();
        }
    };

    Letter.prototype.setupContemplate = function() {
        this.phase = 'contemplate';
        this.circleFinalSize = opts.fireworkCircleBaseSize + opts.fireworkCircleAddedSize * Math.random();
        this.circleCompleteTime = opts.fireworkCircleBaseTime + opts.fireworkCircleAddedTime * Math.random() | 0;
        this.circleCreating = true;
        this.circleFadeTime = opts.fireworkCircleFadeBaseTime + opts.fireworkCircleFadeAddedTime * Math.random() | 0;
        this.tick = 0; this.tick2 = 0;
        this.shards = [];
        let shardCount = opts.fireworkBaseShards + opts.fireworkAddedShards * Math.random() | 0;
        let angle = Tau / shardCount;
        for (let i = 0; i < shardCount; ++i) {
            this.shards.push(new Shard(this.x, this.y, Math.cos(angle * i), Math.sin(angle * i), this.alphaColor));
        }
    };

    Letter.prototype.renderContemplate = function() {
        this.tick++;
        if (this.circleCreating) {
            this.tick2++;
            let prop = this.tick2 / this.circleCompleteTime;
            let arm = -Math.cos(prop * Math.PI) / 2 + .5;
            ctx.beginPath();
            ctx.fillStyle = this.lightAlphaColor.replace('light', 50 + 50 * prop).replace('alp', prop);
            ctx.arc(this.x, this.y, arm * this.circleFinalSize, 0, Tau);
            ctx.fill();
            if (this.tick2 > this.circleCompleteTime) { this.tick2 = 0; this.circleCreating = false; this.circleFading = true; }
        } else {
            ctx.fillStyle = this.lightColor.replace('light', 70);
            ctx.fillText(this.char, this.x + this.dx, this.y + this.dy);
        }

        for (let i = 0; i < this.shards.length; ++i) {
            this.shards[i].step();
            if (!this.shards[i].alive) { this.shards.splice(i, 1); i--; }
        }
        if (this.tick > opts.letterContemplatingWaitTime) this.setupBalloon();
    };

    Letter.prototype.setupBalloon = function() {
        this.phase = 'balloon'; this.tick = 0; this.spawning = true;
        this.spawnTime = opts.balloonSpawnTime * Math.random() | 0;
        this.inflateTime = opts.balloonBaseInflateTime + opts.balloonAddedInflateTime * Math.random() | 0;
        this.size = opts.balloonBaseSize + opts.balloonAddedSize * Math.random() | 0;
        let rad = opts.balloonBaseRadian + opts.balloonAddedRadian * Math.random();
        let vel = opts.balloonBaseVel + opts.balloonAddedVel * Math.random();
        this.vx = Math.cos(rad) * vel; this.vy = Math.sin(rad) * vel;
    };

    Letter.prototype.renderBalloon = function() {
        if (this.spawning) {
            if (++this.tick >= this.spawnTime) { this.tick = 0; this.spawning = false; this.inflating = true; }
            ctx.fillStyle = this.lightColor.replace('light', 70);
            ctx.fillText(this.char, this.x + this.dx, this.y + this.dy);
        } else if (this.inflating) {
            this.tick++;
            let prop = this.tick / this.inflateTime;
            this.cx = this.x; this.cy = this.y - this.size * prop;
            ctx.fillStyle = this.alphaColor.replace('alp', prop);
            ctx.beginPath(); generateBalloonPath(this.cx, this.cy, this.size * prop); ctx.fill();
            ctx.fillStyle = this.lightColor.replace('light', 70);
            ctx.fillText(this.char, this.x + this.dx, this.y + this.dy);
            if (this.tick >= this.inflateTime) { this.tick = 0; this.inflating = false; }
        } else {
            this.cx += this.vx; this.cy += this.vy += opts.upFlow;
            ctx.fillStyle = this.color;
            ctx.beginPath(); generateBalloonPath(this.cx, this.cy, this.size); ctx.fill();
            ctx.fillStyle = this.lightColor.replace('light', 70);
            ctx.fillText(this.char, this.cx + this.dx, this.cy + this.dy + this.size);
            if (this.cy + this.size < -hh || this.cx < -hw || this.cx > hw) this.phase = 'done';
        }
    };

    function Shard(x, y, vx, vy, color) {
        let vel = opts.fireworkShardBaseVel + opts.fireworkShardAddedVel * Math.random();
        this.vx = vx * vel; this.vy = vy * vel;
        this.x = x; this.y = y;
        this.prevPoints = [[x, y]];
        this.color = color; this.alive = true;
        this.size = opts.fireworkShardBaseSize + opts.fireworkShardAddedSize * Math.random();
    }

    Shard.prototype.step = function() {
        this.x += this.vx; this.y += this.vy += opts.gravity;
        if (this.prevPoints.length > opts.fireworkShardPrevPoints) this.prevPoints.shift();
        this.prevPoints.push([this.x, this.y]);
        for (let k = 0; k < this.prevPoints.length - 1; ++k) {
            ctx.strokeStyle = this.color.replace('alp', k / this.prevPoints.length);
            ctx.lineWidth = k * (this.size / this.prevPoints.length);
            ctx.beginPath(); ctx.moveTo(this.prevPoints[k][0], this.prevPoints[k][1]);
            ctx.lineTo(this.prevPoints[k+1][0], this.prevPoints[k+1][1]); ctx.stroke();
        }
        if (this.prevPoints[0][1] > hh) this.alive = false;
    };

    function generateBalloonPath(x, y, size) {
        ctx.moveTo(x, y);
        ctx.bezierCurveTo(x - size / 2, y - size / 2, x - size / 4, y - size, x, y - size);
        ctx.bezierCurveTo(x + size / 4, y - size, x + size / 2, y - size / 2, x, y);
    }

    function anim() {
        window.requestAnimationFrame(anim);
        ctx.fillStyle = '#111'; ctx.fillRect(0, 0, w, h);
        ctx.save(); ctx.translate(hw, hh);
        let done = true;
        for (let l = 0; l < letters.length; l++) {
            letters[l].step();
            if (letters[l].phase !== 'done') done = false;
        }
        if (done) { for (let l = 0; l < letters.length; l++) letters[l].reset(); }
        ctx.restore();
    }

    // Inisialisasi Huruf
    let totalStrWidth = opts.strings[0].length * opts.charSpacing;
    for (let j = 0; j < opts.strings[0].length; j++) {
        letters.push(new Letter(
            opts.strings[0][j],
            j * opts.charSpacing + opts.charSpacing / 2 - totalStrWidth / 2,
            opts.lineHeight / 2
        ));
    }

    ctx.font = opts.charSize + 'px Verdana';
    anim();

    window.addEventListener('resize', function() {
        w = c.width = window.innerWidth; h = c.height = window.innerHeight;
        hw = w / 2; hh = h / 2;
        ctx.font = opts.charSize + 'px Verdana';
    });
});
