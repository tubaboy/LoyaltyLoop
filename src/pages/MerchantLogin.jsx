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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold">Loyalty Loop</CardTitle>
                    <CardDescription>Merchant Terminal Access</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="merchantId" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Store ID
                            </label>
                            <input
                                type="text"
                                id="merchantId"
                                value={merchantId}
                                onChange={(e) => setMerchantId(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Enter Store ID"
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full text-lg py-6">
                            Enter Dashboard
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
