import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { store } from '../lib/store';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Delete, Monitor, LogOut, Maximize, Minimize, X } from 'lucide-react';
import { cn } from "@/lib/utils";

const THEME_MAP = {
    teal: {
        primary: "teal-600",
        bg: "bg-teal-50",
        light: "bg-teal-100",
        shadow: "shadow-teal-200",
        gradient: "from-teal-600 to-cyan-700",
        accent: "text-teal-200",
        selection: "selection:bg-teal-100 selection:text-teal-900",
        // Static class strings for Tailwind JIT
        textPrimary: "text-teal-600",
        bgPrimary: "bg-teal-600",
        hoverBgPrimary: "hover:bg-teal-600/90",
        borderPrimary: "border-teal-600",
        borderLight: "border-teal-100",
        shadowPrimary: "shadow-teal-600/20",
        shadowPrimary50: "shadow-teal-600/50",
        textAccent: "text-teal-200",
        bgAccent: "bg-teal-200",
        hoverBgAccent: "hover:bg-teal-50",
        hoverTextPrimary: "hover:text-teal-600",
        focusBorder: "group-focus-within:border-teal-500/30",
        statusActive: "bg-teal-600 shadow-teal-600/50",
        badgeBg: "bg-teal-50",
        badgeText: "text-teal-600",
        badgeBorder: "border-teal-100"
    },
    indigo: {
        primary: "indigo-600",
        bg: "bg-indigo-50",
        light: "bg-indigo-100",
        shadow: "shadow-indigo-200",
        gradient: "from-indigo-600 to-blue-700",
        accent: "text-indigo-200",
        selection: "selection:bg-indigo-100 selection:text-indigo-900",
        textPrimary: "text-indigo-600",
        bgPrimary: "bg-indigo-600",
        hoverBgPrimary: "hover:bg-indigo-600/90",
        borderPrimary: "border-indigo-600",
        borderLight: "border-indigo-100",
        shadowPrimary: "shadow-indigo-600/20",
        shadowPrimary50: "shadow-indigo-600/50",
        textAccent: "text-indigo-200",
        bgAccent: "bg-indigo-200",
        hoverBgAccent: "hover:bg-indigo-50",
        hoverTextPrimary: "hover:text-indigo-600",
        focusBorder: "group-focus-within:border-indigo-500/30",
        statusActive: "bg-indigo-600 shadow-indigo-600/50",
        badgeBg: "bg-indigo-50",
        badgeText: "text-indigo-600",
        badgeBorder: "border-indigo-100"
    },
    rose: {
        primary: "rose-600",
        bg: "bg-rose-50",
        light: "bg-rose-100",
        shadow: "shadow-rose-200",
        gradient: "from-rose-600 to-pink-700",
        accent: "text-rose-200",
        selection: "selection:bg-rose-100 selection:text-rose-900",
        textPrimary: "text-rose-600",
        bgPrimary: "bg-rose-600",
        hoverBgPrimary: "hover:bg-rose-600/90",
        borderPrimary: "border-rose-600",
        borderLight: "border-rose-100",
        shadowPrimary: "shadow-rose-600/20",
        shadowPrimary50: "shadow-rose-600/50",
        textAccent: "text-rose-200",
        bgAccent: "bg-rose-200",
        hoverBgAccent: "hover:bg-rose-50",
        hoverTextPrimary: "hover:text-rose-600",
        focusBorder: "group-focus-within:border-rose-500/30",
        statusActive: "bg-rose-600 shadow-rose-600/50",
        badgeBg: "bg-rose-50",
        badgeText: "text-rose-600",
        badgeBorder: "border-rose-100"
    },
    amber: {
        primary: "amber-600",
        bg: "bg-amber-50",
        light: "bg-amber-100",
        shadow: "shadow-amber-200",
        gradient: "from-amber-600 to-orange-700",
        accent: "text-amber-200",
        selection: "selection:bg-amber-100 selection:text-amber-900",
        textPrimary: "text-amber-600",
        bgPrimary: "bg-amber-600",
        hoverBgPrimary: "hover:bg-amber-600/90",
        borderPrimary: "border-amber-600",
        borderLight: "border-amber-100",
        shadowPrimary: "shadow-amber-600/20",
        shadowPrimary50: "shadow-amber-600/50",
        textAccent: "text-amber-200",
        bgAccent: "bg-amber-200",
        hoverBgAccent: "hover:bg-amber-50",
        hoverTextPrimary: "hover:text-amber-600",
        focusBorder: "group-focus-within:border-amber-500/30",
        statusActive: "bg-amber-600 shadow-amber-600/50",
        badgeBg: "bg-amber-50",
        badgeText: "text-amber-600",
        badgeBorder: "border-amber-100"
    },
    emerald: {
        primary: "emerald-600",
        bg: "bg-emerald-50",
        light: "bg-emerald-100",
        shadow: "shadow-emerald-200",
        gradient: "from-emerald-600 to-teal-700",
        accent: "text-emerald-200",
        selection: "selection:bg-emerald-100 selection:text-emerald-900",
        textPrimary: "text-emerald-600",
        bgPrimary: "bg-emerald-600",
        hoverBgPrimary: "hover:bg-emerald-600/90",
        borderPrimary: "border-emerald-600",
        borderLight: "border-emerald-100",
        shadowPrimary: "shadow-emerald-600/20",
        shadowPrimary50: "shadow-emerald-600/50",
        textAccent: "text-emerald-200",
        bgAccent: "bg-emerald-200",
        hoverBgAccent: "hover:bg-emerald-50",
        hoverTextPrimary: "hover:text-emerald-600",
        focusBorder: "group-focus-within:border-emerald-500/30",
        statusActive: "bg-emerald-600 shadow-emerald-600/50",
        badgeBg: "bg-emerald-50",
        badgeText: "text-emerald-600",
        badgeBorder: "border-emerald-100"
    },
    slate: {
        primary: "slate-700",
        bg: "bg-slate-50",
        light: "bg-slate-200",
        shadow: "shadow-slate-300",
        gradient: "from-slate-700 to-slate-900",
        accent: "text-slate-400",
        selection: "selection:bg-slate-200 selection:text-slate-900",
        textPrimary: "text-slate-700",
        bgPrimary: "bg-slate-700",
        hoverBgPrimary: "hover:bg-slate-700/90",
        borderPrimary: "border-slate-700",
        borderLight: "border-slate-200",
        shadowPrimary: "shadow-slate-700/20",
        shadowPrimary50: "shadow-slate-700/50",
        textAccent: "text-slate-400",
        bgAccent: "bg-slate-400",
        hoverBgAccent: "hover:bg-slate-100",
        hoverTextPrimary: "hover:text-slate-700",
        focusBorder: "group-focus-within:border-slate-500/30",
        statusActive: "bg-slate-700 shadow-slate-700/50",
        badgeBg: "bg-slate-100",
        badgeText: "text-slate-700",
        badgeBorder: "border-slate-200"
    }
};

