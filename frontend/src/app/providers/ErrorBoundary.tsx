import React from "react";
import { toast } from "sonner";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: any };

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: any): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    // 로깅 도구(Sentry 등) 연동 지점
    console.error("App ErrorBoundary:", error, info);
    toast.error("예기치 못한 오류가 발생했습니다.");
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-dvh flex items-center justify-center text-center p-6">
          <div>
            <h1 className="text-xl font-semibold mb-2">문제가 발생했어요.</h1>
            <p className="opacity-70 mb-4">잠시 후 다시 시도해주세요.</p>
            <button
              className="px-4 py-2 rounded-md border"
              onClick={() => window.location.reload()}
            >
              새로고침
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
