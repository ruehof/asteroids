// bullet.js — Projektile

import { wrapPosition } from './utils.js';

const BULLET_SPEED = 8;
const BULLET_LIFETIME = 60; // frames

export class Bullet {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * BULLET_SPEED;
        this.vy = Math.sin(angle) * BULLET_SPEED;
        this.radius = 3;
        this.life = BULLET_LIFETIME;
        this.alive = true;
    }

    update(canvas) {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        if (this.life <= 0) this.alive = false;
        wrapPosition(this, canvas);
    }

    draw(ctx) {
        ctx.save();
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#ffa';
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();

        // Trail
        ctx.shadowBlur = 6;
        ctx.strokeStyle = 'rgba(255, 255, 200, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.vx * 0.5, this.y - this.vy * 0.5);
        ctx.stroke();
        ctx.restore();
    }
}
