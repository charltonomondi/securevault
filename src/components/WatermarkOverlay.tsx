import { useMemo, useEffect, useState } from 'react';
import { generateWatermarkPositions } from '@/lib/security';

interface WatermarkOverlayProps {
  userEmail: string;
  userName?: string;
  containerRef: React.RefObject<HTMLDivElement>;
}

export const WatermarkOverlay = ({ userEmail, userName, containerRef }: WatermarkOverlayProps) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.scrollWidth,
          height: containerRef.current.scrollHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => {
      window.removeEventListener('resize', updateDimensions);
      clearInterval(timeInterval);
    };
  }, [containerRef]);

  const positions = useMemo(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return [];
    return generateWatermarkPositions(dimensions.width, dimensions.height);
  }, [dimensions]);

  const watermarkText = `${userName || userEmail} • ${currentTime.toLocaleDateString()} ${currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  return (
    <div className="watermark-overlay" aria-hidden="true">
      {positions.map((pos) => (
        <span
          key={pos.key}
          className="watermark-text animate-pulse-glow"
          style={{
            left: pos.x,
            top: pos.y,
          }}
        >
          {watermarkText}
        </span>
      ))}
    </div>
  );
};
