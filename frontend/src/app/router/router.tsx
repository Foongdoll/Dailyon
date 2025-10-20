import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy, Suspense, type JSX } from "react";
import AppLayout from "../layout/AppLayout.tsx";
import ProtectedRoute from "./protected-route.tsx";
import PublicOnlyRoute from "./public-only-route.tsx";

// --- Lazy Pages (코드 스플리팅)
const HomePage    = lazy(() => import("../../pages/home"));
const NotesPage   = lazy(() => import("../../pages/notes"));
const NoteDetail  = lazy(() => import("../../pages/notes/detail"));
const PlannerPage = lazy(() => import("../../pages/planner"));
const LedgerPage  = lazy(() => import("../../pages/ledger"));
const ChatPage    = lazy(() => import("../../pages/chat"));
const LoginPage   = lazy(() => import("../../pages/auth/login"));
const SignupPage  = lazy(() => import("../../pages/auth/signup"));
const NotFound    = lazy(() => import("../../pages/_errors/not-found"));

const withSuspense = (el: JSX.Element) => (
  <Suspense fallback={<div className="p-8 text-sm opacity-70">Loading…</div>}>
    {el}
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />, // 공통 헤더/사이드바/푸터
    errorElement: withSuspense(<NotFound />),
    children: [
      {
        index: true,
        element: withSuspense(<HomePage />),
      },
      // ------ 보호 라우트(로그인 필요)
      {
        element: <ProtectedRoute />, // Outlet 보호
        children: [
          { path: "notes", element: withSuspense(<NotesPage />) },
          { path: "notes/:id", element: withSuspense(<NoteDetail />) },
          { path: "planner", element: withSuspense(<PlannerPage />) },
          { path: "ledger", element: withSuspense(<LedgerPage />) },
          { path: "chat", element: withSuspense(<ChatPage />) },
        ],
      },
      // ------ 퍼블릭 전용 라우트(로그인 상태면 접근 X)
      {
        element: <PublicOnlyRoute />,
        children: [
          { path: "auth/login", element: withSuspense(<LoginPage />) },
          { path: "auth/signup", element: withSuspense(<SignupPage />) },
        ],
      },
      // 기타
      { path: "404", element: withSuspense(<NotFound />) },
      { path: "*", element: <Navigate to="/404" replace /> },
    ],
  },
]);