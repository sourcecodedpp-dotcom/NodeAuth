import { WifiOff, Wifi, CloudUpload, ShieldAlert } from "lucide-react";
import { useAppStore } from "../store";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function TopBar({ title }: { title?: string }) {
  const { isOnline, pendingSyncCount, refreshPendingLogs } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    refreshPendingLogs();
  }, [refreshPendingLogs]);

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-xl border-b border-black/5 shrink-0 z-10 w-full relative">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-5 h-5 text-black" />
        <span className="font-medium text-sm tracking-wide text-black">
          {title || "FaceGuard"}
        </span>
      </div>
      
      <div className="flex items-center gap-3">
        {pendingSyncCount > 0 && (
          <button 
            onClick={() => navigate('/sync')}
            className="flex items-center gap-1.5 bg-black/5 text-black px-2.5 py-1 rounded-full text-xs font-medium border border-black/5 hover:bg-black/10 transition-all duration-300"
          >
            <CloudUpload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Queued: </span>{pendingSyncCount}
          </button>
        )}
        
        {isOnline ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/5 text-black text-[10px] font-semibold uppercase tracking-wider">
            <Wifi className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Online</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/5 text-neutral-500 text-[10px] font-semibold uppercase tracking-wider">
            <WifiOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Offline</span>
          </div>
        )}
      </div>
    </div>
  );
}
