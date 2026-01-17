import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Monitor } from 'lucide-react';
import { Button } from "@/components/ui/button";

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-400/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/10 rounded-full blur-[100px]" />
            </div>

            <div className="z-10 text-center mb-16 px-4 flex flex-col items-center">
                <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-full flex items-center justify-center mb-10 shadow-soft-2xl p-4 md:p-6 animate-in zoom-in-50 duration-700">
                    <img src={`${import.meta.env.BASE_URL}logo.png`} alt="LoyaltyLoop Logo" className="w-full h-full object-contain mix-blend-multiply" />
                </div>
                <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter mb-6">
                    Loyalty<span className="text-teal-600">Loop</span>
                </h1>
                <p className="text-xl md:text-2xl text-slate-400 font-bold tracking-tight">智慧會員集點系統 • 您的顧客忠誠度專家</p>
            </div>

            <div className="z-10 grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-5xl">
                {/* Store Terminal Option */}
                <button
                    onClick={() => {
                        // Safe Fullscreen Trigger
                        const docEl = document.documentElement;
                        const request = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
                        if (request && !document.fullscreenElement) {
                            try {
                                const fsPromise = request.call(docEl);
                                if (fsPromise && typeof fsPromise.catch === 'function') {
                                    fsPromise.catch(() => { });
                                }
                            } catch (e) { }
                        }
                        navigate('/terminal-login');
                    }}
                    className="group relative bg-white rounded-[2.5rem] p-12 hover:-translate-y-2 transition-all duration-500 shadow-soft-xl hover:shadow-soft-2xl border border-slate-100 flex flex-col items-center md:items-start text-center md:text-left"
                >
                    <div className="w-20 h-20 bg-teal-50 rounded-[1.5rem] flex items-center justify-center mb-10 group-hover:bg-teal-600 transition-all duration-500 group-hover:rotate-6">
                        <Store className="w-10 h-10 text-teal-600 group-hover:text-white transition-colors" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-4">開啟門市集點終端</h2>
                    <p className="text-slate-400 text-lg font-medium leading-relaxed">
                        適用於現場櫃檯人員。需輸入分店專屬金鑰 (Key) 即可進入操作。
                    </p>
                    <div className="mt-12 flex items-center text-teal-600 font-black text-xl group-hover:translate-x-3 transition-all">
                        立刻開始 →
                    </div>
                </button>

                {/* Merchant Admin Option */}
                <button
                    onClick={() => navigate('/login')}
                    className="group relative bg-slate-900 rounded-[2.5rem] p-12 hover:-translate-y-2 transition-all duration-500 shadow-soft-2xl text-center md:text-left flex flex-col items-center md:items-start"
                >
                    <div className="w-20 h-20 bg-slate-800 rounded-[1.5rem] flex items-center justify-center mb-10 group-hover:bg-indigo-500 transition-all duration-500 group-hover:-rotate-6">
                        <Monitor className="w-10 h-10 text-slate-400 group-hover:text-white transition-colors" />
                    </div>
                    <h2 className="text-3xl font-black text-white mb-4">開啟商家管理系統</h2>
                    <p className="text-slate-400 text-lg font-medium leading-relaxed">
                        適用於經營者與管理員。需使用 Email 與密碼登入後台查看報表。
                    </p>
                    <div className="mt-12 flex items-center text-indigo-400 font-black text-xl group-hover:translate-x-3 transition-all">
                        管理後台 →
                    </div>
                </button>
            </div>

            <footer className="absolute bottom-10 text-slate-300 font-bold text-sm tracking-widest uppercase">
                © 2026 LoyaltyLoop Inc.
            </footer>
        </div>

    );
};

export default LandingPage;
