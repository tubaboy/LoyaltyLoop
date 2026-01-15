import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '../../lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, MoreHorizontal, UserCheck, ExternalLink } from 'lucide-react';

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
            console.log("[AdminDashboard] Fetching merchants...");
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

            console.log("[AdminDashboard] Fetch result:", { data, error });

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
            // 1. Create User in Supabase Auth
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

            if (isAutoSignedIn) {
                console.warn("System auto-signed in as new user.");
            }

            // 2. Upsert Profile (Role: merchant)
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({ id: userId, role: 'merchant' });

            if (profileError) {
                console.error("Profile update failed:", profileError);
                throw profileError;
            }

            // 3. Create/Update Merchant Record
            // Trigger 'handle_new_user' automatically inserts a row with store_name='My Store'.
            // So we should 'update' it with the real name, or 'upsert' to be safe.
            const { error: merchantError } = await supabase
                .from('merchants')
                .upsert({ id: userId, store_name: newMerchant.store_name });

            if (merchantError) throw merchantError;

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
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">商家管理中心</h2>
                    <p className="text-slate-500 mt-2 font-medium">在此您可以管理所有已註冊的商家、審核帳號與設定權限。</p>
                </div>
                <Button
                    onClick={() => setShowAddMerchant(true)}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-6 rounded-2xl shadow-lg shadow-teal-600/20 transition-all font-bold text-lg">
                    <Plus className="mr-2 h-6 w-6" /> 新增商家帳號
                </Button>
            </div>

            {/* Add Merchant Dialog Overlay */}
            {showAddMerchant && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900">新增商家</h3>
                            <button onClick={() => setShowAddMerchant(false)} className="text-slate-400 hover:text-slate-600">
                                <Plus className="h-6 w-6 rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateMerchant} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">商店名稱</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all font-medium"
                                    value={newMerchant.store_name}
                                    onChange={e => setNewMerchant({ ...newMerchant, store_name: e.target.value })}
                                    placeholder="例如：森林咖啡"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all font-medium"
                                    value={newMerchant.email}
                                    onChange={e => setNewMerchant({ ...newMerchant, email: e.target.value })}
                                    placeholder="merchant@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">設定密碼</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all font-medium"
                                    value={newMerchant.password}
                                    onChange={e => setNewMerchant({ ...newMerchant, password: e.target.value })}
                                    placeholder="至少 6 位數"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button type="button" variant="outline" onClick={() => setShowAddMerchant(false)} className="flex-1 rounded-xl py-6">取消</Button>
                                <Button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-6 font-bold shadow-lg shadow-teal-600/20">確認新增</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Merchant Dialog Overlay */}
            {showEditMerchant && editingMerchant && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900">編輯商家資料</h3>
                            <button onClick={() => setShowEditMerchant(false)} className="text-slate-400 hover:text-slate-600">
                                <Plus className="h-6 w-6 rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateMerchant} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">商店名稱</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all font-medium"
                                    value={editingMerchant.store_name}
                                    onChange={e => setEditingMerchant({ ...editingMerchant, store_name: e.target.value })}
                                    placeholder="門市名稱"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button type="button" variant="outline" onClick={() => setShowEditMerchant(false)} className="flex-1 rounded-xl py-6">取消</Button>
                                <Button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-6 font-bold shadow-lg shadow-teal-600/20">確認修改</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Content Card */}
            <Card className="border-none shadow-sm rounded-3xl bg-white overflow-visible">
                <CardHeader className="p-8 border-b border-slate-50 bg-white">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <CardTitle className="text-xl font-bold text-slate-800 flex items-center">
                            <UserCheck className="mr-3 h-5 w-5 text-teal-600" /> 所有商家列表
                        </CardTitle>
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="搜尋商家名稱或 ID..."
                                className="w-full rounded-2xl border-none bg-slate-50 pl-12 pr-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500/20 focus:bg-white transition-all"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-visible">
                        <table className="w-full text-sm text-left">
                            <thead className="text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 border-b border-slate-50">
                                <tr>
                                    <th className="px-8 py-5">商家名稱</th>
                                    <th className="px-8 py-5">帳號 ID</th>
                                    <th className="px-8 py-5">註冊日期</th>
                                    <th className="px-8 py-5">帳號狀態</th>
                                    <th className="px-8 py-5 text-right">管理操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr><td colSpan="5" className="px-8 py-16 text-center text-slate-400 font-medium">載入中...</td></tr>
                                ) : merchants.length === 0 ? (
                                    <tr><td colSpan="5" className="px-8 py-16 text-center text-slate-400 font-medium">目前尚無商家資料</td></tr>
                                ) : (
                                    merchants.map((merchant) => (
                                        <tr key={merchant.id} className="hover:bg-teal-50/30 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                                                    {merchant.merchants?.store_name || "未命名商店"}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="text-slate-400 font-mono text-xs flex items-center">
                                                    {merchant.id.slice(0, 8)}... <ExternalLink className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-slate-500 font-medium">
                                                {new Date(merchant.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                                                    正常營運
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right relative">
                                                <button
                                                    onClick={() => setOpenDropdown(openDropdown === merchant.id ? null : merchant.id)}
                                                    className="p-2 rounded-xl hover:bg-slate-100 transition-colors inline-flex items-center text-slate-400 hover:text-slate-600"
                                                >
                                                    <MoreHorizontal className="h-5 w-5" />
                                                </button>

                                                {openDropdown === merchant.id && (
                                                    <div className="absolute right-8 top-14 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 min-w-[180px]">
                                                        <button
                                                            onClick={() => handleEditClick(merchant)}
                                                            className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-700 transition-colors flex items-center gap-2"
                                                        >
                                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                            編輯商家資料
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (confirm(`確定要刪除商家「${merchant.merchants?.store_name}」嗎？\n此操作無法復原。`)) {
                                                                    try {
                                                                        // Delete merchant (cascade will handle profile)
                                                                        const { error } = await supabase
                                                                            .from('profiles')
                                                                            .delete()
                                                                            .eq('id', merchant.id);

                                                                        if (error) throw error;
                                                                        alert("商家已刪除");
                                                                        fetchMerchants();
                                                                    } catch (error) {
                                                                        alert("刪除失敗: " + error.message);
                                                                    }
                                                                }
                                                                setOpenDropdown(null);
                                                            }}
                                                            className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                                        >
                                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                            刪除商家
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
