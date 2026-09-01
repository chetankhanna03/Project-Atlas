import React, { useEffect, useRef } from 'react';

export const OceanCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Create bioluminescent bubbles
    const bubbleCount = 45;
    const bubbles = Array.from({ length: bubbleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height + height,
      radius: Math.random() * 3 + 1,
      speedY: Math.random() * 0.8 + 0.3,
      speedX: Math.sin(Math.random() * Math.PI) * 0.4,
      opacity: Math.random() * 0.5 + 0.2,
      color: Math.random() > 0.4 ? 'rgba(0, 242, 254, ' : 'rgba(79, 172, 254, '
    }));

    let step = 0;

    const render = () => {
      step += 0.01;
      ctx.clearRect(0, 0, width, height);

      // Draw subtle wave gradient lines
      ctx.fillStyle = 'rgba(2, 132, 199, 0.02)';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let x = 0; x <= width; x += 40) {
          const y = Math.sin(x * 0.003 + step + i) * 20 + height * 0.7 + i * 40;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();
      }

      // Update and draw bubbles
      bubbles.forEach(b => {
        b.y -= b.speedY;
        b.x += Math.sin(step + b.y * 0.01) * 0.5;

        if (b.y < -10) {
          b.y = height + 10;
          b.x = Math.random() * width;
        }

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = b.color + b.opacity + ')';
        ctx.shadowBlur = 10;
        ctx.shadowColor = b.color + '0.8)';
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-80"
    />
  );
};
