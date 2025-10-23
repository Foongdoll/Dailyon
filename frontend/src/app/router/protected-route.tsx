import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../../shared/store/auth";

export default function ProtectedRoute() {
  const isAuthed = useAuthStore((s: any) => !!s.accessToken);
  const booting  = useAuthStore((s: any) => s.booting); // 앱 초기 부팅 상태(세션 복원 중)
  const loc = useLocation();

  if (booting) return <div className="p-8 text-sm opacity-70">Preparing session…</div>;

  if (!isAuthed) {    
    return <Navigate to="/auth/login" replace state={{ from: loc.pathname + loc.search }} />;
  }

  return <Outlet />;
}