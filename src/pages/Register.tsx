import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import { MobileContainer } from "../components/MobileContainer";
import { TopBar } from "../components/TopBar";
import { extractFaceEmbedding, loadModels } from "../lib/vision";
import { motion, AnimatePresence } from "motion/react";
import { UserPlus, SwitchCamera, Check } from "lucide-react";
import { saveUser } from "../lib/db";
import { Dock } from "../components/Dock";

export function Register() {
  const navigate = useNavigate();
  const webcamRef = useRef<Webcam>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("Position face in the frame");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [name, setName] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  
  const toggleCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  const handleRegister = useCallback(async () => {
    if (!name.trim()) {
      setStatus("Please enter a name first.");
      return;
    }
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setIsProcessing(true);
    setStatus("Loading System...");
    
    try {
      await loadModels();
      setStatus("Extracting Features...");
      const embedding = await extractFaceEmbedding(imageSrc);
      
      const id = `EMP-${Math.floor(Math.random() * 90000) + 10000}`;
      const embeddingId = `EMB-${id}`;
      
      await saveUser({
        id,
        name: name.trim(),
        role: 'field_personnel',
        embeddingId,
        createdAt: Date.now()
      }, embedding);
      
      setStatus("Registration Complete");
      setIsSuccess(true);
      
      if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (err) {
      console.error(err);
      setStatus("Registration error.");
      setIsProcessing(false);
    }
  }, [name, navigate]);

  return (
    <MobileContainer>
      <TopBar title="Register Personnel" />
      <div className="flex-1 relative flex flex-col bg-white overflow-y-auto">
        
        {/* Camera View */}
        <div className="relative w-full aspect-[4/3] bg-neutral-100 overflow-hidden shrink-0">
          
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode }}
            className="absolute inset-0 w-full h-full object-cover"
            mirrored={facingMode === "user"}
          />
          
          <button 
            onClick={toggleCamera}
            className="absolute top-4 right-4 z-50 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 text-white hover:bg-black/60 transition-colors"
          >
            <SwitchCamera className="w-5 h-5" strokeWidth={1.5} />
          </button>
          
          <div className="absolute inset-x-0 bottom-4 flex justify-center z-50">
            <div className={`px-4 py-1.5 rounded-full backdrop-blur-md text-xs font-semibold tracking-wide border ${isSuccess ? 'bg-emerald-500/20 text-emerald-50 border-emerald-500/50' : 'bg-black/40 text-white border-white/20'}`}>
              {status}
            </div>
          </div>
          
          {/* Overlay UI */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
            <div className="w-[60%] aspect-square rounded-full border-[2px] border-dashed border-white/40 flex items-center justify-center relative">
               <div className="w-2 h-2 rounded-full border border-white/50"></div>
                <AnimatePresence>
                  {isProcessing && !isSuccess && (
                    <motion.div 
                      key="scanner-line"
                      initial={{ y: 0, opacity: 0 }}
                      animate={{ y: ["0%", "800%", "0%"], opacity: 1 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      style={{ willChange: 'transform' }}
                      className="absolute top-0 w-full h-[20%] bg-gradient-to-b from-transparent via-blue-400/30 to-transparent z-10"
                    >
                      <div className="absolute bottom-1/2 w-full h-[1px] bg-blue-400"></div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {isSuccess && (
                     <motion.div
                       initial={{ scale: 0, opacity: 0 }}
                       animate={{ scale: 1, opacity: 1 }}
                       className="absolute inset-0 flex items-center justify-center bg-emerald-500/20 rounded-full backdrop-blur-sm"
                     >
                        <Check className="w-12 h-12 text-white" strokeWidth={3} />
                     </motion.div>
                  )}
                </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Bottom Form */}
        <div className="bg-white px-6 py-8 flex flex-col flex-1 z-20 pb-32">
          
          <div className="flex flex-col gap-1 relative mb-10">
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              disabled={isProcessing}
              className="peer w-full bg-transparent border-b border-neutral-200 py-3 text-black placeholder:text-transparent focus:outline-none focus:border-black transition-colors font-medium text-lg disabled:opacity-50"
              required
            />
            <label className="absolute left-0 top-3 text-neutral-400 text-lg transition-all peer-placeholder-shown:text-lg peer-placeholder-shown:top-3 peer-focus:-top-3.5 peer-focus:text-[11px] peer-focus:text-black peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-widest peer-valid:-top-3.5 peer-valid:text-[11px] peer-valid:text-black peer-valid:font-bold peer-valid:uppercase peer-valid:tracking-widest pointer-events-none">
              Full Name
            </label>
            <p className="text-xs text-neutral-400 mt-2">
              Ensure the personnel's face is clearly visible without sunglasses or hats.
            </p>
          </div>
          
          <button
            onClick={handleRegister}
            disabled={isProcessing || !name.trim()}
            className="w-full bg-black text-white hover:scale-[0.98] active:scale-[0.96] disabled:opacity-50 disabled:scale-100 font-medium py-4 rounded-[24px] flex justify-center items-center gap-3 transition-all duration-300 shadow-lg shadow-black/10 mt-auto"
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-[2px] border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="w-5 h-5" strokeWidth={1.5} />
                Enroll Personnel
              </>
            )}
          </button>
        </div>

      </div>
      <Dock />
    </MobileContainer>
  );
}
