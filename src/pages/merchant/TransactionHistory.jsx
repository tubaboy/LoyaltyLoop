import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { FileText, Search, Download, Calendar, ArrowLeft, ArrowRight, Store, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { store } from '../../lib/store';

const TransactionHistory = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [branches, setBranches] = useState([]);

    // Filters
    const [selectedBranchId, setSelectedBranchId] = useState('all');
    const [dateFilter, setDateFilter] = useState('today'); // today, week, month, custom
    const [customRange, setCustomRange] = useState({
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all'); // all, add, redeem

    // Pagination
    const [page, setPage] = useState(0);
    const PAGE_SIZE = 20;
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        setPage(0); // Reset page on filter change
        fetchTransactions(0);
    }, [selectedBranchId, dateFilter, customRange, searchQuery, filterType]);

    useEffect(() => {
        if (page > 0) fetchTransactions(page);
    }, [page]);

    const fetchInitialData = async () => {
        const merchantId = await store.getMerchantId();
        if (!merchantId) return;
        const { data: branchesData } = await supabase.from('branches').select('*').eq('merchant_id', merchantId).order('name');
        setBranches(branchesData || []);
    };

    const fetchTransactions = async (currentPage) => {
        try {
            setLoading(true);
            if (currentPage === 0) setTransactions([]); // Clear data on filter change/initial
            const merchantId = await store.getMerchantId();
            if (!merchantId) return;

            // Date Logic
            const now = new Date();
            let startDate = new Date();
            let endDate = new Date();

            if (dateFilter === 'today') {
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
            } else if (dateFilter === 'week') {
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                startDate.setDate(diff);
                startDate.setHours(0, 0, 0, 0);
                endDate = now;
            } else if (dateFilter === 'month') {
                startDate.setDate(1);
                startDate.setHours(0, 0, 0, 0);
                endDate = now;
            } else if (dateFilter === 'custom') {
                startDate = new Date(customRange.start);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(customRange.end);
                endDate.setHours(23, 59, 59, 999);
            }

            let query = supabase
                .from('transactions')
                .select(`*, branches (name), customers (phone)`, { count: 'exact' })
                .eq('merchant_id', merchantId)
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString())
                .order('created_at', { ascending: false })
                .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

            if (selectedBranchId !== 'all') {
                query = query.eq('branch_id', selectedBranchId);
            }

            if (filterType !== 'all') {
                query = query.eq('type', filterType);
            }

            // Note: Use textSearch or simple ilike join filter if possible, but supabase join filter is tricky.
            // For now, client side legacy search might be needed if not complex, BUT standard is to filter customers first then transactions.
            // For simplicity here, we assume exact match or just load and let backend handle relations.
            // Supabase unfortunately doesn't support deep filtering onjoined tables easily without View or specific RPC.
            // Let's rely on standard ID filtering if we had search box for exact phone, 
            // BUT transactions table has customer_id. 
            // Workaround: If search is present, we must find customer_id first.
            if (searchQuery) {
                const { data: customers } = await supabase.from('customers').select('id').eq('merchant_id', merchantId).ilike('phone', `%${searchQuery}%`);
                if (customers && customers.length > 0) {
                    const ids = customers.map(c => c.id);
                    query = query.in('customer_id', ids);
                } else {
                    // No customer found, return empty
                    setTransactions([]);
                    setHasMore(false);
                    setLoading(false);
                    return;
                }
            }

            const { data, count, error } = await query;
            if (error) throw error;

            if (currentPage === 0) {
                setTransactions(data || []);
            } else {
                setTransactions(prev => [...prev, ...(data || [])]);
            }

            setHasMore(data && data.length === PAGE_SIZE);

        } catch (error) {
            console.error("Error fetching transactions:", error);
        } finally {
            setLoading(false);
        }
    };

    const downloadCSV = async () => {
        try {
            const merchantId = await store.getMerchantId();
            if (!merchantId) return;

            // Replicate Filter Logic
            const now = new Date();
            let startDate = new Date();
            let endDate = new Date();

            if (dateFilter === 'today') {
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
            } else if (dateFilter === 'week') {
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                startDate.setDate(diff);
                startDate.setHours(0, 0, 0, 0);
                endDate = now;
            } else if (dateFilter === 'month') {
                startDate.setDate(1);
                startDate.setHours(0, 0, 0, 0);
                endDate = now;
            } else if (dateFilter === 'custom') {
                startDate = new Date(customRange.start);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(customRange.end);
                endDate.setHours(23, 59, 59, 999);
            }

            let query = supabase
                .from('transactions')
                .select(`*, branches (name), customers (phone)`)
                .eq('merchant_id', merchantId)
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString())
                .order('created_at', { ascending: false });

            if (selectedBranchId !== 'all') {
                query = query.eq('branch_id', selectedBranchId);
            }

            if (filterType !== 'all') {
                query = query.eq('type', filterType);
            }

            if (searchQuery) {
                const { data: customers } = await supabase.from('customers').select('id').eq('merchant_id', merchantId).ilike('phone', `%${searchQuery}%`);
                if (customers && customers.length > 0) {
                    const ids = customers.map(c => c.id);
                    query = query.in('customer_id', ids);
                } else {
                    alert("沒有符合條件的資料可以匯出");
                    return;
                }
            }

            const { data: fullData, error } = await query;
            if (error) throw error;
            if (!fullData || fullData.length === 0) {
                alert("沒有資料可以匯出");
                return;
            }

            const headers = "Time,Branch,Phone,Type,Amount";
            const rows = fullData.map(t =>
                `${new Date(t.created_at).toLocaleString()},${t.branches?.name || '-'},${t.customers?.phone || '-'},${t.type},${t.amount}`
            ).join('\n');

            const blob = new Blob([`\uFEFF${headers}\n${rows}`], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `transactions_export_${new Date().toISOString().slice(0, 10)}.csv`;
            link.click();

        } catch (error) {
            console.error("Error exporting CSV:", error);
            alert("匯出失敗，請稍後再試");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-white text-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/10 border border-teal-100">
                            <FileText className="w-6 h-6" />
                        </div>
                        <h2 className="text-3xl font-black tracking-tighter text-slate-900">交易明細</h2>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button onClick={downloadCSV} variant="outline" className="rounded-xl border-slate-200 text-slate-600 font-bold gap-2">
                        <Download className="w-4 h-4" /> 匯出報表
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="border-none shadow-soft-lg rounded-[2rem] bg-white p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Date Range */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">日期區間</label>
                        <Select value={dateFilter} onValueChange={setDateFilter}>
                            <SelectTrigger className="h-11 rounded-xl shadow-none">
                                <Calendar className="w-4 h-4 mr-2" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="today">本日 (Today)</SelectItem>
                                <SelectItem value="week">本週 (This Week)</SelectItem>
                                <SelectItem value="month">本月 (This Month)</SelectItem>
                                <SelectItem value="custom">自訂區間</SelectItem>
                            </SelectContent>
                        </Select>
                        {dateFilter === 'custom' && (
                            <div className="flex items-center gap-2 mt-2">
                                <input type="date" value={customRange.start} onChange={e => setCustomRange({ ...customRange, start: e.target.value })} className="flex-1 rounded-lg border-slate-200 text-sm p-2 w-full" />
                                <span className="text-slate-300">-</span>
                                <input type="date" value={customRange.end} onChange={e => setCustomRange({ ...customRange, end: e.target.value })} className="flex-1 rounded-lg border-slate-200 text-sm p-2 w-full" />
                            </div>
                        )}
                    </div>

                    {/* Branch */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">分店</label>
                        <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                            <SelectTrigger className="h-11 rounded-xl shadow-none">
                                <Store className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="所有分店" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">所有分店</SelectItem>
                                {branches.map(b => (
                                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Type */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">交易類型</label>
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="h-11 rounded-xl shadow-none">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">全部類型</SelectItem>
                                <SelectItem value="add">發放 (Issue)</SelectItem>
                                <SelectItem value="redeem">兌換 (Redeem)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Search */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">會員搜尋</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="輸入手機號碼..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-9 h-11 rounded-xl shadow-none"
                            />
                        </div>
                    </div>
                </div>
            </Card>

            {/* Table */}
            <Card className="border-none shadow-soft-lg rounded-[2.5rem] bg-white overflow-hidden p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-slate-50/50 border-slate-100 bg-slate-50/30">
                            <TableHead className="font-black text-slate-900 pl-8 h-14">交易時間</TableHead>
                            <TableHead className="font-black text-slate-900">分店</TableHead>
                            <TableHead className="font-black text-slate-900">會員</TableHead>
                            <TableHead className="font-black text-slate-900">類型</TableHead>
                            <TableHead className="font-black text-slate-900 text-right pr-8">點數變動</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && page === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="px-10 py-32 text-center">
                                    <RefreshCw className="w-10 h-10 text-teal-600/20 animate-spin mx-auto mb-4" />
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">同步交易資料中...</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            <>
                                {transactions.map((t) => (
                                    <TableRow key={t.id} className="hover:bg-slate-50/80 border-slate-50">
                                        <TableCell className="pl-8 font-medium text-slate-600">{new Date(t.created_at).toLocaleString('zh-TW')}</TableCell>
                                        <TableCell className="font-bold text-slate-800">{t.branches?.name || '-'}</TableCell>
                                        <TableCell className="font-mono font-bold text-slate-600">{t.customers?.phone || '-'}</TableCell>
                                        <TableCell>
                                            <span className={`px-3 py-1 rounded-full text-xs font-black ${t.type === 'add' ? 'bg-teal-50 text-teal-600' : 'bg-purple-50 text-purple-600'}`}>
                                                {t.type === 'add' ? '發放' : (t.type === 'manual_redeem' ? '手動兌換' : '兌換')}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right pr-8 font-black tabular-nums text-slate-900">
                                            {t.type === 'add' ? '+' : '-'}{t.amount}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {transactions.length === 0 && !loading && (
                                    <TableRow><TableCell colSpan={5} className="h-48 text-center text-slate-400 font-black uppercase tracking-widest">沒有符合條件的交易紀錄</TableCell></TableRow>
                                )}
                                {loading && page > 0 && (
                                    <TableRow><TableCell colSpan={5} className="h-24 text-center">
                                        <div className="flex items-center justify-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                                            <RefreshCw className="w-4 h-4 animate-spin" /> 載入更多資料...
                                        </div>
                                    </TableCell></TableRow>
                                )}
                            </>
                        )}
                    </TableBody>
                </Table>

                {/* Pagination Controls */}
                <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                    <Button
                        variant="ghost"
                        disabled={page === 0}
                        onClick={() => setPage(p => p - 1)}
                        className="font-bold text-slate-500"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> 上一頁
                    </Button>
                    <span className="text-xs font-bold text-slate-400 uppercase">Page {page + 1}</span>
                    <Button
                        variant="ghost"
                        disabled={!hasMore}
                        onClick={() => setPage(p => p + 1)}
                        className="font-bold text-slate-500"
                    >
                        下一頁 <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default TransactionHistory;
