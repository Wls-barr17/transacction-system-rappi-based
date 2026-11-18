import { useState } from 'react';

export default function SmartImage({ src, alt, className = '', fallback = '🍽️', ...props }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <span className={`grid place-items-center bg-gradient-to-br from-orange-50 to-amber-100 ${className}`} role="img" aria-label={alt}>{fallback}</span>;
  return <img src={src} alt={alt} loading="lazy" className={className} onError={() => setFailed(true)} {...props} />;
}
