const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomChar(): string {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

export function generateCaptchaText(length = 6): string {
  let text = '';
  for (let i = 0; i < length; i++) {
    text += randomChar();
  }
  return text;
}

export function drawCaptcha(canvas: HTMLCanvasElement, text: string): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#f0f9ff');
  grad.addColorStop(1, '#ecfeff');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const lineCount = 4;
  for (let i = 0; i < lineCount; i++) {
    ctx.strokeStyle = `rgba(15, 118, 110, ${0.15 + Math.random() * 0.15})`;
    ctx.lineWidth = 1 + Math.random();
    ctx.beginPath();
    ctx.moveTo(Math.random() * w, Math.random() * h);
    ctx.lineTo(Math.random() * w, Math.random() * h);
    ctx.stroke();
  }

  const dotCount = 30;
  for (let i = 0; i < dotCount; i++) {
    ctx.fillStyle = `rgba(13, 148, 136, ${0.1 + Math.random() * 0.2})`;
    ctx.beginPath();
    ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const charWidth = w / (text.length + 1);
  for (let i = 0; i < text.length; i++) {
    ctx.save();
    const x = charWidth * (i + 0.75);
    const y = h / 2 + (Math.random() - 0.5) * 8;
    ctx.translate(x, y);
    ctx.rotate((Math.random() - 0.5) * 0.35);

    const fontSize = 22 + Math.random() * 4;
    ctx.font = `bold ${fontSize}px Georgia, serif`;
    const shades = ['#0f766e', '#115e59', '#134e4a', '#0d9488', '#1e3a3a'];
    ctx.fillStyle = shades[Math.floor(Math.random() * shades.length)];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text[i], 0, 0);
    ctx.restore();
  }
}
