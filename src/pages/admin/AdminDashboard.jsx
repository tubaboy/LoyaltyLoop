import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '../../lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, MoreHorizontal, UserCheck, ExternalLink, RefreshCw, Trash2, Edit3, ShieldCheck } from 'lucide-react';

const AdminDashboard = () => {
    const [merchants, setMerchants] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showAddMerchant, setShowAddMerchant] = useState(false);
    const [newMerchant, setNewMerchant] = useState({ email: '', password: '', store_name: '' });

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
                    store_name
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
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: newMerchant.email,
                password: newMerchant.password,
                options: {
                    data: {
                        role: 'merchant'
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("No user created");

            const userId = authData.user.id;
            const isAutoSignedIn = authData.session !== null;

            await supabase
                .from('profiles')
                .upsert({ id: userId, role: 'merchant' });

            await supabase
                .from('merchants')
                .upsert({ id: userId, store_name: newMerchant.store_name });

            alert("商家帳號建立成功！");

            if (isAutoSignedIn) {
                alert("建立帳號後系統已自動切換為新帳號，請重新登入管理員帳號。");
                await supabase.auth.signOut();
                window.location.reload();
            } else {
                setShowAddMerchant(false);
                setNewMerchant({ email: '', password: '', store_name: '' });
                fetchMerchants();
            }

        } catch (error) {
            console.error("Error creating merchant:", error);
            alert("建立失敗: " + error.message);
        }
    };

    const handleUpdateMerchant = async (e) => {
        e.preventDefault();
        try {
            if (!editingMerchant) return;

            const { error } = await supabase
                .from('merchants')
                .update({ store_name: editingMerchant.store_name })
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
        setEditingMerchant({
            id: merchant.id,
            store_name: merchant.merchants?.store_name || ''
        });
        setShowEditMerchant(true);
        setOpenDropdown(null);
    };

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
                        const randomPassword = Math.floor(100000 + Math.random() * 900000).toString();
                        setNewMerchant(prev => ({ ...prev, password: randomPassword }));
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
                <div className="fixed inset-0 bg-slate-950/60 z-[100] flex items-center justify-center p-6 backdrop-blur-md">
                    <Card className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl border-none animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-2xl font-black text-slate-900">新增商家帳號</h3>
                            <button onClick={() => setShowAddMerchant(false)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                                <Plus className="h-6 w-6 rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateMerchant} className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">商店/品牌名稱</Label>
                                <Input
                                    type="text"
                                    required
                                    className="h-14 rounded-2xl border-transparent bg-slate-50 px-6 py-3 focus:bg-white focus:border-teal-500/30 outline-none transition-all font-bold"
                                    value={newMerchant.store_name}
                                    onChange={e => setNewMerchant({ ...newMerchant, store_name: e.target.value })}
                                    placeholder="例：永心鳳茶"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">管理員 Email</Label>
                                <Input
                                    type="email"
                                    required
                                    className="h-14 rounded-2xl border-transparent bg-slate-50 px-6 py-3 focus:bg-white focus:border-teal-500/30 outline-none transition-all font-bold"
                                    value={newMerchant.email}
                                    onChange={e => setNewMerchant({ ...newMerchant, email: e.target.value })}
                                    placeholder="merchant@example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">預設登入密碼</Label>
                                <Input
                                    type="text"
                                    required
                                    className="h-14 rounded-2xl border-transparent bg-slate-50 px-6 py-3 focus:bg-white focus:border-teal-500/30 outline-none transition-all font-bold font-mono"
                                    value={newMerchant.password}
                                    onChange={e => setNewMerchant({ ...newMerchant, password: e.target.value })}
                                />
                            </div>

                            <div className="pt-6 flex gap-4">
                                <Button type="button" variant="ghost" onClick={() => setShowAddMerchant(false)} className="flex-1 rounded-2xl h-14 font-black text-slate-400">取消</Button>
                                <Button type="submit" className="flex-1 button-premium rounded-2xl h-14">立即建立</Button>
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
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left">
                            <thead className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50 border-b border-slate-50">
                                <tr>
                                    <th className="px-10 py-6">品牌商家名稱</th>
                                    <th className="px-10 py-6">系統識別 ID</th>
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
                                ) : merchants.length === 0 ? (
                                    <tr><td colSpan="5" className="px-10 py-32 text-center text-slate-400 font-black uppercase tracking-widest">目前尚無商家資料</td></tr>
                                ) : (
                                    merchants.map((merchant) => (
                                        <tr key={merchant.id} className="hover:bg-slate-50/80 transition-all duration-300 group">
                                            <td className="px-10 py-8">
                                                <div className="font-black text-xl text-slate-900 group-hover:text-teal-700 transition-colors">
                                                    {merchant.merchants?.store_name || "未命名品牌"}
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="text-slate-400 font-mono text-xs flex items-center group-hover:text-slate-600 transition-colors">
                                                    {merchant.id.slice(0, 12)}...
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-slate-500 font-bold text-sm">
                                                {new Date(merchant.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </td>
                                            <td className="px-10 py-8">
                                                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 shadow-sm shadow-emerald-700/5">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                                                    Active
                                                </span>
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
