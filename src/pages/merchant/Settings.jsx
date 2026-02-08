import React, { useState, useEffect } from 'react';
import { store } from '../../lib/store';
import { supabase } from '../../lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, ShieldCheck, Palette, Timer, Check, RefreshCw, AlertCircle, XCircle, Info, Sparkles, MessageCircle, Copy, Image as ImageIcon, Upload } from 'lucide-react';
import { cn } from "@/lib/utils";

const StatusAlert = ({ message, type = 'error' }) => {
    if (!message) return null;

    const styles = {
        success: "bg-teal-50/80 border-teal-200/50 text-teal-800",
        error: "bg-red-50/80 border-red-200/50 text-red-800",
        warning: "bg-amber-50/80 border-amber-200/50 text-amber-800",
        info: "bg-slate-50/80 border-slate-200/50 text-slate-800"
    };

    const icons = {
        success: <Check className="w-5 h-5 text-teal-500" />,
        error: <XCircle className="w-5 h-5 text-red-500" />,
        warning: <AlertCircle className="w-5 h-5 text-amber-500" />,
        info: <Info className="w-5 h-5 text-slate-500" />
    };

    return (
        <div className={`p-4 rounded-2xl border backdrop-blur-md shadow-soft-sm animate-in zoom-in-95 duration-300 ${styles[type]}`}>
            <div className="flex gap-3">
                <div className="shrink-0 mt-0.5">{icons[type]}</div>
                <div>
                    <p className="text-sm font-black leading-tight mb-1">
                        {type === 'success' ? '更新成功' : '系統提示'}
                    </p>
                    <p className="text-xs font-bold opacity-90 leading-relaxed">{message}</p>
                </div>
            </div>
        </div>
    );
};

const THEME_COLORS = [
    { name: 'Teal', value: 'teal', bg: 'bg-teal-500', border: 'border-teal-500' },
    { name: 'Indigo', value: 'indigo', bg: 'bg-indigo-500', border: 'border-indigo-500' },
    { name: 'Rose', value: 'rose', bg: 'bg-rose-500', border: 'border-rose-500' },
    { name: 'Amber', value: 'amber', bg: 'bg-amber-500', border: 'border-amber-500' },
    { name: 'Emerald', value: 'emerald', bg: 'bg-emerald-500', border: 'border-emerald-500' },
    { name: 'Slate', value: 'slate', bg: 'bg-slate-700', border: 'border-slate-700' },
];

const RESET_INTERVALS = [5, 10, 15, 20, 30];

