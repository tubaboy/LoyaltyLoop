import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MerchantLogin from './pages/MerchantLogin';
import CustomerTerminal from './pages/CustomerTerminal';
import DashboardLayout from './components/layouts/DashboardLayout';
import MerchantDashboard from './pages/merchant/MerchantDashboard';
import BranchManagement from './pages/merchant/BranchManagement';
import RewardsManagement from './pages/merchant/RewardsManagement';
import TransactionHistory from './pages/merchant/TransactionHistory';
import Settings from './pages/merchant/Settings';
import AdminDashboard from './pages/admin/AdminDashboard';
import AuthLayout from './components/layouts/AuthLayout';
import LandingPage from './pages/LandingPage';
import TerminalLogin from './pages/TerminalLogin';
import { store } from './lib/store';
import { supabase } from './lib/supabase';
import { Button } from "@/components/ui/button";
import { useVisualTier } from './hooks/useVisualTier';

// Terminal Route Wrapper
const TerminalRoute = ({ children }) => {
  const session = store.getTerminalSession();
  if (!session) {
    return <Navigate to="/terminal-login" replace />;
  }
  return children;
};



// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 text-center bg-red-50 min-h-screen theme-saas">
          <h1 className="text-2xl font-bold text-red-800">系統發生錯誤</h1>
          <p className="text-red-600 mt-2">{(this.state.error && this.state.error.message) || "不明原因的錯誤"}</p>
          <Button onClick={() => window.location.reload()} className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg">重試</Button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRole, userRole, hasSession }) => {
  if (!hasSession) {
    return <Navigate to="/login" replace />;
  }

  // If role is null but has session, ONLY show full screen loader if we don't have a role yet.
  // This prevents the intrusive "Synchronizing" screen during background re-fetches (e.g. after password change)
  if (userRole === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 theme-saas p-4">
        <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h1 className="text-xl font-black text-slate-800 tracking-tight">正在同步帳號資料...</h1>
        <p className="text-slate-500 mt-2 mb-6 text-center max-w-md">
          系統已偵測到登入狀態，正在從資料庫讀取您的權限設定。
        </p>
        <div className="flex gap-4">
          <Button onClick={() => window.location.reload()} variant="outline">重新整理</Button>
          <Button onClick={async () => {
            await store.logout();
            window.location.href = '/login';
          }} className="bg-red-600 hover:bg-red-700 text-white">登出重試</Button>
        </div>
      </div>
    );
  }

  if (allowedRole && userRole !== allowedRole) {
    const target = userRole === 'admin' ? "/admin" : "/dashboard";
    console.log("[ProtectedRoute] Mismatch! Redirecting to", target);
    return <Navigate to={target} replace />;
  }

  return children;
};

