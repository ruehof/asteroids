// ship.js — Spieler-Schiff

import { wrapPosition } from './utils.js';

const ROTATION_SPEED = 0.07;
const THRUST_POWER = 0.12;
const FRICTION = 0.99;
const MAX_SPEED = 6;
const SHIP_SIZE = 18;
const INVULNERABLE_TIME = 3000;
const BLINK_RATE = 100;

export class Ship {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.angle = -Math.PI / 2; // pointing up
        this.radius = SHIP_SIZE;
        this.thrusting = false;
        this.alive = true;
        this.invulnerable = false;
        this.invulnerableTimer = 0;
        this.invulnerableStart = 0;
    }

    makeInvulnerable() {
        this.invulnerable = true;
        this.invulnerableStart = performance.now();
    }

    update(input, canvas) {
        // Rotation
        if (input.isDown('ArrowLeft')) this.angle -= ROTATION_SPEED;
        if (input.isDown('ArrowRight')) this.angle += ROTATION_SPEED;

        // Thrust
        this.thrusting = input.isDown('ArrowUp');
        if (this.thrusting) {
            this.vx += Math.cos(this.angle) * THRUST_POWER;
            this.vy += Math.sin(this.angle) * THRUST_POWER;
        }

        // Friction
        this.vx *= FRICTION;
        this.vy *= FRICTION;

        // Speed limit
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > MAX_SPEED) {
            this.vx = (this.vx / speed) * MAX_SPEED;
            this.vy = (this.vy / speed) * MAX_SPEED;
        }

        // Move
        this.x += this.vx;
        this.y += this.vy;

        // Wrap
        wrapPosition(this, canvas);

        // Invulnerability timer
        if (this.invulnerable) {
            if (performance.now() - this.invulnerableStart > INVULNERABLE_TIME) {
                this.invulnerable = false;
            }
        }
    }

    draw(ctx) {
        // Blink when invulnerable
        if (this.invulnerable) {
            if (Math.floor((performance.now() - this.invulnerableStart) / BLINK_RATE) % 2 === 0) {
                return;
            }
        }

        const s = SHIP_SIZE;
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);

        // Ship points (triangle)
        const nose = { x: this.x + cos * s, y: this.y + sin * s };
        const left = { x: this.x + Math.cos(this.angle + 2.3) * s * 0.8, y: this.y + Math.sin(this.angle + 2.3) * s * 0.8 };
        const right = { x: this.x + Math.cos(this.angle - 2.3) * s * 0.8, y: this.y + Math.sin(this.angle - 2.3) * s * 0.8 };
        const back = { x: this.x - cos * s * 0.3, y: this.y - sin * s * 0.3 };

        ctx.save();

        // Neon glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#0ff';
        ctx.strokeStyle = '#0ff';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';

        // Draw ship
        ctx.beginPath();
        ctx.moveTo(nose.x, nose.y);
        ctx.lineTo(left.x, left.y);
        ctx.lineTo(back.x, back.y);
        ctx.lineTo(right.x, right.y);
        ctx.closePath();
        ctx.stroke();

        // Thrust flame
        if (this.thrusting) {
            const flameLen = s * (0.6 + Math.random() * 0.4);
            const flameX = this.x - cos * flameLen;
            const flameY = this.y - sin * flameLen;

            ctx.shadowColor = '#f80';
            ctx.strokeStyle = '#f80';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(left.x * 0.7 + back.x * 0.3, left.y * 0.7 + back.y * 0.3);
            ctx.lineTo(flameX, flameY);
            ctx.lineTo(right.x * 0.7 + back.x * 0.3, right.y * 0.7 + back.y * 0.3);
            ctx.stroke();
        }

        ctx.restore();
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.angle = -Math.PI / 2;
        this.alive = true;
        this.makeInvulnerable();
    }
}
