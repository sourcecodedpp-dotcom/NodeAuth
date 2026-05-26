import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileContainer } from "../components/MobileContainer";
import { ShieldAlert, ScanFace } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { seedDemoData } from "../lib/db";

const INTRO_TEXTS = [
  "Secure Check",
  "Offline System",
  "Private & Fast",
  "Loading..."
];

export function Splash() {
  const navigate = useNavigate();
  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex(prev => (prev < INTRO_TEXTS.length - 1 ? prev + 1 : prev));
    }, 1200);

    seedDemoData().then(() => {
      const timer = setTimeout(() => {
        navigate('/supervisor-login', { replace: true });
      }, 4500); // 4.5s total splash time to read through messages
      return () => clearTimeout(timer);
    });

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <MobileContainer className="items-center justify-center bg-white">
      <div className="absolute top-0 left-0 w-full h-[50vh] bg-black/5 blur-[100px] pointer-events-none" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center gap-6 relative z-10"
      >
        <div className="relative w-32 h-32 flex items-center justify-center mb-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-[1px] border-t-black/20 border-l-black/20 border-b-transparent border-r-transparent rounded-full"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute inset-3 border-[1px] border-b-black/30 border-r-black/10 border-t-transparent border-l-transparent rounded-full"
          />
          <motion.div
             initial={{ scale: 0.8 }}
             animate={{ scale: 1 }}
             transition={{ type: "spring", stiffness: 100, damping: 20 }}
             className="w-20 h-20 bg-black rounded-[24px] shadow-2xl flex items-center justify-center relative overflow-hidden border border-black/5"
          >
            <div className="absolute inset-[-100%] bg-gradient-to-tr from-white/0 via-white/5 to-white/0 rotate-45"></div>
            <ScanFace className="w-10 h-10 text-white relative z-10" strokeWidth={1} />
          </motion.div>
        </div>
        
        <div className="h-10 relative w-full flex justify-center items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={textIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="absolute w-full flex justify-center"
            >
              <h1 className={`font-medium tracking-tight text-black whitespace-nowrap text-center ${textIndex === 0 ? 'text-2xl' : 'text-lg text-neutral-600'}`}>
                {INTRO_TEXTS[textIndex]}
              </h1>
            </motion.div>
          </AnimatePresence>
        </div>

      </motion.div>
      <div className="absolute bottom-12 flex flex-col items-center gap-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          <div className="w-5 h-5 border-[2px] border-black/20 border-t-black rounded-full animate-spin" />
        </motion.div>
      </div>
    </MobileContainer>
  );
}
