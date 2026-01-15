import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '../../lib/supabase';
import { store } from '../../lib/store';
import { MapPin, Plus, Trash2, Edit2, Check, X, Phone } from 'lucide-react';

const BranchManagement = () => {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Form state
    const [formData, setFormData] = useState({ name: '', address: '', phone: '' });

    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        try {
            setLoading(true);
            const merchantId = await store.getMerchantId();
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
            setFormData({ name: '', address: '', phone: '' });
            fetchBranches();
        } catch (err) {
            alert('儲存失敗');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('確定要刪除此分店嗎？這可能會影響相關交易紀錄。')) return;
        await supabase.from('branches').delete().eq('id', id);
        fetchBranches();
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900">分店管理</h2>
                    <p className="text-slate-500 font-medium">管理您的連鎖門市與據點資訊。</p>
                </div>
                {!isAdding && (
                    <Button onClick={() => setIsAdding(true)} className="button-premium text-white px-6">
                        <Plus className="mr-2 h-5 w-5" /> 新增分店
                    </Button>
                )}
            </div>

            {(isAdding || editingId) && (
                <Card className="border-teal-100 bg-teal-50/30 shadow-lg p-6 rounded-3xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label className="font-bold text-slate-700">分店名稱</Label>
                            <Input
                                placeholder="例如：忠孝店"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="bg-white rounded-xl h-12"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold text-slate-700">地址</Label>
                            <Input
                                placeholder="完整地址"
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                className="bg-white rounded-xl h-12"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold text-slate-700">電話</Label>
                            <Input
                                placeholder="聯絡電話"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="bg-white rounded-xl h-12"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-8">
                        <Button variant="ghost" onClick={() => { setIsAdding(false); setEditingId(null); }} className="rounded-xl">取消</Button>
                        <Button onClick={handleSave} className="bg-teal-600 hover:bg-teal-700 text-white px-8 rounded-xl font-bold">儲存分店</Button>
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading ? (
                    <p>載入中...</p>
                ) : branches.map(branch => (
                    <Card key={branch.id} className="border-none shadow-sm p-6 rounded-3xl group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-teal-50 p-3 rounded-2xl group-hover:bg-teal-600 transition-colors">
                                <MapPin className="h-6 w-6 text-teal-600 group-hover:text-white" />
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" onClick={() => { setEditingId(branch.id); setFormData(branch); }} className="h-9 w-9 text-slate-400 hover:text-teal-600"><Edit2 className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(branch.id)} className="h-9 w-9 text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">{branch.name}</h3>
                        <div className="mt-4 space-y-2">
                            <div className="flex items-center text-sm text-slate-500 font-medium">
                                <MapPin className="h-4 w-4 mr-2 opacity-50" /> {branch.address || '未設定地址'}
                            </div>
                            <div className="flex items-center text-sm text-slate-500 font-medium">
                                <Phone className="h-4 w-4 mr-2 opacity-50" /> {branch.phone || '未設定電話'}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default BranchManagement;
