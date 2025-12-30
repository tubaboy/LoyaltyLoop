import React, { useState, useEffect } from 'react';
import { store } from '../lib/store';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function CustomerTerminal({ onLogout }) {
    const [phone, setPhone] = useState('');
    const [points, setPoints] = useState(null); // null means no user selected
    const [message, setMessage] = useState('');

    // Keypad for iPad friendliness
    const handleNumClick = (num) => {
        if (phone.length < 10) {
            setPhone(prev => prev + num);
            setPoints(null); // Reset points search when typing
            setMessage('');
        }
    };

    const handleClear = () => {
        setPhone('');
        setPoints(null);
        setMessage('');
    };

    const handleBackspace = () => {
        setPhone(prev => prev.slice(0, -1));
        setPoints(null);
        setMessage('');
    };

    // Search/Load User
    const handleCheckPoints = () => {
        if (phone.length < 4) return;
        const p = store.getPoints(phone);
        setPoints(p);
        setMessage('');
    };

    // Operations
    const handleAddPoint = (amount) => {
        const newPoints = store.addPoints(phone, amount);
        setPoints(newPoints);
        setMessage(`Added ${amount} Point${amount > 1 ? 's' : ''}! 🎉`);
        setTimeout(() => setMessage(''), 2000);
    };

    const handleRedeem = (cost) => {
        const success = store.redeemPoints(phone, cost);
        if (success !== false) {
            setPoints(success);
            setMessage(`Redeemed ${cost} points! 🎁`);
        } else {
            setMessage('Insufficient points! ⚠️');
        }
        setTimeout(() => setMessage(''), 2000);
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* Header */}
            <header className="bg-white shadow-sm p-4 flex justify-between items-center border-b">
                <h1 className="text-xl font-bold text-gray-800">Loyalty Terminal</h1>
                <Button variant="ghost" onClick={onLogout} className="text-muted-foreground hover:text-destructive">
                    Logout
                </Button>
            </header>

            <div className="flex-1 flex flex-col md:flex-row p-4 gap-4 max-w-6xl mx-auto w-full">
                {/* Left: Keypad */}
                <Card className="w-full md:w-1/2 flex flex-col shadow-lg border-0">
                    <CardContent className="p-6 flex flex-col h-full gap-6">
                        <div>
                            <label className="block text-muted-foreground text-sm mb-2">Customer Phone Number</label>
                            <div className="flex gap-2">
                                <div className="w-full text-5xl font-mono p-4 bg-gray-50 rounded-md border text-center text-foreground min-h-[5.5rem] flex items-center justify-center capitalize gap-3">
                                    {Array.from({ length: 10 }).map((_, i) => (
                                        <React.Fragment key={i}>
                                            <span className={phone[i] ? "text-foreground" : "text-muted-foreground/30"}>
                                                {phone[i] || '_'}
                                            </span>
                                            {i === 3 && <span className="text-muted-foreground/30 mx-1">-</span>}
                                        </React.Fragment>
                                    ))}
                                </div>
                                <Button
                                    variant="secondary"
                                    onClick={handleBackspace}
                                    className="h-auto w-20 text-xl"
                                >
                                    ⌫
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 flex-1">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                <Button
                                    key={num}
                                    variant="outline"
                                    onClick={() => handleNumClick(num.toString())}
                                    className="text-3xl font-normal h-auto py-6 shadow-sm hover:bg-accent/50 active:scale-95 transition-all"
                                >
                                    {num}
                                </Button>
                            ))}
                            <Button
                                variant="destructive"
                                onClick={handleClear}
                                className="text-xl h-auto active:scale-95 transition-all"
                            >
                                CLR
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => handleNumClick('0')}
                                className="text-3xl font-normal h-auto py-6 shadow-sm hover:bg-accent/50 active:scale-95 transition-all"
                            >
                                0
                            </Button>
                            <Button
                                onClick={handleCheckPoints}
                                className="text-xl font-bold h-auto active:scale-95 transition-all"
                            >
                                GO
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Right: Dashboard */}
                <Card className="w-full md:w-1/2 relative overflow-hidden shadow-lg border-0">
                    <CardContent className="p-6 h-full flex flex-col">
                        {points === null ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                                <div className="text-6xl mb-4">👋</div>
                                <p className="text-xl">Enter phone & press GO</p>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col gap-4">
                                <div className="text-center py-6 bg-primary/5 rounded-xl border border-primary/10">
                                    <span className="text-sm text-muted-foreground uppercase tracking-widest font-semibold">Current Balance</span>
                                    <div className="text-8xl font-black text-primary mt-2 font-mono tracking-tighter">
                                        {points}
                                    </div>
                                </div>

                                {/* Add Points Section */}
                                <div className="flex-1 flex flex-col gap-2 mt-auto">
                                    <h3 className="text-muted-foreground font-medium text-sm">Add Points</h3>
                                    <div className="grid grid-cols-3 gap-3 h-full">
                                        {[1, 2, 3].map(amt => (
                                            <Button
                                                key={amt}
                                                onClick={() => handleAddPoint(amt)}
                                                className="h-full flex flex-col items-center justify-center text-3xl font-bold bg-green-600 hover:bg-green-700 active:scale-95 transition-all text-white"
                                            >
                                                +{amt}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {/* Redeem Section */}
                                <div className="flex-1 flex flex-col gap-2">
                                    <h3 className="text-muted-foreground font-medium text-sm">Redeem Rewards</h3>
                                    <div className="grid grid-cols-3 gap-3 h-full">
                                        {[10, 15, 20].map(amt => (
                                            <Button
                                                key={amt}
                                                onClick={() => handleRedeem(amt)}
                                                className="h-full flex flex-col items-center justify-center text-3xl font-bold bg-amber-500 hover:bg-amber-600 active:scale-95 transition-all text-white"
                                            >
                                                -{amt}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {/* Feedback Toast */}
                                {message && (
                                    <div className="absolute top-6 left-0 right-0 mx-auto w-max px-6 py-3 bg-foreground/90 text-background rounded-full shadow-2xl animate-in slide-in-from-top-4 fade-in duration-300 z-50">
                                        {message}
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
