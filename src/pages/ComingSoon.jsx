import { useState, useEffect } from 'react';

export default function ComingSoon() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-black">
      {/* Animated gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1DBC60 50%, #0a0a0a 100%)',
          backgroundSize: '400% 400%',
          animation: 'gradientShift 8s ease infinite',
        }}
      />

      {/* Noise overlay */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl">
        {/* Logo */}
        <img
          src="/krewgrid-logo.png"
          alt="krewgrid"
          className="w-48 sm:w-64 md:w-80 mb-8"
        />

        {/* Tagline */}
        <p className="text-lg sm:text-xl md:text-2xl text-white/80 font-medium mb-4">
          Something big is coming{dots}
        </p>

        {/* Description */}
        <p className="text-sm sm:text-base text-white/50 max-w-md mb-12 leading-relaxed">
          We're building a platform where event teams and workers connect directly.
          Built for speed, reliability, and growing your network in the event industry.
        </p>

        {/* Divider */}
        <div className="w-16 h-px bg-white/20 mb-12" />

        {/* Coming Soon badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md px-6 py-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-sm font-medium text-white/90 tracking-wide uppercase">
            Coming Soon
          </span>
        </div>
      </div>

      {/* Bottom text */}
      <div className="absolute bottom-8 text-center z-10">
        <p className="text-xs text-white/30">© 2026 krewgrid. All rights reserved.</p>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
