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
        <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
            {/* Header */}
            <header className="bg-white shadow-sm p-4 flex justify-between items-center border-b shrink-0 z-10">
                <div className="flex items-center gap-2">
                    {view === 'action' && (
                        <Button
                            variant="outline"
                            onClick={handleBack}
                            className="mr-2 gap-2 text-base h-10 px-4 border-gray-300 hover:bg-gray-100 hover:text-gray-900"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                    )}
                    <h1 className="text-xl font-bold text-gray-800">
                        {view === 'search' ? 'Loyalty Terminal' : `Customer: ${phone}`}
                    </h1>
                </div>
                <Button variant="ghost" onClick={onLogout} className="text-muted-foreground hover:text-destructive">
                    Logout
                </Button>
            </header>

            <main className="flex-1 overflow-hidden relative">
                {/* View 1: Search (Keypad) */}
                {view === 'search' && (
                    <div className="h-full flex items-center justify-center p-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <Card className="w-full max-w-md shadow-xl border-0">
                            <CardContent className="p-8 flex flex-col gap-8">
                                <div className="space-y-4">
                                    <label className="block text-center text-muted-foreground font-medium">
                                        Enter Customer Phone Number
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 bg-gray-50 border rounded-xl h-20 flex items-center justify-center text-4xl font-mono tracking-wider font-semibold shadow-inner">
                                            {Array.from({ length: 10 }).map((_, i) => (
                                                <React.Fragment key={i}>
                                                    <span className={phone[i] ? "text-foreground" : "text-muted-foreground/20"}>
                                                        {phone[i] || '_'}
                                                    </span>
                                                    {i === 3 && <span className="text-muted-foreground/20 mx-1">-</span>}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                        <Button
                                            variant="secondary"
                                            onClick={handleBackspace}
                                            className="h-20 w-20 text-2xl rounded-xl shrink-0"
                                        >
                                            ⌫
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                        <Button
                                            key={num}
                                            variant="outline"
                                            onClick={() => handleNumClick(num.toString())}
                                            className="h-24 text-4xl font-normal rounded-xl hover:bg-accent/50 active:scale-95 transition-all shadow-sm"
                                        >
                                            {num}
                                        </Button>
                                    ))}
                                    <Button
                                        variant="destructive"
                                        onClick={handleClear}
                                        className="h-24 text-xl font-bold rounded-xl active:scale-95 transition-all opacity-90 hover:opacity-100"
                                    >
                                        CLR
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => handleNumClick('0')}
                                        className="h-24 text-4xl font-normal rounded-xl hover:bg-accent/50 active:scale-95 transition-all shadow-sm"
                                    >
                                        0
                                    </Button>
                                    <Button
                                        onClick={handleGo}
                                        disabled={phone.length < 10 || isLoading}
                                        className="h-24 text-2xl font-bold rounded-xl active:scale-95 transition-all bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
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
                    <div className="h-full flex flex-col md:flex-row gap-6 p-6 max-w-7xl mx-auto animate-in fade-in zoom-in-95 duration-300">
                        {/* Balance Card */}
                        <Card className="flex-1 md:w-1/3 shadow-lg border-0 bg-primary/5 border-primary/20 flex flex-col justify-center items-center p-8 text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Current Balance</h2>
                            <div className="text-[10rem] font-black text-primary leading-none tracking-tighter tabular-nums">
                                {points}
                            </div>
                            <p className="mt-4 text-muted-foreground font-medium">Points Available</p>
                        </Card>

                        {/* Actions Region */}
                        <div className="flex-[2] flex flex-col gap-6">
                            {/* Add Points */}
                            <div className="flex-1 bg-white rounded-xl p-6 shadow-sm border flex flex-col gap-4">
                                <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                                    <span className="w-2 h-8 bg-green-500 rounded-full inline-block"></span>
                                    Add Points
                                </h3>
                                <div className="grid grid-cols-4 gap-4 flex-1">
                                    {options.filter(o => o.type === 'add').map(opt => (
                                        <Button
                                            key={opt.id}
                                            disabled={isLoading}
                                            onClick={() => handleAddPoint(opt.value)}
                                            className="h-full text-4xl font-bold bg-green-50 hover:bg-green-100 text-green-700 border-2 border-green-200 hover:border-green-300 active:scale-95 transition-all rounded-2xl shadow-sm disabled:opacity-50"
                                        >
                                            {opt.label}
                                        </Button>
                                    ))}
                                    <Button
                                        disabled={isLoading}
                                        onClick={() => setShowCustomInput(true)}
                                        className="h-full flex flex-col items-center justify-center text-xl font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 border-2 border-gray-200 hover:border-gray-300 active:scale-95 transition-all rounded-2xl shadow-sm disabled:opacity-50"
                                    >
                                        Custom
                                    </Button>
                                </div>
                            </div>

                            {/* Redeem Points */}
                            <div className="flex-1 bg-white rounded-xl p-6 shadow-sm border flex flex-col gap-4">
                                <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                                    <span className="w-2 h-8 bg-amber-500 rounded-full inline-block"></span>
                                    Redeem Rewards
                                </h3>
                                <div className="grid grid-cols-3 gap-4 flex-1">
                                    {options.filter(o => o.type === 'redeem').map(opt => (
                                        <Button
                                            key={opt.id}
                                            disabled={isLoading}
                                            onClick={() => handleRedeem(opt.value)}
                                            className="h-full text-3xl font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border-2 border-amber-200 hover:border-amber-300 active:scale-95 transition-all rounded-2xl shadow-sm disabled:opacity-50"
                                        >
                                            <div className="flex flex-col items-center">
                                                <span className="text-sm font-normal opacity-70 mb-1">-{opt.value}pts</span>
                                                <span className="text-center">{opt.label}</span>
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
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <Card className="w-full max-w-sm shadow-2xl border-0">
                        <CardContent className="p-6 flex flex-col gap-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold">Custom Amount</h3>
                                <Button variant="ghost" size="icon" onClick={() => setShowCustomInput(false)}>
                                    <X className="h-6 w-6" />
                                </Button>
                            </div>

                            <div className="bg-gray-50 border rounded-xl h-20 flex items-center justify-center text-4xl font-mono font-bold">
                                {customAmount || '0'}
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                    <Button
                                        key={num}
                                        variant="outline"
                                        onClick={() => handleCustomNumClick(num.toString())}
                                        className="h-16 text-2xl font-normal"
                                    >
                                        {num}
                                    </Button>
                                ))}
                                <Button onClick={handleCustomClear} variant="destructive" className="h-16 text-lg" disabled={isLoading}>C</Button>
                                <Button onClick={() => handleCustomNumClick('0')} variant="outline" className="h-16 text-2xl" disabled={isLoading}>0</Button>
                                <Button onClick={handleCustomSubmit} className="h-16 text-lg font-bold bg-green-600 hover:bg-green-700 text-white disabled:opacity-50" disabled={isLoading}>
                                    {isLoading ? '...' : 'OK'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Global Message Toast */}
            {message && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 px-8 py-4 bg-gray-900 text-white text-xl font-medium rounded-full shadow-2xl animate-in slide-in-from-bottom-8 fade-in duration-300 z-50 flex items-center gap-3 whitespace-nowrap">
                    {message}
                </div>
            )}
        </div>
    );
}
