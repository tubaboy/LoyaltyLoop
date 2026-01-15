import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '../../lib/supabase';
import { store } from '../../lib/store';
import { Gift, Plus, Trash2, ArrowUpCircle, ArrowDownCircle, Info } from 'lucide-react';

const RewardsManagement = () => {
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [type, setType] = useState('add'); // 'add' | 'redeem'

    // New Option State
    const [newItem, setNewItem] = useState({ label: '', value: '', type: 'add' });

    useEffect(() => {
        fetchOptions();
    }, []);

    const fetchOptions = async () => {
        try {
            setLoading(true);
            const merchantId = await store.getMerchantId();
            const { data, error } = await supabase
                .from('loyalty_options')
                .select('*')
                .eq('merchant_id', merchantId)
                .order('type', { ascending: true })
                .order('display_order', { ascending: true });
            if (error) throw error;
            setOptions(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newItem.label || !newItem.value) return;
        try {
            const merchantId = await store.getMerchantId();
            await supabase.from('loyalty_options').insert([{
                ...newItem,
                value: parseInt(newItem.value),
                merchant_id: merchantId,
                type: type
            }]);
            setNewItem({ label: '', value: '', type: type });
            fetchOptions();
        } catch (err) {
            alert('儲存失敗');
        }
    };

    const handleDelete = async (id) => {
        await supabase.from('loyalty_options').delete().eq('id', id);
        fetchOptions();
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900">忠誠度方案設定</h2>
                    <p className="text-slate-500 font-medium">設定門市集點與兌換的規則，這些設定會即時反映在 iPad 終端機上。</p>
                </div>
            </div>

            <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
                <button
                    onClick={() => setType('add')}
                    className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${type === 'add' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <ArrowUpCircle className="inline-block mr-2 h-4 w-4" /> 集點項目
                </button>
                <button
                    onClick={() => setType('redeem')}
                    className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${type === 'redeem' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <ArrowDownCircle className="inline-block mr-2 h-4 w-4" /> 兌換獎勵
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add Form */}
                <Card className="border-none shadow-sm p-8 rounded-3xl bg-white h-fit">
                    <CardHeader className="p-0 mb-6">
                        <CardTitle className="text-xl font-bold flex items-center">
                            <Plus className="mr-2 h-5 w-5 text-teal-600" /> 新增{type === 'add' ? '集點' : '兌換'}方案
                        </CardTitle>
                    </CardHeader>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="font-bold text-slate-600">顯示標題</Label>
                            <Input
                                placeholder={type === 'add' ? '例如：購買咖啡' : '例如：免費拿鐵一份'}
                                value={newItem.label}
                                onChange={e => setNewItem({ ...newItem, label: e.target.value })}
                                className="rounded-xl h-12 bg-slate-50 border-none focus:bg-white transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold text-slate-600">點數數額</Label>
                            <Input
                                type="number"
                                placeholder={type === 'add' ? '例如：10' : '例如：100'}
                                value={newItem.value}
                                onChange={e => setNewItem({ ...newItem, value: e.target.value })}
                                className="rounded-xl h-12 bg-slate-50 border-none focus:bg-white transition-all font-mono"
                            />
                        </div>
                        <Button
                            onClick={handleAdd}
                            disabled={!newItem.label || !newItem.value}
                            className="w-full button-premium text-white py-6 rounded-2xl font-bold text-lg"
                        >
                            確認新增
                        </Button>
                        <div className="p-4 bg-blue-50 rounded-2xl flex gap-3">
                            <Info className="h-5 w-5 text-blue-500 shrink-0" />
                            <p className="text-xs text-blue-700 font-medium leading-relaxed">
                                <b>小提示：</b> 標題建議控制在 8 個字以內，在 iPad 終端機上閱讀最清晰。
                            </p>
                        </div>
                    </div>
                </Card>

                {/* List Table */}
                <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl bg-white h-fit">
                    <CardHeader className="p-8 border-b border-slate-50">
                        <CardTitle className="text-xl font-bold text-slate-800">計畫清單</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50/50 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                                    <tr>
                                        <th className="px-8 py-4">類型</th>
                                        <th className="px-8 py-4">標題</th>
                                        <th className="px-8 py-4">分值</th>
                                        <th className="px-8 py-4 text-right">管理</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {options.filter(o => o.type === type).length === 0 ? (
                                        <tr><td colSpan="4" className="px-8 py-16 text-center text-slate-400 font-medium italic">尚未建立任何項目</td></tr>
                                    ) : (
                                        options.filter(o => o.type === type).map(opt => (
                                            <tr key={opt.id} className="hover:bg-teal-50/30 transition-colors">
                                                <td className="px-8 py-6">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${opt.type === 'add' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                                                        {opt.type === 'add' ? 'ISSUE' : 'REDEEM'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 font-bold text-slate-900">{opt.label}</td>
                                                <td className="px-8 py-6 font-mono font-bold text-slate-700">
                                                    {opt.type === 'add' ? '+' : '-'}{opt.value}
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(opt.id)} className="rounded-xl text-slate-300 hover:text-red-500">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
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
        </div>
    );
};

export default RewardsManagement;