export default function CustomerTerminal({ onLogout }) {
    const navigate = useNavigate();
    const [view, setView] = useState('search'); // 'search' | 'action'
    const [phone, setPhone] = useState('');
    const [points, setPoints] = useState(0);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [options, setOptions] = useState([]); // Dynamic Add/Redeem presets
    const [terminalInfo, setTerminalInfo] = useState({ store_name: '', branch_name: '' });
    const [redemptionCount, setRedemptionCount] = useState(0);

    // Custom Points State
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customAmount, setCustomAmount] = useState('');
    const [customMode, setCustomMode] = useState('add'); // 'add' | 'deduct'
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [theme, setTheme] = useState(THEME_MAP.teal);
    const [resetInterval, setResetInterval] = useState(10);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(e => {
                console.error(`Error attempting to enable full-screen mode: ${e.message}`);
            });
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    // Auto-Reset Timer
    const resetTimerRef = useRef(null);

    // Clear timer when unmounting or changing views intentionally
    useEffect(() => {
        const session = store.getTerminalSession();
        if (session) {
            setTerminalInfo({
                store_name: session.store_name,
                branch_name: session.branch_name
            });
            setTheme(THEME_MAP[session.theme_color] || THEME_MAP.teal);
            setResetInterval(session.reset_interval || 10);
        }

        return () => {
            if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        };
    }, []);

    const startAutoReset = () => {
        if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        resetTimerRef.current = setTimeout(() => {
            handleBack(); // Simply go back to search
        }, resetInterval * 1000);
    };

    const cancelAutoReset = () => {
        if (resetTimerRef.current) {
            clearTimeout(resetTimerRef.current);
            resetTimerRef.current = null;
        }
    };

    // --- Keypad Logic (Search View) ---
    const handleNumClick = (num) => {
        if (phone.length < 10) {
            setPhone(prev => prev + num);
        }
    };

    const handleClear = () => {
        setPhone('');
    };

    const handleBackspace = () => {
        setPhone(prev => prev.slice(0, -1));
    };

    const handleGo = async () => {
        if (phone.length < 10) return;

        setIsLoading(true);
        try {
            // Fetch points, loyalty options, and daily redemption count in parallel
            const [p, opt, count] = await Promise.all([
                store.getPoints(phone),
                store.getLoyaltyOptions(),
                store.getRedemptionCountToday(phone)
            ]);
            setPoints(p);
            setOptions(opt);
            setRedemptionCount(count);
            setView('action');
        } catch (error) {
            console.error(error);
            setMessage('Error fetching data. ❌');
        } finally {
            setIsLoading(false);
        }
    };

    // --- Action View Logic ---
    const handleBack = () => {
        cancelAutoReset();
        setPhone('');
        setPoints(0);
        setMessage('');
        setShowCustomInput(false);
        setCustomAmount('');
        setCustomMode('add');
        setView('search');
    };

    // Global interaction handler to pause/reset timer could be here, 
    // but for now we only set it on successful transaction as requested.

    const handleAddPoint = async (amount) => {
        cancelAutoReset();
        setIsLoading(true);
        try {
            const newPoints = await store.addPoints(phone, amount);
            setPoints(newPoints);
            setMessage(`Added ${amount} Point${amount > 1 ? 's' : ''}! 🎉 (Resetting in ${resetInterval}s...)`);
            startAutoReset();
        } catch (error) {
            console.error(error);
            setMessage('Failed to add points. ❌');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRedeem = async (cost, isManual = false) => {
        cancelAutoReset();
        setIsLoading(true);
        try {
            const success = await store.redeemPoints(phone, cost, isManual);
            if (success !== false) {
                setPoints(success);
                if (!isManual) setRedemptionCount(prev => prev + 1);
                setMessage(`${isManual ? '扣除' : '兌換'} ${cost} 點! ${isManual ? '🔧' : '🎁'} (Resetting in ${resetInterval}s...)`);
                startAutoReset();
            } else {
                setMessage('點數不足! ⚠️');
            }
        } catch (error) {
            if (error.message === 'Limit reached') {
                const session = store.getTerminalSession();
                const limit = session?.daily_redemption_limit ?? 2;
                setMessage(`今日兌換次數已達上限 ${limit} 次 ⚠️`);
            } else {
                console.error(error);
                setMessage('Redemption error. ❌');
            }
        } finally {
            setIsLoading(false);
        }
        setTimeout(() => setMessage(''), 5000); // UI message toast can stay for 5s, doesn't need to match reset logic
    };

    // --- Custom Points Logic ---
    const handleCustomNumClick = (num) => {
        cancelAutoReset(); // Interaction cancels reset
        if (customAmount.length < 5) { // Limit length
            setCustomAmount(prev => prev + num);
        }
    };

    const handleCustomClear = () => {
        cancelAutoReset();
        setCustomAmount('');
    };

    const handleCustomSubmit = async () => {
        const amt = parseInt(customAmount, 10);
        if (amt > 0) {
            if (customMode === 'add') {
                await handleAddPoint(amt);
            } else {
                if (amt > points) {
                    setMessage('扣除點數不能超過顧客持有點數! ⚠️');
                    setTimeout(() => setMessage(''), 5000);
                    return;
                }
                await handleRedeem(amt, true);
            }
            setShowCustomInput(false);
            setCustomAmount('');
            setCustomMode('add');
        }
    };

    return (
        <div className={cn("min-h-screen bg-slate-50 flex flex-col font-sans", theme.selection)}>


            <main className="flex-1 overflow-auto relative">
                {/* View 1: Search (Keypad) - Landscape Optimized */}
                {view === 'search' && (
                    <div className="h-full min-h-[550px] flex items-center justify-center p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
                        <Card className="w-full max-w-6xl p-6 md:p-10 bg-white shadow-soft-2xl rounded-[3rem] border-0 relative">
                            <CardContent className="p-0">
                                {/* Search View Top Actions (Inside Card) */}
                                <div className="absolute top-6 left-8 z-20">
                                    <Button variant="ghost" onClick={async () => {
                                        store.clearTerminalSession();
                                        await store.logout();
                                        navigate('/terminal-login');
                                    }} className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors gap-2">
                                        <LogOut className="h-5 w-5" />
                                        <span className="hidden sm:inline">登出系統</span>
                                    </Button>
                                </div>

                                <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                                    {/* Left Column: Display & Instructions */}
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className={cn("w-16 h-16 p-2 bg-white rounded-full flex items-center justify-center shadow-lg", `shadow-${theme.primary}/10`)}>
                                                    <img src={`${import.meta.env.BASE_URL}logo.png`} alt="LoyaltyLoop Logo" className="w-full h-full object-contain mix-blend-multiply" />
                                                </div>
                                                <div>
                                                    <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">顧客查詢</h2>
                                                    <p className="text-slate-400 font-bold text-lg mt-1">Customer Lookup</p>
                                                </div>
                                            </div>
                                            <p className="text-slate-500 font-medium text-xl leading-relaxed">
                                                請輸入顧客的手機號碼，系統將自動查詢點數餘額並進入操作介面。
                                            </p>
                                        </div>

                                        {/* Large Phone Display */}
                                        <div className="relative group">
                                            <div className={cn("absolute -inset-2 rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500", theme.bgAccent + "/20")} style={{ filter: 'blur(var(--ui-blur-md))' }} />
                                            <div className={cn("relative flex items-center justify-center h-24 lg:h-32 bg-slate-50 rounded-[2.5rem] border-2 border-transparent transition-all duration-300 shadow-inner", theme.focusBorder, "group-focus-within:bg-white")}>
                                                <div className="flex gap-2 items-center">
                                                    {Array.from({ length: 10 }).map((_, i) => (
                                                        <React.Fragment key={i}>
                                                            <div className={cn(
                                                                "w-7 lg:w-9 h-12 lg:h-16 flex items-center justify-center text-5xl lg:text-6xl font-black transition-all duration-200",
                                                                phone[i] ? "text-slate-900 scale-110" : "text-slate-200"
                                                            )}>
                                                                {phone[i] || '•'}
                                                            </div>
                                                            {(i === 3) && <div className="w-3 h-1 bg-slate-300 mx-1 rounded-full" />}
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status Indicator */}
                                        <div className="space-y-2">
                                            {terminalInfo.store_name && (
                                                <div className={cn("text-[10px] font-black uppercase tracking-[0.2em] ml-1", theme.textPrimary + "/60")}>
                                                    {terminalInfo.store_name} - {terminalInfo.branch_name}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-3 text-slate-400 font-bold">
                                                <div className={cn(
                                                    "w-3 h-3 rounded-full transition-all duration-300",
                                                    phone.length === 10 ? cn(theme.bgPrimary, "animate-pulse shadow-lg", theme.shadowPrimary50) : "bg-slate-200"
                                                )} />
                                                <span className="text-sm uppercase tracking-widest">
                                                    {phone.length === 10 ? '已就緒 - 可查詢' : `已輸入 ${phone.length}/10 位數字`}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Keypad */}
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-3 gap-4">
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                                <Button
                                                    key={num}
                                                    variant="ghost"
                                                    onClick={() => handleNumClick(num.toString())}
                                                    className={cn("h-18 lg:h-22 text-3xl lg:text-4xl font-black rounded-[1.5rem] bg-slate-50 transition-all active:scale-95 shadow-sm hover:shadow-md", theme.hoverBgAccent, theme.hoverTextPrimary)}
                                                >
                                                    {num}
                                                </Button>
                                            ))}
                                            <Button
                                                variant="ghost"
                                                onClick={handleClear}
                                                className="h-18 lg:h-22 text-2xl font-black text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-[1.5rem] uppercase tracking-wider transition-all active:scale-95"
                                            >
                                                清除
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                onClick={() => handleNumClick('0')}
                                                className={cn("h-18 lg:h-22 text-3xl lg:text-4xl font-black rounded-[1.5rem] bg-slate-50 transition-all active:scale-95 shadow-sm hover:shadow-md", theme.hoverBgAccent, theme.hoverTextPrimary)}
                                            >
                                                0
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                onClick={handleBackspace}
                                                className="h-18 lg:h-22 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-[1.5rem] transition-all active:scale-95 flex items-center justify-center pt-2 [&_svg]:!size-auto [&_svg]:!w-10 [&_svg]:!h-10 lg:[&_svg]:!w-12 lg:[&_svg]:!h-12"
                                            >
                                                <Delete strokeWidth={2} />
                                            </Button>
                                        </div>

                                        <Button
                                            variant="ghost" // Using ghost but manually applying theme classes
                                            onClick={handleGo}
                                            disabled={phone.length < 10 || isLoading}
                                            className={cn(
                                                "w-full h-18 text-2xl font-black rounded-[2rem] shadow-2xl disabled:opacity-50 group text-white transition-all",
                                                theme.bgPrimary, theme.hoverBgPrimary, theme.shadowPrimary
                                            )}
                                        >
                                            {isLoading ? '查詢中...' : (
                                                <span className="flex items-center justify-center gap-4">
                                                    開始操作 <ArrowLeft className="rotate-180 h-8 w-8 group-hover:translate-x-2 transition-transform" />
                                                </span>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* View 2: Action (Dashboard) - Landscape Optimized */}
                {view === 'action' && (
                    <div className="w-full h-screen p-4 md:p-6 lg:p-8 overflow-y-auto bg-slate-50">
                        <div className={cn(
                            "max-w-[1200px] md:max-w-[1400px] mx-auto min-h-[550px] flex flex-row justify-center gap-6 md:gap-8 items-start pb-20 transition-all duration-500",
                            isFullscreen ? "pt-6" : "pt-10"
                        )}>
                            {/* Left Sidebar: Points Card + Quick Actions */}
                            <div className="w-[320px] md:w-[360px] lg:w-[400px] shrink-0 flex flex-col gap-6">

                                {/* Points Display Card (Integrated Customer Info) */}
                                <Card className={cn("text-white p-6 md:p-8 lg:p-10 flex flex-col justify-between relative shadow-soft-2xl min-h-[260px] md:min-h-[280px] shrink-0 border-0 rounded-[2.5rem] overflow-hidden bg-gradient-to-br", theme.gradient)}>
                                    {/* Decorative Background */}
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-2xl pointer-events-none" style={{ filter: 'blur(var(--ui-blur-md))' }} />

                                    {/* Header: Customer Info */}
                                    <div className="relative z-10 w-full flex justify-between items-start border-b border-white/20 pb-4 mb-4">
                                        <div>
                                            <div className={cn("text-xs font-bold uppercase tracking-wider mb-1 opacity-90", theme.accent)}>目前操作顧客</div>
                                            <div className="text-2xl font-black text-white tracking-tight">
                                                {phone.replace(/(\d{4})(\d{6})/, '$1-$2')}
                                            </div>
                                        </div>
                                        <div className="bg-white p-1.5 rounded-full shadow-lg">
                                            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo" className="w-8 h-8 mix-blend-multiply object-contain" />
                                        </div>
                                    </div>

                                    {/* Body: Points */}
                                    <div className="relative z-10 flex flex-col justify-center flex-1">
                                        <h3 className={cn("font-bold text-base uppercase tracking-wide mb-3 opacity-90", theme.accent)}>累積剩餘點數</h3>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-6xl md:text-[5.5rem] font-black leading-none tracking-tighter">
                                                {points}
                                            </span>
                                            <span className={cn("text-2xl md:text-3xl font-black", theme.accent)}>PTS</span>
                                        </div>
                                    </div>
                                </Card>


                                {/* Quick Actions Card */}
                                <Card className="bg-white p-6 lg:p-8 flex-1 flex flex-col justify-center border-0 shadow-soft-lg rounded-[2.5rem]">
                                    <h3 className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs mb-5">快速操作 ACTIONS</h3>
                                    <div className="grid grid-cols-1 gap-3">
                                        <Button
                                            onClick={() => {
                                                cancelAutoReset();
                                                setShowCustomInput(true);
                                            }}
                                            className={cn("h-16 rounded-[1.5rem] bg-slate-50 text-slate-600 border-0 shadow-sm hover:shadow-md text-base font-black flex items-center justify-center gap-3 transition-all active:scale-95", theme.hoverBgAccent, theme.hoverTextPrimary)}
                                        >
                                            <span className="text-2xl">➕</span>
                                            自訂點數
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={handleBack}
                                            className="h-16 rounded-[1.5rem] border-2 border-slate-100 hover:border-slate-200 text-slate-500 hover:text-slate-900 text-base font-black flex items-center justify-center gap-3 transition-all active:scale-95"
                                        >
                                            <span className="text-2xl">🔄</span>
                                            更換手機
                                        </Button>
                                    </div>
                                </Card>

                                {/* Sidebar Bottom Actions */}
                                <div className="mt-auto pb-6 px-4 flex flex-col gap-2">
                                    <Button variant="ghost" className={cn("w-full justify-start text-slate-400 rounded-xl", theme.hoverTextPrimary, theme.hoverBgAccent)} onClick={toggleFullscreen}>
                                        {isFullscreen ? <Minimize className="mr-3 h-4 w-4" /> : <Maximize className="mr-3 h-4 w-4" />}
                                        {isFullscreen ? '退出全螢幕' : '進入全螢幕'}
                                    </Button>
                                    <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl" onClick={async () => {
                                        store.clearTerminalSession();
                                        await store.logout();
                                        navigate('/terminal-login');
                                    }}>
                                        <LogOut className="mr-3 h-4 w-4" /> 登出系統
                                    </Button>
                                </div>
                            </div>

                            {/* Right Content: Add Points & Redeem Rewards */}
                            <div className="flex-1 h-full flex flex-col gap-5 md:gap-6 overflow-hidden">
                                {/* Add Points Section - Flexible height with max limit */}
                                <div className="shrink-0 flex flex-col gap-4 max-h-[35%] min-h-[140px]">
                                    <div className="flex items-center gap-4 shrink-0">
                                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm", theme.light, theme.textPrimary)}>+</div>
                                        <h3 className="text-2xl lg:text-3xl font-black text-slate-900">累積點數</h3>
                                    </div>
                                    <div className="grid grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto pr-2 pb-2">
                                        {options.filter(o => o.type === 'add').map(opt => (
                                            <Button
                                                key={opt.id}
                                                disabled={isLoading}
                                                onClick={() => handleAddPoint(opt.value)}
                                                className={cn("h-24 rounded-[1.5rem] bg-white border-2 shadow-soft-md transition-all duration-300 group active:scale-95", theme.textPrimary, theme.borderLight, "hover:text-white", theme.hoverBgPrimary, theme.shadowPrimary)}
                                            >
                                                <div className="flex flex-col items-center gap-0">
                                                    <span className="text-3xl font-black group-hover:scale-110 transition-transform">+{opt.value}</span>
                                                    <span className="text-xs font-bold opacity-70">{opt.label}</span>
                                                </div>
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-slate-200 shrink-0" />

                                {/* Redeem Rewards Section - Flexible height scrolling */}
                                <div className="flex-1 flex flex-col gap-4 min-h-0 relative">
                                    <div className="flex items-center gap-4 shrink-0 sticky top-0 bg-slate-50 z-10 py-1">
                                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm", theme.light, theme.textPrimary)}>★</div>
                                        <h3 className="text-2xl lg:text-3xl font-black text-slate-900">兌換獎勵</h3>
                                        {redemptionCount > 0 && (store.getTerminalSession()?.daily_redemption_limit ?? 2) > 0 && (
                                            <div className={cn("ml-auto px-3 py-1 rounded-full text-xs font-black border", theme.badgeBg, theme.textPrimary, theme.badgeBorder)}>
                                                今日已兌換 {redemptionCount}/{store.getTerminalSession()?.daily_redemption_limit ?? 2} 次
                                            </div>
                                        )}
                                        {redemptionCount > 0 && (store.getTerminalSession()?.daily_redemption_limit ?? 2) === 0 && (
                                            <div className={cn("ml-auto px-3 py-1 rounded-full text-xs font-black border", theme.badgeBg, theme.textPrimary, theme.badgeBorder)}>
                                                今日已兌換 {redemptionCount} 次 (不限次數)
                                            </div>
                                        )}
                                    </div>

                                    <div className="relative flex-1 min-h-0">
                                        {(store.getTerminalSession()?.daily_redemption_limit ?? 2) > 0 && redemptionCount >= (store.getTerminalSession()?.daily_redemption_limit ?? 2) && (
                                            <div className="absolute inset-0 z-20 bg-white/40 backdrop-blur-md rounded-[2.5rem] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500 border-2 border-dashed border-amber-200/50">
                                                <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-4xl mb-4 shadow-lg shadow-amber-200/50">⚠️</div>
                                                <h4 className="text-2xl font-black text-slate-900 mb-2">兌換額度已達上限</h4>
                                                <p className="text-slate-500 font-bold">同顧客於本分店每日限兌換 {store.getTerminalSession()?.daily_redemption_limit ?? 2} 次</p>
                                                <div className="mt-6 px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-full font-black text-sm uppercase tracking-widest shadow-xl">
                                                    請明天再試 Tomorrow
                                                </div>
                                            </div>
                                        )}

                                        <div className={cn(
                                            "grid grid-cols-2 gap-3 overflow-y-auto h-full pr-2 pb-4 content-start transition-all duration-500",
                                            (store.getTerminalSession()?.daily_redemption_limit ?? 2) > 0 && redemptionCount >= (store.getTerminalSession()?.daily_redemption_limit ?? 2) && "opacity-20 grayscale pointer-events-none blur-[2px]"
                                        )}>
                                            {options.filter(o => o.type === 'redeem').map(opt => (
                                                <Button
                                                    key={opt.id}
                                                    disabled={isLoading || points < opt.value || ((store.getTerminalSession()?.daily_redemption_limit ?? 2) > 0 && redemptionCount >= (store.getTerminalSession()?.daily_redemption_limit ?? 2))}
                                                    onClick={() => handleRedeem(opt.value)}
                                                    className={cn(
                                                        "h-24 rounded-[1.5rem] flex justify-between items-center px-5 border-2 transition-all duration-300 active:scale-95 group",
                                                        points >= opt.value && ((store.getTerminalSession()?.daily_redemption_limit ?? 2) === 0 || redemptionCount < (store.getTerminalSession()?.daily_redemption_limit ?? 2))
                                                            ? cn("bg-white border-slate-100 text-slate-900 shadow-soft-md hover:shadow-xl", theme.borderPrimary, theme.hoverBgAccent)
                                                            : "bg-slate-50 border-transparent text-slate-300 grayscale opacity-50 cursor-not-allowed shadow-none"
                                                    )}
                                                >
                                                    <div className="flex flex-col items-start gap-0 max-w-[60%] overflow-hidden">
                                                        <span className="text-lg font-black truncate w-full text-left">{opt.label}</span>
                                                        <span className="text-xs font-bold text-slate-400">消耗 {opt.value} 點</span>
                                                    </div>
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-full flex items-center justify-center font-black text-xs shrink-0 transition-colors",
                                                        points >= opt.value && ((store.getTerminalSession()?.daily_redemption_limit ?? 2) === 0 || redemptionCount < (store.getTerminalSession()?.daily_redemption_limit ?? 2))
                                                            ? cn("text-white", theme.bgPrimary, theme.hoverBgPrimary)
                                                            : "bg-slate-200 text-slate-400"
                                                    )}>
                                                        兌換
                                                    </div>
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Custom Amount Overlay */}
            {
                showCustomInput && (
                    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300" style={{ backdropFilter: 'var(--ui-backdrop-blur)', WebkitBackdropFilter: 'var(--ui-backdrop-blur)' }}>
                        <Card className="w-full max-w-lg md:max-w-4xl p-6 md:p-10 bg-white shadow-soft-2xl rounded-[2.5rem] md:rounded-[3rem] border-0 overflow-hidden">
                            <CardContent className="p-0 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
                                {/* Left Side: Display & Header */}
                                <div className="flex flex-col gap-6 md:gap-8 justify-center">
                                    <div className="flex justify-between items-start md:block">
                                        <div>
                                            <h3 className="text-2xl md:text-4xl font-black text-slate-900 leading-tight">自訂累積扣除點數</h3>
                                            <p className="text-slate-400 font-medium mt-1 md:mt-2 md:text-lg">請輸入要手動增加/扣除的點數值</p>
                                        </div>
                                        <Button variant="ghost" className="md:hidden rounded-full w-10 h-10 p-0" onClick={() => setShowCustomInput(false)}>
                                            <X className="h-5 w-5" />
                                        </Button>
                                    </div>

                                    {/* Mode Toggle */}
                                    <div className="flex p-1 bg-slate-100 rounded-2xl">
                                        <Button
                                            variant="ghost"
                                            onClick={() => setCustomMode('add')}
                                            className={cn(
                                                "flex-1 h-12 rounded-xl text-lg font-black transition-all",
                                                customMode === 'add' ? cn("bg-white shadow-sm", theme.textPrimary) : "text-slate-400 hover:text-slate-600"
                                            )}
                                        >
                                            ➕ 增加點數
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={() => setCustomMode('deduct')}
                                            className={cn(
                                                "flex-1 h-12 rounded-xl text-lg font-black transition-all",
                                                customMode === 'deduct' ? "bg-white text-red-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                            )}
                                        >
                                            ➖ 扣除點數
                                        </Button>
                                    </div>

                                    <div className={cn(
                                        "rounded-3xl h-24 md:h-48 flex items-center justify-center text-6xl md:text-8xl font-black shadow-inner transition-colors",
                                        customMode === 'add' ? cn(theme.bg, theme.textPrimary) : "bg-red-50 text-red-600"
                                    )}>
                                        <span className="opacity-40 mr-2 md:mr-4">{customMode === 'add' ? '+' : '-'}</span>
                                        {customAmount || '0'}
                                    </div>

                                    <div className="hidden md:block">
                                        <Button variant="ghost" className="w-full h-14 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 font-bold text-lg" onClick={() => setShowCustomInput(false)}>
                                            取消並返回
                                        </Button>
                                    </div>
                                </div>

                                {/* Right Side: Keypad */}
                                <div className="grid grid-cols-3 gap-3 md:gap-4">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                        <Button
                                            key={num}
                                            variant="ghost"
                                            onClick={() => handleCustomNumClick(num.toString())}
                                            className={cn("h-16 md:h-20 text-2xl md:text-3xl font-bold rounded-2xl bg-slate-50 transition-all active:scale-95", theme.hoverBgAccent)}
                                        >
                                            {num}
                                        </Button>
                                    ))}
                                    <Button onClick={handleCustomClear} variant="ghost" className="h-16 md:h-20 text-lg font-bold text-slate-400 hover:bg-slate-100 rounded-2xl">清除</Button>
                                    <Button onClick={() => handleCustomNumClick('0')} variant="ghost" className={cn("h-16 md:h-20 text-2xl md:text-3xl font-bold rounded-2xl bg-slate-50 transition-all active:scale-95", theme.hoverBgAccent)}>0</Button>
                                    <Button
                                        onClick={handleCustomSubmit}
                                        variant="ghost"
                                        disabled={isLoading || !customAmount || customAmount === '0'}
                                        className={cn(
                                            "h-16 md:h-20 text-xl md:text-2xl font-black rounded-2xl text-white shadow-xl transition-all",
                                            theme.bgPrimary, theme.hoverBgPrimary, theme.shadowPrimary
                                        )}
                                    >
                                        {isLoading ? '...' : '確認'}
                                    </Button>

                                    {/* Mobile close button at bottom for easier reach if needed, but we have the Cancel button on desktop */}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )
            }

            {/* Global Message Toast */}
            {
                message && (
                    <div className={cn("fixed bottom-10 left-1/2 -translate-x-1/2 px-10 py-5 bg-slate-900 text-white text-xl font-bold rounded-3xl shadow-soft-2xl animate-in slide-in-from-bottom-8 fade-in duration-500 z-50 flex items-center gap-4 border border-white/10")}>
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm", theme.bgPrimary)}>✓</div>
                        {message}
                    </div>
                )
            }
        </div >
    );
}
