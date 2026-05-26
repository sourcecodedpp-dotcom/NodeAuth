import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileContainer } from "../components/MobileContainer";
import { Fingerprint } from "lucide-react";
import { motion } from "motion/react";
import { useAppStore } from "../store";

export function SupervisorLogin() {
  const navigate = useNavigate();
  const { setSupervisorAuthed } = useAppStore();
  
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate quick offline verification
    setTimeout(() => {
      setSupervisorAuthed(true);
      navigate('/dashboard');
    }, 800);
  };

  return (
    <MobileContainer>
      <div className="flex-1 bg-white flex flex-col px-8 pt-[12vh] pb-8 overflow-y-auto cursor-default">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center text-center mb-16"
        >
          <div className="w-16 h-16 bg-black rounded-[20px] flex items-center justify-center mb-6 shadow-2xl">
            <Fingerprint className="w-8 h-8 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-[26px] font-semibold text-black tracking-tight mb-2 leading-tight">Login</h1>
          <p className="text-[13px] text-neutral-500 font-medium tracking-wide">Sign in to manage the system</p>
        </motion.div>

        <motion.form 
          onSubmit={handleLogin}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-6 flex-1 max-w-sm w-full mx-auto"
        >
          <div className="flex flex-col gap-1 relative">
            <input 
              type="text" 
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="Supervisor ID"
              className="peer w-full bg-transparent border-b border-neutral-200 py-3 text-black placeholder:text-transparent focus:outline-none focus:border-black transition-colors font-medium text-lg"
              required
            />
            <label className="absolute left-0 top-3 text-neutral-400 text-lg transition-all peer-placeholder-shown:text-lg peer-placeholder-shown:top-3 peer-focus:-top-3.5 peer-focus:text-[11px] peer-focus:text-black peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-widest peer-valid:-top-3.5 peer-valid:text-[11px] peer-valid:text-black peer-valid:font-bold peer-valid:uppercase peer-valid:tracking-widest pointer-events-none">
              Supervisor ID
            </label>
          </div>

          <div className="flex flex-col gap-1 relative mt-4">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="peer w-full bg-transparent border-b border-neutral-200 py-3 text-black placeholder:text-transparent focus:outline-none focus:border-black transition-colors font-medium text-lg"
              required
            />
            <label className="absolute left-0 top-3 text-neutral-400 text-lg transition-all peer-placeholder-shown:text-lg peer-placeholder-shown:top-3 peer-focus:-top-3.5 peer-focus:text-[11px] peer-focus:text-black peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-widest peer-valid:-top-3.5 peer-valid:text-[11px] peer-valid:text-black peer-valid:font-bold peer-valid:uppercase peer-valid:tracking-widest pointer-events-none">
              Password
            </label>
          </div>

          <div className="mt-10">
            <button 
              type="submit"
              disabled={isLoading || !id || !password}
              className="w-full bg-black text-white hover:scale-[0.98] active:scale-[0.96] disabled:opacity-50 disabled:scale-100 font-medium py-4 rounded-[24px] flex justify-center items-center gap-3 transition-all duration-300 shadow-xl shadow-black/10"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-[2px] border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                "Continue"
              )}
            </button>
          </div>
        </motion.form>
        
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.4 }}
           className="mt-auto pt-6 flex justify-center"
        >
           <p className="text-[9px] uppercase tracking-[0.2em] text-neutral-400 font-bold">Authorized Personnel Only</p>
        </motion.div>
      </div>
    </MobileContainer>
  );
}
