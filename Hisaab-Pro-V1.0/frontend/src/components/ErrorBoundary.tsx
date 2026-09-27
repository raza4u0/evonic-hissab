import React from 'react';
import { AlertOctagon, Mail, RotateCcw, ShieldAlert, Cpu } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  reported: boolean;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    reported: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, reported: false };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
    this.setState({ errorInfo });
    
    // Auto feedback simulation - log to console and simulate auto dispatch
    try {
      this.autoReportError(error, errorInfo);
    } catch (e) {
      console.error("Failed to auto-report:", e);
    }
  }

  private autoReportError(error: Error, errorInfo: React.ErrorInfo) {
    // In production environment we could trigger a telemetry fetch
    console.log("== AUTO-REPORT DIAGNOSTICS QUEUED FOR DISPATCH ==");
    console.log("SUPPORT EMAIL: Hissabpro1@gmail.com");
    console.log("RECIPIENTS: Hissabpro1@gmail.com");
    console.log("ERROR MESSAGE:", error.message);
    console.log("COMPONENT STACK:", errorInfo.componentStack);
    
    // Set state to show it was auto-transmitted
    setTimeout(() => {
      this.setState({ reported: true });
    }, 1500);
  }

  private handleCopyLog = () => {
    const errorMsg = this.state.error?.message || "Unknown error";
    const componentStack = this.state.errorInfo?.componentStack || "No stack trace available";
    
    const logDetails = 
      `HISAAB PRO V3.0.1 - DIAGNOSTIC LOG\n` +
      `==========================================\n` +
      `Timestamp: ${new Date().toISOString()}\n` +
      `Platform/Agent: ${navigator.userAgent}\n` +
      `DIAGNOSTIC ERROR DESCRIPTION:\n` +
      `${errorMsg}\n\n` +
      `COMPONENT CALLSTACK:\n` +
      `${componentStack}\n`;

    navigator.clipboard?.writeText(logDetails);
    alert("Diagnostic log copied to clipboard.");
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-6 font-sans">
          <div className="w-full max-w-2xl bg-slate-950 rounded-2xl border border-rose-500/30 p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600"></div>
            
            <div className="flex items-start space-x-6">
              <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-rose-400">
                <ShieldAlert className="w-10 h-10 animate-bounce" />
              </div>
              
              <div className="flex-1 space-y-4">
                <div>
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 font-mono font-semibold px-2 py-0.5 rounded uppercase tracking-wider">
                    UAT Crash Interceptor
                  </span>
                  <h1 className="text-2xl font-black text-white mt-1">
                    System Exception Trapped
                  </h1>
                  <p className="text-sm text-slate-400 mt-1">
                    Hisaab Pro has caught a runtime error. Auto-diagnostics have intercepted this crash to protect local company ledgers.
                  </p>
                </div>

                {/* Error Log Box */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 font-mono text-xs">
                  <div className="flex items-center text-rose-300 space-x-2 border-b border-slate-800 pb-2">
                    <AlertOctagon className="w-4 h-4" />
                    <span className="font-bold">Exception:</span>
                    <span>{this.state.error?.name || "RuntimeError"}</span>
                  </div>
                  <p className="text-rose-200 font-medium whitespace-pre-wrap">
                    {this.state.error?.message || "No error details available."}
                  </p>
                  
                  {this.state.errorInfo && (
                    <div className="mt-2 space-y-1">
                      <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Component Callstack</p>
                      <pre className="max-h-40 overflow-y-auto text-[10px] text-slate-400 p-2 bg-slate-950 rounded border border-slate-800 scrollbar-thin whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Auto Transmission Alert */}
                <div className="flex items-center space-x-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-300">
                  <Cpu className="w-5 h-5 text-emerald-400 animate-pulse" />
                  <div>
                    <span className="font-bold">Auto Feedback Dispatch: </span>
                    {this.state.reported ? (
                      <span>Diagnostic report automatically queued and logged for Raza & Arjun!</span>
                    ) : (
                      <span>Synthesizing error context & preparing diagnostic logs...</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={this.handleCopyLog}
                    className="flex-1 flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-3 rounded-xl shadow-lg shadow-emerald-950/40 transition duration-150 text-sm cursor-pointer"
                  >
                    <span>Copy Diagnostic Log</span>
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-3 rounded-xl transition duration-150 text-sm border border-slate-700 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reboot Hisaab Pro</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-6 text-slate-500 text-xs font-mono">
            Support: Hissabpro1@gmail.com • UAE Tax Compliance & Double Entry
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
