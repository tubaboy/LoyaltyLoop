import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Users, Store, CreditCard, LayoutDashboard, ChevronRight, Target, TrendingUp, Sparkles, Monitor, Download, ArrowUpRight, ArrowDownLeft, FileText, Trophy, BarChart3, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { store } from '../../lib/store';

const MerchantDashboard = () => {
    const navigate = useNavigate();
    const [selectedBranchId, setSelectedBranchId] = useState('all');
    const [dateFilter, setDateFilter] = useState('today'); // today, week, month, custom
    const [customRange, setCustomRange] = useState({
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [branches, setBranches] = useState([]);
    const [transactions, setTransactions] = useState([]); // Recent 5
    const [allTransactions, setAllTransactions] = useState([]); // All in period for stats/rankings
    const [stats, setStats] = useState({
        totalCustomers: 0,
        newMembers: 0,
        periodIssued: 0,
        periodRedeemed: 0,
        lifetimeIssued: 0,
        periodAddCount: 0,
        burnRate: 0,
        redemptionCount: 0,
        activeBranches: 0,
    });
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (branches.length > 0 || selectedBranchId === 'all') {
            fetchStats();
        }
    }, [selectedBranchId, dateFilter, customRange]);

    const fetchInitialData = async () => {
        try {
            const merchantId = await store.getMerchantId();
            if (!merchantId) return;

            const { data: branchesData } = await supabase
                .from('branches')
                .select('*')
                .eq('merchant_id', merchantId)
                .order('name');

            setBranches(branchesData || []);
            fetchStats();
        } catch (error) {
            console.error("Error fetching initial data:", error);
        }
    };

    const fetchStats = async () => {
        try {
            setLoading(true);
            const merchantId = await store.getMerchantId();
            if (!merchantId) return;

            // 1. Calculate Date Range
            const now = new Date();
            let startDate = new Date();
            let endDate = new Date();

            if (dateFilter === 'today') {
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
            } else if (dateFilter === 'week') {
                // This week (Monday to Now)
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
                startDate.setDate(diff);
                startDate.setHours(0, 0, 0, 0);
                endDate = now;
            } else if (dateFilter === 'month') {
                // This month (1st to Now)
                startDate.setDate(1);
                startDate.setHours(0, 0, 0, 0);
                endDate = now;
            } else if (dateFilter === 'custom') {
                startDate = new Date(customRange.start);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(customRange.end);
                endDate.setHours(23, 59, 59, 999);
            }

            // ISO Strings for Queries
            const startISO = startDate.toISOString();
            const endISO = endDate.toISOString();

            // 2. Fetch Stats
            const { count: customerCount } = await supabase
                .from('customers')
                .select('*', { count: 'exact', head: true })
                .eq('merchant_id', merchantId);

            // New Members (in selected range)
            const { count: newMemberCount } = await supabase
                .from('customers')
                .select('*', { count: 'exact', head: true })
                .eq('merchant_id', merchantId)
                .gte('created_at', startISO)
                .lte('created_at', endISO);

            // 3. Stats Data (ALL transactions in range for Rankings/Summaries/Stats)
            let statsQuery = supabase
                .from('transactions')
                .select(`type, amount, created_at, customer_id, branch_id, branches(name), customers(phone)`)
                .eq('merchant_id', merchantId)
                .gte('created_at', startISO)
                .lte('created_at', endISO);

            if (selectedBranchId !== 'all') {
                statsQuery = statsQuery.eq('branch_id', selectedBranchId);
            }

            const { data: allPeriodTrans, error: statsError } = await statsQuery;
            if (statsError) throw statsError;

            setAllTransactions(allPeriodTrans || []);

            // 4. Recent Transactions Query (List display)
            let listQuery = supabase
                .from('transactions')
                .select(`*, branches (name), customers (phone)`)
                .eq('merchant_id', merchantId)
                .gte('created_at', startISO)
                .lte('created_at', endISO)
                .order('created_at', { ascending: false })
                .limit(5);

            if (selectedBranchId !== 'all') {
                listQuery = listQuery.eq('branch_id', selectedBranchId);
            }

            const { data: transData, error } = await listQuery;
            if (error) throw error;

            setTransactions(transData || []);

            // 5. Lifetime Issued Query
            let lifetimeQuery = supabase
                .from('transactions')
                .select('amount')
                .eq('merchant_id', merchantId)
                .eq('type', 'add');

            if (selectedBranchId !== 'all') {
                lifetimeQuery = lifetimeQuery.eq('branch_id', selectedBranchId);
            }

            const { data: lifetimeData } = await lifetimeQuery;
            const lifetimeTotal = (lifetimeData || []).reduce((sum, t) => sum + (t.amount || 0), 0);

            // 6. Stats Calculation
            const issued = (allPeriodTrans || []).filter(t => t.type === 'add').reduce((acc, t) => acc + (t.amount || 0), 0);
            const redeemed = (allPeriodTrans || []).filter(t => ['redeem', 'manual_redeem'].includes(t.type)).reduce((acc, t) => acc + (t.amount || 0), 0);
            const redemptions = (allPeriodTrans || []).filter(t => ['redeem', 'manual_redeem'].includes(t.type)).length;

            const dailyMap = {};

            // Initialize Chart Keys
            const isToday = dateFilter === 'today' || (dateFilter === 'custom' && customRange.start === customRange.end);

            if (isToday) {
                for (let i = 0; i < 24; i++) {
                    const hourStr = `${i.toString().padStart(2, '0')}:00`;
                    dailyMap[hourStr] = 0;
                }
            } else {
                const loopDate = new Date(startDate);
                while (loopDate <= endDate) {
                    const dateStr = loopDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    if (dailyMap[dateStr] === undefined) dailyMap[dateStr] = 0;
                    loopDate.setDate(loopDate.getDate() + 1);
                }
            }

            (allPeriodTrans || []).forEach(t => {
                const amt = t.amount || 0;
                if (t.type === 'add') {
                    const tDate = new Date(t.created_at);
                    let key;
                    if (isToday) {
                        key = `${tDate.getHours().toString().padStart(2, '0')}:00`;
                    } else {
                        key = tDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }

                    if (dailyMap[key] !== undefined) {
                        dailyMap[key] += amt;
                    }
                }
            });

            const burnRate = issued > 0 ? ((redeemed / issued) * 100).toFixed(1) : 0;
            const chartDataArray = Object.keys(dailyMap).map(key => ({
                name: key,
                points: dailyMap[key]
            }));

            setStats({
                totalCustomers: customerCount || 0,
                newMembers: newMemberCount || 0,
                periodIssued: issued,
                periodRedeemed: redeemed,
                lifetimeIssued: lifetimeTotal,
                periodAddCount: (allPeriodTrans || []).filter(t => t.type === 'add').length,
                burnRate: burnRate,
                redemptionCount: redemptions,
                activeBranches: branches.length
            });
            setChartData(chartDataArray);

        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
    };

    // Derived Data for Tables
    const memberRankings = useMemo(() => {
        const map = {};
        allTransactions.forEach(t => {
            if (!map[t.customer_id]) {
                map[t.customer_id] = {
                    id: t.customer_id,
                    phone: t.customers?.phone || 'Unknown',
                    points: 0, // This seems to be unused or for a different purpose if accumulated is used for ranking
                    lastSeen: t.created_at,
                    txns: 0,
                    accumulated: 0, // Initialize accumulated
                    redeemed: 0 // Initialize redeemed for potential future use or display
                };
            }
            // Re-read plan: "Member Rankings -> Total Accumulated Points"
            // So if type is add, increase. If redeem, ignore for "Accumulated"?
            // Plan says: "Total Accumulated Points" and "Current Remaining Points".
            // Since we don't have current remaining points in transaction stream clearly (it's stateful), we can only approx.
            // OR we assume transaction history is complete.
            // Let's just sum 'add' for "Total Accumulated".
            if (t.type === 'add') map[t.customer_id].accumulated = (map[t.customer_id].accumulated || 0) + (t.amount || 0);
            if (['redeem', 'manual_redeem'].includes(t.type)) {
                map[t.customer_id].redeemed += (t.amount || 0);
            }

            map[t.customer_id].txns += 1;
            if (new Date(t.created_at) > new Date(map[t.customer_id].lastSeen)) {
                map[t.customer_id].lastSeen = t.created_at;
            }
        });
        return Object.values(map).sort((a, b) => (b.accumulated || 0) - (a.accumulated || 0)).slice(0, 10);
    }, [allTransactions]);

    const branchSummary = useMemo(() => {
        if (selectedBranchId !== 'all') return [];
        const map = {};
        allTransactions.forEach(t => {
            const bid = t.branch_id || 'unknown';
            const bName = t.branches?.name || 'Unknown';
            if (!map[bid]) map[bid] = { name: bName, issued: 0, redeemed: 0, txns: 0, members: new Set() };

            if (t.type === 'add') map[bid].issued += (t.amount || 0);
            if (['redeem', 'manual_redeem'].includes(t.type)) map[bid].redeemed += (t.amount || 0);
            map[bid].txns += 1;
            map[bid].members.add(t.customer_id);
        });
        return Object.values(map).map(b => ({ ...b, uniqueMembers: b.members.size }));
    }, [allTransactions, selectedBranchId]);



    // CSV Download
    const downloadCSV = (data, filename) => {
        if (!data || !data.length) return;
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row =>
            Object.values(row).map(val =>
                typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
            ).join(',')
        ).join('\n');

        const blob = new Blob([`\uFEFF${headers}\n${rows}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.csv`;
        link.click();
    };

    const handleExport = (type) => {
        const dateStr = new Date().toISOString().slice(0, 10);
        if (type === 'members') {
            const data = memberRankings.map(m => ({
                CustomerPhone: m.phone || '-',
                TotalAccumulated: m.accumulated || 0,
                LastSeen: new Date(m.lastSeen).toLocaleString('zh-TW'),
                TxnCount: m.txns
            }));
            downloadCSV(data, `member_rankings_${dateStr}`);
        } else if (type === 'branches') {
            const data = branchSummary.map(b => ({
                Branch: b.name,
                Issued: b.issued,
                Redeemed: b.redeemed,
                UniqueMembers: b.uniqueMembers,
                TxnCount: b.txns
            }));
            downloadCSV(data, `branch_summary_${dateStr}`);
        }
    };

    const statCards = [
        { title: '會員總數', value: stats.totalCustomers, subValue: `所選區間新增 +${stats.newMembers}`, icon: Users, color: 'text-teal-600', bg: 'bg-teal-50' },
        { title: '點數發放', value: stats.periodIssued.toLocaleString(), subValue: `Lifetime: ${stats.lifetimeIssued.toLocaleString()}`, icon: CreditCard, color: 'text-cyan-600', bg: 'bg-cyan-50' },
        { title: '點數兌換', value: stats.periodRedeemed.toLocaleString(), subValue: `${stats.redemptionCount} 次兌換`, icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-50' },
        { title: '流通率', value: `${stats.burnRate}%`, subValue: 'Redeemed / Issued', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
    ];

    if (loading && transactions.length === 0) return (
        <div className="h-full flex flex-col items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">載入營運數據...</p>
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20">
                            <LayoutDashboard className="w-6 h-6" />
                        </div>
                        <h2 className="text-4xl font-black tracking-tighter text-slate-900">營運指揮中心</h2>
                    </div>
                    <p className="text-slate-500 font-medium ml-1 text-lg">全方位掌握會員成長與點數經濟脈動。</p>
                </div>
                <div className="flex flex-col xl:flex-row items-center gap-4">
                    {dateFilter === 'custom' && (
                        <div className="flex items-center gap-2 bg-white rounded-xl shadow-sm border border-slate-200 p-1 px-3">
                            <input
                                type="date"
                                value={customRange.start}
                                onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                                className="border-none text-slate-700 font-bold focus:ring-0 text-sm"
                            />
                            <span className="text-slate-400">-</span>
                            <input
                                type="date"
                                value={customRange.end}
                                onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                                className="border-none text-slate-700 font-bold focus:ring-0 text-sm"
                            />
                        </div>
                    )}
                    <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1">
                        <Select value={dateFilter} onValueChange={setDateFilter}>
                            <SelectTrigger className="w-[180px] border-none shadow-none h-12 text-slate-700 font-bold text-base focus:ring-0">
                                <Calendar className="w-5 h-5 mr-2 text-slate-400" />
                                <SelectValue placeholder="選擇區間" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="today">本日 (Today)</SelectItem>
                                <SelectItem value="week">本週 (This Week)</SelectItem>
                                <SelectItem value="month">本月 (This Month)</SelectItem>
                                <SelectItem value="custom">自訂區間</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1">
                        <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                            <SelectTrigger className="w-[200px] border-none shadow-none h-12 text-slate-700 font-bold text-base focus:ring-0">
                                <Store className="w-5 h-5 mr-2 text-slate-400" />
                                <SelectValue placeholder="選擇分店" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">所有分店 (All Branches)</SelectItem>
                                <SelectItem value="all_active">所有營業中分店</SelectItem>
                                {branches.map(b => (
                                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={() => navigate('/terminal')} className="button-premium h-14 px-8 rounded-xl text-lg shadow-lg shadow-teal-600/20 flex items-center gap-3 group">
                        <Monitor className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span>開啟終端</span>
                    </Button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {statCards.map((card, i) => (
                    <Card key={i} className="border-none shadow-soft-lg p-6 rounded-[2rem] bg-white group relative overflow-hidden hover:shadow-soft-2xl transition-all">
                        <div className={`absolute top-0 right-0 w-24 h-24 ${card.bg} rounded-bl-full -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-125 opacity-50`} />
                        <div className="flex flex-col relative z-10 h-full justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`${card.bg} p-3 rounded-2xl`}>
                                    <card.icon className={`h-6 w-6 ${card.color}`} />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">{card.title}</h3>
                                <div className="text-3xl font-black text-slate-900 tracking-tight tabular-nums">{card.value}</div>
                                <div className="text-xs font-bold text-slate-400 mt-2 flex items-center gap-1">
                                    <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                                    {card.subValue}
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <Card className="xl:col-span-2 border-none shadow-soft-lg rounded-[2.5rem] bg-white overflow-hidden flex flex-col h-[450px]">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900">點數發放趨勢</h3>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                                    {dateFilter === 'today' ? 'Today Since 00:00' : dateFilter === 'week' ? 'This Week' : dateFilter === 'month' ? 'This Month' : 'Selected Range'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <CardContent className="p-6 flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                                <Tooltip cursor={{ stroke: '#0d9488', strokeWidth: 2, strokeDasharray: '4 4' }} contentStyle={{ borderRadius: '16px', border: 'none', padding: '16px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' }} />
                                <Area type="monotone" dataKey="points" stroke="#0d9488" strokeWidth={4} fill="url(#chartGradient)" animationDuration={1500} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Insight Card */}
                <Card className="xl:col-span-1 border-none shadow-soft-lg rounded-[2.5rem] bg-slate-900 text-white overflow-hidden flex flex-col relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl -mr-16 -mt-16" />
                    <div className="p-8 relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                                    <Sparkles className="w-5 h-5 text-teal-300" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black">營運洞察</h3>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Key Insights</p>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="bg-white/5 p-5 rounded-3xl border border-white/10">
                                    <div className="text-slate-400 text-xs font-bold uppercase mb-2">Most Active</div>
                                    <div className="text-2xl font-black text-white mb-1">
                                        {memberRankings.length > 0 ? memberRankings[0].phone : '-'}
                                    </div>
                                    <div className="text-teal-400 text-sm font-bold">
                                        {memberRankings.length > 0 ? `${memberRankings[0].accumulated.toLocaleString()} PTS` : 'Top Spender'} (Accumulated)
                                    </div>
                                </div>
                                <div className="bg-white/5 p-5 rounded-3xl border border-white/10">
                                    <div className="text-slate-400 text-xs font-bold uppercase mb-2">Avg. Transaction</div>
                                    <div className="text-2xl font-black text-white mb-1">
                                        {transactions.length > 0 ? (stats.periodIssued / (stats.periodAddCount || 1)).toFixed(0) : 0} <span className="text-sm text-slate-400">PTS</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Data Tables Tabs */}
            <Card className="border-none shadow-soft-lg rounded-[2.5rem] bg-white overflow-hidden p-8">
                <Tabs defaultValue="transactions" className="w-full">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <TabsList className="bg-slate-100 p-1 h-14 rounded-2xl w-full md:w-auto">
                            <TabsTrigger value="transactions" className="h-12 rounded-xl px-6 font-bold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-teal-600 data-[state=active]:shadow-sm">
                                最近交易
                            </TabsTrigger>
                            <TabsTrigger value="members" className="h-12 rounded-xl px-6 font-bold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-teal-600 data-[state=active]:shadow-sm">
                                會員排行
                            </TabsTrigger>
                            {selectedBranchId === 'all' && (
                                <TabsTrigger value="branches" className="h-12 rounded-xl px-6 font-bold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-teal-600 data-[state=active]:shadow-sm">
                                    分店報表
                                </TabsTrigger>
                            )}
                        </TabsList>

                        <div className="flex gap-2">
                            <Button onClick={() => navigate('/dashboard/transactions')} variant="ghost" className="rounded-xl text-teal-600 font-bold gap-2 hover:bg-teal-50">
                                查看全部交易 <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <TabsContent value="transactions" className="mt-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-slate-50/50 border-slate-100">
                                    <TableHead className="font-black text-slate-900 pl-4">時間</TableHead>
                                    <TableHead className="font-black text-slate-900">分店</TableHead>
                                    <TableHead className="font-black text-slate-900">顧客手機</TableHead>
                                    <TableHead className="font-black text-slate-900">類型</TableHead>
                                    <TableHead className="font-black text-slate-900 text-right pr-4">點數</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((t) => (
                                    <TableRow key={t.id} className="hover:bg-slate-50/80 border-slate-50">
                                        <TableCell className="pl-4 font-medium text-slate-600">{new Date(t.created_at).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</TableCell>
                                        <TableCell className="font-bold text-slate-800">{t.branches?.name || '-'}</TableCell>
                                        <TableCell className="font-mono font-bold text-slate-600">{t.customers?.phone || '-'}</TableCell>
                                        <TableCell>
                                            <span className={`px-3 py-1 rounded-full text-xs font-black ${t.type === 'add' ? 'bg-teal-50 text-teal-600' : 'bg-purple-50 text-purple-600'}`}>
                                                {t.type === 'add' ? '發放' : (t.type === 'manual_redeem' ? '手動' : '兌換')}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right pr-4 font-black tabular-nums text-slate-900">
                                            {t.type === 'add' ? '+' : '-'}{t.amount}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {transactions.length === 0 && <TableRow><TableCell colSpan={5} className="h-32 text-center text-slate-400 font-bold">尚無交易紀錄</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </TabsContent>

                    <TabsContent value="members" className="mt-0">
                        <div className="flex justify-end mb-4">
                            <Button variant="outline" size="sm" onClick={() => handleExport('members')} className="rounded-lg border-slate-200 text-xs font-bold gap-2">
                                <Download className="w-3 h-3" /> 匯出榜單
                            </Button>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-slate-50/50 border-slate-100">
                                    <TableHead className="font-black text-slate-900 pl-4">排名</TableHead>
                                    <TableHead className="font-black text-slate-900">顧客手機</TableHead>
                                    <TableHead className="font-black text-slate-900 text-right">累積獲得點數</TableHead>
                                    <TableHead className="font-black text-slate-900 text-right">交易次數</TableHead>
                                    <TableHead className="font-black text-slate-900 text-right pr-4">最後互動</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {memberRankings.map((m, idx) => (
                                    <TableRow key={m.id} className="hover:bg-slate-50/80 border-slate-50">
                                        <TableCell className="pl-4 font-black text-slate-400">#{idx + 1}</TableCell>
                                        <TableCell className="font-mono font-bold text-slate-600">{m.phone}</TableCell>
                                        <TableCell className="text-right font-black text-teal-600">{m.accumulated?.toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-bold text-slate-700">{m.txns}</TableCell>
                                        <TableCell className="text-right pr-4 text-xs font-bold text-slate-400">{new Date(m.lastSeen).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))}
                                {memberRankings.length === 0 && <TableRow><TableCell colSpan={5} className="h-32 text-center text-slate-400 font-bold">尚無會員資料</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </TabsContent>

                    {selectedBranchId === 'all' && (
                        <TabsContent value="branches" className="mt-0">
                            <div className="flex justify-end mb-4">
                                <Button variant="outline" size="sm" onClick={() => handleExport('branches')} className="rounded-lg border-slate-200 text-xs font-bold gap-2">
                                    <Download className="w-3 h-3" /> 匯出報表
                                </Button>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-slate-50/50 border-slate-100">
                                        <TableHead className="font-black text-slate-900 pl-4">分店名稱</TableHead>
                                        <TableHead className="font-black text-slate-900 text-right">發放點數</TableHead>
                                        <TableHead className="font-black text-slate-900 text-right">兌換點數</TableHead>
                                        <TableHead className="font-black text-slate-900 text-right">不重複客數</TableHead>
                                        <TableHead className="font-black text-slate-900 text-right pr-4">總交易量</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {branchSummary.map((b, idx) => (
                                        <TableRow key={idx} className="hover:bg-slate-50/80 border-slate-50">
                                            <TableCell className="pl-4 font-bold text-slate-800">{b.name}</TableCell>
                                            <TableCell className="text-right font-black text-teal-600">{b.issued.toLocaleString()}</TableCell>
                                            <TableCell className="text-right font-black text-purple-600">{b.redeemed.toLocaleString()}</TableCell>
                                            <TableCell className="text-right font-bold text-slate-700">{b.uniqueMembers}</TableCell>
                                            <TableCell className="text-right pr-4 font-bold text-slate-700">{b.txns}</TableCell>
                                        </TableRow>
                                    ))}
                                    {branchSummary.length === 0 && <TableRow><TableCell colSpan={5} className="h-32 text-center text-slate-400 font-bold">尚無分店資料</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </TabsContent>
                    )}
                </Tabs>
            </Card>
        </div>
    );
};

export default MerchantDashboard;
