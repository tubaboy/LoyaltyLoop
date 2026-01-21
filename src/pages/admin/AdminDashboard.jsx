import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '../../lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Plus, Search, MoreHorizontal, UserCheck, ExternalLink, RefreshCw, Trash2, Edit3, ShieldCheck, Mail, Phone, MapPin, User, Hash, Lock, Copy, Check, Activity } from 'lucide-react';

const AdminDashboard = () => {
    const [merchants, setMerchants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [showAddMerchant, setShowAddMerchant] = useState(false);
    const [newMerchant, setNewMerchant] = useState({
        email: '',
        password: '',
        store_name: '',
        contact_person: '',
        contact_phone: '',
        contact_address: '',
        tax_id: '',
        status: 'active'
    });

    const [showEditMerchant, setShowEditMerchant] = useState(false);
    const [editingMerchant, setEditingMerchant] = useState(null);

    const [openDropdown, setOpenDropdown] = useState(null); // Track which dropdown is open

    useEffect(() => {
        fetchMerchants();
    }, []);

    const fetchMerchants = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                id,
                role,
                created_at,
                merchants (
                    store_name,
                    contact_person,
                    contact_phone,
                    contact_address,
                    tax_id,
                    email,
                    recovery_password,
                    status,
                    store_code
                )
            `)
                .eq('role', 'merchant')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMerchants(data || []);
        } catch (error) {
            console.error("Error fetching merchants:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateMerchant = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const { data, error } = await supabase.functions.invoke('admin-create-merchant', {
                body: {
                    email: newMerchant.email,
                    password: newMerchant.password,
                    store_name: newMerchant.store_name,
                    contact_person: newMerchant.contact_person,
                    contact_phone: newMerchant.contact_phone,
                    contact_address: newMerchant.contact_address,
                    tax_id: newMerchant.tax_id,
                    status: newMerchant.status
                }
            });

            if (error) {
                // Try to extract body from the error if possible
                const body = error.context?.body;
                const message = body?.error || error.message;
                throw new Error(message);
            }
            if (data?.error) throw new Error(data.error);

            alert("商家帳號建立成功！(已跳過 Email 驗證)");
            setShowAddMerchant(false);
            setNewMerchant({
                email: '',
                password: '',
                store_name: '',
                contact_person: '',
                contact_phone: '',
                contact_address: '',
                tax_id: '',
                status: 'active'
            });
            fetchMerchants();

        } catch (error) {
            console.error("Error creating merchant:", error);
            alert("建立失敗: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateMerchant = async (e) => {
        e.preventDefault();
        try {
            if (!editingMerchant) return;

            const { error } = await supabase
                .from('merchants')
                .update({
                    store_name: editingMerchant.store_name,
                    contact_person: editingMerchant.contact_person,
                    contact_phone: editingMerchant.contact_phone,
                    contact_address: editingMerchant.contact_address,
                    tax_id: editingMerchant.tax_id,
                    status: editingMerchant.status
                })
                .eq('id', editingMerchant.id);

            if (error) throw error;

            alert("商家資料已更新！");
            setShowEditMerchant(false);
            setEditingMerchant(null);
            fetchMerchants();
        } catch (error) {
            console.error("Error updating merchant:", error);
            alert("更新失敗: " + error.message);
        }
    };

    const handleEditClick = (merchant) => {
        const m = merchant.merchants || {};
        setEditingMerchant({
            id: merchant.id,
            store_name: m.store_name || '',
            contact_person: m.contact_person || '',
            contact_phone: m.contact_phone || '',
            contact_address: m.contact_address || '',
            tax_id: m.tax_id || '',
            email: m.email || '',
            recovery_password: m.recovery_password || '',
            status: m.status || 'active'
        });
        setShowEditMerchant(true);
        setOpenDropdown(null);
    };

    const filteredMerchants = merchants.filter(merchant => {
        const m = merchant.merchants || {};
        const searchLower = searchTerm.toLowerCase().trim();
        if (!searchLower) return true;

        return (
            (m.store_name || "").toLowerCase().includes(searchLower) ||
            (m.email || "").toLowerCase().includes(searchLower) ||
            (m.tax_id || "").toLowerCase().includes(searchLower) ||
            merchant.id.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-slate-100 text-slate-800 rounded-2xl flex items-center justify-center font-black">
                            <ShieldCheck className="w-7 h-7" />
                        </div>
                        <h2 className="text-4xl font-black tracking-tight text-slate-900">核心商家管理</h2>
                    </div>
                    <p className="text-slate-500 font-medium ml-1">在此您可以管理全球所有已註冊商家、審核帳號權限與檢視狀態。</p>
                </div>
                <Button
                    onClick={() => {
                        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
                        let randomPassword = "";
                        for (let i = 0; i < 10; i++) {
                            randomPassword += chars.charAt(Math.floor(Math.random() * chars.length));
                        }
                        setNewMerchant({
                            email: '',
                            password: randomPassword,
                            store_name: '',
                            contact_person: '',
                            contact_phone: '',
                            contact_address: '',
                            tax_id: '',
                            status: 'active'
                        });
                        setShowAddMerchant(true);
                    }}
                    className="button-premium h-16 px-10 rounded-2xl text-lg group"
                >
                    <Plus className="mr-2 h-7 w-7 group-hover:rotate-90 transition-transform" />
                    <span>建立全新合作商家</span>
                </Button>
            </div>

            {/* Overlays (Dialogs) */}
            {showAddMerchant && (
                <div className="fixed inset-0 bg-slate-950/60 z-[100] flex items-center justify-center p-6 backdrop-blur-md overflow-y-auto">
                    <Card className="bg-white rounded-[2.5rem] p-10 max-w-3xl w-full shadow-2xl border-none animate-in zoom-in-95 duration-300 my-auto">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-slate-900">新增商家帳號</h3>
                            <button onClick={() => setShowAddMerchant(false)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                                <Plus className="h-6 w-6 rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateMerchant} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">商店/品牌名稱</Label>
                                    <Input
                                        type="text"
                                        required
                                        className="h-14 rounded-2xl border-transparent bg-slate-50 px-6 focus:bg-white focus:border-teal-500/30 font-bold"
                                        value={newMerchant.store_name}
                                        onChange={e => setNewMerchant({ ...newMerchant, store_name: e.target.value })}
                                        placeholder="例：永心鳳茶"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">統一編號 (8位數字)</Label>
                                    <Input
                                        type="text"
                                        pattern="[0-9]{8}"
                                        required
                                        title="請輸入8位數字統一編號"
                                        className="h-14 rounded-2xl border-transparent bg-slate-50 px-6 focus:bg-white focus:border-teal-500/30 font-bold"
                                        value={newMerchant.tax_id}
                                        onChange={e => setNewMerchant({ ...newMerchant, tax_id: e.target.value.replace(/[^0-9]/g, '').slice(0, 8) })}
                                        placeholder="12345678"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">聯絡人</Label>
                                    <Input
                                        type="text"
                                        className="h-14 rounded-2xl border-transparent bg-slate-50 px-6 focus:bg-white focus:border-teal-500/30 font-bold"
                                        value={newMerchant.contact_person}
                                        onChange={e => setNewMerchant({ ...newMerchant, contact_person: e.target.value })}
                                        placeholder="王小明"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">聯絡電話</Label>
                                    <Input
                                        type="text"
                                        className="h-14 rounded-2xl border-transparent bg-slate-50 px-6 focus:bg-white focus:border-teal-500/30 font-bold"
                                        value={newMerchant.contact_phone}
                                        onChange={e => setNewMerchant({ ...newMerchant, contact_phone: e.target.value })}
                                        placeholder="0912345678"
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">聯絡地址</Label>
                                    <Input
                                        type="text"
                                        className="h-14 rounded-2xl border-transparent bg-slate-50 px-6 focus:bg-white focus:border-teal-500/30 font-bold"
                                        value={newMerchant.contact_address}
                                        onChange={e => setNewMerchant({ ...newMerchant, contact_address: e.target.value })}
                                        placeholder="台北市信義區..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">管理員 Email (登入帳號)</Label>
                                    <Input
                                        type="email"
                                        required
                                        className="h-14 rounded-2xl border-transparent bg-slate-50 px-6 focus:bg-white focus:border-teal-500/30 font-bold"
                                        value={newMerchant.email}
                                        onChange={e => setNewMerchant({ ...newMerchant, email: e.target.value })}
                                        placeholder="merchant@example.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">預設登入密碼 (10位)</Label>
                                    <Input
                                        type="text"
                                        required
                                        className="h-14 rounded-2xl border-transparent bg-slate-50 px-6 focus:bg-white focus:border-teal-500/30 font-bold font-mono"
                                        value={newMerchant.password}
                                        onChange={e => setNewMerchant({ ...newMerchant, password: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">啟動營運狀態</Label>
                                    <select
                                        className="w-full h-14 rounded-2xl border-transparent bg-slate-50 px-6 focus:bg-white focus:border-teal-500/30 font-bold outline-none appearance-none cursor-pointer"
                                        value={newMerchant.status}
                                        onChange={e => setNewMerchant({ ...newMerchant, status: e.target.value })}
                                    >
                                        <option value="active">🟢 營運中 (Active)</option>
                                        <option value="inactive">🟡 暫停服務 (Inactive)</option>
                                        <option value="suspended">🔴 已停權 (Suspended)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-6 flex gap-4">
                                <Button type="button" variant="ghost" onClick={() => setShowAddMerchant(false)} className="flex-1 rounded-2xl h-14 font-black text-slate-400">取消</Button>
                                <Button type="submit" className="flex-1 button-premium rounded-2xl h-14">立即建立商家</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {showEditMerchant && editingMerchant && (
                <div className="fixed inset-0 bg-slate-950/60 z-[100] flex items-center justify-center p-6 backdrop-blur-md overflow-y-auto">
                    <Card className="bg-white rounded-[2.5rem] p-10 max-w-3xl w-full shadow-2xl border-none animate-in zoom-in-95 duration-300 my-auto">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-slate-900">編輯商家資料</h3>
                            <button onClick={() => { setShowEditMerchant(false); setEditingMerchant(null); }} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                                <Plus className="h-6 w-6 rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateMerchant} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">商店/品牌名稱</Label>
                                    <Input
                                        type="text"
                                        required
                                        className="h-14 rounded-2xl border-transparent bg-slate-50 px-6 focus:bg-white focus:border-teal-500/30 font-bold"
                                        value={editingMerchant.store_name}
                                        onChange={e => setEditingMerchant({ ...editingMerchant, store_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">統一編號 (8位數字)</Label>
                                    <Input
                                        type="text"
                                        pattern="[0-9]{8}"
                                        required
                                        className="h-14 rounded-2xl border-transparent bg-slate-50 px-6 focus:bg-white focus:border-teal-500/30 font-bold"
                                        value={editingMerchant.tax_id}
                                        onChange={e => setEditingMerchant({ ...editingMerchant, tax_id: e.target.value.replace(/[^0-9]/g, '').slice(0, 8) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">聯絡人</Label>
                                    <Input
                                        type="text"
                                        className="h-14 rounded-2xl border-transparent bg-slate-50 px-6 focus:bg-white focus:border-teal-500/30 font-bold"
                                        value={editingMerchant.contact_person}
                                        onChange={e => setEditingMerchant({ ...editingMerchant, contact_person: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">聯絡電話</Label>
                                    <Input
                                        type="text"
                                        className="h-14 rounded-2xl border-transparent bg-slate-50 px-6 focus:bg-white focus:border-teal-500/30 font-bold"
                                        value={editingMerchant.contact_phone}
                                        onChange={e => setEditingMerchant({ ...editingMerchant, contact_phone: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">聯絡地址</Label>
                                    <Input
                                        type="text"
                                        className="h-14 rounded-2xl border-transparent bg-slate-50 px-6 focus:bg-white focus:border-teal-500/30 font-bold"
                                        value={editingMerchant.contact_address}
                                        onChange={e => setEditingMerchant({ ...editingMerchant, contact_address: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">修改營運狀態</Label>
                                    <select
                                        className="w-full h-14 rounded-2xl border-transparent bg-slate-50 px-6 focus:bg-white focus:border-teal-500/30 font-bold outline-none appearance-none cursor-pointer border-2 border-slate-100"
                                        value={editingMerchant.status}
                                        onChange={e => setEditingMerchant({ ...editingMerchant, status: e.target.value })}
                                    >
                                        <option value="active">🟢 營運中 (Active)</option>
                                        <option value="inactive">🟡 暫停服務 (Inactive)</option>
                                        <option value="suspended">🔴 已停權 (Suspended)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <ShieldCheck className="w-5 h-5 text-teal-600" />
                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">救援登入帳密 (管理員專用)</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">登入帳號 EMAIL</Label>
                                        <div className="relative group">
                                            <Input
                                                readOnly
                                                className="h-12 rounded-xl border-dashed border-2 border-slate-200 bg-white px-4 font-bold text-slate-600 cursor-default"
                                                value={editingMerchant.email || '未記錄'}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(editingMerchant.email);
                                                    alert("帳號已複製！");
                                                }}
                                                className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 p-0 rounded-lg hover:bg-slate-100 text-slate-400 active:scale-95"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">系統初設密碼</Label>
                                        <div className="relative group">
                                            <Input
                                                readOnly
                                                className="h-12 rounded-xl border-dashed border-2 border-slate-200 bg-white px-4 font-bold font-mono text-slate-600 cursor-default"
                                                value={editingMerchant.recovery_password || '未記錄'}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(editingMerchant.recovery_password);
                                                    alert("密碼已複製！");
                                                }}
                                                className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 p-0 rounded-lg hover:bg-slate-100 text-slate-400 active:scale-95"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[10px] font-bold text-amber-500 flex items-center gap-1">
                                    <span className="text-sm">⚠️</span>
                                    僅供協助商家找回帳號。若商家已於後台自行修改密碼，此處顯示之密碼將失效。
                                </p>
                            </div>

                            <div className="pt-6 flex gap-4">
                                <Button type="button" variant="ghost" onClick={() => { setShowEditMerchant(false); setEditingMerchant(null); }} className="flex-1 rounded-2xl h-14 font-black text-slate-400">取消</Button>
                                <Button type="submit" className="flex-1 button-premium rounded-2xl h-14">儲存變更</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Main Content Table Card */}
            <Card className="border-none shadow-soft-lg rounded-[2.5rem] bg-white overflow-hidden">
                <CardHeader className="p-10 border-b border-slate-50 bg-slate-50/20">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
                            <UserCheck className="h-6 w-6 text-teal-600" /> 合作商家列表
                        </CardTitle>
                        <div className="relative w-full lg:w-96">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="搜尋品牌、Email 或 ID..."
                                className="w-full rounded-2xl border-transparent bg-white shadow-soft-sm pl-12 pr-6 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500/20 transition-all border border-slate-100"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left">
                            <thead className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50 border-b border-slate-50">
                                <tr>
                                    <th className="px-10 py-6">品牌商家名稱 / 統編 / 代碼</th>
                                    <th className="px-10 py-6">聯絡資訊</th>
                                    <th className="px-10 py-6">建立時間</th>
                                    <th className="px-10 py-6">運營狀態</th>
                                    <th className="px-10 py-6 text-right">管理操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr><td colSpan="5" className="px-10 py-32 text-center">
                                        <RefreshCw className="w-10 h-10 text-teal-600/20 animate-spin mx-auto mb-4" />
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">同步核心資料中...</p>
                                    </td></tr>
                                ) : filteredMerchants.length === 0 ? (
                                    <tr><td colSpan="5" className="px-10 py-32 text-center text-slate-400 font-black uppercase tracking-widest">
                                        {searchTerm ? `查無此商家: "${searchTerm}"` : "目前尚無商家資料"}
                                    </td></tr>
                                ) : (
                                    filteredMerchants.map((merchant) => (
                                        <tr key={merchant.id} className="hover:bg-slate-50/80 transition-all duration-300 group">
                                            <td className="px-10 py-8">
                                                <div className="font-black text-xl text-slate-900 group-hover:text-teal-700 transition-colors">
                                                    {(merchant.merchants && merchant.merchants.store_name) || "未命名品牌"}
                                                </div>
                                                <div className="text-slate-400 font-mono text-xs mt-1 flex gap-3">
                                                    <span>統編: {(merchant.merchants && merchant.merchants.tax_id) || "未設定"}</span>
                                                    <span className="text-teal-600 font-black px-1.5 py-0.5 bg-teal-50 rounded">代碼: {(merchant.merchants && merchant.merchants.store_code) || "----"}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex flex-col gap-1">
                                                    <div className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                        <User className="w-3 h-3 text-slate-400" />
                                                        {(merchant.merchants && merchant.merchants.contact_person) || "無聯絡人"}
                                                    </div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-2">
                                                        <Phone className="w-3 h-3 text-slate-400" />
                                                        {(merchant.merchants && merchant.merchants.contact_phone) || "無電話"}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-slate-500 font-bold text-sm">
                                                {new Date(merchant.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </td>
                                            <td className="px-10 py-8">
                                                {(() => {
                                                    const status = (merchant.merchants && merchant.merchants.status) || 'active';
                                                    const configs = {
                                                        active: { label: 'Active', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
                                                        inactive: { label: 'Inactive', bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
                                                        suspended: { label: 'Suspended', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' }
                                                    };
                                                    const config = configs[status] || configs.active;
                                                    return (
                                                        <span className={cn("inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm", config.bg, config.text)}>
                                                            <span className={cn("w-2 h-2 rounded-full mr-2", config.dot, status === 'active' && "animate-pulse")} />
                                                            {config.label}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-10 py-8 text-right relative">
                                                <button
                                                    onClick={() => setOpenDropdown(openDropdown === merchant.id ? null : merchant.id)}
                                                    className="w-12 h-12 rounded-2xl hover:bg-white hover:shadow-soft-md transition-all inline-flex items-center justify-center text-slate-300 hover:text-slate-600 border border-transparent hover:border-slate-100"
                                                >
                                                    <MoreHorizontal className="h-6 w-6" />
                                                </button>

                                                {openDropdown === merchant.id && (
                                                    <div className="absolute right-10 top-20 bg-white rounded-3xl shadow-2xl border border-slate-100 py-3 z-[60] min-w-[220px] animate-in slide-in-from-top-2 duration-200">
                                                        <button
                                                            onClick={() => handleEditClick(merchant)}
                                                            className="w-full px-6 py-4 text-left text-sm font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-700 transition-all flex items-center gap-3"
                                                        >
                                                            <Edit3 className="h-5 w-5" />
                                                            編輯商家資料
                                                        </button>
                                                        <div className="h-px bg-slate-50 mx-4 my-1" />
                                                        <button
                                                            onClick={async () => {
                                                                if (confirm(`確定要永久刪除此商家嗎？此操作將同時移除所有關聯資料。`)) {
                                                                    try {
                                                                        const { error } = await supabase
                                                                            .from('profiles')
                                                                            .delete()
                                                                            .eq('id', merchant.id);

                                                                        if (error) throw error;
                                                                        fetchMerchants();
                                                                    } catch (error) {
                                                                        alert("刪除失敗: " + error.message);
                                                                    }
                                                                }
                                                                setOpenDropdown(null);
                                                            }}
                                                            className="w-full px-6 py-4 text-left text-sm font-bold text-red-500 hover:bg-red-50 transition-all flex items-center gap-3"
                                                        >
                                                            <Trash2 className="h-5 w-5" />
                                                            刪除商家帳號
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminDashboard;
