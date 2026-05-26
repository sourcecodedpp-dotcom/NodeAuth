import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileContainer } from "../components/MobileContainer";
import { TopBar } from "../components/TopBar";
import { useAppStore } from "../store";
import { getPendingLogs, performMasterSync } from "../lib/db";
import { CloudOff, CloudUpload, ArrowLeft, LogOut } from "lucide-react";
import { motion } from "motion/react";

import { Dock } from "../components/Dock";

export function Settings() {
  const navigate = useNavigate();
  const { isOnline, pendingSyncCount, refreshPendingLogs, setSupervisorAuthed } = useAppStore();
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  async function handleSync() {
    if (!isOnline) {
      setSyncMessage("Cannot sync while offline.");
      return;
    }
    
    setSyncing(true);
    setSyncMessage("Connecting to endpoint...");
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    try {
      const syncedCount = await performMasterSync();
      setSyncMessage(`Sync complete. ${syncedCount} logs securely purged.`);
    } catch (err) {
      console.error(err);
      setSyncMessage("Sync failed. Logs retained safely offline.");
    }
    
    await refreshPendingLogs();
    
    setTimeout(() => {
      setSyncing(false);
      setSyncMessage("");
    }, 2000);
  }

  const handleSignOut = () => {
    setSupervisorAuthed(false);
    navigate('/supervisor-login');
  };

  return (
    <MobileContainer>
      <TopBar title="Settings" />
      <div className="flex-1 overflow-y-auto p-5 pb-32 flex flex-col cursor-default">
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-black/5 p-8 rounded-[40px] text-center mb-6 shadow-xl flex flex-col items-center relative overflow-hidden mt-2"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-black/5 rounded-bl-[100px] -z-10 blur-xl"></div>
          
          <div className="w-20 h-20 rounded-[28px] flex items-center justify-center mb-6 bg-black shadow-lg">
            {isOnline ? (
              <CloudUpload className="w-8 h-8 text-white" strokeWidth={1.5} />
            ) : (
              <CloudOff className="w-8 h-8 text-white/50" strokeWidth={1.5} />
            )}
          </div>
          <h2 className="text-2xl font-medium text-black mb-2 tracking-tight">Cloud Sync</h2>
          <div className="bg-black/5 py-1.5 px-3 rounded-md mb-6">
            <p className="text-black text-xs font-semibold tracking-wide uppercase">
              {pendingSyncCount} EVENTS PENDING
            </p>
          </div>

          <button
            onClick={handleSync}
            disabled={pendingSyncCount === 0 || !isOnline || syncing}
            className="w-full bg-black text-white hover:scale-[0.98] active:scale-[0.96] disabled:opacity-50 disabled:scale-100 font-medium py-4 rounded-[28px] transition-all duration-300 flex justify-center items-center gap-3 shadow-lg"
          >
            {syncing ? (
              <div className="w-5 h-5 border-[2px] border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              "Secure Upload"
            )}
          </button>
          
          {syncMessage && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-5 w-full text-[11px] font-mono text-neutral-600 bg-neutral-100 py-3 px-4 rounded-[20px] text-left border border-black/5 shadow-inner"
            >
              &gt; {syncMessage}
            </motion.div>
          )}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-black/5 border border-black/5 rounded-[32px] p-5 mb-8 flex items-center justify-between"
        >
          <div className="flex flex-col">
            <span className="text-sm font-medium text-black">Network Status</span>
            <span className="text-xs text-neutral-500 font-light mt-0.5 tracking-wide uppercase">
              {isOnline ? 'System Online' : 'Offline Mode Active'}
            </span>
          </div>
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-black' : 'bg-black/20 border border-black/20'}`} />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-auto"
        >
          <div className="bg-black/5 rounded-[32px] p-2">
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-[26px] bg-white text-black font-medium hover:bg-neutral-50 transition-colors shadow-sm border border-black/5"
            >
              <LogOut className="w-5 h-5 text-black" strokeWidth={1.5} />
              Supervisor Sign Out
            </button>
          </div>
        </motion.div>

      </div>
      <Dock />
    </MobileContainer>
  );
}
