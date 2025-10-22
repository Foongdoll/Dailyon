// src/app/layout/AppLayout.tsx
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { memo, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  NotebookText,
  CalendarClock,
  Wallet,
  MessageSquareText,
  Search,
  ChevronDown,
} from "lucide-react";

/**
 * Dailyon — Inpa Dev 스타일 감성 레이아웃
 * - 상단 투명 헤더 + 블러
 * - 좌측 카테고리 사이드바 (데스크톱)
 * - 홈에서만 보이는 히어로 섹션(배경 일러스트 + 대형 타이포)
 * - 라우트 콘텐츠는 Outlet으로 표시
 */

/** 공통 util: className merge */
function cx(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(" ");
}

/** 상단 헤더 */
function Header() {
  const menus = [
    { to: "/notes", label: "노트" },
    { to: "/planner", label: "플래너" },
    { to: "/ledger", label: "가계부" },
    { to: "/chat", label: "채팅" },
  ];

  return (
    <header
      className={cx(
        "sticky top-0 z-50 h-14 w-full",
        "backdrop-blur supports-[backdrop-filter]:bg-[color-mix(in_oklab,theme(colors.slate.900)_60%,transparent)]",
        "border-b border-white/10",
      )}
    >
      <div className="mx-auto flex h-full max-w-screen-2xl items-center justify-between px-4">
        <NavLink to="/" className="flex items-center gap-2 text-base font-semibold tracking-tight">
          <span className="inline-block h-6 w-6 rounded-md bg-gradient-to-tr from-sky-400 to-fuchsia-400" />
          Dailyon
        </NavLink>

        <nav className="hidden items-center gap-6 text-sm font-medium text-white/90 md:flex">
          {menus.map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              className={({ isActive }) =>
                cx(
                  "transition-colors hover:text-white",
                  isActive ? "text-white" : "text-white/80",
                )
              }
            >
              {m.label}
            </NavLink>
          ))}
        </nav>

        {/* Search */}
        <div className="ml-4 hidden min-w-[220px] items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70 ring-1 ring-white/0 transition-all hover:bg-white/10 md:flex">
          <Search className="h-4 w-4" />
          <input type="text" placeholder="검색" />
        </div>
      </div>
    </header>
  );
}

/** 좌측 사이드바 (데스크톱) */
function Sidebar() {
  const items = [
    { to: "/notes", label: "Notes", icon: NotebookText, count: 16 },
    { to: "/planner", label: "Planner", icon: CalendarClock, count: 12 },
    { to: "/ledger", label: "Ledger", icon: Wallet, count: 8 },
    { to: "/chat", label: "Chat", icon: MessageSquareText, count: 3 },
  ];

  return (
    <aside className="sticky top-14 hidden w-64 shrink-0 border-r border-slate-200/10 bg-slate-950/30 px-3 py-4 lg:block">
      <div className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/40">
        Root
      </div>
      <ul className="space-y-1">
        {items.map(({ to, label, icon: Icon, count }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                cx(
                  "group flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm",
                  "text-white/80 hover:bg-white/5 hover:text-white",
                  isActive && "bg-white/10 text-white",
                )
              }
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4 opacity-80" />
                {label}
              </span>
              <span className="rounded-full bg-white/10 px-1.5 text-[10px] leading-5 text-white/70">
                {count}
              </span>
            </NavLink>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/** 홈 히어로 섹션 (Inpa 감성) */
function Hero() {
  const fullText = "Hello World! Let's Get it" ;  
  const [displayedText, setDisplayedText] = useState("");
  const [typingDone, setTypingDone] = useState(false);

  // 타이핑 효과
  useEffect(() => {
    let i = 0;    
        
    const interval = setInterval(() => {
      i++;
      setDisplayedText(fullText.slice(0, i));
      if (i === fullText.length) {
        
        clearInterval(interval);
        setTypingDone(true);
      }
    }, 100); // 속도 조절
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative isolate">
      {/* 배경 이미지 */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=2400&auto=format&fit=crop"
          alt="cozy desk illustration"
          className="h-full w-full object-cover"
          loading="eager"
        />
        {/* 어둡게 + 그라데이션 */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#020617_70%)]" />
        <div className="absolute inset-0 bg-slate-950/50" />
      </div>

      <div className="mx-auto flex min-h-[60dvh] max-w-screen-2xl flex-col items-center justify-center px-4 text-center text-white">
        <motion.span
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-4 inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide"
        >
          I LOVE WHAT I DO
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.7 }}
          className="text-5xl font-extrabold leading-tight md:text-6xl"
        >
          <br />
          <span className="text-white/90">{displayedText}</span>
          {/* 고정폭 커서: 조건부 렌더링 X, 항상 자리 유지 */}
          <span
            className={
              "align-top inline-block w-[0.6ch] text-sky-300 " +
              (typingDone ? "blink-caret" : "opacity-100")
            }
          >
            |
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7 }}
          className="mt-6 max-w-2xl text-base text-white/80"
        >
          자신만의 공간에 기록해요.
        </motion.p>

        <a
          href="#content"
          className="mt-10 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/90 transition-colors hover:bg-white/20"
        >
          <ChevronDown className="h-4 w-4" />
          Scroll
        </a>
      </div>

      {/* 커서 깜빡임 키프레임 (레이아웃 영향 없이 opacity만 변경) */}
      <style>{`
        @keyframes blink { 0%, 49% { opacity: 1 } 50%, 100% { opacity: 0 } }
        .blink-caret { animation: blink 1s steps(1, end) infinite; }
      `}</style>
    </section>
  );
}


export default memo(function AppLayout() {
  const { pathname } = useLocation();
  const showHero = useMemo(() => pathname === "/" || pathname === "", [pathname]);

  return (
    <div className="bg-slate-950 text-slate-100 h-screen">
      <Header />
      {/* 메인 그리드 */}
      <div className="flex">
        <Sidebar />
        <main id="content" className="flex-1 h-[60%]">
          {showHero && <Hero />}
          <div className="px-4 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
});
