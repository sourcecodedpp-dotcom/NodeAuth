import { useNavigate, useLocation } from "react-router-dom";
import { Home, Settings as SettingsIcon, UserPlus } from "lucide-react";

export function Dock() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[85%] max-w-[320px] bg-white border border-neutral-100 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.08)] p-2 flex justify-between items-center z-50 transform-gpu contain-paint">
      <button 
        onClick={() => navigate('/register')}
        aria-label="Register"
        className={`relative w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 ease-out transform-gpu active:scale-90 ${
          location.pathname === '/register' 
            ? 'text-blue-600 bg-blue-50/80 shadow-sm' 
            : 'text-neutral-400 hover:text-neutral-800 hover:bg-neutral-50'
        }`}
      >
        <UserPlus className="w-5 h-5" strokeWidth={2.5} />
      </button>
      
      <button 
        onClick={() => navigate('/dashboard')}
        aria-label="Dashboard"
        className={`relative w-14 h-14 flex items-center justify-center rounded-[22px] transition-all duration-300 ease-out transform-gpu active:scale-90 ${
          location.pathname === '/dashboard' 
            ? 'bg-gradient-to-b from-neutral-800 to-black text-white shadow-[0_8px_16px_rgba(0,0,0,0.2)] -translate-y-1 scale-105' 
            : 'bg-transparent text-neutral-400 hover:text-neutral-800 hover:bg-neutral-50'
        }`}
      >
        <Home className="w-6 h-6" strokeWidth={2.5} />
      </button>
      
      <button 
        onClick={() => navigate('/settings')}
        aria-label="Settings"
        className={`relative w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 ease-out transform-gpu active:scale-90 ${
          location.pathname === '/settings' 
            ? 'text-blue-600 bg-blue-50/80 shadow-sm' 
            : 'text-neutral-400 hover:text-neutral-800 hover:bg-neutral-50'
        }`}
      >
        <SettingsIcon className="w-5 h-5" strokeWidth={2.5} />
      </button>
    </div>
  );
}
