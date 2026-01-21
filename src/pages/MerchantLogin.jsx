import React, { useState, useEffect } from 'react';
import { store } from '../lib/store';
import { supabase } from '../lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, XCircle, Info } from 'lucide-react';

const StatusAlert = ({ message, type = 'error', onClear }) => {
    if (!message) return null;

    const styles = {
        error: "bg-red-50/80 border-red-200/50 text-red-800",
        warning: "bg-amber-50/80 border-amber-200/50 text-amber-800",
        info: "bg-teal-50/80 border-teal-200/50 text-teal-800"
    };

    const icons = {
        error: <XCircle className="w-5 h-5 text-red-500" />,
        warning: <AlertCircle className="w-5 h-5 text-amber-500" />,
        info: <Info className="w-5 h-5 text-teal-500" />
    };

    return (
        <div className={`p-4 rounded-2xl border backdrop-blur-md shadow-soft-sm animate-in slide-in-from-top-2 fade-in duration-300 ${styles[type]}`}>
            <div className="flex gap-3">
                <div className="shrink-0 mt-0.5">{icons[type]}</div>
                <div>
                    <p className="text-sm font-black leading-tight mb-1">系統提示</p>
                    <p className="text-xs font-bold opacity-90 leading-relaxed">{message}</p>
                </div>
            </div>
        </div>
    );
};

export default function MerchantLogin({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Check for persisted error (handles silent logout issue)
        const savedError = sessionStorage.getItem('login_error');
        if (savedError) {
            setError(savedError);
            sessionStorage.removeItem('login_error');
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);

        try {
            const { session } = await store.login(email, password);
            if (!session?.user) throw new Error("登入資訊獲取失敗");

            // 1. Check user role
            const role = await store.getUserRole(session.user);

            // 2. If merchant, verify status
            if (role === 'merchant') {
                const { data: merchantData, error: statusError } = await supabase
                    .from('merchants')
                    .select('status')
                    .eq('id', session.user.id)
                    .single();

                if (statusError) throw new Error("讀取帳號狀態失敗");

                if (merchantData.status !== 'active') {
                    const statusMsg = merchantData.status === 'suspended'
                        ? '此帳號已被系統管理員停權。如有疑問，請聯絡客服。'
                        : '您的帳號目前暫停服務，可能是因為合約到期或手動設定，請聯絡管理員確認。';

                    // PERSIST: Save error before triggering logout cleanup
                    sessionStorage.setItem('login_error', statusMsg);
                    await store.logout();
                    // Component will re-mount/re-render, error will be picked up by useEffect
                    return;
                }
            }

            if (onLogin) onLogin();
        } catch (err) {
            console.error(err);
            setError(err.message || '登入失敗，請檢查帳號密碼');
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

                {error && <StatusAlert message={error} type="error" />}

                {message && <StatusAlert message={message} type="info" />}

                <div className="pt-2">
                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full h-14 text-lg font-black rounded-2xl shadow-teal-200 shadow-xl"
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : '登入系統'}
                    </Button>
                </div>
            </form>

            <div className="text-center text-xs text-slate-500 mt-4 font-medium">
                商家帳號由管理員開立，若有疑問請連繫系統管理員。
            </div>
        </div>
    );
}
