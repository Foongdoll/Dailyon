import { useNavigate } from "react-router-dom";
import useAuth from "../../shared/hooks/AuthHooks";
import { toast } from "sonner";
import { loginRequest } from "../../shared/api/authApi";
import { useAuthStore } from "../../shared/store/auth";

export default function Login() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setBooting = useAuthStore((s) => s.setBooting);

  const { email, setEmail, password, setPassword } = useAuth();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex =
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^\w\s])\S{8,64}$/;


  const onSubmit = async () => {
    if (!emailRegex.test(email)) {
      toast.error("이메일 형식이 올바르지 않습니다.");
      return;
    }

    if (!passwordRegex.test(password)) {
      toast.error("비밀번호는 대문자, 소문자, 숫자, 특수문자를 포함해 8~64자여야 합니다.");
      return;
    }

    try {
      const res = await loginRequest({ email, password });

      setTokens(res.accessToken, res.refreshToken);
      setBooting(false);

      toast.success("로그인 성공!");
      navigate("/");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "로그인 실패");
    }
  }


  return (
    <section className="flex items-center justify-center bg-slate-950 px-4 py-8 text-slate-100">
      <div className="w-full max-w-[360px] rounded-xl border border-white/10 bg-white/10 p-5 text-left shadow-lg backdrop-blur-sm">
        <h1 className="mb-1 text-xl font-semibold">Welcome Back 👋</h1>
        <p className="mb-4 text-sm text-white/70">로그인을 통해 Dailyon을 시작하세요.</p>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <input
            type="email"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일"
            autoComplete="email"
            className="w-full rounded-lg bg-white/15 px-3 py-2.5 text-sm text-white placeholder-white/50 transition focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
          <input
            type="password"
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            autoComplete="current-password"
            className="w-full rounded-lg bg-white/15 px-3 py-2.5 text-sm text-white placeholder-white/50 transition focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-sky-500 py-2.5 text-sm font-medium text-white transition hover:bg-sky-600"
          >
            로그인
          </button>
        </form>
        <p className="mt-3 text-xs text-white/60">
          계정이 없나요?{" "}
          <button onClick={() => navigate("/auth/signup")} className="text-sky-400 hover:underline">
            회원가입
          </button>
        </p>
      </div>
    </section>
  );
}
