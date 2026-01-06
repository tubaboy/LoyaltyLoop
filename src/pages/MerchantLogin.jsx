import React, { useState } from 'react';
import { store } from '../lib/store';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export default function MerchantLogin({ onLogin }) {
    const [merchantId, setMerchantId] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (merchantId.trim()) {
            store.login(merchantId);
            onLogin(); // Notify parent to switch view
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#E1FF01] p-4 font-mono">
            <Card className="w-full max-w-xl p-8">
                <CardHeader className="text-center space-y-4">
                    <CardTitle className="text-6xl font-black uppercase tracking-tighter">Loyalty Loop</CardTitle>
                    <CardDescription className="text-xl font-bold text-black uppercase">Merchant Terminal Access</CardDescription>
                </CardHeader>
                <CardContent className="mt-8">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-4">
                            <label htmlFor="merchantId" className="text-2xl font-black uppercase">
                                Store ID
                            </label>
                            <input
                                type="text"
                                id="merchantId"
                                value={merchantId}
                                onChange={(e) => setMerchantId(e.target.value)}
                                className="flex h-20 w-full border-4 border-black bg-white px-6 py-4 text-3xl font-bold focus-visible:outline-none shadow-brutalist focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none transition-all"
                                placeholder="ENTER STORE ID"
                                required
                            />
                        </div>
                        <Button type="submit" size="xl" className="w-full hover:bg-black hover:text-[#E1FF01]">
                            ENTER DASHBOARD
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
