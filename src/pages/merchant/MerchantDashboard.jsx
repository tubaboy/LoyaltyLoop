import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Users, Store, CreditCard, LayoutDashboard, ChevronRight } from 'lucide-react';
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
        { title: '總會員數', value: stats.totalCustomers, icon: Users, color: 'text-teal-600', bg: 'bg-teal-50' },
        { title: '累積發放點數', value: stats.totalPoints.toLocaleString(), icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
        { title: '活躍分店', value: stats.activeBranches, icon: Store, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    ];

    if (loading) return <div className="flex items-center justify-center h-64 text-slate-400 font-medium">載入中...</div>;

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">營運分析總覽</h2>
                    <p className="text-slate-500 mt-2 font-medium">歡迎回來，查看您目前的忠誠度計畫執行成效。</p>
                </div>
                <Button
                    onClick={() => navigate('/terminal')}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-6 rounded-2xl shadow-lg shadow-teal-600/20 transition-all font-bold text-lg"
                >
                    <LayoutDashboard className="mr-3 h-6 w-6" /> 開啟門市集點終端
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {statCards.map((card, i) => (
                    <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow p-8 rounded-3xl bg-white group overflow-hidden relative">
                        <div className={`absolute top-0 right-0 w-32 h-32 ${card.bg} rounded-bl-full -mr-12 -mt-12 transition-transform group-hover:scale-110 opacity-40`} />
                        <CardHeader className="p-0 mb-6 flex flex-row items-center justify-between z-10 relative">
                            <CardTitle className="text-slate-500 font-bold text-sm uppercase tracking-widest">{card.title}</CardTitle>
                            <div className={`${card.bg} p-3 rounded-2xl`}>
                                <card.icon className={`h-6 w-6 ${card.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 z-10 relative">
                            <div className="text-5xl font-black text-slate-900 tracking-tighter tabular-nums">{card.value}</div>
                            <div className="mt-4 flex items-center text-xs font-bold">
                                <span className="text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg mr-2">↑ 12%</span>
                                <span className="text-slate-400 uppercase tracking-tighter">較上個月成長</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Middle Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 border-none shadow-sm p-8 rounded-3xl bg-white">
                    <CardHeader className="p-0 mb-8 flex flex-row items-center justify-between">
                        <CardTitle className="text-xl font-extrabold text-slate-800">趨勢圖表</CardTitle>
                        <div className="flex gap-2">
                            <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-bold">點數發放</span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.recentActivity}>
                                <defs>
                                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dx={-10} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                />
                                <Area type="monotone" dataKey="points" stroke="#0d9488" strokeWidth={4} fillOpacity={1} fill="url(#chartGradient)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm p-8 rounded-3xl bg-white flex flex-col justify-between overflow-hidden">
                    <CardHeader className="p-0 mb-8">
                        <CardTitle className="text-xl font-extrabold text-slate-800">目標進度</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 flex flex-col items-center flex-1 justify-center">
                        <div className="relative w-48 h-48 flex items-center justify-center mb-6">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="96" cy="96" r="80" stroke="#f1f5f9" strokeWidth="16" fill="transparent" />
                                <circle cx="96" cy="96" r="80" stroke="#0d9488" strokeWidth="16" fill="transparent" strokeDasharray={2 * Math.PI * 80} strokeDashoffset={2 * Math.PI * 80 * (1 - 0.75)} strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <span className="text-4xl font-black text-slate-900 tracking-tighter">75%</span>
                                <span className="text-xs font-bold text-slate-400 uppercase mt-1">達成率</span>
                            </div>
                        </div>
                        <p className="text-center text-slate-500 font-medium text-sm leading-relaxed px-4">
                            本月目標為 50,000 點 <br /> 目前已發放 37,500 點
                        </p>
                    </CardContent>
                    <Button variant="ghost" className="w-full mt-6 rounded-2xl py-4 text-teal-600 font-bold hover:bg-teal-50 group">
                        查看詳情 <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                </Card>
            </div>
        </div>
    );
};

export default MerchantDashboard;
