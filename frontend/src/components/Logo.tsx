import React, { useId } from 'react';

interface LogoProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  hideText?: boolean;
}

export default function Logo({ size = 'medium', hideText = false }: LogoProps) {
  const sizeMap = {
    small: { icon: 20, text: '16px', gap: '8px' },
    medium: { icon: 32, text: '24px', gap: '10px' },
    large: { icon: 48, text: '36px', gap: '14px' },
    xlarge: { icon: 80, text: '60px', gap: '20px' },
  };

  const { icon, text, gap } = sizeMap[size];
  const uniqueId = useId();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={icon} height={icon} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`bgGrad-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F59223" />
              <stop offset="100%" stopColor="#7E1515" />
            </linearGradient>
            <linearGradient id={`leftArmGrad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="40%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#C2C2C2" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="28" fill={`url(#bgGrad-${uniqueId})`}/>
          
          <path d="M 22 34 L 42 34 L 54 74 L 34 74 Z" fill={`url(#leftArmGrad-${uniqueId})`} stroke={`url(#leftArmGrad-${uniqueId})`} strokeWidth="2" strokeLinejoin="round" />
          <path d="M 58 34 L 78 34 L 66 74 L 46 74 Z" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      </div>
      {!hideText && (
        <span style={{ 
          fontSize: text, 
          fontWeight: 900, 
          color: '#262626', 
          letterSpacing: '-0.04em', 
          lineHeight: 1, 
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          marginTop: '2px'
        }}>
          VedaAI
        </span>
      )}
    </div>
  );
}
