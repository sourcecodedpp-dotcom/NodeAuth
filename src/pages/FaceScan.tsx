import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import { MobileContainer } from "../components/MobileContainer";
import { TopBar } from "../components/TopBar";
import { extractFaceEmbedding, loadModels } from "../lib/vision";
import { motion, AnimatePresence } from "motion/react";
import { ScanFace, SwitchCamera } from "lucide-react";

export function FaceScan() {
  const navigate = useNavigate();
  const webcamRef = useRef<Webcam>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("Position face in the frame");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  
  const toggleCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  const handleScan = useCallback(async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setIsProcessing(true);
    setStatus("Loading System...");
    
    try {
      // Shorter timeout to keep low-ram simulated flow snappy
      await loadModels();
      setStatus("Analyzing Identity...");
      const embedding = await extractFaceEmbedding(imageSrc);
      
      setTimeout(() => {
        navigate('/liveness', { state: { embedding: Array.from(embedding), facingMode } });
      }, 300);

    } catch (err) {
      console.error(err);
      setStatus("Scan error.");
      setIsProcessing(false);
    }
  }, [navigate]);

  return (
    <MobileContainer>
      <TopBar title="Face Scan" />
      <div className="flex-1 relative flex flex-col bg-white">
        
        {/* Camera View */}
        <div className="relative flex-1 bg-neutral-900 overflow-hidden rounded-b-[40px] z-0 shadow-sm">
          
          {/* Skeleton Loader behind camera */}
          <div className="absolute inset-0 bg-neutral-900 flex flex-col items-center justify-center -z-10">
            <div className="w-[60%] aspect-[3/4] rounded-[60px] bg-neutral-800 animate-pulse border-4 border-neutral-700"></div>
          </div>

          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode }}
            className="absolute inset-0 w-full h-full object-cover opacity-90"
            mirrored={facingMode === "user"}
          />
          <button 
            onClick={toggleCamera}
            className="absolute top-6 right-6 z-50 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 text-white hover:bg-white/20 transition-colors"
          >
            <SwitchCamera className="w-5 h-5" strokeWidth={1.5} />
          </button>
          
          {/* Overlay UI */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6">
            <div className="w-full max-w-[280px] aspect-[3/4] relative">
              
              {/* Corner Brackets */}
              <div className="absolute top-0 left-0 w-12 h-12 border-t-[3px] border-l-[3px] border-white/80 rounded-tl-[32px]"></div>
              <div className="absolute top-0 right-0 w-12 h-12 border-t-[3px] border-r-[3px] border-white/80 rounded-tr-[32px]"></div>
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-[3px] border-l-[3px] border-white/80 rounded-bl-[32px]"></div>
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-[3px] border-r-[3px] border-white/80 rounded-br-[32px]"></div>
              
              {/* Scan Area Base */}
              <div className="absolute inset-0 rounded-[32px] overflow-hidden">
                {/* Subtle Telemetry Overlay */}
                <div className="absolute top-5 left-5 flex flex-col gap-1.5 opacity-80">
                  <div className="flex items-center gap-1.5">
                     <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                     <div className="text-[9px] font-mono font-bold tracking-widest text-white drop-shadow-md">REC</div>
                  </div>
                </div>

                <div className="absolute bottom-5 right-5 flex flex-col items-end gap-1.5 opacity-80">
                  <div className="text-[9px] font-mono font-bold tracking-widest text-white drop-shadow-md animate-pulse">FPS: {isProcessing ? '24' : '30'}</div>
                </div>
                
                {/* Target Circle (Subtle) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50%] h-[50%] border border-white/20 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
                </div>

                {/* Clean Scanner Line */}
                <AnimatePresence>
                  {isProcessing && (
                    <motion.div 
                      key="scanner-line"
                      initial={{ y: 0, opacity: 0 }}
                      animate={{ y: ["0%", "800%", "0%"], opacity: 1 }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                      style={{ willChange: 'transform' }}
                      className="absolute w-full h-[100px] bg-gradient-to-b from-transparent via-white/10 to-transparent z-10"
                    >
                      <div className="absolute bottom-1/2 w-[100%] h-[2px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Drawer */}
        <div className="bg-white pt-8 pb-10 px-6 relative z-20 flex flex-col items-center">
          <div className="text-center mb-8 h-12 flex flex-col justify-end">
            <h2 className="text-2xl font-bold text-neutral-900 mb-1 tracking-tight">Identity Scan</h2>
            <p className={`text-sm text-neutral-500 ${isProcessing ? 'animate-pulse' : ''}`}>{status}</p>
          </div>
          
          <button
            onClick={handleScan}
            disabled={isProcessing}
            className="w-full bg-neutral-900 text-white hover:scale-[0.98] active:scale-[0.96] disabled:opacity-50 disabled:scale-100 font-medium py-4 rounded-3xl flex justify-center items-center gap-3 transition-all duration-300 shadow-sm"
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <ScanFace className="w-5 h-5" strokeWidth={1.5} />
                Match Face
              </>
            )}
          </button>
          
          <button 
            onClick={() => navigate('/dashboard')}
            disabled={isProcessing}
            className="w-full mt-4 py-3 text-sm font-medium text-neutral-400 hover:text-neutral-900 transition-colors"
          >
            Cancel
          </button>
        </div>

      </div>
    </MobileContainer>
  );
}