export default function Settings() {
    const [loading, setLoading] = useState(true);
    const [branches, setBranches] = useState([]);
    const [selectedBranchId, setSelectedBranchId] = useState('');

    // Password State
    const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
    const [pwLoading, setPwLoading] = useState(false);
    const [pwMessage, setPwMessage] = useState({ text: '', type: '' });

    // Branch Settings State
    const [branchSettings, setBranchSettings] = useState({
        theme_color: 'teal',
        reset_interval: 10,
        enable_confetti: true,
        enable_sound: true,
        logo_url: null,
        point_collection_effect: 'shower',
        redemption_effect: 'confetti'
    });
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [settingsMessage, setSettingsMessage] = useState({ text: '', type: '' });

    // Merchant (System) Settings State
    const [merchantSettings, setMerchantSettings] = useState({ line_user_id: '', daily_report_enabled: false });
    const [merchantSettingsLoading, setMerchantSettingsLoading] = useState(false);
    const [merchantSettingsMessage, setMerchantSettingsMessage] = useState({ text: '', type: '' });

    // LINE Bot Binding State
    const [bindCode, setBindCode] = useState(null);
    const [bindCodeExpiry, setBindCodeExpiry] = useState(null);
    const [bindCodeLoading, setBindCodeLoading] = useState(false);
    const [bindCodeCopied, setBindCodeCopied] = useState(false);
    const [existingBinding, setExistingBinding] = useState(null);

    useEffect(() => {
        fetchInitialData();

        // Check for persisted messages (e.g. after auth reload)
        const savedMsg = sessionStorage.getItem('settings_message');
        if (savedMsg) {
            const { text, type } = JSON.parse(savedMsg);
            setPwMessage({ text, type });
            sessionStorage.removeItem('settings_message');
        }
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const merchantId = await store.getMerchantId();
            const { data, error } = await supabase
                .from('branches')
                .select('*')
                .eq('merchant_id', merchantId)
                .order('name');

            if (error) throw error;
            setBranches(data || []);
            if (data && data.length > 0) {
                setSelectedBranchId(data[0].id);
                setBranchSettings({
                    theme_color: data[0].theme_color || 'teal',
                    reset_interval: data[0].reset_interval || 10,
                    enable_confetti: data[0].enable_confetti !== false,
                    enable_sound: data[0].enable_sound !== false,
                    logo_url: data[0].logo_url || null,
                    point_collection_effect: data[0].point_collection_effect || 'shower',
                    redemption_effect: data[0].redemption_effect || 'confetti'
                });
            }

            // Fetch Merchant Settings
            const { data: merchant, error: mError } = await supabase
                .from('merchants')
                .select('settings')
                .eq('id', merchantId)
                .single();

            if (mError) throw mError;
            if (merchant && merchant.settings) {
                setMerchantSettings({
                    line_user_id: merchant.settings.line_user_id || '',
                    daily_report_enabled: !!merchant.settings.daily_report_enabled
                });
            }

            // Fetch existing LINE Bot binding
            const { data: binding } = await supabase
                .from('merchant_line_bindings')
                .select('*')
                .eq('merchant_id', merchantId)
                .maybeSingle();

            if (binding) {
                setExistingBinding(binding);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleBranchChange = (branchId) => {
        const branch = branches.find(b => b.id === branchId);
        setSelectedBranchId(branchId);
        if (branch) {
            setBranchSettings({
                theme_color: branch.theme_color || 'teal',
                reset_interval: branch.reset_interval || 10,
                enable_confetti: branch.enable_confetti !== false,
                enable_sound: branch.enable_sound !== false,
                logo_url: branch.logo_url || null,
                point_collection_effect: branch.point_collection_effect || 'shower',
                redemption_effect: branch.redemption_effect || 'confetti'
            });
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (passwords.next !== passwords.confirm) {
            setPwMessage({ text: '密碼與確認密碼不符', type: 'error' });
            return;
        }
        if (passwords.next.length < 6) {
            setPwMessage({ text: '密碼長度需至少 6 個字元', type: 'error' });
            return;
        }

        try {
            setPwLoading(true);
            setPwMessage({ text: '', type: '' });
            await store.updatePassword(passwords.next);

            const successMsg = { text: '登入密碼已成功更新！', type: 'success' };
            setPwMessage(successMsg);
            // Save to session storage just in case of unexpected refresh or auth shift
            sessionStorage.setItem('settings_message', JSON.stringify(successMsg));

            setPasswords({ current: '', next: '', confirm: '' });
        } catch (err) {
            console.error(err);
            setPwMessage({ text: err.message || '更新失敗', type: 'error' });
        } finally {
            setPwLoading(false);
        }
    };


    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validation: Size < 2MB, Type Image
        if (file.size > 2 * 1024 * 1024) {
            setSettingsMessage({ text: '檔案大小請勿超過 2MB', type: 'error' });
            return;
        }
        if (!file.type.startsWith('image/')) {
            setSettingsMessage({ text: '請上傳圖片檔案', type: 'error' });
            return;
        }

        try {
            setSettingsLoading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${selectedBranchId}/${Date.now()}.${fileExt}`;
            const filePath = `branch_logos/${fileName}`;
            const branchFolder = `branch_logos/${selectedBranchId}/`;

            // 1. Cleanup: List and delete old files in this branch's folder
            const { data: existingFiles } = await supabase.storage
                .from('logos')
                .list(`branch_logos/${selectedBranchId}`); // Do not use trailing slash for list in some versions, but folders need care.

            if (existingFiles && existingFiles.length > 0) {
                // Filter out .emptyFolderPlaceholder if you use it, though here we just delete everything
                const filesToRemove = existingFiles
                    .filter(f => f.name !== '.emptyFolderPlaceholder')
                    .map(f => `branch_logos/${selectedBranchId}/${f.name}`);

                if (filesToRemove.length > 0) {
                    await supabase.storage.from('logos').remove(filesToRemove);
                }
            }

            // 2. Upload new file
            const { error: uploadError } = await supabase.storage
                .from('logos')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('logos')
                .getPublicUrl(filePath);

            setBranchSettings(prev => ({ ...prev, logo_url: publicUrl }));
            setSettingsMessage({ text: '圖片上傳成功！請記得點擊儲存設定。', type: 'success' });
        } catch (err) {
            console.error(err);
            setSettingsMessage({ text: err.message || '圖片上傳失敗', type: 'error' });
        } finally {
            setSettingsLoading(false);
        }
    };

    const handleSaveBranchSettings = async () => {
        if (!selectedBranchId) {
            setSettingsMessage({ text: '請先新增分店資料', type: 'warning' });
            return;
        }

        try {
            setSettingsLoading(true);
            setSettingsMessage({ text: '', type: '' });
            const { error } = await supabase
                .from('branches')
                .update({
                    theme_color: branchSettings.theme_color,
                    reset_interval: branchSettings.reset_interval,
                    enable_confetti: branchSettings.enable_confetti,
                    enable_sound: branchSettings.enable_sound,
                    logo_url: branchSettings.logo_url,
                    point_collection_effect: branchSettings.point_collection_effect,
                    redemption_effect: branchSettings.redemption_effect
                })
                .eq('id', selectedBranchId);

            if (error) throw error;

            // Update local state
            setBranches(prev => prev.map(b =>
                b.id === selectedBranchId
                    ? { ...b, ...branchSettings }
                    : b
            ));

            setSettingsMessage({ text: '分店設定儲存成功！', type: 'success' });
        } catch (err) {
            console.error(err);
            setSettingsMessage({ text: err.message || '儲存失敗', type: 'error' });
        } finally {
            setSettingsLoading(false);
        }
    };

    const handleSaveMerchantSettings = async () => {
        try {
            setMerchantSettingsLoading(true);
            setMerchantSettingsMessage({ text: '', type: '' });
            const merchantId = await store.getMerchantId();

            // Fetch current settings first to merge
            const { data: current, error: getError } = await supabase
                .from('merchants')
                .select('settings')
                .eq('id', merchantId)
                .single();

            if (getError) throw getError;

            const newSettings = {
                ...(current?.settings || {}),
                line_user_id: merchantSettings.line_user_id,
                daily_report_enabled: merchantSettings.daily_report_enabled
            };

            const { error: updateError } = await supabase
                .from('merchants')
                .update({ settings: newSettings })
                .eq('id', merchantId);

            if (updateError) throw updateError;

            setMerchantSettingsMessage({ text: '系統設定儲存成功！', type: 'success' });
        } catch (err) {
            console.error(err);
            setMerchantSettingsMessage({ text: err.message || '儲存失敗', type: 'error' });
        } finally {
            setMerchantSettingsLoading(false);
        }
    };

    const generateBindCode = async () => {
        try {
            setBindCodeLoading(true);
            const merchantId = await store.getMerchantId();
            const code = Math.random().toString().slice(2, 8); // 6位數字
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分鐘後過期

            const { error } = await supabase
                .from('merchant_bind_codes')
                .insert({
                    code,
                    merchant_id: merchantId,
                    expires_at: expiresAt.toISOString()
                });

            if (error) throw error;

            setBindCode(code);
            setBindCodeExpiry(expiresAt);
        } catch (err) {
            console.error(err);
            alert('產生綁定碼失敗: ' + err.message);
        } finally {
            setBindCodeLoading(false);
        }
    };

    const handleUnbind = async () => {
        if (!confirm('確定要解除 LINE Bot 綁定嗎？')) return;
        try {
            const merchantId = await store.getMerchantId();
            const { error } = await supabase
                .from('merchant_line_bindings')
                .delete()
                .eq('merchant_id', merchantId);

            if (error) throw error;
            setExistingBinding(null);
        } catch (err) {
            console.error(err);
            alert('解除綁定失敗: ' + err.message);
        }
    };

    const copyBindCode = () => {
        if (bindCode) {
            navigator.clipboard.writeText(`綁定 ${bindCode}`);
            setBindCodeCopied(true);
            setTimeout(() => setBindCodeCopied(false), 2000);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">系統設定 <span className="text-teal-600">Settings</span></h1>
                <p className="text-slate-500 font-bold">管理您的帳號安全與分店終端機風格</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                {/* Left Column: Security & LINE Integrations */}
                <div className="space-y-8">
                    {/* Account Security Card */}
                    <Card className="p-8 border-0 shadow-soft-2xl rounded-[2.5rem] bg-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[5rem] -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-700" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900">帳號安全</h2>
                            </div>

                            <form onSubmit={handleUpdatePassword} className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="font-black text-slate-400 uppercase text-[10px] tracking-[0.2em] ml-1">新的登入密碼</Label>
                                    <Input
                                        type="password"
                                        required
                                        value={passwords.next}
                                        onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
                                        className="h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500/30 transition-all font-bold px-5"
                                        placeholder="請輸入新密碼"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-black text-slate-400 uppercase text-[10px] tracking-[0.2em] ml-1">確認新密碼</Label>
                                    <Input
                                        type="password"
                                        required
                                        value={passwords.confirm}
                                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                        className="h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500/30 transition-all font-bold px-5"
                                        placeholder="請再次輸入新密碼"
                                    />
                                </div>

                                {pwMessage.text && (
                                    <StatusAlert message={pwMessage.text} type={pwMessage.type} />
                                )}

                                <Button
                                    type="submit"
                                    disabled={pwLoading}
                                    className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black text-lg shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    {pwLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : '更新密碼 Update Password'}
                                </Button>
                            </form>
                        </div>
                    </Card>

                    {/* LINE Report Card */}
                    <Card className="p-8 border-0 shadow-soft-2xl rounded-[2.5rem] bg-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-[5rem] -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-700" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shadow-sm">
                                    <RefreshCw className="w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900">LINE 每日報表</h2>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Label className="font-black text-slate-400 uppercase text-[10px] tracking-[0.2em] ml-1">報表推送狀態</Label>
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${merchantSettings.daily_report_enabled ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-400'}`}>
                                                <Check className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-black text-sm text-slate-900">啟用報表</p>
                                                <p className="text-xs text-slate-400 font-bold">每天10:00自動發送今日營運數據</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setMerchantSettings(prev => ({ ...prev, daily_report_enabled: !prev.daily_report_enabled }))}
                                            className={`w-14 h-8 rounded-full transition-all duration-300 relative ${merchantSettings.daily_report_enabled ? 'bg-green-500' : 'bg-slate-300'}`}
                                        >
                                            <div className={`w-6 h-6 bg-white rounded-full shadow-md absolute top-1 transition-all duration-300 ${merchantSettings.daily_report_enabled ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="font-black text-slate-400 uppercase text-[10px] tracking-[0.2em] ml-1">LINE User ID (接收對象)</Label>
                                    <Input
                                        type="text"
                                        value={merchantSettings.line_user_id}
                                        onChange={(e) => setMerchantSettings({ ...merchantSettings, line_user_id: e.target.value })}
                                        className="h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-green-500/30 transition-all font-bold px-5"
                                        placeholder="U..."
                                    />
                                    <p className="text-[10px] text-slate-400 font-bold px-1">請輸入您的 LINE User ID，系統將會推送報表至此內容。</p>
                                </div>

                                {merchantSettingsMessage.text && (
                                    <StatusAlert message={merchantSettingsMessage.text} type={merchantSettingsMessage.type} />
                                )}

                                <Button
                                    onClick={handleSaveMerchantSettings}
                                    disabled={merchantSettingsLoading}
                                    className="w-full h-14 rounded-2xl bg-green-600 text-white font-black text-lg shadow-xl shadow-green-100 hover:scale-[1.02] active:scale-95 transition-all mt-4"
                                >
                                    {merchantSettingsLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : '儲存推送設定 Update LINE Settings'}
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* LINE Bot Binding Card */}
                    <Card className="p-8 border-0 shadow-soft-2xl rounded-[2.5rem] bg-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[5rem] -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-700" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
                                    <MessageCircle className="w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900">LINE Bot 查詢綁定</h2>
                            </div>

                            <div className="space-y-6">
                                {existingBinding ? (
                                    /* 已綁定狀態 */
                                    <div className="space-y-4">
                                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <p className="font-black text-blue-800">已綁定 LINE 帳號</p>
                                            </div>
                                            <p className="text-xs text-blue-600 font-bold ml-11">
                                                綁定時間: {new Date(existingBinding.bound_at).toLocaleString('zh-TW')}
                                            </p>
                                            {existingBinding.display_name && (
                                                <p className="text-xs text-blue-600 font-bold ml-11">
                                                    LINE 名稱: {existingBinding.display_name}
                                                </p>
                                            )}
                                        </div>
                                        <Button
                                            onClick={handleUnbind}
                                            variant="outline"
                                            className="w-full h-12 rounded-2xl border-red-200 text-red-600 hover:bg-red-50 font-bold"
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            解除綁定 Unbind
                                        </Button>
                                    </div>
                                ) : (
                                    /* 未綁定狀態 */
                                    <div className="space-y-4">
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                                            <p className="text-sm font-bold text-slate-500 mb-2">
                                                請先在 LINE Bot 輸入指令，再點擊下方按鈕產生綁定碼。
                                            </p>
                                            <p className="text-xs text-slate-400 font-bold">
                                                綁定後，您可以在 LINE Bot 中輸入指令快速查詢會員點數與交易紀錄。
                                            </p>
                                        </div>

                                        {bindCode ? (
                                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                                <div className="space-y-2">
                                                    <Label className="font-black text-slate-400 uppercase text-[10px] tracking-[0.2em] ml-1">您的綁定碼</Label>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-14 rounded-2xl bg-blue-50 border-2 border-blue-100 flex items-center justify-center">
                                                            <span className="text-2xl font-black text-blue-600 tracking-widest">{bindCode}</span>
                                                        </div>
                                                        <button
                                                            onClick={copyBindCode}
                                                            className="h-14 w-14 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all text-slate-400 hover:text-blue-500"
                                                            title="複製"
                                                        >
                                                            {bindCodeCopied ? <Check className="w-6 h-6 text-green-500" /> : <Copy className="w-6 h-6" />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-bold text-amber-500 bg-amber-50 px-3 py-2 rounded-lg">
                                                    <Timer className="w-4 h-4" />
                                                    有效期限: {bindCodeExpiry?.toLocaleTimeString('zh-TW')} (10分鐘)
                                                </div>
                                            </div>
                                        ) : (
                                            <Button
                                                onClick={generateBindCode}
                                                disabled={bindCodeLoading}
                                                className="w-full h-14 rounded-2xl bg-blue-600 text-white font-black text-lg shadow-xl shadow-blue-100 hover:scale-[1.02] active:scale-95 transition-all"
                                            >
                                                {bindCodeLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : '產生綁定碼 Generate Code'}
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Terminal Customization */}
                <div className="space-y-8">
                    {/* Terminal Customization Card */}
                    <Card className="p-8 border-0 shadow-soft-2xl rounded-[2.5rem] bg-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-bl-[5rem] -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-700" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center shadow-sm">
                                    <Palette className="w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900">終端機自訂</h2>
                            </div>

                            <div className="space-y-8">
                                {/* Branch Selection */}
                                <div className="space-y-2">
                                    <Label className="font-black text-slate-400 uppercase text-[10px] tracking-[0.2em] ml-1">選擇分店</Label>
                                    <select
                                        value={selectedBranchId}
                                        onChange={(e) => handleBranchChange(e.target.value)}
                                        className="w-full h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-teal-500/30 transition-all font-bold px-5 appearance-none cursor-pointer"
                                    >
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Logo Upload */}
                                <div className="space-y-3">
                                    <Label className="font-black text-slate-400 uppercase text-[10px] tracking-[0.2em] ml-1">分店 LOGO Branch Logo</Label>
                                    <div className="flex items-start gap-6">
                                        <div className="shrink-0 relative group">
                                            <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-slate-50 shadow-soft-sm flex items-center justify-center overflow-hidden">
                                                {branchSettings.logo_url ? (
                                                    <img src={branchSettings.logo_url} alt="Branch Logo" className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageIcon className="w-8 h-8 text-slate-300" />
                                                )}
                                            </div>
                                            {branchSettings.logo_url && (
                                                <button
                                                    onClick={() => setBranchSettings(prev => ({ ...prev, logo_url: null }))}
                                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                                                    title="移除 Logo"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleLogoUpload}
                                                    className="hidden"
                                                    id="logo-upload"
                                                    disabled={settingsLoading}
                                                />
                                                <label
                                                    htmlFor="logo-upload"
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 cursor-pointer transition-all active:scale-95"
                                                >
                                                    {settingsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                                    {branchSettings.logo_url ? '更換圖片' : '上傳圖片'}
                                                </label>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                                                建議尺寸 200x200 像素，支援 JPG, PNG 格式。<br />
                                                若未上傳，將顯示系統預設 Logo。
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Theme Color Selection */}
                                <div className="space-y-3">
                                    <Label className="font-black text-slate-400 uppercase text-[10px] tracking-[0.2em] ml-1">主題顏色 Theme Color</Label>
                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                                        {THEME_COLORS.map((color) => (
                                            <button
                                                key={color.value}
                                                onClick={() => setBranchSettings({ ...branchSettings, theme_color: color.value })}
                                                className={cn(
                                                    "aspect-square rounded-2xl flex items-center justify-center transition-all duration-300 relative",
                                                    color.bg,
                                                    branchSettings.theme_color === color.value
                                                        ? "ring-4 ring-offset-4 ring-teal-500/20 scale-95"
                                                        : "opacity-80 hover:opacity-100 hover:scale-105"
                                                )}
                                            >
                                                {branchSettings.theme_color === color.value && (
                                                    <div className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md">
                                                        <Check className="w-5 h-5 text-white" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Reset Interval Selection */}
                                <div className="space-y-3">
                                    <Label className="font-black text-slate-400 uppercase text-[10px] tracking-[0.2em] ml-1 flex items-center gap-2">
                                        <Timer className="w-3 h-3" /> 自動重置秒數 Reset Interval
                                    </Label>
                                    <div className="flex flex-wrap gap-2">
                                        {RESET_INTERVALS.map((sec) => (
                                            <button
                                                key={sec}
                                                onClick={() => setBranchSettings({ ...branchSettings, reset_interval: sec })}
                                                className={cn(
                                                    "px-6 py-3 rounded-xl font-black text-sm transition-all duration-300",
                                                    branchSettings.reset_interval === sec
                                                        ? "bg-teal-600 text-white shadow-lg shadow-teal-200"
                                                        : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                                                )}
                                            >
                                                {sec}s
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold px-1">系統將在完成操作後，於指定秒數內自動返回顧客查詢登入頁面。</p>
                                </div>

                                {/* Confetti Toggle */}
                                <div className="space-y-3">
                                    <Label className="font-black text-slate-400 uppercase text-[10px] tracking-[0.2em] ml-1">特效設定 Effects</Label>

                                    {/* Confetti / Effects Toggle & Selection */}
                                    <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${branchSettings.enable_confetti ? 'bg-teal-100 text-teal-600' : 'bg-slate-200 text-slate-400'}`}>
                                                    <Sparkles className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-sm text-slate-900">慶祝特效</p>
                                                    <p className="text-xs text-slate-400 font-bold">啟用後可設定集點與兌換的動畫效果</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setBranchSettings(prev => ({ ...prev, enable_confetti: !prev.enable_confetti }))}
                                                className={`w-14 h-8 rounded-full transition-all duration-300 relative ${branchSettings.enable_confetti ? 'bg-teal-500' : 'bg-slate-300'}`}
                                            >
                                                <div className={`w-6 h-6 bg-white rounded-full shadow-md absolute top-1 transition-all duration-300 ${branchSettings.enable_confetti ? 'left-7' : 'left-1'}`} />
                                            </button>
                                        </div>

                                        {/* Sub-settings for effects */}
                                        {branchSettings.enable_confetti && (
                                            <div className="pl-[52px] space-y-4 animate-in fade-in slide-in-from-top-2">
                                                {/* Point Collection Effect */}
                                                <div className="space-y-2">
                                                    <p className="text-xs font-black text-slate-500 uppercase tracking-wider">集點獲得點數時 Point Collection</p>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button
                                                            onClick={() => setBranchSettings({ ...branchSettings, point_collection_effect: 'shower' })}
                                                            className={cn(
                                                                "px-3 py-2 rounded-xl text-sm font-bold border-2 transition-all text-left",
                                                                branchSettings.point_collection_effect === 'shower'
                                                                    ? "border-teal-500 bg-teal-50 text-teal-700"
                                                                    : "border-transparent bg-white text-slate-500 hover:bg-slate-100"
                                                            )}
                                                        >
                                                            💰 金幣海 (Coin Shower)
                                                        </button>
                                                        <button
                                                            onClick={() => setBranchSettings({ ...branchSettings, point_collection_effect: 'flip' })}
                                                            className={cn(
                                                                "px-3 py-2 rounded-xl text-sm font-bold border-2 transition-all text-left",
                                                                branchSettings.point_collection_effect === 'flip'
                                                                    ? "border-teal-500 bg-teal-50 text-teal-700"
                                                                    : "border-transparent bg-white text-slate-500 hover:bg-slate-100"
                                                            )}
                                                        >
                                                            🪙 單幣翻轉 (Single Flip)
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Redemption Effect */}
                                                <div className="space-y-2">
                                                    <p className="text-xs font-black text-slate-500 uppercase tracking-wider">兌換成功時 Redemption</p>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button
                                                            onClick={() => setBranchSettings({ ...branchSettings, redemption_effect: 'confetti' })}
                                                            className={cn(
                                                                "px-3 py-2 rounded-xl text-sm font-bold border-2 transition-all text-left",
                                                                branchSettings.redemption_effect === 'confetti'
                                                                    ? "border-teal-500 bg-teal-50 text-teal-700"
                                                                    : "border-transparent bg-white text-slate-500 hover:bg-slate-100"
                                                            )}
                                                        >
                                                            🎉 豪華灑花 (Confetti)
                                                        </button>
                                                        <button
                                                            onClick={() => setBranchSettings({ ...branchSettings, redemption_effect: 'balloons' })}
                                                            className={cn(
                                                                "px-3 py-2 rounded-xl text-sm font-bold border-2 transition-all text-left",
                                                                branchSettings.redemption_effect === 'balloons'
                                                                    ? "border-teal-500 bg-teal-50 text-teal-700"
                                                                    : "border-transparent bg-white text-slate-500 hover:bg-slate-100"
                                                            )}
                                                        >
                                                            🎈 氣球昇空 (Balloons)
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Sound */}
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${branchSettings.enable_sound ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
                                                <MessageCircle className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-black text-sm text-slate-900">音效回饋</p>
                                                <p className="text-xs text-slate-400 font-bold">操作成功時播放金幣或慶祝音效</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setBranchSettings(prev => ({ ...prev, enable_sound: !prev.enable_sound }))}
                                            className={`w-14 h-8 rounded-full transition-all duration-300 relative ${branchSettings.enable_sound ? 'bg-indigo-500' : 'bg-slate-300'}`}
                                        >
                                            <div className={`w-6 h-6 bg-white rounded-full shadow-md absolute top-1 transition-all duration-300 ${branchSettings.enable_sound ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </div>

                                {settingsMessage.text && (
                                    <StatusAlert message={settingsMessage.text} type={settingsMessage.type} />
                                )}

                                <Button
                                    onClick={handleSaveBranchSettings}
                                    disabled={settingsLoading}
                                    className="w-full h-14 rounded-2xl bg-teal-600 text-white font-black text-lg shadow-xl shadow-teal-100 hover:scale-[1.02] active:scale-95 transition-all mt-4"
                                >
                                    {settingsLoading ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : '儲存分店設定 Save Changes'}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
