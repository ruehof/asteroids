// utils.js — Hilfsfunktionen

export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

export function randomInt(min, max) {
    return Math.floor(randomRange(min, max + 1));
}

export function distanceBetween(x1, y1, x2, y2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
}

export function circleCollision(x1, y1, r1, x2, y2, r2) {
    return distanceBetween(x1, y1, x2, y2) < r1 + r2;
}

export function wrapPosition(obj, canvas) {
    const margin = obj.radius || 0;
    if (obj.x < -margin) obj.x = canvas.width + margin;
    if (obj.x > canvas.width + margin) obj.x = -margin;
    if (obj.y < -margin) obj.y = canvas.height + margin;
    if (obj.y > canvas.height + margin) obj.y = -margin;
}

export function randomColor(colors) {
    return colors[Math.floor(Math.random() * colors.length)];
}
