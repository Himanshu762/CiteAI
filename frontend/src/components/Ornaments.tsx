import React from 'react';
import CornerFiligree from '../assets/corner-filigree.svg';
import Flourish from '../assets/flourish-ornament.svg';
import Crest from '../assets/crest.svg';
import WaxSeal from '../assets/wax-seal.svg';
import OrnamentalDivider from '../assets/ornamental-divider.svg';

export const SmallCrest = ({ className = '', alt = 'crest' }: { className?: string; alt?: string }) => (
  <img src={Crest} alt={alt} className={`inline-block ${className}`} />
);

export const WaxSealIcon = ({ className = '', alt = 'wax seal' }: { className?: string; alt?: string }) => (
  <img src={WaxSeal} alt={alt} className={`inline-block ${className}`} />
);

export const CornerFlourish = ({ position = 'top-left', className = '' }: { position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'; className?: string }) => {
  const rotationMap: Record<string, number> = {
    'top-left': 0,
    'top-right': 90,
    'bottom-right': 180,
    'bottom-left': 270,
  };
  const rot = rotationMap[position] ?? 0;
  return (
    <img
      src={CornerFiligree}
      aria-hidden
      className={`${className}`}
      style={{ transform: `rotate(${rot}deg)` }}
      alt="corner flourish"
    />
  );
};

export const FlourishDivider = ({ className = '' }: { className?: string }) => (
  <img src={Flourish} alt="ornamental divider" className={className} />
);

export const OrnamentDividerInline = ({ className = '' }: { className?: string }) => (
  <img src={OrnamentalDivider} alt="ornamental divider" className={`mx-auto my-6 ${className}`} />
);

export default {
  SmallCrest,
  WaxSealIcon,
  CornerFlourish,
  FlourishDivider,
  OrnamentDividerInline,
};

