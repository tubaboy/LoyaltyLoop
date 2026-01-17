import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Users, Store, CreditCard, LayoutDashboard, ChevronRight, Target, TrendingUp, Sparkles, Monitor } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { store } from '../../lib/store';

const MerchantDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalCustomers: 0,
        totalPoints: 0,
        activeBranches: 0,
        recentActivity: [
            { name: 'Mon', points: 400 },
            { name: 'Tue', points: 300 },
            { name: 'Wed', points: 600 },
            { name: 'Thu', points: 800 },
            { name: 'Fri', points: 500 },
            { name: 'Sat', points: 900 },
            { name: 'Sun', points: 700 },
        ]
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const merchantId = await store.getMerchantId();
            if (!merchantId) return;

            const { count: customerCount } = await supabase
                .from('customers')
                .select('*', { count: 'exact', head: true })
                .eq('merchant_id', merchantId);

            const { data: transData } = await supabase
                .from('transactions')
                .select('amount')
                .eq('merchant_id', merchantId)
                .eq('type', 'add');

            const totalPoints = transData?.reduce((acc, curr) => acc + curr.amount, 0) || 0;

            const { count: branchCount } = await supabase
                .from('branches')
                .select('*', { count: 'exact', head: true })
                .eq('merchant_id', merchantId)
                .eq('is_active', true);

            setStats(prev => ({
                ...prev,
                totalCustomers: customerCount || 0,
                totalPoints: totalPoints,
                activeBranches: branchCount || 0,
            }));
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        { title: '總會員人數', value: stats.totalCustomers, icon: Users, color: 'text-teal-600', bg: 'bg-teal-50', growth: '+12.4%' },
        { title: '累積發放點數', value: stats.totalPoints.toLocaleString(), icon: CreditCard, color: 'text-cyan-600', bg: 'bg-cyan-50', growth: '+8.2%' },
        { title: '營運分店數', value: stats.activeBranches, icon: Store, color: 'text-indigo-600', bg: 'bg-indigo-50', growth: '+0%' },
    ];

    if (loading) return (
        <div className="h-full flex flex-col items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">大數據分析中...</p>
        </div>
    );

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20">
                            <Sparkles className="w-7 h-7" />
                        </div>
                        <h2 className="text-4xl font-black tracking-tighter text-slate-900">營運指揮中心</h2>
                    </div>
                    <p className="text-slate-500 font-medium ml-1 text-lg">掌握您的忠誠度計畫執行成效與顧客成長動態。</p>
                </div>
                <Button
                    onClick={() => navigate('/terminal')}
                    className="button-premium h-16 px-10 rounded-2xl text-lg shadow-xl shadow-teal-600/20 flex items-center gap-4 group"
                >
                    <Monitor className="h-6 w-6 group-hover:scale-110 transition-transform" />
                    <span>啟動集點終端</span>
                </Button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {statCards.map((card, i) => (
                    <Card key={i} className="border-none shadow-soft-lg p-10 rounded-[2.5rem] bg-white group relative overflow-hidden transition-all hover:shadow-soft-2xl active:scale-[0.98]">
                        <div className={`absolute top-0 right-0 w-32 h-32 ${card.bg} rounded-bl-full -mr-12 -mt-12 transition-all duration-700 group-hover:scale-150 opacity-40`} />

                        <div className="flex flex-col relative z-10">
                            <div className="flex items-center justify-between mb-8">
                                <div className={`${card.bg} p-4 rounded-2xl`}>
                                    <card.icon className={`h-8 w-8 ${card.color}`} />
                                </div>
                                <div className="text-emerald-500 font-black text-sm flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-full">
                                    <TrendingUp className="w-4 h-4" /> {card.growth}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-slate-400 font-black text-xs uppercase tracking-[0.2em]">{card.title}</h3>
                                <div className="text-6xl font-black text-slate-900 tracking-tighter tabular-nums leading-tight">
                                    {card.value}
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Charts & Goals Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                {/* Main Activity Chart */}
                <Card className="xl:col-span-8 border-none shadow-soft-lg rounded-[3rem] bg-white overflow-hidden flex flex-col">
                    <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">點數發放趨勢</h3>
                        </div>
                        <div className="flex gap-2">
                            <div className="px-5 py-2 bg-white rounded-xl shadow-sm text-xs font-black text-slate-600 border border-slate-100">近 7 日數據</div>
                        </div>
                    </div>
                    <CardContent className="p-10 flex-1 h-[450px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.recentActivity}>
                                <defs>
                                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 700 }}
                                    dy={15}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 700 }}
                                    dx={-15}
                                />
                                <Tooltip
                                    cursor={{ stroke: '#0d9488', strokeWidth: 2, strokeDasharray: '6 6' }}
                                    contentStyle={{
                                        borderRadius: '24px',
                                        border: 'none',
                                        boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)',
                                        padding: '20px',
                                        background: 'rgba(255, 255, 255, 0.95)',
                                        backdropFilter: 'blur(10px)'
                                    }}
                                    itemStyle={{ color: '#0f172a', fontWeight: 900, fontSize: '18px' }}
                                    labelStyle={{ color: '#64748b', fontWeight: 700, marginBottom: '8px', fontSize: '14px' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="points"
                                    stroke="#0d9488"
                                    strokeWidth={6}
                                    fillOpacity={1}
                                    fill="url(#chartGradient)"
                                    animationDuration={2000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Performance Goals */}
                <Card className="xl:col-span-4 border-none shadow-soft-lg rounded-[3rem] bg-white flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-[80px] -mr-32 -mt-32" />

                    <CardHeader className="p-10 pb-0 relative z-10">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 border border-teal-100/50">
                                <Target className="w-6 h-6" />
                            </div>
                            <CardTitle className="text-2xl font-black text-slate-900">績效目標進度</CardTitle>
                        </div>
                    </CardHeader>

                    <CardContent className="p-10 pt-4 flex flex-col items-center flex-1 justify-center relative z-10 text-center">
                        <div className="relative w-64 h-64 flex items-center justify-center mb-10 group">
                            <div className="absolute inset-0 bg-teal-500/5 rounded-full blur-2xl group-hover:bg-teal-500/10 transition-colors duration-700" />
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="128" cy="128" r="110" stroke="#f1f5f9" strokeWidth="18" fill="transparent" />
                                <circle
                                    cx="128"
                                    cy="128"
                                    r="110"
                                    stroke="#0d9488"
                                    strokeWidth="18"
                                    fill="transparent"
                                    strokeDasharray={2 * Math.PI * 110}
                                    strokeDashoffset={2 * Math.PI * 110 * (1 - 0.75)}
                                    strokeLinecap="round"
                                    className="drop-shadow-[0_4px_12px_rgba(13,148,136,0.2)]"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-7xl font-black text-slate-900 tracking-tighter">75</span>
                                <span className="text-sm font-black text-teal-600 uppercase tracking-widest mt-1">PERCENT</span>
                            </div>
                        </div>

                        <div className="space-y-6 w-full px-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400">
                                    <span>Monthly Goal</span>
                                    <span className="text-slate-900">50,000 PTS</span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                    <div className="h-full bg-teal-500 w-[75%] rounded-full" />
                                </div>
                            </div>
                            <p className="text-slate-500 font-bold text-sm leading-relaxed">
                                目前已發放發放 37,500 點，<br />
                                預計本月達成率可達 102%。
                            </p>
                        </div>

                        <Button variant="ghost" className="w-full mt-12 h-16 rounded-[2rem] text-teal-600 font-black hover:bg-teal-50 group border border-teal-100/50 transition-all">
                            發送報表至 Email <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-2" />
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default MerchantDashboard;
