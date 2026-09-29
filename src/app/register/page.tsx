"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  PackagePlus,
  Mail,
  Lock,
  User,
  MapPin,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Camera,
  Sparkles,
  Zap,
  HeartHandshake,
  ShieldCheck,
  Link as LinkIcon
} from "lucide-react";
import { Instagram, Twitter } from "@/components/brand-icons";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

// --- NEW: SHARING ANIMATION COMPONENT ---
const SharingAnimation = () => {
  return (
    <div className="w-full h-48 relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900/50 to-black/50 border border-zinc-800/50 flex items-center justify-center">
      {/* Injected CSS for the animation */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes passRight {
          0%, 100% { transform: translateX(0px); }
          50% { transform: translateX(60px); }
        }
        @keyframes passLeft {
          0%, 100% { transform: translateX(60px); }
          50% { transform: translateX(0px); }
        }
        @keyframes giverArm {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-20deg); }
        }
        @keyframes receiverArm {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(20deg); }
        }
        .floating-box { animation: float 3s ease-in-out infinite; }
        .box-path { animation: passRight 6s ease-in-out infinite; }
        .giver-arm { transform-origin: 30% 60%; animation: giverArm 6s ease-in-out infinite; }
        .receiver-arm { transform-origin: 70% 60%; animation: receiverArm 6s ease-in-out infinite; }
      `}</style>
      
      <svg width="240" height="140" viewBox="0 0 240 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Giver Figure (Left) */}
        <g className="giver">
          <circle cx="50" cy="40" r="15" fill="#14b8a6" fillOpacity="0.8" /> {/* Head - Teal */}
          <path d="M50 60 C 30 80, 30 110, 35 130 L 65 130 C 70 110, 70 80, 50 60" fill="#0f766e" fillOpacity="0.6" /> {/* Body */}
          <path className="giver-arm" d="M40 75 Q 20 90, 50 105" stroke="#14b8a6" strokeWidth="6" strokeLinecap="round" /> {/* Arm */}
        </g>

        {/* Receiver Figure (Right) */}
        <g className="receiver">
          <circle cx="190" cy="40" r="15" fill="#06b6d4" fillOpacity="0.8" /> {/* Head - Cyan */}
          <path d="M190 60 C 170 80, 170 110, 175 130 L 205 130 C 210 110, 210 80, 190 60" fill="#0e7490" fillOpacity="0.6" /> {/* Body */}
          <path className="receiver-arm" d="M200 75 Q 220 90, 190 105" stroke="#06b6d4" strokeWidth="6" strokeLinecap="round" /> {/* Arm */}
        </g>
        
        {/* The Package being shared */}
        <g className="box-path" transform="translate(60, 0)">
          <g className="floating-box">
            {/* Box body */}
            <rect x="0" y="75" width="40" height="30" rx="4" fill="url(#boxGradient)" stroke="#ccfbf1" strokeWidth="2" />
            {/* Bow tie */}
            <path d="M0 90 L 40 90 M 20 75 L 20 105" stroke="#ccfbf1" strokeWidth="2" />
            <path d="M20 75 L 10 65 L 20 68 L 30 65 L 20 75" fill="#ccfbf1" />
            {/* Sparkles */}
            <path d="M-5 70 L -2 73 M 45 70 L 42 73 M 20 110 L 20 115" stroke="#f0fdff" strokeWidth="2" className="animate-pulse" />
          </g>
        </g>

        {/* Gradients */}
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

// --- Configuration ---

type UserRole = 'giver' | 'receiver' | 'both';
type Category = 'Clothing' | 'Accessories' | 'Shoes' | 'Bags' | 'Other';

const categories: Category[] = ['Clothing', 'Accessories', 'Shoes', 'Bags', 'Other'];

const roleConfig = {
  giver: {
    displayIcon: <Zap className="w-5 h-5" />,
    title: "The Supplier",
    description: "Clear your closet. Drop heat.",
    dbRole: 'GIVER',
    fields: ['preferredCategories', 'aboutGiving'],
    canListItems: true,
    canRequestItems: false,
    gradient: "from-teal-400 to-emerald-500",
    border: "group-hover:border-emerald-500/50",
    text: "group-hover:text-emerald-400"
  },
  receiver: {
    displayIcon: <Sparkles className="w-5 h-5" />,
    title: "The Collector",
    description: "Hunt for hidden gems.",
    dbRole: 'RECEIVER',
    fields: ['preferredCategories', 'aboutReceiving'],
    canListItems: false,
    canRequestItems: true,
    gradient: "from-cyan-400 to-blue-500",
    border: "group-hover:border-cyan-500/50",
    text: "group-hover:text-cyan-400"
  },
  both: {
    displayIcon: <HeartHandshake className="w-5 h-5" />,
    title: "All Access",
    description: "Give back and get back.",
    dbRole: 'BOTH',
    fields: ['preferredCategories', 'aboutGiving', 'aboutReceiving'],
    canListItems: true,
    canRequestItems: true,
    gradient: "from-teal-400 to-cyan-500",
    border: "group-hover:border-teal-500/50",
    text: "group-hover:text-teal-400"
  }
};

const testimonials = [
  {
    quote: "StuffsDrop completely changed how I find vintage gear. The community is unreal.",
    author: "Alex Chen",
    role: "Verified Collector"
  },
  {
    quote: "I cleared out my entire closet in a week. Feels good to see my stuff get a second life.",
    author: "Sarah Jenkins",
    role: "Top Supplier"
  },
  {
    quote: "The drop system is addictive. It's like a game where everyone wins.",
    author: "Marcus D.",
    role: "Community Member"
  }
];

export default function SignUp() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [showVerification, setShowVerification] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  
  // Form State
  const [formData, setFormData] = useState({
    role: '' as UserRole,
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    location: '',
    bio: '',
    avatar: '',
    preferredCategories: [] as Category[],
    aboutGiving: '',
    aboutReceiving: '',
    socialLinks: { instagram: '', twitter: '' }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // --- DYNAMIC GLOW LOGIC ---
  const stepProgress = useMemo(() => {
    let score = 0;
    let total = 1;

    if (currentStep === 1) {
      total = 5; 
      if (formData.role) score++;
      if (formData.username.length > 2) score++;
      if (/\S+@\S+\.\S+/.test(formData.email)) score++;
      if (formData.password.length > 5) score++;
      if (formData.confirmPassword && formData.password === formData.confirmPassword) score++;
    } 
    else if (currentStep === 2) {
      total = 3; 
      if (formData.fullName.length > 1) score++;
      if (formData.location.length > 2) score++;
      if (formData.role) {
         const config = roleConfig[formData.role as UserRole];
         if (config.fields.includes('preferredCategories') && formData.preferredCategories.length > 0) score++;
         else if (config.fields.includes('aboutGiving') && formData.aboutGiving.length > 5) score++;
      }
    }
    else if (currentStep === 3) {
      total = 2; 
      if (formData.socialLinks.instagram.length > 2) score++;
      if (formData.socialLinks.twitter.length > 2) score++;
    }

    return Math.min(score / total, 1);
  }, [formData, currentStep]);


  // --- Testimonial Rotator ---
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000); 
    return () => clearInterval(interval);
  }, []);

  // --- Validation ---
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.role) newErrors.role = 'Select an archetype';
    if (!formData.email) newErrors.email = 'Email required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.username) newErrors.username = 'Handle required';
    else if (formData.username.length < 3) newErrors.username = 'Min 3 chars';
    if (!formData.password) newErrors.password = 'Password required';
    else if (formData.password.length < 6) newErrors.password = 'Min 6 chars';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'No match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName) newErrors.fullName = 'Name required';
    if (!formData.location) newErrors.location = 'Location required';
    
    const role = formData.role as UserRole;
    if (roleConfig[role].fields.includes('preferredCategories') && formData.preferredCategories.length === 0) {
      newErrors.preferredCategories = 'Select at least one tag';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    return true; 
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) setCurrentStep(2);
    else if (currentStep === 2 && validateStep2()) setCurrentStep(3);
    else if (currentStep === 3 && validateStep3()) handleSubmit();
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    setErrors({});
  };

  const handleSubmit = async () => {
    const role = formData.role as UserRole;
    const config = roleConfig[role];
    const payload = {
      email: formData.email,
      password: formData.password,
      username: formData.username,
      role: config.dbRole,
      subscriptionTier: 'FREE',
      fullName: formData.fullName,
      location: formData.location,
      bio: formData.bio,
      avatar: formData.avatar,
      preferredCategories: formData.preferredCategories,
      aboutGiving: formData.aboutGiving,
      aboutReceiving: formData.aboutReceiving,
      socialLinks: formData.socialLinks,
      canListItems: config.canListItems,
      canRequestItems: config.canRequestItems
    };

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!result.success) {
        setErrors({ submit: result.error?.message || 'Registration failed.' });
        return;
      }
      // Auto-login after register
      const { error: loginError } = await getSupabaseBrowserClient().auth.signInWithPassword({
        email: payload.email,
        password: payload.password,
      });
      if (loginError) {
        setErrors({ submit: loginError.message });
        return;
      }
      setShowVerification(true);
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Registration failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Field Updaters
  const toggleCategory = (category: Category) => {
    setFormData(prev => ({
      ...prev,
      preferredCategories: prev.preferredCategories.includes(category)
        ? prev.preferredCategories.filter(c => c !== category)
        : [...prev.preferredCategories, category]
    }));
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const updateSocialLink = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value }
    }));
  };

  // --- Renderers ---

  const StepIndicator = () => (
    <div className="space-y-8 relative">
      <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-zinc-900 z-0" />
      {[
        { id: 1, title: "Identity & Access", sub: "Choose your path" },
        { id: 2, title: "Profile Details", sub: "Tell us about you" },
        { id: 3, title: "Connections", sub: "Get Verified" }
      ].map((step) => {
        const isActive = currentStep === step.id;
        const isCompleted = currentStep > step.id;
        return (
          <div key={step.id} className="relative z-10 flex items-center gap-4 transition-opacity duration-300">
            <div className={`
              w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border transition-all duration-300 shadow-lg
              ${isActive || isCompleted 
                ? "bg-teal-600 border-teal-500 text-white shadow-teal-500/20" 
                : "bg-black border-zinc-800 text-zinc-600"
              }
            `}>
              {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : step.id}
            </div>
            <div className="flex flex-col">
              <span className={`text-sm font-semibold tracking-wide ${isActive || isCompleted ? "text-white" : "text-zinc-600"}`}>
                {step.title}
              </span>
              <span className="text-xs text-zinc-500 font-medium">
                {step.sub}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  );

  if (showVerification) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-white selection:bg-teal-500/30">
        <div className="w-full max-w-lg bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-xl rounded-3xl p-12 text-center space-y-8">
           <div className="w-20 h-20 bg-gradient-to-tr from-teal-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-teal-500/20">
             <CheckCircle2 className="w-10 h-10 text-white" />
           </div>
           <div className="space-y-2">
             <h2 className="text-3xl font-bold tracking-tight">You&apos;re in.</h2>
             <p className="text-zinc-400">Account created for <span className="text-white font-medium">{formData.email}</span></p>
             <p className="text-zinc-500 text-sm">You&apos;re already logged in — no email confirmation needed.</p>
           </div>
           <button
             onClick={() => router.push("/drops")}
             className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-teal-50 transition-colors flex items-center justify-center gap-2"
           >
             Enter StuffsDrop <ArrowRight className="w-5 h-5" />
           </button>
           <button
             onClick={() => router.push("/login")}
             className="w-full py-3 text-zinc-500 text-sm hover:text-white transition-colors"
           >
             Or sign in with a different account
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-teal-500/30 flex relative overflow-hidden font-sans">
      
      {/* --- BACKGROUND FX (Teal/Cyan) --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         {/* Static Top Left */}
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-600/10 blur-[120px]" />
         
         {/* DYNAMIC REACTIVE GLOW (Bottom Right) */}
         <div 
            className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-600/15 blur-[100px] transition-all duration-700 ease-out will-change-transform"
            style={{ 
              transform: `scale(${1 + stepProgress * 0.5})`, // Grows from 1.0 to 1.5
              opacity: 0.2 + (stepProgress * 0.8), // Fades from 0.2 to 1.0
              filter: `blur(${100 - (stepProgress * 30)}px)` // Sharpens slightly as you progress
            }} 
         />
         
         
         <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
      </div>

      <div className="w-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 relative z-10 min-h-screen">
        
        {/* --- LEFT: Brand & Progress --- */}
        <div className="hidden lg:flex lg:col-span-4 flex-col justify-between p-12 border-r border-zinc-900/50 bg-black/20 backdrop-blur-sm sticky top-0 h-screen">
          <div className="space-y-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
                <PackagePlus className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-2xl font-bold tracking-tight">StuffsDrop</span>
            </div>
            {StepIndicator()}
          </div>

          {/* CONTENT CONTAINER FOR ANIMATION & SLIDER */}
          <div className="space-y-6">
            
            {/* --- NEW SHARING ANIMATION --- */}
            <SharingAnimation />

            {/* TESTIMONIAL SLIDER */}
            <div className="relative min-h-[140px]">
              {testimonials.map((t, idx) => (
                <div 
                  key={idx}
                  className={`
                    absolute inset-0 transition-all duration-700 ease-in-out
                    ${idx === activeTestimonial ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 pointer-events-none"}
                  `}
                >
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-zinc-900 to-black border border-zinc-800">
                    <p className="text-sm text-zinc-400 italic leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-900/50 flex items-center justify-center text-teal-400 font-bold text-xs">
                        {t.author.charAt(0)}
                      </div>
                      <div className="text-xs">
                        <div className="text-white font-medium">{t.author}</div>
                        <div className="text-teal-500/70">{t.role}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Slider Dots */}
            <div className="flex gap-1.5 px-6">
              {testimonials.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1 rounded-full transition-all duration-300 ${idx === activeTestimonial ? "w-6 bg-teal-500" : "w-1.5 bg-zinc-800"}`} 
                />
              ))}
            </div>
          </div>
        </div>

        {/* --- RIGHT: Form Area --- */}
        <div className="lg:col-span-8 p-6 md:p-12 flex flex-col justify-center">
          <div className="max-w-xl mx-auto w-full space-y-8">
            
            {/* Header Text */}
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight text-white">
                {currentStep === 1 && "Claim your handle"}
                {currentStep === 2 && "Build your profile"}
                {currentStep === 3 && "Secure account"}
              </h1>
              <p className="text-zinc-400 text-lg">
                {currentStep === 1 && "Start by choosing how you want to contribute."}
                {currentStep === 2 && "Help the community get to know you."}
                {currentStep === 3 && "Verify your social presence."}
              </p>
            </div>

            {/* Error Display */}
            {errors.submit && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {errors.submit}
              </div>
            )}

            {/* --- STEP 1: IDENTITY --- */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(Object.entries(roleConfig) as [UserRole, typeof roleConfig.giver][]).map(([key, config]) => {
                    const isSelected = formData.role === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => updateField('role', key)}
                        className={`
                          relative p-4 rounded-xl border text-left transition-all duration-300 group
                          ${isSelected 
                            ? "bg-zinc-900 border-teal-500 ring-1 ring-teal-500" 
                            : "bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900"
                          }
                          ${config.border}
                        `}
                      >
                        <div className={`mb-3 ${isSelected ? 'text-white' : 'text-zinc-500'} ${config.text}`}>
                          {config.displayIcon}
                        </div>
                        <h3 className="font-bold text-sm text-white">{config.title}</h3>
                        <p className="text-[11px] text-zinc-500 mt-1 leading-snug">{config.description}</p>
                      </button>
                    );
                  })}
                </div>
                {errors.role && <p className="text-xs text-red-400">{errors.role}</p>}

                <div className="space-y-4 pt-2">
                   {/* Inputs using Teal focus rings */}
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                         <label className="text-xs font-medium text-zinc-400 ml-1">Username</label>
                         <div className="relative group">
                            <User className="absolute left-4 top-3.5 w-4 h-4 text-zinc-500 group-focus-within:text-teal-400 transition-colors" />
                            <input 
                               type="text" 
                               value={formData.username}
                               onChange={(e) => updateField('username', e.target.value)}
                               className="w-full pl-11 pr-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 outline-none transition-all placeholder:text-zinc-700 text-sm"
                               placeholder="handle"
                            />
                         </div>
                         {errors.username && <p className="text-xs text-red-400 ml-1">{errors.username}</p>}
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-xs font-medium text-zinc-400 ml-1">Email</label>
                         <div className="relative group">
                            <Mail className="absolute left-4 top-3.5 w-4 h-4 text-zinc-500 group-focus-within:text-teal-400 transition-colors" />
                            <input 
                               type="email" 
                               value={formData.email}
                               onChange={(e) => updateField('email', e.target.value)}
                               className="w-full pl-11 pr-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 outline-none transition-all placeholder:text-zinc-700 text-sm"
                               placeholder="email"
                            />
                         </div>
                         {errors.email && <p className="text-xs text-red-400 ml-1">{errors.email}</p>}
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400 ml-1">Password</label>
                        <div className="relative group">
                           <Lock className="absolute left-4 top-3.5 w-4 h-4 text-zinc-500 group-focus-within:text-teal-400 transition-colors" />
                           <input 
                              type="password" 
                              value={formData.password}
                              onChange={(e) => updateField('password', e.target.value)}
                              className="w-full pl-11 pr-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 outline-none transition-all placeholder:text-zinc-700 text-sm"
                              placeholder="••••••"
                           />
                        </div>
                        {errors.password && <p className="text-xs text-red-400 ml-1">{errors.password}</p>}
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400 ml-1">Confirm</label>
                        <div className="relative group">
                           <Lock className="absolute left-4 top-3.5 w-4 h-4 text-zinc-500 group-focus-within:text-teal-400 transition-colors" />
                           <input 
                              type="password" 
                              value={formData.confirmPassword}
                              onChange={(e) => updateField('confirmPassword', e.target.value)}
                              className="w-full pl-11 pr-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 outline-none transition-all placeholder:text-zinc-700 text-sm"
                              placeholder="••••••"
                           />
                        </div>
                        {errors.confirmPassword && <p className="text-xs text-red-400 ml-1">{errors.confirmPassword}</p>}
                     </div>
                   </div>
                </div>
              </div>
            )}

            {/* --- STEP 2: PROFILE --- */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="flex gap-4 items-start">
                   <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center text-zinc-500 cursor-pointer hover:border-teal-500/50 hover:text-teal-400 transition-all shrink-0">
                      <Camera className="w-6 h-6 mb-1" />
                      <span className="text-[10px] uppercase font-bold">Photo</span>
                   </div>
                   <div className="flex-1 space-y-4">
                      <input 
                        type="text" 
                        value={formData.fullName}
                        onChange={(e) => updateField('fullName', e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 outline-none transition-all placeholder:text-zinc-700 text-sm"
                        placeholder="Full Name"
                      />
                      <div className="relative">
                         <MapPin className="absolute left-4 top-3.5 w-4 h-4 text-zinc-500" />
                         <input 
                            type="text" 
                            value={formData.location}
                            onChange={(e) => updateField('location', e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 outline-none transition-all placeholder:text-zinc-700 text-sm"
                            placeholder="City, State"
                         />
                      </div>
                   </div>
                </div>

                {roleConfig[formData.role as UserRole].fields.includes('preferredCategories') && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400">Interests</label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleCategory(cat)}
                          className={`
                            px-3 py-1.5 rounded-lg text-xs font-medium transition-all border
                            ${formData.preferredCategories.includes(cat)
                              ? "bg-teal-500/10 border-teal-500 text-teal-400"
                              : "bg-black border-zinc-800 text-zinc-500 hover:border-zinc-700"
                            }
                          `}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {roleConfig[formData.role as UserRole].fields.includes('aboutGiving') && (
                  <textarea
                    rows={2}
                    value={formData.aboutGiving}
                    onChange={(e) => updateField('aboutGiving', e.target.value)}
                    className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 outline-none transition-all placeholder:text-zinc-700 text-sm resize-none"
                    placeholder="What kind of items do you drop?"
                  />
                )}
              </div>
            )}

            {/* --- STEP 3: CONNECTIONS (Socials) --- */}
            {currentStep === 3 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                
                <div className="p-5 rounded-2xl bg-teal-900/10 border border-teal-900/30 flex gap-4 items-start">
                   <div className="p-2 bg-teal-500/20 rounded-lg text-teal-400">
                     <ShieldCheck className="w-6 h-6" />
                   </div>
                   <div>
                     <h3 className="text-sm font-bold text-teal-100">Why connect socials?</h3>
                     <p className="text-xs text-teal-200/60 mt-1 leading-relaxed">
                       StuffsDrop is built on trust. Connecting an active social profile helps verify you are a real person and increases your trust score by 20%.
                     </p>
                   </div>
                </div>

                <div className="space-y-4">
                  <div className="relative group">
                    <div className="absolute left-4 top-3.5"><Instagram className="w-4 h-4 text-zinc-500 group-focus-within:text-pink-500 transition-colors"/></div>
                    <input 
                      type="text" 
                      placeholder="Instagram Username"
                      value={formData.socialLinks.instagram}
                      onChange={(e) => updateSocialLink('instagram', e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500/50 outline-none transition-all placeholder:text-zinc-700 text-sm"
                    />
                  </div>
                  <div className="relative group">
                    <div className="absolute left-4 top-3.5"><Twitter className="w-4 h-4 text-zinc-500 group-focus-within:text-sky-500 transition-colors"/></div>
                    <input 
                      type="text" 
                      placeholder="X / Twitter Username"
                      value={formData.socialLinks.twitter}
                      onChange={(e) => updateSocialLink('twitter', e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/50 outline-none transition-all placeholder:text-zinc-700 text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-2 text-xs text-zinc-500 justify-center">
                  <LinkIcon className="w-3 h-3" />
                  <span>Your social profiles will be visible to verified members only.</span>
                </div>
              </div>
            )}

            {/* --- CONTROLS --- */}
            <div className="flex items-center gap-4 pt-4 border-t border-zinc-900">
               {currentStep > 1 && (
                 <button
                   onClick={handleBack}
                   disabled={isLoading}
                   className="px-6 py-4 rounded-xl border border-zinc-800 text-zinc-400 font-medium hover:bg-zinc-900 hover:text-white transition-colors"
                 >
                   <ArrowLeft className="w-5 h-5" />
                 </button>
               )}
               <button
                 onClick={handleNext}
                 disabled={isLoading}
                 className={`
                   flex-1 py-4 rounded-xl font-bold text-black flex items-center justify-center gap-2
                   bg-white hover:bg-teal-50 transition-all shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]
                   hover:shadow-[0_0_25px_-5px_rgba(255,255,255,0.5)] active:scale-[0.98]
                   disabled:opacity-70 disabled:cursor-not-allowed
                 `}
               >
                 {isLoading ? (
                   <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
                 ) : (
                   <>
                     {currentStep === 3 ? "Mint Profile" : "Continue"}
                     <ArrowRight className="w-5 h-5" />
                   </>
                 )}
               </button>
            </div>
            
            <div className="text-center">
              <p className="text-zinc-500 text-xs">
                Already have an account?{' '}
                <button onClick={() => router.push('/login')} className="text-white hover:underline decoration-zinc-500 underline-offset-4">
                  Sign In
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}