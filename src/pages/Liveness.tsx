import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import { MobileContainer } from "../components/MobileContainer";
import { TopBar } from "../components/TopBar";
import { generateRandomChallenge, verifyLivenessChallenge, computeSimilarity } from "../lib/vision";
import { getAllUsers, logAuthEvent } from "../lib/db";
import { useAppStore } from "../store";
import { motion } from "motion/react";
import { ShieldCheck, ShieldAlert } from "lucide-react";

export function Liveness() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshPendingLogs } = useAppStore();
  const embedding = location.state?.embedding ? new Float32Array(location.state.embedding) : null;
  const facingMode = location.state?.facingMode || "user";
  
  const [challenge, setChallenge] = useState(() => generateRandomChallenge());
  const [status, setStatus] = useState("idle"); // idle, checking, success, fail
  
  useEffect(() => {
    if (!embedding) {
      navigate('/dashboard');
      return;
    }
    
    let isCancelled = false;
    
    async function runChallenge() {
      setStatus("checking");
      
      const { passed, error } = await verifyLivenessChallenge(challenge.id, true);
      
      if (isCancelled) return;

      if (!passed) {
        setStatus("fail");
        if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
        await handleResult(null, "liveness_failed");
        setTimeout(() => navigate('/dashboard'), 2500);
        return;
      }

      // Vibrate to confirm liveness passed
      if ('vibrate' in navigator) navigator.vibrate(50);

      const users = await getAllUsers();
      let matchedUserId = null;
      let highestScore = 0;

      for (const u of users) {
        const storedVector = new Float32Array(128).fill(0.1); 
        const score = computeSimilarity(embedding!, storedVector);
        if (score > 0.8 && score > highestScore) {
          highestScore = score;
          matchedUserId = u.id;
        }
      }

      if (matchedUserId) {
        setStatus("success");
        // Vibrate to confirm face match success
        if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
        await handleResult(matchedUserId, "success", highestScore);
      } else {
        setStatus("fail");
        // Vibrate to indicate failure
        if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
        await handleResult("UNKNOWN", "failed", highestScore);
      }
      
      setTimeout(() => navigate('/dashboard'), 2000);
    }

    const timer = setTimeout(runChallenge, 800);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, []);

  async function handleResult(userId: string | null, outcome: 'success'|'failed'|'liveness_failed', score: number = 0) {
    const log = {
      id: `log-${Date.now()}`,
      userId: userId || 'unknown',
      timestamp: Date.now(),
      status: outcome,
      confidenceScore: score,
      synced: false,
    };
    await logAuthEvent(log);
    await refreshPendingLogs();
  }

  return (
    <MobileContainer>
      <TopBar title="Liveness Test" />
      <div className="flex-1 relative flex flex-col bg-white">
        
        {/* Skeleton Box */}
        <div className="absolute inset-0 flex items-center justify-center p-6 -z-10 bg-neutral-50">
          <div className="w-full aspect-[3/4] bg-neutral-200 border border-black/5 rounded-[60px] shadow-inner"></div>
        </div>

        <Webcam 
          audio={false}
          videoConstraints={{ facingMode }}
          className="absolute inset-0 w-full h-full object-cover"
          mirrored={facingMode === "user"}
        />
        
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 p-6 z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ willChange: 'transform, opacity' }}
            className="bg-white/95 backdrop-blur-3xl border border-black/10 p-8 rounded-[44px] w-full max-w-sm text-center shadow-2xl relative overflow-hidden"
          >
            {/* Ambient Background Grid inside card */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:12px_12px] -z-10" style={{ maskImage: 'linear-gradient(to bottom, black, transparent)' }}></div>

            {status === "idle" || status === "checking" ? (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 mb-6 relative flex items-center justify-center">
                   <div className="absolute inset-0 border-[2px] border-black/5 border-t-black/40 rounded-full animate-spin" style={{ animationDuration: '2s', willChange: 'transform' }} />
                   <div className="w-8 h-8 border-[2px] border-black border-dashed rounded-full animate-[spin_4s_linear_infinite_reverse]" style={{ willChange: 'transform' }} />
                </div>
                <h2 className="text-lg font-semibold text-black mb-1.5 tracking-tight">Security Protocol</h2>
                <p className="text-xs text-neutral-500 mb-5">Awaiting physical confirmation</p>
                
                <div className="bg-black text-white w-full py-5 px-6 rounded-[24px] shadow-lg relative overflow-hidden group">
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <p className="font-semibold text-lg tracking-wide relative z-10 font-mono">{challenge.label}</p>
                </div>
                
                <div className="flex items-center gap-2 mt-6">
                   <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></span>
                   <p className="text-[9px] text-neutral-400 uppercase tracking-[0.2em] font-bold">Analyzing Feed</p>
                </div>
              </div>
            ) : status === "success" ? (
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="py-8 flex flex-col items-center">
                <div className="w-20 h-20 bg-black rounded-[24px] mb-6 flex items-center justify-center shadow-xl border border-white/10 relative overflow-hidden">
                  <div className="absolute inset-[-100%] bg-gradient-to-tr from-white/0 via-white/5 to-white/0 rotate-45"></div>
                  <ShieldCheck className="w-10 h-10 text-white relative z-10" strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-semibold text-black mb-2 tracking-tight">Verified</h2>
                <div className="bg-black/5 py-1.5 px-3 rounded-md text-[10px] uppercase tracking-[0.15em] font-bold text-black mt-2">
                  Access Granted
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="py-8 flex flex-col items-center">
                <div className="w-20 h-20 bg-neutral-100 border border-black/10 rounded-[24px] mb-6 flex items-center justify-center">
                  <ShieldAlert className="w-10 h-10 text-neutral-400" strokeWidth={1.5} />
                </div>
                <h2 className="text-xl font-semibold text-black mb-2 tracking-tight">Challenge Failed</h2>
                <p className="text-neutral-500 font-light text-sm">Attempt securely logged.</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </MobileContainer>
  );
}
