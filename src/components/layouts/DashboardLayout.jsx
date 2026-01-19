import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { store } from '../../lib/store';
import { supabase } from '../../lib/supabase';
import { LayoutDashboard, Store, Gift, Settings, Users, LogOut } from 'lucide-react';

const DashboardLayout = ({ role = 'merchant' }) => {
    const navigate = useNavigate();
    const [userEmail, setUserEmail] = React.useState('');

    React.useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserEmail(user.email);
            }
        };
        getUser();
    }, []);

    const handleLogout = async () => {
        await store.logout();
        navigate('/login');
    };

    const merchantLinks = [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
        { to: '/dashboard/branches', label: '分店管理', icon: Store },
        { to: '/dashboard/rewards', label: '兌換項目', icon: Gift },
        { to: '/dashboard/settings', label: '設定', icon: Settings },
    ];

    const adminLinks = [
        { to: '/admin', label: '商家列表', icon: Users, end: true },
    ];

    const links = role === 'admin' ? adminLinks : merchantLinks;

    return (
        <div className="theme-saas flex h-screen bg-slate-50 font-sans">
            {/* Sidebar */}
            <aside className="w-72 sidebar-bg hidden md:flex flex-col text-white shadow-2xl z-20 relative overflow-hidden">
                {/* Brand Logo Section */}
                <div className="p-10 relative z-10 flex flex-col items-center border-b border-white/5 bg-white/5 backdrop-blur-sm">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl shadow-teal-500/20 rotate-3 transition-transform hover:rotate-0 duration-500 p-3">
                        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="LoyaltyLoop Logo" className="w-full h-full object-contain mix-blend-multiply" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-2xl font-black tracking-tighter mb-1">
                            Loyalty<span className="text-teal-400">Loop</span>
                        </h2>
                        <span className="inline-block px-3 py-1 bg-teal-500/10 text-teal-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-teal-500/20 mb-3">
                            {role === 'admin' ? 'SUPER ADMIN' : 'MERCHANT CONSOLE'}
                        </span>
                    </div>
                    <div className="w-full mt-4 p-4 rounded-2xl bg-black/20 border border-white/5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                            {userEmail && userEmail[0] ? userEmail[0].toUpperCase() : ''}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">目前帳號</p>
                            <p className="text-xs text-slate-200 font-medium truncate">{userEmail}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-5 space-y-2 mt-8 overflow-y-auto">
                    {links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            end={link.end}
                            className={({ isActive }) =>
                                `flex items-center px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-300 group ${isActive
                                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                }`
                            }
                        >
                            <link.icon className={`w-5 h-5 mr-4 transition-transform group-hover:scale-110`} />
                            {link.label}
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom Action */}
                <div className="p-8 border-t border-white/5">
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-6 py-4 text-sm font-bold text-red-400 rounded-2xl hover:bg-red-500/10 hover:text-red-300 transition-all group"
                    >
                        <LogOut className="w-5 h-5 mr-4 group-hover:-translate-x-1 transition-transform" />
                        安全登出
                    </button>
                    <div className="mt-6 text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                        v2.0.4 Pre-Release
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {/* Header for Mobile */}
                <header className="bg-white border-b border-slate-200 h-20 flex items-center justify-between px-8 sticky top-0 z-10 w-full md:hidden">
                    <h1 className="text-xl font-bold text-teal-700 uppercase tracking-tighter">LoyaltyLoop</h1>
                    <button className="p-2 bg-slate-100 rounded-lg">
                        <LayoutDashboard className="w-6 h-6 text-slate-600" />
                    </button>
                </header>

                {/* Content Area */}
                <div className="p-8 lg:p-12 max-w-7xl mx-auto min-h-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};


export default DashboardLayout;
