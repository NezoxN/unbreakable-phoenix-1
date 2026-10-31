import React, { useEffect, useRef } from 'react';

class Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  canvasWidth: number;
  canvasHeight: number;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.x = Math.random() * canvasWidth;
    this.y = Math.random() * canvasHeight;
    this.size = Math.random() * 2 + 0.1; // Мелкие искры
    this.speedX = Math.random() * 1 - 0.5;
    this.speedY = Math.random() * 1 - 0.5; // Медленное парение
    this.color = '#FFD700';
  }

  update(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.x += this.speedX;
    this.y += this.speedY;
    if (this.size > 0.2) this.size -= 0.01; // Исчезновение

    // Сброс частицы
    if (
      this.size <= 0.2 ||
      this.x < 0 ||
      this.x > canvasWidth ||
      this.y < 0 ||
      this.y > canvasHeight
    ) {
      this.x = Math.random() * canvasWidth;
      this.y = canvasHeight + 10;
      this.size = Math.random() * 3 + 1;
      this.speedY = Math.random() * -1 - 0.5; // Движение вверх (огонь)
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.size / 5; // Прозрачность
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

export const AmbientEffects: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const cursorDotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // 1. Custom Cursor Logic with Event Delegation for .hover-target
    const cursor = cursorRef.current;
    const cursorDot = cursorDotRef.current;

    const handleMouseMove = (e: MouseEvent) => {
      if (cursor && cursorDot) {
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
        cursorDot.style.left = `${e.clientX}px`;
        cursorDot.style.top = `${e.clientY}px`;
      }

      const target = e.target as HTMLElement | null;
      const inFormZone = Boolean(
        target &&
          target.closest(
            '#registration, footer, #partners, #regModal, .registration-modal, form, input, select, textarea'
          )
      );

      if (inFormZone) {
        document.body.classList.add('in-form-zone');
        document.body.classList.remove('hovered');
      } else {
        document.body.classList.remove('in-form-zone');
        if (target && target.closest('.hover-target, a, button')) {
          document.body.classList.add('hovered');
        } else {
          document.body.classList.remove('hovered');
        }
      }
    };

    const handleMouseLeave = () => {
      document.body.classList.remove('hovered');
      document.body.classList.remove('in-form-zone');
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    // 2. Particle System (Ember Effect)
    const canvas = canvasRef.current;
    if (!canvas) {
      return () => document.removeEventListener('mousemove', handleMouseMove);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return () => document.removeEventListener('mousemove', handleMouseMove);
    }

    let animationFrameId: number;
    let particlesArray: Particle[] = [];

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isLowPowerMobile = window.innerWidth < 768;
    // Preserve 150 particles on desktop as in original; reduce slightly on small mobile screens for 60fps
    const particleCount = prefersReducedMotion ? 35 : isLowPowerMobile ? 75 : 150;

    const initParticles = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particlesArray = [];
      for (let i = 0; i < particleCount; i++) {
        particlesArray.push(new Particle(canvas.width, canvas.height));
      }
    };

    const animateParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particlesArray.length; i++) {
        if (!prefersReducedMotion) {
          particlesArray[i].update(canvas.width, canvas.height);
        }
        particlesArray[i].draw(ctx);
      }
      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(animateParticles);
      }
    };

    initParticles();
    animateParticles();

    const handleResize = () => {
      initParticles();
      if (prefersReducedMotion) {
        animateParticles();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <>
      <div ref={cursorRef} className="cursor" aria-hidden="true" />
      <div ref={cursorDotRef} className="cursor-dot" aria-hidden="true" />
      <canvas ref={canvasRef} id="particles" aria-hidden="true" />
    </>
  );
};
