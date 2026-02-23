import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Zap, Shield, FileText, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWizardStore } from '../../lib/store/use-wizard-store';

// Animated background particles
const FloatingOrb = ({ delay, size, color, position }: { delay: number; size: number; color: string; position: { x: string; y: string } }) => (
    <motion.div
        className="absolute rounded-full blur-3xl opacity-30"
        style={{
            width: size,
            height: size,
            background: color,
            left: position.x,
            top: position.y,
        }}
        animate={{
            y: [0, -30, 0],
            x: [0, 15, 0],
            scale: [1, 1.1, 1],
        }}
        transition={{
            duration: 8,
            delay,
            repeat: Infinity,
            ease: "easeInOut",
        }}
    />
);

export default function StartPage() {
    const navigate = useNavigate();
    const { topic, setTopic, setStage } = useWizardStore();
    const [inputValue, setInputValue] = useState(topic);
    const [isFocused, setIsFocused] = useState(false);
    const [isTyping, setIsTyping] = useState(false);

    const canStart = inputValue.trim().length >= 10;

    useEffect(() => {
        if (inputValue.length > 0) {
            setIsTyping(true);
            const timer = setTimeout(() => setIsTyping(false), 500);
            return () => clearTimeout(timer);
        }
    }, [inputValue]);

    const handleStart = () => {
        if (!canStart) return;
        setTopic(inputValue.trim());
        setStage('research');
        navigate('/research');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && canStart) {
            e.preventDefault();
            handleStart();
        }
    };

    const features = [
        { icon: Zap, text: 'AI-Powered Research', color: 'from-amber-400 to-orange-500' },
        { icon: FileText, text: 'Academic Writing', color: 'from-blue-400 to-indigo-500' },
        { icon: Shield, text: 'Plagiarism Free', color: 'from-emerald-400 to-teal-500' },
        { icon: TrendingUp, text: 'Citation Analysis', color: 'from-purple-400 to-pink-500' },
    ];

    return (
        <div className="min-h-screen relative overflow-hidden bg-[#0a0a0f]">
            {/* Animated background */}
            <div className="absolute inset-0">
                <FloatingOrb delay={0} size={600} color="radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)" position={{ x: '-10%', y: '10%' }} />
                <FloatingOrb delay={2} size={500} color="radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)" position={{ x: '60%', y: '50%' }} />
                <FloatingOrb delay={4} size={400} color="radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%)" position={{ x: '20%', y: '70%' }} />

                {/* Grid overlay */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                        backgroundSize: '50px 50px',
                    }}
                />
            </div>

            {/* Header */}
            <header className="relative z-10 px-6 py-6">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3"
                    >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white tracking-tight">CiteAI</span>
                    </motion.div>

                    <motion.nav
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="hidden md:flex items-center gap-8"
                    >
                        <a href="#features" className="text-sm text-zinc-400 hover:text-white transition-colors">Features</a>
                        <a href="#pricing" className="text-sm text-zinc-400 hover:text-white transition-colors">Pricing</a>
                        <button className="text-sm px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-sm">
                            Sign In
                        </button>
                    </motion.nav>
                </div>
            </header>

            {/* Main content */}
            <main className="relative z-10 px-6 pt-16 md:pt-24 pb-32">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 backdrop-blur-sm mb-8"
                    >
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-sm text-zinc-300">Free AI-powered research assistant</span>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
                    >
                        <span className="text-white">Research papers</span>
                        <br />
                        <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            powered by AI
                        </span>
                    </motion.h1>

                    {/* Subheadline */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-12"
                    >
                        From topic to publication-ready paper in minutes.
                        Discover research gaps, find citations, and generate academic content.
                    </motion.p>

                    {/* Input card */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="relative max-w-2xl mx-auto"
                    >
                        {/* Glow effect */}
                        <div className={`absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-0 blur-xl transition-opacity duration-500 ${isFocused ? 'opacity-30' : ''}`} />

                        {/* Card */}
                        <div className={`relative bg-zinc-900/80 backdrop-blur-xl rounded-2xl border transition-all duration-300 ${isFocused ? 'border-blue-500/50' : 'border-zinc-800'}`}>
                            <div className="p-2">
                                <textarea
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="What do you want to research? ✨"
                                    className="w-full px-4 py-4 bg-transparent text-white text-lg placeholder-zinc-500 resize-none focus:outline-none min-h-[100px]"
                                    rows={2}
                                />

                                <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
                                    <div className="flex items-center gap-3">
                                        <AnimatePresence>
                                            {isTyping && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    className="flex items-center gap-1"
                                                >
                                                    {[0, 1, 2].map(i => (
                                                        <motion.div
                                                            key={i}
                                                            className="w-1.5 h-1.5 rounded-full bg-blue-400"
                                                            animate={{ y: [0, -4, 0] }}
                                                            transition={{ duration: 0.5, delay: i * 0.1, repeat: Infinity }}
                                                        />
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                        <span className={`text-sm transition-colors ${canStart ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                            {canStart ? '✓ Ready' : `${Math.max(0, 10 - inputValue.length)} more chars`}
                                        </span>
                                    </div>

                                    <motion.button
                                        onClick={handleStart}
                                        disabled={!canStart}
                                        whileHover={canStart ? { scale: 1.02 } : {}}
                                        whileTap={canStart ? { scale: 0.98 } : {}}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${canStart
                                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40'
                                                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                            }`}
                                    >
                                        Start Research
                                        <ArrowRight className="w-4 h-4" />
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Features row */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="flex flex-wrap justify-center gap-4 mt-12"
                    >
                        {features.map((feature, i) => (
                            <motion.div
                                key={feature.text}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 + i * 0.1 }}
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm"
                            >
                                <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
                                    <feature.icon className="w-3.5 h-3.5 text-white" />
                                </div>
                                <span className="text-sm text-zinc-300">{feature.text}</span>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </main>

            {/* Stats bar */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="relative z-10 border-t border-zinc-800/50 bg-zinc-900/50 backdrop-blur-xl"
            >
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { value: '50K+', label: 'Papers Generated' },
                            { value: '∞', label: 'Free Checks' },
                            { value: '98%', label: 'Originality' },
                            { value: '4.9/5', label: 'User Rating' },
                        ].map((stat, i) => (
                            <div key={stat.label} className="text-center">
                                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                    {stat.value}
                                </div>
                                <div className="text-sm text-zinc-500 mt-1">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
