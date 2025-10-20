// src/app/layout/AppLayout.tsx
import { Outlet, NavLink } from "react-router-dom";
import { memo } from "react";

function Header() {
  return (
    <header className="sticky top-0 z-40 h-14 border-b bg-[var(--color-surface)] px-4 flex items-center justify-between">
      <NavLink to="/" className="font-semibold">Dailyon</NavLink>
      <nav className="flex gap-4 text-sm">
        <NavLink to="/notes">노트</NavLink>
        <NavLink to="/planner">플래너</NavLink>
        <NavLink to="/ledger">가계부</NavLink>
        <NavLink to="/chat">채팅</NavLink>
      </nav>
    </header>
  );
}

function Sidebar() {
  return (
    <aside className="hidden lg:block w-64 border-r p-4">
      <div className="text-xs uppercase opacity-60 mb-2">Menu</div>
      <ul className="space-y-2 text-sm">
        <li><NavLink to="/notes">Notes</NavLink></li>
        <li><NavLink to="/planner">Planner</NavLink></li>
        <li><NavLink to="/ledger">Ledger</NavLink></li>
        <li><NavLink to="/chat">Chat</NavLink></li>
      </ul>
    </aside>
  );
}

export default memo(function AppLayout() {
  return (
    <div className="min-h-dvh grid grid-rows-[auto,1fr]">
      <Header />
      <div className="grid grid-cols-1 lg:grid-cols-[16rem,1fr]">
        <Sidebar />
        <main className="p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
});
