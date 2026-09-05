import React from 'react';

interface ImnoraLogoProps {
  className?: string;
  variant?: 'navy' | 'light' | 'beige' | 'white';
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ImnoraLogo: React.FC<ImnoraLogoProps> = ({
  className = '',
  variant = 'navy',
  showText = true,
  size = 'md'
}) => {
  // Color palette: deep luxury navy vs warm cream/beige
  const colorMap = {
    navy: '#0B1E38',      // Deepest midnight navy
    light: '#F5EFEB',     // Warm refined beige/cream
    beige: '#D4C3A3',     // Warm beige/gold
    white: '#FFFFFF'
  };

  const primaryColor = colorMap[variant];

  // Sizing definitions
  const dimensions = {
    sm: { height: 28, markWidth: 20, textSize: 'text-xs tracking-[0.28em]' },
    md: { height: 38, markWidth: 28, textSize: 'text-sm tracking-[0.32em]' },
    lg: { height: 50, markWidth: 38, textSize: 'text-lg tracking-[0.35em]' },
    xl: { height: 68, markWidth: 52, textSize: 'text-2xl tracking-[0.38em]' }
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none font-serif ${className}`}>
      {/* Precision Vector Serif 'M' matching the brand mark in the uploaded visual */}
      <svg
        width={dimensions.markWidth}
        height={dimensions.height}
        viewBox="0 0 100 110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200"
      >
        {/* Left upright with classical bracketed top and bottom serifs */}
        <path
          d="M 12 18 L 32 18 M 22 18 L 22 92 M 12 92 L 32 92"
          stroke={primaryColor}
          strokeWidth="7"
          strokeLinecap="square"
        />
        {/* Central chevron V meeting down at the baseline */}
        <path
          d="M 22 18 L 50 82 L 78 18"
          stroke={primaryColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Right upright with classical bracketed top and bottom serifs */}
        <path
          d="M 68 18 L 88 18 M 78 18 L 78 92 M 68 92 L 88 92"
          stroke={primaryColor}
          strokeWidth="7"
          strokeLinecap="square"
        />
      </svg>

      {/* Brand Typography: I M N O R A with stylized apex 'Λ' for 'A' */}
      {showText && (
        <div className="flex flex-col justify-center">
          <div
            className={`font-semibold uppercase font-sans ${dimensions.textSize} leading-none`}
            style={{ color: primaryColor, letterSpacing: '0.34em' }}
          >
            <span>I M N O R</span>
            {/* The signature apex 'Λ' of Imnora */}
            <span className="inline-block ml-[0.28em] font-light">Λ</span>
          </div>
          <span
            className="text-[9px] uppercase tracking-[0.38em] font-sans font-medium mt-0.5 opacity-75"
            style={{ color: primaryColor }}
          >
            Marketplace Imobiliário
          </span>
        </div>
      )}
    </div>
  );
};
