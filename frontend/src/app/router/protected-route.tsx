import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../../shared/store/auth.ts";

export default function ProtectedRoute() {
  const isAuthed = useAuthStore((s: any) => !!s.accessToken);
  const booting  = useAuthStore((s: any) => s.booting); // 앱 초기 부팅 상태(세션 복원 중)
  const loc = useLocation();

  if (booting) return <div className="p-8 text-sm opacity-70">Preparing session…</div>;

  // 세션 없으면 로그인으로 이동. 이후 원래 위치 복귀를 위한 state 전달
  if (!isAuthed) {
    return <Navigate to="/auth/login" replace state={{ from: loc.pathname + loc.search }} />;
  }

  return <Outlet />;
}