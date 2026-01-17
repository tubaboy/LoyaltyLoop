import React, { useState } from 'react';
import { store } from '../lib/store';
import { supabase } from '../lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        <div className="space-y-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-900 font-bold ml-1">電子郵件信箱</Label>
                    <div className="mt-1">
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@loyaltyloop.com"
                            className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-teal-500/30 transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password" name="password" className="text-slate-900 font-bold ml-1">登入密碼</Label>
                    <div className="mt-1">
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-teal-500/30 transition-all font-medium"
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold animate-in shake border border-red-100/50">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="p-4 bg-teal-50 text-teal-700 rounded-xl text-sm font-bold border border-teal-100/50">
                        {message}
                    </div>
                )}

                <div className="pt-2">
                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full h-14 text-lg font-black rounded-2xl shadow-teal-200 shadow-xl"
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (isSignUp ? '建立管理員帳號' : '登入系統')}
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
                <div className="text-center text-xs text-slate-500 mt-4 font-medium">
                    商家帳號由管理員開立，若有疑問請連繫系統管理員。
                </div>
            )}
        </div>
    );
}
