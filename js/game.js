// game.js — Game-Loop, Zustandsverwaltung

import { Input } from './input.js';
import { Ship } from './ship.js';
import { Bullet } from './bullet.js';
import { spawnAsteroid } from './asteroid.js';
import { ParticleSystem } from './particles.js';
import { circleCollision } from './utils.js';
import { AudioManager } from './audio.js';

const INITIAL_ASTEROIDS = 4;
const SHOOT_COOLDOWN = 10; // frames
const MAX_LIVES = 3;

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.input = new Input();
        this.particles = new ParticleSystem();
        this.audio = new AudioManager();

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.state = 'title'; // title, playing, gameover
        this.score = 0;
        this.lives = MAX_LIVES;
        this.level = 0;
        this.shootCooldown = 0;
        this.screenShake = 0;

        this.ship = new Ship(canvas.width / 2, canvas.height / 2);
        this.bullets = [];
        this.asteroids = [];

        this.loop();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    startGame() {
        this.state = 'playing';
        this.score = 0;
        this.lives = MAX_LIVES;
        this.level = 0;
        this.bullets = [];
        this.asteroids = [];
        this.ship.reset(this.canvas.width / 2, this.canvas.height / 2);
        this.nextLevel();
    }

    nextLevel() {
        this.level++;
        if (this.level > 1) this.audio.play('levelUp');
        const count = INITIAL_ASTEROIDS + (this.level - 1) * 2;
        for (let i = 0; i < count; i++) {
            this.asteroids.push(spawnAsteroid(this.canvas));
        }
    }

    loop() {
        this.update();
        this.render();
        this.input.clearJustPressed();
        requestAnimationFrame(() => this.loop());
    }

    update() {
        if (this.state === 'title') {
            if (this.input.wasPressed(' ') || this.input.wasPressed('Enter')) {
                this.startGame();
            }
            this.particles.update();
            return;
        }

        if (this.state === 'gameover') {
            if (this.input.wasPressed(' ') || this.input.wasPressed('Enter')) {
                this.startGame();
            }
            this.particles.update();
            return;
        }

        // Playing state
        this.ship.update(this.input, this.canvas);
        this.audio.setThrust(this.ship.thrusting);

        // Shooting
        if (this.shootCooldown > 0) this.shootCooldown--;
        if (this.input.isDown(' ') && this.shootCooldown <= 0) {
            const nose = {
                x: this.ship.x + Math.cos(this.ship.angle) * 18,
                y: this.ship.y + Math.sin(this.ship.angle) * 18,
            };
            this.bullets.push(new Bullet(nose.x, nose.y, this.ship.angle));
            this.shootCooldown = SHOOT_COOLDOWN;
            this.audio.play('shoot');
        }

        // Update bullets
        this.bullets.forEach(b => b.update(this.canvas));
        this.bullets = this.bullets.filter(b => b.alive);

        // Update asteroids
        this.asteroids.forEach(a => a.update(this.canvas));

        // Bullet-Asteroid collisions
        for (const bullet of this.bullets) {
            for (const asteroid of this.asteroids) {
                if (!bullet.alive || !asteroid.alive) continue;
                if (circleCollision(bullet.x, bullet.y, bullet.radius, asteroid.x, asteroid.y, asteroid.radius)) {
                    bullet.alive = false;
                    asteroid.alive = false;
                    this.score += asteroid.score;
                    this.particles.emit(asteroid.x, asteroid.y, asteroid.color, 20);
                    this.screenShake = 5;
                    this.audio.play('explosion', asteroid.size);

                    const children = asteroid.split();
                    this.asteroids.push(...children);
                }
            }
        }

        // Ship-Asteroid collisions
        if (!this.ship.invulnerable) {
            for (const asteroid of this.asteroids) {
                if (!asteroid.alive) continue;
                if (circleCollision(this.ship.x, this.ship.y, this.ship.radius * 0.6, asteroid.x, asteroid.y, asteroid.radius)) {
                    this.shipDestroyed();
                    break;
                }
            }
        }

        // Clean up dead asteroids
        this.asteroids = this.asteroids.filter(a => a.alive);

        // Next level check
        if (this.asteroids.length === 0 && this.state === 'playing') {
            this.nextLevel();
        }

        // Particles
        this.particles.update();

        // Screen shake decay
        if (this.screenShake > 0) this.screenShake *= 0.8;
        if (this.screenShake < 0.5) this.screenShake = 0;
    }

    shipDestroyed() {
        this.particles.emit(this.ship.x, this.ship.y, '#0ff', 30);
        this.particles.emit(this.ship.x, this.ship.y, '#fff', 10);
        this.screenShake = 12;
        this.audio.setThrust(false);
        this.audio.play('shipExplosion');
        this.lives--;

        if (this.lives <= 0) {
            this.state = 'gameover';
            this.audio.play('gameOver');
        } else {
            this.ship.reset(this.canvas.width / 2, this.canvas.height / 2);
        }
    }

    render() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.save();

        // Screen shake
        if (this.screenShake > 0) {
            const sx = (Math.random() - 0.5) * this.screenShake * 2;
            const sy = (Math.random() - 0.5) * this.screenShake * 2;
            ctx.translate(sx, sy);
        }

        // Clear
        ctx.fillStyle = '#000';
        ctx.fillRect(-10, -10, w + 20, h + 20);

        if (this.state === 'title') {
            this.drawTitle(ctx, w, h);
            this.particles.draw(ctx);
            ctx.restore();
            return;
        }

        // Draw game objects
        this.asteroids.forEach(a => a.draw(ctx));
        this.bullets.forEach(b => b.draw(ctx));
        if (this.state === 'playing') this.ship.draw(ctx);
        this.particles.draw(ctx);

        // HUD
        this.drawHUD(ctx, w);

        if (this.state === 'gameover') {
            this.drawGameOver(ctx, w, h);
        }

        ctx.restore();
    }

    drawTitle(ctx, w, h) {
        ctx.textAlign = 'center';

        // Title
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#f0f';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 64px monospace';
        ctx.fillText('ASTEROIDS', w / 2, h / 2 - 50);

        // Subtitle
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#0ff';
        ctx.fillStyle = '#0ff';
        ctx.font = '20px monospace';
        ctx.fillText('PRESS SPACE OR ENTER TO START', w / 2, h / 2 + 20);

        // Controls
        ctx.shadowBlur = 5;
        ctx.fillStyle = '#888';
        ctx.font = '14px monospace';
        ctx.fillText('ARROW KEYS = MOVE   |   SPACE = SHOOT', w / 2, h / 2 + 70);
    }

    drawGameOver(ctx, w, h) {
        ctx.textAlign = 'center';

        ctx.shadowBlur = 20;
        ctx.shadowColor = '#f00';
        ctx.fillStyle = '#f00';
        ctx.font = 'bold 48px monospace';
        ctx.fillText('GAME OVER', w / 2, h / 2 - 30);

        ctx.shadowBlur = 10;
        ctx.shadowColor = '#0ff';
        ctx.fillStyle = '#0ff';
        ctx.font = '20px monospace';
        ctx.fillText(`FINAL SCORE: ${this.score}`, w / 2, h / 2 + 20);

        ctx.fillStyle = '#888';
        ctx.font = '16px monospace';
        ctx.fillText('PRESS SPACE OR ENTER TO RESTART', w / 2, h / 2 + 60);
    }

    drawHUD(ctx, w) {
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#0ff';
        ctx.fillStyle = '#0ff';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${this.score}`, 20, 35);

        ctx.textAlign = 'right';
        ctx.fillText(`LEVEL ${this.level}`, w - 20, 35);

        // Lives as small ship icons
        ctx.textAlign = 'left';
        for (let i = 0; i < this.lives; i++) {
            const lx = 25 + i * 25;
            const ly = 60;
            ctx.save();
            ctx.translate(lx, ly);
            ctx.rotate(-Math.PI / 2);
            ctx.shadowBlur = 6;
            ctx.shadowColor = '#0ff';
            ctx.strokeStyle = '#0ff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, -8);
            ctx.lineTo(-5, 5);
            ctx.lineTo(0, 2);
            ctx.lineTo(5, 5);
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        }

        ctx.restore();
    }
}

// Initialize
const canvas = document.getElementById('gameCanvas');
new Game(canvas);
