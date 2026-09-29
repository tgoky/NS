"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Package
} from "lucide-react";

// --- SHARING ANIMATION (Borderless & Resized) ---
const SharingAnimation = () => {
  return (
    // Reduced height to h-32, max-width to 280px to fit "perfectly"
    // Removed border and background colors for a clean look
    <div className="w-full max-w-[280px] h-32 relative overflow-visible flex items-center justify-start -ml-4">
      {/* Injected CSS for the animation */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes passRight {
          0%, 100% { transform: translateX(0px); }
          50% { transform: translateX(50px); }
        }
        @keyframes giverArm {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-15deg); }
        }
        @keyframes receiverArm {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(15deg); }
        }
        .floating-box { animation: float 3s ease-in-out infinite; }
        .box-path { animation: passRight 5s ease-in-out infinite; }
        .giver-arm { transform-origin: 30% 60%; animation: giverArm 5s ease-in-out infinite; }
        .receiver-arm { transform-origin: 70% 60%; animation: receiverArm 5s ease-in-out infinite; }
      `}</style>
      
      <svg width="220" height="120" viewBox="0 0 240 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Giver Figure (Left) */}
        <g className="giver">
          <circle cx="50" cy="40" r="15" fill="#14b8a6" fillOpacity="0.9" /> {/* Head - Teal */}
          <path d="M50 60 C 30 80, 30 110, 35 130 L 65 130 C 70 110, 70 80, 50 60" fill="#0f766e" fillOpacity="0.7" /> {/* Body */}
          <path className="giver-arm" d="M40 75 Q 20 90, 50 105" stroke="#14b8a6" strokeWidth="6" strokeLinecap="round" />
        </g>

        {/* Receiver Figure (Right) */}
        <g className="receiver">
          <circle cx="190" cy="40" r="15" fill="#06b6d4" fillOpacity="0.9" /> {/* Head - Cyan */}
          <path d="M190 60 C 170 80, 170 110, 175 130 L 205 130 C 210 110, 210 80, 190 60" fill="#0e7490" fillOpacity="0.7" /> {/* Body */}
          <path className="receiver-arm" d="M200 75 Q 220 90, 190 105" stroke="#06b6d4" strokeWidth="6" strokeLinecap="round" />
        </g>
        
        {/* The Package being shared */}
        <g className="box-path" transform="translate(60, 0)">
          <g className="floating-box">
            <rect x="0" y="75" width="40" height="30" rx="4" fill="url(#boxGradient)" stroke="#ccfbf1" strokeWidth="2" />
            <path d="M0 90 L 40 90 M 20 75 L 20 105" stroke="#ccfbf1" strokeWidth="2" />
            <path d="M20 75 L 10 65 L 20 68 L 30 65 L 20 75" fill="#ccfbf1" />
            {/* Sparkles */}
            <path d="M-5 70 L -2 73 M 45 70 L 42 73 M 20 110 L 20 115" stroke="#f0fdff" strokeWidth="2" className="animate-pulse" />
          </g>
        </g>

        <defs>
          <linearGradient id="boxGradient" x1="0" y1="75" x2="40" y2="105" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2dd4bf" />
            <stop offset="1" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

// --- CANVAS PARTICLE SYSTEM ---
const FallingCubesCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setSize();
    window.addEventListener('resize', setSize);

    const particleCount = 100; 
    const particles: any[] = [];
    const colors = ['#14b8a6', '#0d9488', '#2dd4bf', '#99f6e4'];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        size: Math.random() * 12 + 4,
        speedY: Math.random() * 3 + 1,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: Math.random() * 0.5 + 0.2
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;
        if (p.y > canvas.height + 50) {
          p.y = -50;
          p.x = Math.random() * canvas.width;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.strokeStyle = '#ccfbf1';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });
      requestAnimationFrame(animate);
    };

    animate();
    return () => window.removeEventListener('resize', setSize);
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 z-0 pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default function LoginClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!formData.username) newErrors.username = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      const { error } = await getSupabaseBrowserClient().auth.signInWithPassword({
        email: formData.username,
        password: formData.password,
      });
      if (error) {
        setErrors({ password: error.message });
        setIsLoading(false);
        return;
      }
      router.replace("/drops");
      router.refresh();
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <div className="min-h-screen flex w-full bg-[#050505] text-white selection:bg-teal-500/30 overflow-hidden font-sans">
      
      <style jsx global>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.3; filter: blur(80px); }
          50% { transform: scale(1.3); opacity: 0.6; filter: blur(60px); }
        }
        .perspective-grid {
          background-size: 50px 50px;
          background-image:
            linear-gradient(to right, rgba(20, 184, 166, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(20, 184, 166, 0.1) 1px, transparent 1px);
          transform: perspective(500px) rotateX(60deg);
          transform-origin: top;
        }
      `}</style>

      {/* --- BACKGROUND EFFECTS --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-teal-600/10 blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] bg-teal-500 rounded-full animate-[breathe_6s_ease-in-out_infinite]" />
        <div className="absolute bottom-0 left-0 right-0 h-[40vh] perspective-grid mask-image-gradient" style={{ maskImage: 'linear-gradient(to bottom, transparent, black)' }}></div>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
      </div>

      <FallingCubesCanvas />

      <div className="w-full max-w-[1920px] mx-auto grid grid-cols-1 lg:grid-cols-2 relative z-10 h-screen">
        
        {/* --- LEFT COLUMN: Brand Experience --- */}
        <div className="hidden lg:flex flex-col justify-between p-12 relative pointer-events-none">
          
          {/* Logo */}
          <div className="relative z-20 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Package className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
              StuffsDrop
            </span>
          </div>

          {/* Hero Content */}
          <div className="relative z-20 space-y-4 max-w-lg mb-12">
            
            {/* REPLACED "Drop is Live" WITH ANIMATION */}
            <SharingAnimation />
            
            <h1 className="text-6xl font-semibold tracking-tight leading-[1] drop-shadow-2xl text-white">
               The marketplace for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-400 to-white animate-pulse">
                free hidden gems.
              </span>
            </h1>
            
            <p className="text-lg text-zinc-400 leading-relaxed max-w-md backdrop-blur-sm">
                Join the community redefining ownership. Give away what you don&apos;t need, find what you love, and keep the cycle moving all for free! 
            </p>

            <div className="flex gap-4 pt-4">
               <div className="flex -space-x-3">
                 {[1,2,3,4].map(i => (
                   <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-zinc-800 flex items-center justify-center text-xs text-zinc-500">
                     <Package className="w-4 h-4" />
                   </div>
                 ))}
               </div>
               <div className="flex flex-col justify-center">
                 <span className="text-sm font-bold text-white">5k+ free stuffs</span>
                 <span className="text-xs text-zinc-500">claimed this week</span>
               </div>
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-20 flex items-center gap-6 text-xs text-zinc-600 font-medium tracking-wide uppercase">
            <span>© 2026 StuffsDrop Inc.</span>
            <span className="w-1 h-1 rounded-full bg-zinc-800" />
            <span>Privacy Policy</span>
          </div>
        </div>

        {/* --- RIGHT COLUMN: Login Form --- */}
        <div className="flex items-center justify-center p-6 lg:p-12 w-full relative">
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-b from-teal-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="w-full max-w-[420px] space-y-8 relative z-10">
            
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
                <Package className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold">StuffsDrop</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight text-white">
                Welcome back
              </h2>
              <p className="text-sm text-zinc-400">
                Enter your credentials to access the drop
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-300 ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-zinc-500 group-focus-within:text-teal-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => updateField('username', e.target.value)}
                    className={`
                      block w-full pl-11 pr-4 py-3.5 bg-black/40 border backdrop-blur-sm
                      rounded-xl text-sm placeholder:text-zinc-600 text-white
                      transition-all duration-200 outline-none
                      focus:bg-zinc-900/80 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50
                      ${errors.username ? "border-red-500/50 focus:border-red-500" : "border-zinc-800"}
                    `}
                    placeholder="name@example.com"
                  />
                </div>
                {errors.username && <p className="text-xs text-red-400 ml-1">{errors.username}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-300 ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-zinc-500 group-focus-within:text-teal-400 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    className={`
                      block w-full pl-11 pr-12 py-3.5 bg-black/40 border backdrop-blur-sm
                      rounded-xl text-sm placeholder:text-zinc-600 text-white
                      transition-all duration-200 outline-none
                      focus:bg-zinc-900/80 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50
                      ${errors.password ? "border-red-500/50 focus:border-red-500" : "border-zinc-800"}
                    `}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-400 ml-1">{errors.password}</p>}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.rememberMe}
                      onChange={(e) => updateField('rememberMe', e.target.checked)}
                      className="peer h-4 w-4 appearance-none rounded border border-zinc-700 bg-black/50 checked:bg-teal-500 checked:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                    />
                    <svg
                      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-zinc-500 group-hover:text-zinc-400 transition-colors">
                    Remember me
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => router.push('/forgot-password')}
                  className="text-xs font-medium text-teal-400 hover:text-teal-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`
                  group w-full py-3.5 px-4 bg-white text-black text-sm font-bold rounded-xl 
                  hover:bg-teal-50 transition-all duration-300 
                  disabled:opacity-70 disabled:cursor-not-allowed
                  shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]
                  hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.6)]
                  active:scale-[0.98]
                  flex items-center justify-center gap-2
                `}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-6 border-t border-zinc-800/50 text-center">
              <p className="text-xs text-zinc-500">
                New to StuffsDrop?{' '}
                <button
                  onClick={() => router.push('/register')}
                  className="font-medium text-white hover:text-teal-400 transition-colors"
                >
                  Create an account
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}