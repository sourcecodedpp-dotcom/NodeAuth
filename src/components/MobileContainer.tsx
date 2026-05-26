import { ReactNode } from "react";
import { cn } from "../lib/utils";

export function MobileContainer({ 
  children, 
  className 
}: { 
  children: ReactNode; 
  className?: string; 
}) {
  return (
    <div className="min-h-screen bg-neutral-100 flex justify-center items-center p-0 sm:p-4 transition-colors duration-500">
      {/* Mobile viewport constraint */}
      <div 
        className={cn(
          "w-full h-screen sm:h-[844px] sm:max-h-[90vh] sm:max-w-[390px] sm:rounded-[48px] sm:border-[12px] sm:border-neutral-200",
          "bg-white text-black relative overflow-hidden flex flex-col shadow-2xl transition-all duration-500",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
