import React, { useState } from 'react';
import { store } from '../lib/store';
import { supabase } from '../lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from 'lucide-react';

export default function MerchantLogin({ onLogin }) {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);

        try {
            if (isSignUp) {
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (signUpError) throw signUpError;

                if (data?.user?.identities?.length === 0) {
                    setMessage('該 Email 已被註冊，請直接登入');
                    setIsSignUp(false);
                } else {
                    setMessage('註冊成功！請告訴我你的 Email 以便幫你升級為 Admin。');
                }
            } else {
                await store.login(email, password);
                if (onLogin) onLogin();
            }
        } catch (err) {
            console.error(err);
            setError(err.message || '操作失敗');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                    <Label htmlFor="email">Email address</Label>
                    <div className="mt-2">
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-teal-600 sm:text-sm sm:leading-6"
                        />
                    </div>
                </div>

                <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="mt-2">
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-teal-600 sm:text-sm sm:leading-6"
                        />
                    </div>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {message && (
                    <Alert className="bg-teal-50 border-teal-200">
                        <AlertDescription className="text-teal-800 font-medium">{message}</AlertDescription>
                    </Alert>
                )}

                <div>
                    <Button
                        type="submit"
                        className="flex w-full justify-center rounded-md bg-teal-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
                        disabled={isLoading}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSignUp ? '註冊帳號' : 'Sign in'}
                    </Button>
                </div>
            </form>

            <div className="text-center">
                <button
                    type="button"
                    onClick={() => {
                        setIsSignUp(!isSignUp);
                        setError('');
                        setMessage('');
                    }}
                    className="text-sm font-medium text-teal-600 hover:text-teal-500 underline underline-offset-4"
                >
                    {isSignUp ? '已有帳號？返回登入' : '還沒有帳號？現在註冊一個'}
                </button>
            </div>

            {!isSignUp && (
                <div className="text-center text-xs text-slate-500 mt-4">
                    商家帳號由管理員開立，若有疑問請連繫系統管理員。
                </div>
            )}
        </div>
    );
}
