import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../shared/store/auth.ts";

export default function PublicOnlyRoute() {
  const isAuthed = useAuthStore((s: any) => !!s.accessToken);
  const booting  = useAuthStore((s: any) => s.booting);

  if (booting) return <div className="p-8 text-sm opacity-70">Preparing session…</div>;
  if (isAuthed) return <Navigate to="/" replace />;

  return <Outlet />;
}