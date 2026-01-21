import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { store } from '../lib/store';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Monitor, Loader2, Maximize } from 'lucide-react';

const TerminalLogin = () => {
    const navigate = useNavigate();
    const [key, setKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const toggleFullscreen = () => {
        const docEl = document.documentElement;
        const request = docEl.requestFullscreen ||
            docEl.mozRequestFullScreen ||
            docEl.webkitRequestFullScreen ||
            docEl.msRequestFullscreen;

        if (request && !document.fullscreenElement) {
            try {
                const promise = request.call(docEl);
                if (promise && promise.catch) {
                    promise.catch(err => console.error("Fullscreen request failed:", err));
                }
            } catch (err) {
                console.error("Fullscreen execution failed:", err);
            }
        } else if (!request) {
            alert("您的瀏覽器似乎不支援自動切換全螢幕，請手動縮放。");
        }
    };

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        console.log("[TerminalLogin] handleLogin triggered with key:", key);

        if (key.length < 8) {
            setError('請輸入完整的 8 位數金鑰');
            return;
        }

        // --- Safe Fullscreen Trigger ---
        // Attempt to trigger fullscreen in a detached way so it doesn't block the login flow
        const docEl = document.documentElement;
        const request = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
        if (request && !document.fullscreenElement) {
            try {
                const fsPromise = request.call(docEl);
                if (fsPromise && typeof fsPromise.catch === 'function') {
                    fsPromise.catch(() => { /* Silent fail */ });
                }
            } catch (fsErr) {
                console.warn("[TerminalLogin] Fullscreen failed silently:", fsErr);
            }
        }
        // -------------------------------

        setError('');
        setLoading(true);
        try {
            console.log("[TerminalLogin] Verifying branch key...");
            const branchData = await store.verifyBranchKey(key);
            console.log("[TerminalLogin] Verification result:", branchData);

            if (branchData) {
                if (branchData.is_active === false) {
                    setError('該分店狀態為暫停營運，請聯絡企業管理員');
                    setLoading(false);
                    return;
                }
                store.setTerminalSession(branchData);
                navigate('/terminal');
            } else {
                setError('找不到此金鑰對應的分店，請確認後再試。');
            }
        } catch (err) {
            console.error("[TerminalLogin] Login error:", err);
            setError('連線錯誤，請確認網路狀態後再試。');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans relative overflow-y-auto">
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-400/10 rounded-full" style={{ filter: 'blur(var(--ui-blur-lg))' }} />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-400/10 rounded-full" style={{ filter: 'blur(var(--ui-blur-lg))' }} />
            </div>

            <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="absolute top-6 left-6 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all"
            >
                <ArrowLeft className="mr-2 h-5 w-5" /> 返回首頁
            </Button>

            <div className="bg-white rounded-[2.5rem] shadow-soft-2xl p-10 w-full max-w-md animate-in zoom-in-95 duration-500 relative z-10 border border-slate-100/50">
                <div className="text-center mb-10 flex flex-col items-center">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-soft-lg p-3">
                        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="LoyaltyLoop Logo" className="w-full h-full object-contain mix-blend-multiply" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">分店終端登入</h2>
                    <p className="text-slate-400 mt-3 font-medium">請輸入系統產生的 8 位數登入金鑰 (Key)</p>

                    <div className="mt-6 p-4 bg-teal-50 rounded-2xl border border-teal-100/50 flex flex-col items-center gap-2">
                        <p className="text-xs font-bold text-teal-600 uppercase tracking-widest">建議使用全螢幕模式</p>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={toggleFullscreen}
                            className="h-10 text-teal-700 hover:bg-white rounded-xl gap-2 font-bold transition-all shadow-sm hover:shadow-md"
                        >
                            <Maximize className="w-4 h-4" /> 點此開啟全螢幕
                        </Button>
                    </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-8">
                    <div>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={key}
                            onChange={(e) => setKey(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))}
                            placeholder="例如：12345678"
                            className="w-full text-center text-4xl font-black tracking-[0.2em] py-6 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-teal-500/30 focus:bg-white outline-none transition-all placeholder:text-slate-200 text-slate-800"
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-center font-bold text-sm animate-in shake border border-red-100">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading || key.length < 8}
                        variant="primary"
                        className="w-full h-16 text-xl font-black shadow-teal-200 shadow-xl"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="animate-spin h-5 w-5" />
                                驗證中...
                            </div>
                        ) : '進入集點系統'}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default TerminalLogin;
