import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '../../lib/supabase';
import { store } from '../../lib/store';
import { Gift, Plus, Trash2, ArrowUpCircle, ArrowDownCircle, Info, Star, Zap, RefreshCw } from 'lucide-react';

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
        if (!confirm('確定要刪除此項目嗎？')) return;
        await supabase.from('loyalty_options').delete().eq('id', id);
        fetchOptions();
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-black shadow-inner shadow-indigo-600/5">
                            <Star className="w-6 h-6" />
                        </div>
                        <h2 className="text-3xl font-black tracking-tight text-slate-900">忠誠度方案設定</h2>
                    </div>
                    <p className="text-slate-500 font-medium ml-1 leading-relaxed max-w-2xl">
                        在此設定您的行銷規則，不論是「買一送一」或「百元集點」，設定後將即時同步至各分店終端機。
                    </p>
                </div>
            </div>

            {/* View Switcher */}
            <div className="flex p-1.5 bg-slate-100 rounded-[1.5rem] w-fit shadow-inner">
                <button
                    onClick={() => setType('add')}
                    className={`px-8 py-3.5 rounded-[1.2rem] text-sm font-black transition-all flex items-center gap-2 ${type === 'add' ? 'bg-white text-teal-600 shadow-soft-md scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <ArrowUpCircle className={`h-5 w-5 ${type === 'add' ? 'text-teal-500' : 'text-slate-400'}`} /> 集點規則
                </button>
                <button
                    onClick={() => setType('redeem')}
                    className={`px-8 py-3.5 rounded-[1.2rem] text-sm font-black transition-all flex items-center gap-2 ${type === 'redeem' ? 'bg-white text-indigo-600 shadow-soft-md scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <ArrowDownCircle className={`h-5 w-5 ${type === 'redeem' ? 'text-indigo-500' : 'text-slate-400'}`} /> 兌換獎勵
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                {/* Form Section */}
                <div className="xl:col-span-4">
                    <Card className="border-none shadow-soft-2xl rounded-[2.5rem] bg-white h-fit overflow-hidden sticky top-8">
                        <div className={`p-8 border-b border-slate-50 ${type === 'add' ? 'bg-teal-500/5' : 'bg-indigo-500/5'}`}>
                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                <Zap className={`w-5 h-5 ${type === 'add' ? 'text-teal-600' : 'text-indigo-600'}`} />
                                新增{type === 'add' ? '集點' : '兌換'}方案
                            </h3>
                        </div>
                        <div className="p-8 space-y-8">
                            <div className="space-y-3">
                                <Label className="font-black text-slate-900 ml-1 uppercase text-xs tracking-widest">顯示標題</Label>
                                <Input
                                    placeholder={type === 'add' ? '例：購買拿鐵一杯' : '例：免費換伯爵茶'}
                                    value={newItem.label}
                                    onChange={e => setNewItem({ ...newItem, label: e.target.value })}
                                    className="h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-teal-500/30 transition-all font-bold px-5"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="font-black text-slate-900 ml-1 uppercase text-xs tracking-widest">點數數值 (PTS)</Label>
                                <Input
                                    type="number"
                                    placeholder={type === 'add' ? '10' : '100'}
                                    value={newItem.value}
                                    onChange={e => setNewItem({ ...newItem, value: e.target.value })}
                                    className="h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-teal-500/30 transition-all font-black px-5 tabular-nums"
                                />
                            </div>
                            <Button
                                onClick={handleAdd}
                                disabled={!newItem.label || !newItem.value}
                                className={type === 'add' ? 'w-full button-premium h-16 rounded-2xl text-lg' : 'w-full h-16 rounded-2xl text-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-200'}
                            >
                                <Plus className="mr-2 h-6 w-6" /> 加入集點選單
                            </Button>

                            <div className="p-5 bg-slate-50 rounded-2xl flex gap-4 border border-slate-100">
                                <Info className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-slate-500 font-bold leading-relaxed tracking-wide">
                                    小細節：建議標題保持簡短（8 字內），能讓門市人員在 iPad 上一眼辨識。
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* List Table Section */}
                <div className="xl:col-span-8">
                    <Card className="border-none shadow-soft-lg rounded-[2.5rem] bg-white h-fit overflow-hidden">
                        <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
                            <CardTitle className="text-xl font-black text-slate-800">所有集點計畫</CardTitle>
                            <span className="px-4 py-1.5 bg-slate-100 rounded-full text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                Total {options.filter(o => o.type === type).length} Items
                            </span>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                                        <tr>
                                            <th className="px-10 py-5">顯示名稱</th>
                                            <th className="px-10 py-5">點數數值</th>
                                            <th className="px-10 py-5 text-right">管理操作</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {loading ? (
                                            <tr><td colSpan="3" className="px-10 py-24 text-center">
                                                <RefreshCw className="w-10 h-10 text-teal-600/20 animate-spin mx-auto mb-4" />
                                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">載入方案中...</p>
                                            </td></tr>
                                        ) : options.filter(o => o.type === type).length === 0 ? (
                                            <tr><td colSpan="3" className="px-10 py-32 text-center">
                                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                                    <Zap className="w-10 h-10 text-slate-200" />
                                                </div>
                                                <h3 className="text-xl font-black text-slate-300">目前尚無任何項目</h3>
                                            </td></tr>
                                        ) : (
                                            options.filter(o => o.type === type).map(opt => (
                                                <tr key={opt.id} className="group hover:bg-slate-50/80 transition-all duration-300">
                                                    <td className="px-10 py-8 font-black text-slate-900 group-hover:text-teal-600 transition-colors">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-3 h-3 rounded-full ${opt.type === 'add' ? 'bg-teal-500 shadow-sm shadow-teal-500/30' : 'bg-indigo-500 shadow-sm shadow-indigo-500/30'}`} />
                                                            {opt.label}
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-8">
                                                        <span className={`px-5 py-2 rounded-xl h-10 font-mono font-black text-lg ${opt.type === 'add' ? 'bg-teal-50 text-teal-700' : 'bg-indigo-50 text-indigo-700'}`}>
                                                            {opt.type === 'add' ? '+' : '-'}{opt.value} <span className="text-[10px] font-sans opacity-50 ml-1">PTS</span>
                                                        </span>
                                                    </td>
                                                    <td className="px-10 py-8 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDelete(opt.id)}
                                                            className="h-12 w-12 rounded-2xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                                        >
                                                            <Trash2 className="h-6 w-6" />
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
                    <p className="mt-8 text-center text-xs text-slate-400 font-medium">
                        * 所有修改將會在 10 秒內同步至連線的集點終端設備。
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RewardsManagement;
