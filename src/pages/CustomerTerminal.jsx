import React, { useState, useEffect, useRef } from 'react';
import { store } from '../lib/store';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, X } from 'lucide-react';

export default function CustomerTerminal({ onLogout }) {
    const [view, setView] = useState('search'); // 'search' | 'action'
    const [phone, setPhone] = useState('');
    const [points, setPoints] = useState(0);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [options, setOptions] = useState([]); // Dynamic Add/Redeem presets

    // Custom Points State
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customAmount, setCustomAmount] = useState('');

    // Auto-Reset Timer
    const resetTimerRef = useRef(null);

    // Clear timer when unmounting or changing views intentionally
    useEffect(() => {
        return () => {
            if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        };
    }, []);

    const startAutoReset = () => {
        if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        resetTimerRef.current = setTimeout(() => {
            handleBack(); // Simply go back to search
        }, 5000);
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
            // Fetch points and loyalty options in parallel
            const [p, opt] = await Promise.all([
                store.getPoints(phone),
                store.getLoyaltyOptions()
            ]);
            setPoints(p);
            setOptions(opt);
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
            setMessage(`Added ${amount} Point${amount > 1 ? 's' : ''}! 🎉 (Resetting in 5s...)`);
            startAutoReset();
        } catch (error) {
            console.error(error);
            setMessage('Failed to add points. ❌');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRedeem = async (cost) => {
        cancelAutoReset();
        setIsLoading(true);
        try {
            const success = await store.redeemPoints(phone, cost);
            if (success !== false) {
                setPoints(success);
                setMessage(`Redeemed ${cost} points! 🎁 (Resetting in 5s...)`);
                startAutoReset();
            } else {
                setMessage('Insufficient points! ⚠️');
            }
        } catch (error) {
            console.error(error);
            setMessage('Redemption error. ❌');
        } finally {
            setIsLoading(false);
        }
        setTimeout(() => setMessage(''), 5000);
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
            await handleAddPoint(amt);
            setShowCustomInput(false);
            setCustomAmount('');
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col font-mono selection:bg-black selection:text-[#E1FF01]">
            {/* Header */}
            <header className="bg-white p-6 flex justify-between items-center border-b-4 border-black shrink-0 z-10">
                <div className="flex items-center gap-4">
                    {view === 'action' && (
                        <Button
                            variant="outline"
                            onClick={handleBack}
                            className="mr-2"
                        >
                            <ArrowLeft className="h-6 w-6" />
                            BACK
                        </Button>
                    )}
                    <h1 className="text-3xl font-black uppercase tracking-tighter">
                        {view === 'search' ? 'LOYALTY TERMINAL' : `CUSTOMER: ${phone}`}
                    </h1>
                </div>
                <Button variant="ghost" onClick={onLogout} className="text-xl font-bold uppercase underline">
                    Logout
                </Button>
            </header>

            <main className="flex-1 overflow-hidden relative">
                {/* View 1: Search (Keypad) */}
                {view === 'search' && (
                    <div className="h-full flex items-center justify-center p-4 bg-[#E1FF01] animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <Card className="w-full max-w-lg p-6 bg-white shadow-brutalist-lg">
                            <CardContent className="p-0 flex flex-col gap-4">
                                <div className="space-y-2">
                                    <label className="block text-center text-xl font-black uppercase tracking-tight">
                                        Enter Phone Number
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 bg-white border-4 border-black h-20 flex items-center justify-center text-4xl font-black tracking-widest shadow-inner">
                                            {Array.from({ length: 10 }).map((_, i) => (
                                                <React.Fragment key={i}>
                                                    <span className={phone[i] ? "text-black" : "text-gray-200"}>
                                                        {phone[i] || '_'}
                                                    </span>
                                                    {i === 3 && <span className="text-black/20 mx-2">-</span>}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                        <Button
                                            variant="secondary"
                                            onClick={handleBackspace}
                                            className="h-20 w-20 text-2xl shrink-0"
                                        >
                                            ⌫
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                        <Button
                                            key={num}
                                            variant="outline"
                                            size="xl"
                                            onClick={() => handleNumClick(num.toString())}
                                            className="h-20 text-4xl font-black"
                                        >
                                            {num}
                                        </Button>
                                    ))}
                                    <Button
                                        variant="destructive"
                                        size="xl"
                                        onClick={handleClear}
                                        className="h-20 text-2xl font-black"
                                    >
                                        CLR
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="xl"
                                        onClick={() => handleNumClick('0')}
                                        className="h-20 text-4xl font-black"
                                    >
                                        0
                                    </Button>
                                    <Button
                                        size="xl"
                                        onClick={handleGo}
                                        disabled={phone.length < 10 || isLoading}
                                        className="h-20 text-3xl font-black bg-black text-[#E1FF01] hover:bg-black/90 disabled:opacity-30"
                                    >
                                        {isLoading ? '...' : 'GO'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* View 2: Action (Dashboard) */}
                {view === 'action' && (
                    <div className="h-full flex flex-col md:flex-row gap-4 p-4 max-w-screen-2xl mx-auto animate-in fade-in zoom-in-95 duration-300 overflow-hidden">
                        {/* Balance Card */}
                        <Card className="flex-1 md:w-1/3 p-6 bg-[#E1FF01] flex flex-col justify-center items-center text-center shadow-brutalist-lg min-h-0">
                            <h2 className="text-xl font-black uppercase tracking-widest mb-2">You Have</h2>
                            <div className="text-[8rem] xl:text-[10rem] font-black leading-none tracking-tighter tabular-nums drop-shadow-[4px_4px_0px_#000]">
                                {points}
                            </div>
                            <p className="mt-4 text-2xl font-black uppercase">Points</p>
                        </Card>

                        {/* Actions Region */}
                        <div className="flex-[2] flex flex-col gap-4 min-h-0">
                            {/* Add Points */}
                            <div className="flex-1 bg-white border-4 border-black p-4 shadow-brutalist flex flex-col gap-2 min-h-0 overflow-y-auto">
                                <h3 className="text-2xl font-black uppercase flex items-center gap-2 sticky top-0 bg-white z-10">
                                    <span className="w-8 h-8 bg-black text-[#E1FF01] flex items-center justify-center font-black text-lg">+</span>
                                    Add Points
                                </h3>
                                <div className="grid grid-cols-4 gap-3 flex-1">
                                    {options.filter(o => o.type === 'add').map(opt => (
                                        <Button
                                            key={opt.id}
                                            disabled={isLoading}
                                            size="xl"
                                            onClick={() => handleAddPoint(opt.value)}
                                            className="h-full w-full text-2xl lg:text-3xl font-black px-2 whitespace-normal leading-tight"
                                        >
                                            {opt.label}
                                        </Button>
                                    ))}
                                    <Button
                                        disabled={isLoading}
                                        variant="outline"
                                        size="xl"
                                        onClick={() => setShowCustomInput(true)}
                                        className="h-full w-full text-xl lg:text-2xl font-black uppercase px-2"
                                    >
                                        Custom
                                    </Button>
                                </div>
                            </div>

                            {/* Redeem Points */}
                            <div className="flex-1 bg-black text-white p-4 shadow-brutalist flex flex-col gap-2 min-h-0 overflow-y-auto">
                                <h3 className="text-2xl font-black uppercase flex items-center gap-2 sticky top-0 bg-black z-10">
                                    <span className="w-8 h-8 bg-[#E1FF01] text-black flex items-center justify-center font-black text-lg">★</span>
                                    Redeem Rewards
                                </h3>
                                <div className="grid grid-cols-3 gap-3 flex-1">
                                    {options.filter(o => o.type === 'redeem').map(opt => (
                                        <Button
                                            key={opt.id}
                                            disabled={isLoading}
                                            size="xl"
                                            onClick={() => handleRedeem(opt.value)}
                                            className="h-full w-full bg-white text-black border-4 border-[#E1FF01] shadow-none hover:bg-[#E1FF01] hover:translate-x-0 hover:translate-y-0 px-2 whitespace-normal"
                                        >
                                            <div className="flex flex-col items-center w-full">
                                                <span className="text-sm font-bold uppercase mb-1 whitespace-nowrap">-{opt.value} PTS</span>
                                                <span className="text-center text-lg lg:text-xl font-black leading-tight break-words w-full">{opt.label}</span>
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Custom Amount Overlay */}
            {showCustomInput && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-8 animate-in fade-in duration-200">
                    <Card className="w-full max-w-2xl p-10 bg-white shadow-brutalist-lg">
                        <CardContent className="p-0 flex flex-col gap-10">
                            <div className="flex justify-between items-center">
                                <h3 className="text-4xl font-black uppercase">Custom Amount</h3>
                                <Button variant="ghost" onClick={() => setShowCustomInput(false)}>
                                    <X className="h-10 w-10" />
                                </Button>
                            </div>

                            <div className="bg-white border-4 border-black h-32 flex items-center justify-center text-7xl font-black shadow-inner">
                                {customAmount || '0'}
                            </div>

                            <div className="grid grid-cols-3 gap-6">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                    <Button
                                        key={num}
                                        variant="outline"
                                        size="xl"
                                        onClick={() => handleCustomNumClick(num.toString())}
                                        className="h-28 text-5xl font-black"
                                    >
                                        {num}
                                    </Button>
                                ))}
                                <Button onClick={handleCustomClear} variant="destructive" size="xl" className="h-28 text-4xl font-black" disabled={isLoading}>C</Button>
                                <Button onClick={() => handleCustomNumClick('0')} variant="outline" size="xl" className="h-28 text-5xl font-black" disabled={isLoading}>0</Button>
                                <Button onClick={handleCustomSubmit} size="xl" className="h-28 text-4xl font-black bg-black text-[#E1FF01] disabled:opacity-50" disabled={isLoading}>
                                    {isLoading ? '...' : 'OK'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Global Message Toast */}
            {message && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 px-12 py-6 bg-black text-[#E1FF01] text-3xl font-black uppercase border-4 border-[#E1FF01] shadow-brutalist-lg animate-in slide-in-from-bottom-8 fade-in duration-300 z-50 flex items-center gap-6 whitespace-nowrap">
                    {message}
                </div>
            )}
        </div>
    );
}
