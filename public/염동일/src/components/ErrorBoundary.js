import React from 'react';
import { AlertCircle } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
          <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full border border-red-100">
            <h2 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2">
              <AlertCircle className="w-6 h-6" /> 오류가 발생했습니다
            </h2>
            <p className="text-stone-600 mb-4 text-sm">애플리케이션을 실행하는 도중 예기치 않은 오류가 발생했습니다.</p>
            <div className="bg-gray-100 p-4 rounded text-xs font-mono text-red-800 overflow-auto max-h-40 mb-6">
              {this.state.error?.message || "알 수 없는 오류"}
            </div>
            <button onClick={() => window.location.reload()} className="w-full py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors">
              새로고침
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
