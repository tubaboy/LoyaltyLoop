import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '../../lib/supabase';
import { store } from '../../lib/store';
import { MapPin, Plus, Trash2, Edit2, Phone, Key, Store, ArrowRight, RefreshCw, Copy } from 'lucide-react';
import { cn } from "@/lib/utils";

const BranchManagement = () => {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [storeCode, setStoreCode] = useState('----');

    // Form state
    const [formData, setFormData] = useState({ name: '', address: '', phone: '', login_key: '', is_active: true });

    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        try {
            setLoading(true);
            const merchantId = await store.getMerchantId();

            // Fetch merchant store_code
            const { data: merchantData } = await supabase
                .from('merchants')
                .select('store_code')
                .eq('id', merchantId)
                .single();

            if (merchantData) setStoreCode(merchantData.store_code || '----');

            const { data, error } = await supabase
                .from('branches')
                .select('*')
                .eq('merchant_id', merchantId)
                .order('created_at', { ascending: true });
            if (error) throw error;
            setBranches(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const merchantId = await store.getMerchantId();
            if (editingId) {
                await supabase.from('branches').update(formData).eq('id', editingId);
            } else {
                await supabase.from('branches').insert([{ ...formData, merchant_id: merchantId }]);
            }
            setIsAdding(false);
            setEditingId(null);
            setFormData({ name: '', address: '', phone: '', login_key: '', is_active: true });
            fetchBranches();
        } catch (err) {
            alert('儲存失敗：金鑰可能重複或格式錯誤');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('確定要刪除此分店嗎？這可能會影響相關交易紀錄。')) return;
        await supabase.from('branches').delete().eq('id', id);
        fetchBranches();
    };

    const handleCopy = async (branch) => {
        try {
            const merchantId = await store.getMerchantId();
            const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
            const randomKey = `${storeCode}${randomPin}`;

            const newBranchData = {
                name: `${branch.name} - 副本`,
                address: branch.address,
                phone: branch.phone,
                login_key: randomKey,
                is_active: branch.is_active ?? true,
                merchant_id: merchantId
            };

            const { error } = await supabase.from('branches').insert([newBranchData]);
            if (error) throw error;

            fetchBranches();
        } catch (err) {
            console.error(err);
            alert('複製分店失敗');
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center">
                            <Store className="w-6 h-6" />
                        </div>
                        <h2 className="text-3xl font-black tracking-tight text-slate-900">分店管理中心</h2>
                    </div>
                    <p className="text-slate-500 font-medium ml-1">在此您可以管理所有連鎖門市的設備金鑰與聯繫資訊。</p>
                </div>
                {!isAdding && !editingId && (
                    <Button onClick={() => setIsAdding(true)} className="button-premium h-14 px-8 rounded-2xl text-lg group">
                        <Plus className="mr-2 h-6 w-6 group-hover:rotate-90 transition-transform" /> 新增門市分店
                    </Button>
                )}
            </div>

            {/* Form Card */}
            {(isAdding || editingId) && (
                <Card className="border-none shadow-soft-2xl rounded-[2.5rem] bg-white overflow-hidden animate-in slide-in-from-top-4 duration-500">
                    <div className="p-10 border-b border-slate-50 bg-slate-50/30">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                            {editingId ? <Edit2 className="w-5 h-5 text-teal-600" /> : <Plus className="w-5 h-5 text-teal-600" />}
                            {editingId ? '編輯門市資訊' : '建立新分店'}
                        </h3>
                    </div>
                    <CardContent className="p-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="space-y-3">
                                <Label className="font-black text-slate-900 ml-1 uppercase text-xs tracking-widest">分店名稱</Label>
                                <Input
                                    placeholder="例如：忠孝 SOGO 店"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-teal-500/30 transition-all font-bold px-5"
                                />
                            </div>
                            <div className="space-y-3 lg:col-span-2">
                                <Label className="font-black text-slate-900 ml-1 uppercase text-xs tracking-widest">門市地址</Label>
                                <Input
                                    placeholder="完整營運地址"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    className="h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-teal-500/30 transition-all font-bold px-5"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="font-black text-slate-900 ml-1 uppercase text-xs tracking-widest">聯絡電話</Label>
                                <Input
                                    placeholder="門市專線"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-teal-500/30 transition-all font-bold px-5"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="font-black text-slate-900 ml-1 uppercase text-xs tracking-widest">系統登入金鑰 (8 碼: {storeCode} + PIN)</Label>
                                <div className="flex gap-2">
                                    <div className="h-14 rounded-l-2xl bg-slate-200 flex items-center px-4 font-black text-slate-500 border-r border-slate-300">
                                        {storeCode}
                                    </div>
                                    <Input
                                        placeholder="後 4 碼 PIN"
                                        value={formData.login_key ? formData.login_key.replace(storeCode, '') : ''}
                                        onChange={e => {
                                            const pin = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                                            setFormData({ ...formData, login_key: `${storeCode}${pin}` });
                                        }}
                                        className="h-14 rounded-r-2xl bg-slate-50 border-transparent focus:bg-white focus:border-teal-500/30 transition-all font-black tracking-[0.4em] text-center px-5 flex-1"
                                        maxLength={4}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => {
                                            const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
                                            setFormData(prev => ({ ...prev, login_key: `${storeCode}${randomPin}` }));
                                        }}
                                        className="h-14 w-14 rounded-2xl bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-600 transition-all flex-shrink-0"
                                    >
                                        <RefreshCw className="h-6 w-6" />
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Label className="font-black text-slate-900 ml-1 uppercase text-xs tracking-widest">分店狀態</Label>
                                <select
                                    value={formData.is_active}
                                    onChange={e => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                                    className="w-full h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-0 focus:border-teal-500/30 transition-all font-bold px-5 appearance-none cursor-pointer"
                                >
                                    <option value="true">正常營運</option>
                                    <option value="false">暫停營運</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-4 mt-12 pt-8 border-t border-slate-50">
                            <Button variant="ghost" onClick={() => { setIsAdding(false); setEditingId(null); }} className="h-14 px-8 rounded-2xl font-bold text-slate-400">放棄修改</Button>
                            <Button onClick={handleSave} className="button-premium h-14 px-10 rounded-2xl text-lg">完成並儲存</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* List Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {loading ? (
                    <div className="col-span-full py-20 text-center">
                        <RefreshCw className="w-10 h-10 text-teal-600/20 animate-spin mx-auto mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">串聯門市資料中...</p>
                    </div>
                ) : branches.length === 0 ? (
                    <div className="col-span-full py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center px-6">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                            <Store className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-400 mb-2">尚未建立任何分店</h3>
                        <p className="text-slate-400 max-w-xs mb-8">點擊上方按鈕開始建立您的第一個門市據點，並獲得登入金鑰。</p>
                        <Button onClick={() => setIsAdding(true)} variant="outline" className="rounded-2xl h-12 px-6 border-slate-200 text-slate-600">現在新增</Button>
                    </div>
                ) : branches.map(branch => (
                    <Card key={branch.id} className="border-none shadow-soft-lg p-8 rounded-[2.5rem] bg-white group hover:shadow-soft-2xl transition-all duration-500 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />

                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div className="bg-slate-50 p-4 rounded-2xl group-hover:bg-teal-600 group-hover:text-white transition-all duration-500 shadow-inner">
                                <Store className="h-7 w-7" />
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleCopy(branch)} title="複製分店" className="h-10 w-10 rounded-xl text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition-all"><Copy className="h-5 w-5" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => { setEditingId(branch.id); setFormData(branch); }} className="h-10 w-10 rounded-xl text-slate-300 hover:text-teal-600 hover:bg-teal-50 transition-all"><Edit2 className="h-5 w-5" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(branch.id)} className="h-10 w-10 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 className="h-5 w-5" /></Button>
                            </div>
                        </div>

                        <div className="relative z-10">
                            <h3 className="text-2xl font-black text-slate-900 group-hover:text-teal-700 transition-colors mb-1">{branch.name}</h3>
                            <div className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Active Terminal</div>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-5 w-5 text-slate-300 mt-0.5" />
                                    <span className="text-sm font-bold text-slate-500 leading-relaxed">{branch.address || '未設定地址'}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone className="h-5 w-5 text-slate-300" />
                                    <span className="text-sm font-bold text-slate-500">{branch.phone || '未設定電話'}</span>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Terminal Key</span>
                                    <span className="text-lg font-black tracking-[0.15em] text-teal-600 font-mono">
                                        {branch.login_key || '••••••••'}
                                    </span>
                                </div>
                                <div className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors",
                                    branch.is_active !== false
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "bg-rose-50 text-rose-700"
                                )}>
                                    {branch.is_active !== false ? '正常營運' : '暫停營運'}
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default BranchManagement;
