import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { signupRequest } from "../../shared/api/authApi";


export default function Signup() {
  const navigate = useNavigate();

  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ✅ 정규식 (username 대신 nickname 검증용)
  const nicknameRegex = /^[a-zA-Z0-9ㄱ-힣]{2,16}$/; // 한글/영문/숫자 2~16자
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex =
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^\w\s])\S{8,64}$/;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ 유효성 검증
    if (!nicknameRegex.test(nickname)) {
      toast.error("닉네임은 2~16자의 한글, 영문, 숫자만 가능합니다.");
      return;
    }

    if (!emailRegex.test(email)) {
      toast.error("이메일 형식이 올바르지 않습니다.");
      return;
    }

    if (!passwordRegex.test(password)) {
      toast.error("비밀번호는 대문자, 소문자, 숫자, 특수문자를 포함해 8~64자여야 합니다.");
      return;
    }

    try {
      await signupRequest({ email, password, nickname });
      toast.success("회원가입 성공! 🎉 로그인 페이지로 이동합니다.");
      navigate("/auth/login");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "회원가입 실패");
    }
  };

  return (
    <section className="flex items-center justify-center bg-slate-950 px-4 py-8 text-slate-100">
      <div className="w-full max-w-[360px] rounded-xl border border-white/10 bg-white/10 p-5 text-left shadow-lg backdrop-blur-sm">
        <h1 className="mb-1 text-xl font-semibold">Create Account ✨</h1>
        <p className="mb-4 text-sm text-white/70">
          새로운 계정을 만들어 Dailyon에 참여하세요.
        </p>

        <form className="grid gap-3" onSubmit={onSubmit}>
          <input
            type="text"
            placeholder="닉네임"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            autoComplete="nickname"
            className="w-full rounded-lg bg-white/15 px-3 py-2.5 text-sm text-white placeholder-white/50 transition focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
          />
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full rounded-lg bg-white/15 px-3 py-2.5 text-sm text-white placeholder-white/50 transition focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            className="w-full rounded-lg bg-white/15 px-3 py-2.5 text-sm text-white placeholder-white/50 transition focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
          />

          <button
            type="submit"
            className="w-full rounded-lg bg-fuchsia-500 py-2.5 text-sm font-medium text-white transition hover:bg-fuchsia-600"
          >
            회원가입
          </button>
        </form>

        <p className="mt-3 text-xs text-white/60">
          이미 계정이 있나요?{" "}
          <button
            onClick={() => navigate("/auth/login")}
            className="text-fuchsia-400 hover:underline"
          >
            로그인
          </button>
        </p>
      </div>
    </section>
  );
}
