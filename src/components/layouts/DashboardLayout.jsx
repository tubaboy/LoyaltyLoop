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
        <div className="theme-saas flex h-screen bg-[#F0F2F5]">
            {/* Sidebar */}
            <aside className="w-68 sidebar-bg hidden md:flex flex-col text-white shadow-xl z-20">
                <div className="p-8 flex flex-col items-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                        <Users className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">
                        {role === 'admin' ? 'Super Admin' : 'Merchant'}
                    </p>
                    <h2 className="text-xl font-bold mb-1">LoyaltyLoop</h2>
                    <p className="text-[11px] text-white/50 font-medium truncate w-full text-center px-4">
                        {userEmail}
                    </p>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            end={link.end}
                            className={({ isActive }) =>
                                `flex items-center px-6 py-4 rounded-2xl text-sm font-semibold transition-all duration-300 ${isActive
                                    ? 'bg-white text-teal-700 shadow-lg translate-x-1'
                                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                                }`
                            }
                        >
                            <link.icon className="w-5 h-5 mr-4" />
                            {link.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-6">
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-6 py-4 text-sm font-semibold text-white/70 rounded-2xl hover:bg-white/10 hover:text-white transition-all"
                    >
                        <LogOut className="w-5 h-5 mr-4" />
                        登出系統
                    </button>
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
