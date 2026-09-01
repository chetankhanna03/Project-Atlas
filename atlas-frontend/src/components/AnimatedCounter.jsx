import React, { useEffect, useState } from 'react';

export const AnimatedCounter = ({ value, duration = 1.5, prefix = '', suffix = '', decimals = 0 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const target = parseFloat(value) || 0;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      // Ease out quad
      const current = progress * (2 - progress) * target;
      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };

    requestAnimationFrame(step);
  }, [value, duration]);

  return (
    <span>
      {prefix}
      {count.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
};