function App() {
  useVisualTier();
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'admin', 'merchant', or null
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);

  const fetchRole = async (user) => {
    if (!user) {
      setUserRole(null);
      return null;
    }
    if (fetchingRef.current) {
      console.log("[App] ⏳ Already fetching role, skipping...");
      return null;
    }

    try {
      fetchingRef.current = true;
      console.log("[App] 🔍 Fetching role for:", user.email);
      const role = await store.getUserRole(user);
      console.log("[App] ✅ Fetched role:", role);
      setUserRole(role);
      return role;
    } catch (err) {
      console.error("[App] ❌ Failed to fetch role:", err);
      return null;
    } finally {
      fetchingRef.current = false;
    }
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      console.log("[App] 🚀 Starting initialization...");
      console.log("[App] ENV Check - VITE_SUPABASE_URL:", import.meta.env.VITE_SUPABASE_URL ? "✅ Present" : "❌ Missing");
      console.log("[App] ENV Check - VITE_SUPABASE_ANON_KEY:", import.meta.env.VITE_SUPABASE_ANON_KEY ? "✅ Present (length: " + import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 20) + "...)" : "❌ Missing");

      // Check Supabase credentials first
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.error("[App] ❌ Supabase credentials missing!");
        alert("Supabase 環境變數未設定！\n\n1. 請確認 .env 檔案存在\n2. 檔案內有 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY\n3. 重新啟動 dev server (npm run dev)");
        if (mounted) setLoading(false);
        return;
      }

      console.log("[App] ✅ Supabase credentials found");
      console.log("[App] 🔗 Supabase client:", supabase ? "✅ Created" : "❌ Undefined");

      try {
        // Set a 10 second timeout that will force loading to end
        const timeoutId = setTimeout(() => {
          console.warn("[App] ⏱️ Timeout reached, forcing loading to end.");
          if (mounted) setLoading(false);
        }, 10000);

        console.log("[App] 📡 Calling supabase.auth.getSession()...");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("[App] ❌ Session error:", sessionError);
          setLoading(false);
          return;
        }

        console.log("[App] Session found:", session ? `✅ ${session.user.email}` : "❌ None");

        if (mounted) {
          setSession(session);
          if (session) {
            console.log("[App] 🔄 Triggering initial fetchRole...");
            await fetchRole(session.user);
          } else {
            setLoading(false);
          }
        }

        clearTimeout(timeoutId);
        console.log("[App] ✅ Initialization completed successfully!");

      } catch (err) {
        console.error("[App] 💥 Initialization error:", err);
      } finally {
        if (mounted) {
          console.log("[App] 🏁 Setting loading to false");
          setLoading(false);
        }
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("[App] 🔄 Auth state changed:", _event, (session && session.user && session.user.email) || "none");
      if (mounted) {
        setSession(session);
        if (session) {
          await fetchRole(session.user);
        } else {
          setUserRole(null);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Auto-retry fetchRole if stuck in "Synchronizing" state
  useEffect(() => {
    let intervalId;
    if (session && userRole === null && !loading) {
      console.log("[App] ⚠️ Detected stuck 'Synchronizing' state. Starting auto-retry...");
      intervalId = setInterval(() => {
        if (!fetchingRef.current) {
          console.log("[App] 🔄 Auto-retrying fetchRole...");
          fetchRole(session.user);
        }
      }, 2000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [session, userRole, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 theme-saas font-sans">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-6"></div>
          <div className="text-slate-900 font-black text-2xl tracking-tighter">
            Loyalty<span className="text-teal-600">Loop</span>
          </div>
          <div className="text-slate-400 font-bold mt-2 text-sm tracking-widest uppercase">載入中...</div>
        </div>
      </div>
    );
  }

  console.log("[App] Rendering. Session:", !!session, "Role:", userRole);

  return (
    <ErrorBoundary>
      <BrowserRouter basename={import.meta.env.BASE_URL || "/LoyaltyLoop"}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/terminal-login" element={<TerminalLogin />} />

          <Route path="/login" element={
            !session ? (
              <AuthLayout>
                <MerchantLogin onLogin={() => { }} />
              </AuthLayout>
            ) : (
              <Navigate
                to={userRole === 'admin' ? "/admin" : "/dashboard"}
                replace
              />
            )
          } />

          {/* Merchant Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRole="merchant" userRole={userRole} hasSession={!!session}>
              <DashboardLayout role="merchant" />
            </ProtectedRoute>
          }>
            <Route index element={<MerchantDashboard />} />
            <Route path="branches" element={<BranchManagement />} />
            <Route path="rewards" element={<RewardsManagement />} />
            <Route path="transactions" element={<TransactionHistory />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRole="admin" userRole={userRole} hasSession={!!session}>
              <DashboardLayout role="admin" />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
          </Route>

          {/* Terminal */}
          <Route path="/terminal" element={
            <TerminalRoute>
              <div className="h-screen bg-slate-50 flex items-center justify-center">
                <CustomerTerminal />
              </div>
            </TerminalRoute>
          } />

          {/* Default Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
