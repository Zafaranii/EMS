/** Lightweight canvas confetti — no deps. Call burst() once on success. */
export function burst(durationMs = 1400): void {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:10000';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;
  const colors = ['#4F46E5', '#F59E0B', '#16A34A', '#1A56DB', '#EC4899', '#06B6D4'];

  type P = { x:number; y:number; vx:number; vy:number; r:number; c:string; a:number; spin:number; ang:number };
  const pieces: P[] = [];
  const cx = canvas.width / 2, cy = canvas.height / 3;
  for (let i = 0; i < 140; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 6 + Math.random() * 9;
    pieces.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      r: 3 + Math.random() * 4,
      c: colors[Math.floor(Math.random() * colors.length)],
      a: 1, spin: (Math.random() - .5) * .3, ang: Math.random() * Math.PI,
    });
  }

  const start = performance.now();
  function frame(now: number) {
    const t = now - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.vy += 0.25;          // gravity
      p.vx *= 0.995;
      p.x += p.vx; p.y += p.vy;
      p.ang += p.spin;
      p.a = Math.max(0, 1 - t / durationMs);
      ctx.save();
      ctx.globalAlpha = p.a;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.ang);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
      ctx.restore();
    });
    if (t < durationMs) requestAnimationFrame(frame);
    else canvas.remove();
  }
  requestAnimationFrame(frame);
}
