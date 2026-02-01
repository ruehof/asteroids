// asteroid.js — Asteroiden

import { wrapPosition, randomRange } from './utils.js';

const SIZE_CONFIG = {
    large:  { radius: 50, speed: 1.0, score: 20,  color: '#f0f', children: 'medium' },
    medium: { radius: 28, speed: 1.8, score: 50,  color: '#f80', children: 'small' },
    small:  { radius: 14, speed: 2.5, score: 100, color: '#0f0', children: null },
};

export class Asteroid {
    constructor(x, y, size) {
        this.size = size;
        const cfg = SIZE_CONFIG[size];
        this.x = x;
        this.y = y;
        this.radius = cfg.radius + randomRange(-5, 5);
        this.score = cfg.score;
        this.color = cfg.color;
        this.childSize = cfg.children;
        this.alive = true;

        const angle = randomRange(0, Math.PI * 2);
        const speed = cfg.speed * randomRange(0.7, 1.3);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        this.rotation = 0;
        this.rotSpeed = randomRange(-0.02, 0.02);

        // Generate jagged shape
        this.vertices = [];
        const numVerts = Math.floor(randomRange(7, 12));
        for (let i = 0; i < numVerts; i++) {
            const a = (i / numVerts) * Math.PI * 2;
            const r = this.radius * randomRange(0.7, 1.0);
            this.vertices.push({ angle: a, dist: r });
        }
    }

    update(canvas) {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotSpeed;
        wrapPosition(this, canvas);
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        ctx.shadowBlur = 12;
        ctx.shadowColor = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;

        ctx.beginPath();
        for (let i = 0; i < this.vertices.length; i++) {
            const v = this.vertices[i];
            const px = Math.cos(v.angle) * v.dist;
            const py = Math.sin(v.angle) * v.dist;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();

        ctx.restore();
    }

    split() {
        if (!this.childSize) return [];
        return [
            new Asteroid(this.x, this.y, this.childSize),
            new Asteroid(this.x, this.y, this.childSize),
        ];
    }
}

export function spawnAsteroid(canvas) {
    // Spawn from edge
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    switch (edge) {
        case 0: x = 0; y = randomRange(0, canvas.height); break;
        case 1: x = canvas.width; y = randomRange(0, canvas.height); break;
        case 2: x = randomRange(0, canvas.width); y = 0; break;
        default: x = randomRange(0, canvas.width); y = canvas.height; break;
    }
    return new Asteroid(x, y, 'large');
}
