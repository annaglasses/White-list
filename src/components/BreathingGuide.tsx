import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Pause, Wind, Volume2, VolumeX, Moon } from "lucide-react";
import { playCoseyBell } from "../utils/audio";

const STAGES = [
  { text: "Вдох", duration: 4, size: 1.5, color: "bg-amber-100" },
  { text: "Задержка дыхания", duration: 4, size: 1.5, color: "bg-teal-50" },
  { text: "Выдох", duration: 4, size: 1.0, color: "bg-indigo-50" },
  { text: "Задержка на выдохе", duration: 4, size: 1.0, color: "bg-slate-100" },
];

export default function BreathingGuide() {
  const [isActive, setIsActive] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Handle countdown intervals when active
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            // Move to next stage
            const nextIndex = (stageIndex + 1) % STAGES.length;
            setStageIndex(nextIndex);
            
            // Play physical bowl bell on transitions if enabled
            if (soundEnabled) {
              playCoseyBell();
            }
            
            return STAGES[nextIndex].duration;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setStageIndex(0);
      setSecondsLeft(STAGES[0].duration);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, stageIndex, soundEnabled]);

  const currentStage = STAGES[stageIndex];

  return (
    <div id="breathing-guide-block" className="outline-none">
      <div className="bg-[#FAF9F6] border border-[#E5E2DA] rounded-3xl p-6 sm:p-8 text-center shadow-xs max-w-md mx-auto transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Wind className="w-5 h-5 text-[#8E8A7D]" />
            <h3 className="font-display font-medium text-base text-[#1F2421]">Дыхательный Покой</h3>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 transition-colors rounded-full hover:bg-[#FAF9F6] hover:border hover:border-[#FAF9F6] border border-transparent flex items-center justify-center text-[#8E8A7D]"
            title={soundEnabled ? "Выключить звук колокольчика" : "Включить звук колокольчика"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* Breathing Circle Container */}
        <div className="relative flex items-center justify-center h-56 my-4">
          <AnimatePresence mode="popLayout">
            {isActive && (
              <motion.div
                key="breathing-glow"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.15 }}
                exit={{ opacity: 0 }}
                className="absolute w-56 h-56 rounded-full bg-amber-200 blur-2xl"
              />
            )}
          </AnimatePresence>

          {/* Core Breathing Sphere */}
          <motion.div
            animate={{
              scale: isActive ? currentStage.size : 1.0,
              backgroundColor: isActive ? "rgb(250, 249, 246)" : "rgb(255, 255, 255)",
            }}
            transition={{
              duration: isActive ? currentStage.duration : 0.8,
              ease: "easeInOut",
            }}
            className="w-36 h-36 rounded-full border-2 border-[#E5E2DA] flex flex-col items-center justify-center shadow-lg relative z-10"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={stageIndex + "-" + isActive}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="px-4 text-center"
              >
                {!isActive ? (
                  <Moon className="w-6 h-6 text-[#A09C91] mx-auto opacity-70" />
                ) : (
                  <>
                    <p className="text-xs text-[#8E8A7D] uppercase tracking-widest font-sans font-medium mb-1">
                      {currentStage.text}
                    </p>
                    <p className="text-3xl font-display font-light text-[#1F2421]">
                      {secondsLeft}s
                    </p>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Outer ripples */}
          {isActive && (
            <motion.div
              animate={{
                scale: [1, 2],
                opacity: [0.3, 0]
              }}
              transition={{
                repeat: Infinity,
                duration: 4,
                ease: "easeOut"
              }}
              className="absolute w-28 h-28 rounded-full border border-amber-300/40 pointer-events-none"
            />
          )}
        </div>

        <p className="text-sm text-[#8E8A7D] font-light max-w-xs mx-auto mb-6">
          {!isActive 
            ? "Успокойте вегетативную нервную систему с помощью классического дыхания по квадрату 4-4-4-4." 
            : "Следуйте за секундной стрелкой. Сделайте мягкий осознанный вдох и расслабьте плечи."
          }
        </p>

        {/* Action button */}
        <button
          onClick={() => {
            setIsActive(!isActive);
            if (!isActive && soundEnabled) {
              playCoseyBell();
            }
          }}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-full font-display text-sm tracking-wide transition-all mx-auto duration-300 ${
            isActive 
              ? "bg-[#E5E2DA] hover:bg-[#D1CDC2] text-[#4A463B]" 
              : "bg-[#1F2421] hover:bg-black text-[#FAF9F6] shadow-sm hover:translate-y-[-1px]"
          }`}
        >
          {isActive ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>Приостановить</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Начать дыхание</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
