import { useNavigate } from "react-router-dom";
import { MobileContainer } from "../components/MobileContainer";
import { 
  ScanFace, Settings as SettingsIcon, ChevronRight, Users, 
  Server, ShieldCheck, Cpu, Camera, Clock, 
  UserPlus, RefreshCw, FileText, Activity, Fingerprint, Database, Home, User
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAppStore } from "../store";
import { useEffect, useState } from "react";
import { getAllUsers } from "../lib/db";
import { Dock } from "../components/Dock";

export function Dashboard() {
  const navigate = useNavigate();
  const { pendingSyncCount, isSupervisorAuthed, isOnline } = useAppStore();
  const [userCount, setUserCount] = useState<number>(0);

  useEffect(() => {
    getAllUsers().then(users => setUserCount(users.length));
  }, []);

  return (
    <MobileContainer>
      <div className="relative flex-1 bg-white overflow-y-auto overflow-x-hidden flex flex-col">
        {/* Background Texture & Glows (Removed for cleaner look) */}

        {/* HEADER */}
        <div className="px-6 pt-10 pb-4 flex justify-between items-start">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-2 mb-1">
               <ShieldCheck className="w-5 h-5 text-neutral-900" />
               <h1 className="text-xl font-bold tracking-tight text-neutral-900">Operations</h1>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold ml-7">Secure Offline Auth</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white text-neutral-600 border border-neutral-200 shadow-sm`}>
              <div className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOnline ? 'bg-emerald-400' : 'bg-neutral-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? 'bg-emerald-500' : 'bg-neutral-500'}`}></span>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider">{isOnline ? 'Network' : 'Offline'}</span>
            </div>
            <div className="w-10 h-10 bg-neutral-100 border border-neutral-200 rounded-full flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
               <User className="w-5 h-5 text-neutral-400" strokeWidth={2} />
            </div>
          </motion.div>
        </div>

        <div className="px-6 pb-6 flex flex-col gap-6">

          {/* MAIN ACTION: Employee Login */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          >
            <button 
              onClick={() => navigate('/face-scan')}
              className="w-full bg-neutral-900 text-white rounded-3xl p-6 text-left transition-transform active:scale-[0.98] shadow-sm border border-neutral-800 flex justify-between items-center"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Fingerprint className="w-5 h-5 text-neutral-400" strokeWidth={1.5} />
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em]">Primary Action</span>
                </div>
                <h2 className="text-[22px] font-bold tracking-tight mb-1 text-white leading-tight">Employee Verification</h2>
                <p className="text-[11px] text-neutral-400 font-medium tracking-wide">Offline Face & Liveness Detection</p>
              </div>
              <div className="w-14 h-14 bg-neutral-800 rounded-[20px] flex items-center justify-center border border-neutral-700 shrink-0">
                <ScanFace className="w-7 h-7 text-white" strokeWidth={1.5} />
              </div>
            </button>
          </motion.div>

          {/* STATS GRID */}
          <motion.div 
             initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
             className="grid grid-cols-2 gap-4"
          >
            {/* Local Users Card */}
            <div className="bg-neutral-50 border border-neutral-200/80 p-5 rounded-[24px] shadow-sm flex flex-col justify-between">
               <div className="flex justify-between items-start mb-3">
                 <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center border border-neutral-200 shrink-0">
                   <Users className="w-4 h-4 text-neutral-600" strokeWidth={2} />
                 </div>
                 <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded text-[9px] font-bold text-neutral-600 border border-neutral-200 tracking-wider">
                   <Activity className="w-3 h-3" /> LIVE
                 </div>
               </div>
               <div className="mt-1">
                 <div className="text-3xl font-bold text-neutral-900 tracking-tight">{userCount}</div>
                 <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.15em] mt-0.5">Local Users</div>
               </div>
            </div>

            {/* Offline Queue Card */}
            <div className="bg-neutral-50 border border-neutral-200/80 p-5 rounded-[24px] shadow-sm flex flex-col justify-between">
               <div className="flex justify-between items-start mb-3">
                 <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center border border-neutral-200 shrink-0">
                   <Server className="w-4 h-4 text-neutral-600" strokeWidth={2} />
                 </div>
                 {pendingSyncCount > 0 && (
                   <span className="relative flex h-2 w-2 mt-1 mr-1">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neutral-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-2 w-2 bg-neutral-500"></span>
                   </span>
                 )}
               </div>
               <div className="mt-1">
                 <div className="text-3xl font-bold text-neutral-900 tracking-tight">{pendingSyncCount}</div>
                 <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.15em] mt-0.5">Offline Queue</div>
                 {/* Mini progress bar */}
                 <div className="w-full h-1 bg-neutral-200 rounded-full mt-2 overflow-hidden">
                   <div className="h-full bg-neutral-600 rounded-full transition-all duration-1000" style={{ width: pendingSyncCount > 0 ? '60%' : '0%' }}></div>
                 </div>
               </div>
            </div>
          </motion.div>

          {/* SYSTEM STATUS PILLS */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-4 text-center pb-32">
            <div className="flex flex-wrap justify-center gap-2">
               <div className="flex items-center gap-1.5 bg-neutral-50 px-3 py-1.5 rounded-[10px] border border-neutral-200">
                  <Cpu className="w-3.5 h-3.5 text-neutral-600" />
                  <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-[0.1em]">Config: Ready</span>
               </div>
               <div className="flex items-center gap-1.5 bg-neutral-50 px-3 py-1.5 rounded-[10px] border border-neutral-200">
                  <Camera className="w-3.5 h-3.5 text-neutral-600" />
                  <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-[0.1em]">Cam: Active</span>
               </div>
               <div className="flex items-center gap-1.5 bg-neutral-50 px-3 py-1.5 rounded-[10px] border border-neutral-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-neutral-600" />
                  <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-[0.1em]">Sys: Secured</span>
               </div>
            </div>
          </motion.div>

        </div>
      </div>
      
      <Dock />
    </MobileContainer>
  );
}
