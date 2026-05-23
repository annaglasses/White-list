import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar,
  Sparkles,
  Heart,
  Compass,
  Moon,
  Info,
  ChevronLeft,
  ChevronRight,
  Wifi,
  WifiOff,
  Music,
  Trees,
  CheckCircle,
  HelpCircle,
  BookOpen,
  Anchor,
  Loader2,
  Volume2,
  VolumeX
} from "lucide-react";
import { DailyBlogData } from "./types";
import { OFFLINE_BLOG_POOL } from "./utils/fallbackPool";
import BreathingGuide from "./components/BreathingGuide";
import ThreeQuestions from "./components/ThreeQuestions";
import { startOceanSynth, stopOceanSynth, playCoseyBell } from "./utils/audio";

export default function App() {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  });
  const [blogData, setBlogData] = useState<DailyBlogData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Audio state
  const [isOceanPlaying, setIsOceanPlaying] = useState(false);

  // Network State
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Register PWA service worker if supported
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js")
          .then((reg) => console.log("Service Worker registered successfully:", reg.scope))
          .catch((err) => console.log("Service Worker registration failed:", err));
      });
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Fetch or Load from cache
  useEffect(() => {
    loadDailyData(selectedDate);
  }, [selectedDate]);

  const loadDailyData = async (targetDate: string) => {
    setIsLoading(true);
    setApiError(null);

    // 1. Try to read from localStorage cache first
    const cacheKey = `milk_blog_cache_${targetDate}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData) as DailyBlogData;
        setBlogData(parsed);
        setIsLoading(false);
        return;
      } catch (e) {
        console.error("Failed to parse cached daily blog", e);
      }
    }

    // 2. Fetch from the server API if online
    if (navigator.onLine) {
      try {
        const response = await fetch(`/api/daily-blog?date=${targetDate}`);
        if (!response.ok) {
          let errorMsg = "Не удалось получить свежие данные от искусственного интеллекта.";
          try {
            const errJson = await response.json();
            if (errJson && errJson.error) {
              errorMsg = errJson.error;
            }
          } catch (jsonErr) {}
          throw new Error(errorMsg);
        }
        const data = await response.json() as DailyBlogData;
        
        // Cache the result
        localStorage.setItem(cacheKey, JSON.stringify(data));
        setBlogData(data);
        setApiError(null);
      } catch (error: any) {
        console.warn("API request failed, falling back to local formulas:", error);
        setApiError(error.message || "Ошибка соединения");
        useFallback(targetDate);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Offline fallback when no cache exists
      setApiError("Ошибка соединения: вы находитесь вне сети.");
      useFallback(targetDate);
      setIsLoading(false);
    }
  };

  const useFallback = (targetDate: string) => {
    const d = new Date(targetDate);
    
    // Deterministic selection from the 7-day pool based on the day of the week (0-6)
    const dayOfWeek = d.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const poolData = OFFLINE_BLOG_POOL[dayOfWeek] || OFFLINE_BLOG_POOL[0];
    
    const options: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" };
    const dateFormatted = d.toLocaleDateString("ru-RU", options);
    
    const fallbackCopy: DailyBlogData = {
      ...poolData,
      dateString: dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1)
    };
    setBlogData(fallbackCopy);
  };

  const shiftDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split("T")[0]);
  };

  const toggleOceanAmbient = () => {
    if (isOceanPlaying) {
      stopOceanSynth();
      setIsOceanPlaying(false);
    } else {
      startOceanSynth();
      setIsOceanPlaying(true);
      playCoseyBell();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1F2421] selection:bg-[#E5E2DA] selection:text-[#1F2421] pb-16 font-sans">
      
      {/* Visual background ambient milk-floaties (Subtle luxury vector shapes) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[12%] left-[-10%] w-72 h-72 rounded-full bg-amber-100/30 blur-3xl animate-soft-pulse" />
        <div className="absolute bottom-[15%] right-[-10%] w-96 h-96 rounded-full bg-indigo-50/40 blur-3xl animate-soft-pulse" style={{ animationDelay: "3s" }} />
        <div className="absolute top-[50%] left-[60%] w-80 h-80 rounded-full bg-emerald-50/20 blur-3xl animate-soft-pulse" style={{ animationDelay: "5s" }} />
      </div>

      {/* Main Container */}
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
        
        {/* Navigation / Header */}
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 border-b border-[#E5E2DA] pb-6">
          <div className="text-center sm:text-left">
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#1F2421] tracking-tight flex items-center gap-2 justify-center sm:justify-start">
              <span className="inline-block w-3.5 h-3.5 rounded-full bg-amber-200 border border-amber-300 shadow-sm" />
              <span>Молочный Блог</span>
            </h1>
            <p className="text-xs text-[#8E8A7D] font-display font-medium tracking-wide mt-1 uppercase">
              Ваш тихий оазис утренней гармонии
            </p>
          </div>

          {/* Connection status and sound toggle */}
          <div className="flex items-center gap-3">
            {/* Ambient Soundscape Controller */}
            <button
              onClick={toggleOceanAmbient}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-display font-medium border transition-all duration-300 ${
                isOceanPlaying 
                  ? "bg-amber-50/80 border-amber-200 text-amber-800 shadow-xs scale-102" 
                  : "bg-white/80 border-[#E5E2DA] text-[#8E8A7D] hover:bg-white hover:text-[#1F2421]"
              }`}
            >
              <Music className={`w-3.5 h-3.5 ${isOceanPlaying ? "animate-spin style-slow" : ""}`} />
              <span>{isOceanPlaying ? "Шум прибоя: вкл" : "Включить прибой"}</span>
            </button>

            {/* Offline Status Pille */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-display font-medium border bg-white/60 ${
              isOnline 
                ? "border-[#E5E2DA] text-emerald-800" 
                : "border-amber-200 text-amber-800"
            }`}>
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-[#8DAB7E]" />
                  <span>Сеть</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                  <span>Оффлайн</span>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Date switcher wrapper */}
        <div className="flex items-center justify-between bg-white border border-[#E5E2DA] p-2.5 rounded-2xl mb-8 shadow-xs">
          <button
            onClick={() => shiftDate(-1)}
            className="p-2 hover:bg-[#FAF9F6] rounded-xl transition-all cursor-pointer text-[#8E8A7D]"
            title="Предыдущий день"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-[#1F2421]">
            <Calendar className="w-4 h-4 text-[#8E8A7D]" />
            <span className="font-display font-semibold text-sm sm:text-base">
              {blogData ? blogData.dateString : selectedDate}
            </span>
          </div>

          <button
            onClick={() => shiftDate(1)}
            className="p-2 hover:bg-[#FAF9F6] rounded-xl transition-all cursor-pointer text-[#8E8A7D]"
            title="Следующий день"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Calm Day Greeting */}
        {blogData && blogData.dayGreeting && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.4 }}
            className="mb-8 p-6 bg-[#FAF9F6]/90 border border-[#E5E2DA]/65 rounded-3xl text-center relative overflow-hidden shadow-xs"
          >
            <div className="flex justify-center mb-2.5">
              <span className="text-amber-800/50 font-serif text-[18px] leading-none select-none">✻</span>
            </div>
            <p className="font-serif italic text-[#3E3A31] text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
              {blogData.dayGreeting}
            </p>
          </motion.div>
        )}

        {/* Core Blog Panel */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <Loader2 className="w-10 h-10 animate-spin text-[#8E8A7D] mb-4" />
              <p className="font-display text-base text-[#4A463B] font-medium font-serif italic">
                Вспениваем тёплые мысли, пишем тихие истории...
              </p>
              <p className="text-xs text-[#8E8A7D] mt-2 max-w-xs font-sans">
                Сверяемся со звёздным атласом и достоверными хрониками времени.
              </p>
            </motion.div>
          ) : blogData ? (
            <motion.main
              key={selectedDate}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              {/* Daily Wisdom / Calming Story block */}
              <article className="bg-white border border-[#E5E2DA] rounded-3xl p-6 sm:p-8 shadow-xs">
                <div className="flex items-center gap-2 mb-4 text-amber-700/80">
                  <Anchor className="w-5 h-5" />
                  <span className="text-xs uppercase tracking-widest font-sans font-semibold">
                    Тихая история из достоверных источников
                  </span>
                </div>
                <h2 className="font-serif font-medium text-xl sm:text-2xl text-[#1F2421] mb-4 balance-text">
                  {blogData.calmStory.title}
                </h2>
                <p className="font-serif italic text-[#4A463B] leading-relaxed text-base sm:text-lg mb-6 whitespace-pre-wrap">
                  «{blogData.calmStory.story}»
                </p>
                <div className="text-xs text-[#8E8A7D] font-sans border-t border-[#F2EFE9] pt-4 flex items-center justify-between">
                  <span>Достоверный источник:</span>
                  <span className="font-medium font-serif italic text-[#1F2421]">
                    {blogData.calmStory.source}
                  </span>
                </div>
              </article>

              {/* Literary Quote block */}
              {blogData.literaryQuote && (
                <article className="bg-amber-50/15 border border-[#EAD2AC]/30 rounded-3xl p-6 sm:p-8 relative overflow-hidden">
                  <div className="absolute top-[-20px] right-2 p-4 opacity-5 text-amber-900 pointer-events-none select-none">
                    <span className="font-serif text-[180px] leading-none">”</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3.5 text-amber-800/70">
                    <span className="text-xs uppercase tracking-widest font-sans font-semibold">
                      Литературная классика дня
                    </span>
                  </div>
                  <p className="font-serif italic text-base sm:text-lg text-[#3A352B] leading-relaxed mb-4 relative z-10">
                    «{blogData.literaryQuote.text}»
                  </p>
                  <p className="text-right text-xs text-[#8E8A7D] font-display font-medium">
                    — {blogData.literaryQuote.author}
                    {blogData.literaryQuote.bookOrYear && (
                      <span className="font-serif italic font-light ml-1 text-[#1F2421]">
                        , {blogData.literaryQuote.bookOrYear}
                      </span>
                    )}
                  </p>
                </article>
              )}

              {/* Cosmic Weather / Astronomical Forecast */}
              <section className="bg-[#FAF9F6] border border-[#E5E2DA] rounded-3xl p-6 sm:p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Moon className="w-5 h-5 text-[#8DAB7E]" />
                    <h3 className="font-display font-medium text-base text-[#1F2421]">
                      Космическая погода
                    </h3>
                  </div>
                  <span className="text-[10px] bg-white border border-[#E5E2DA] px-2 py-1 rounded-full text-[#8E8A7D] uppercase font-display tracking-widest">
                    Научно и с улыбкой
                  </span>
                </div>
                <div className="space-y-3">
                  <p className="text-xs text-[#8E8A7D] font-display uppercase tracking-wider bg-white/60 p-2.5 rounded-xl border border-[#F2EFE9] inline-block font-medium">
                    Статус небесных тел: <span className="text-[#1F2421] lowercase font-sans font-normal italic">{blogData.cosmicForecast.planetaryStatus}</span>
                  </p>
                  <p className="font-serif italic text-base text-[#4A463B] leading-relaxed">
                    {blogData.cosmicForecast.humorousAdvice}
                  </p>
                </div>
              </section>

              {/* Grid: Events & Mindfulness advice */}
              <div id="grid-container" className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Positive Global Events */}
                <div className="bg-white border border-[#E5E2DA] rounded-3xl p-6 sm:p-7 shadow-xs">
                  <div className="flex items-center gap-2 mb-5">
                    <Sparkles className="w-5 h-5 text-[#C9A074]" />
                    <h3 className="font-display font-medium text-base text-[#1F2421]">
                      Миролюбивые события
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {blogData.positiveEvents.map((ev, i) => (
                      <div key={i} className="border-l-2 border-[#EAD2AC] pl-3.5">
                        <h4 className="text-sm font-display font-semibold text-[#1F2421] mb-1">
                          {ev.title}
                        </h4>
                        <p className="text-xs text-[#8E8A7D] leading-relaxed">
                          {ev.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mindfulness Tips */}
                <div className="bg-white border border-[#E5E2DA] rounded-3xl p-6 sm:p-7 shadow-xs">
                  <div className="flex items-center gap-2 mb-5">
                    <Heart className="w-5 h-5 text-rose-300" />
                    <h3 className="font-display font-medium text-base text-[#1F2421]">
                      Легкость нервной системы
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {blogData.mindfulnessAdvice.map((adv, i) => (
                      <div key={i} className="border-l-2 border-rose-100 pl-3.5">
                        <h4 className="text-sm font-display font-semibold text-[#1F2421] mb-1">
                          {adv.title}
                        </h4>
                        <p className="text-xs text-[#8E8A7D] leading-relaxed">
                          {adv.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Flora & Fauna and Calendar Event (Two columns) */}
              <div id="nature-grid" className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Flora & Fauna */}
                <div className="bg-white border border-[#E5E2DA] rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-4 text-[#8DAB7E]">
                      <Trees className="w-5 h-5" />
                      <span className="text-xs uppercase tracking-widest font-sans font-semibold">
                        Флора и Фауна
                      </span>
                    </div>
                    <p className="text-xs text-[#8E8A7D] uppercase font-display tracking-widest mb-2 font-medium">
                      Существо: {blogData.floraFaunaFact.subject}
                    </p>
                    <p className="font-serif italic text-sm text-[#4A463B] leading-relaxed">
                      {blogData.floraFaunaFact.fact}
                    </p>
                  </div>
                </div>

                {/* Day in Calendar historical fact */}
                <div className="bg-white border border-[#E5E2DA] rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-4 text-[#A1B5D0]">
                      <Compass className="w-5 h-5" />
                      <span className="text-xs uppercase tracking-widest font-sans font-semibold">
                        День в Календаре
                      </span>
                    </div>
                    <p className="text-xs text-[#8E8A7D] uppercase font-display tracking-widest mb-2 font-medium">
                      Год: {blogData.historicFact.year}
                    </p>
                    <p className="font-serif italic text-sm text-[#4A463B] leading-relaxed">
                      {blogData.historicFact.event}
                    </p>
                  </div>
                </div>

              </div>

              {/* Cozy Recipe of the Day */}
              {blogData.cozyRecipe && (
                <div className="bg-white border border-[#E5E2DA] rounded-3xl p-6 sm:p-8 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-5 border-b border-[#F2EFE9] pb-4">
                    <div className="flex items-center gap-2 text-amber-800/80">
                      <span className="font-display font-medium text-base text-[#1F2421]">
                        Рецепт тепла: {blogData.cozyRecipe.name}
                      </span>
                    </div>
                    <span className="text-[10px] w-fit bg-amber-50 border border-[#EAD2AC]/40 px-2.5 py-1 rounded-full text-amber-800/80 uppercase font-display tracking-widest font-semibold">
                      Минутка согревания
                    </span>
                  </div>
                  
                  <p className="text-xs text-[#8E8A7D] font-serif italic mb-6">
                    {blogData.cozyRecipe.description}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Ingredients with offline checkbox checks */}
                    <div className="space-y-3 bg-[#FAF9F6] p-4 rounded-2xl border border-[#E5E2DA]/60">
                      <h4 className="text-xs font-display font-bold uppercase tracking-wider text-[#4A463B] mb-2">
                        Ингредиенты:
                      </h4>
                      <ul className="space-y-2.5 text-xs text-[#4A463B]">
                        {blogData.cozyRecipe.ingredients.map((ing, idx) => (
                          <li key={idx} className="flex items-start gap-2.5">
                            <input 
                              type="checkbox" 
                              id={`ing-${idx}`} 
                              className="mt-0.5 h-4 w-4 rounded border-[#E5E2DA] text-[#8E8A7D] focus:ring-[#8E8A7D] cursor-pointer accent-amber-500" 
                            />
                            <label htmlFor={`ing-${idx}`} className="cursor-pointer select-none font-sans font-light leading-snug">
                              {ing}
                            </label>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Step-by-step directions */}
                    <div className="space-y-3 p-1">
                      <h4 className="text-xs font-display font-bold uppercase tracking-wider text-[#4A463B] mb-2">
                        Приготовление:
                      </h4>
                      <ol className="space-y-3.5 text-xs text-[#8E8A7D] leading-relaxed">
                        {blogData.cozyRecipe.steps.map((step, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="font-mono text-[#C9A074] font-bold text-xs">{idx + 1}.</span>
                            <span className="text-[#4A463B] font-light">
                              {step}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              {/* Breathing Guide Interactive Block */}
              <BreathingGuide />

              {/* Three Self-Reflection Questions with local save mechanics */}
              <ThreeQuestions questions={blogData.threeQuestions} dateKey={selectedDate} />

            </motion.main>
          ) : (
            <div className="text-center py-12 bg-amber-50 rounded-2xl p-6 border border-amber-200">
              <p className="text-amber-800">Информация не найдена.</p>
            </div>
          )}
        </AnimatePresence>

        {/* Footer Info */}
        <footer className="mt-16 text-center text-xs text-[#8E8A7D] font-light max-w-sm mx-auto space-y-4">
          <p>
            Молочный Блог — место чистых и настоящих знаний, созданное для вашей душевной невесомости.
          </p>
          <div className="p-3 bg-white border border-[#E5E2DA] rounded-2xl flex items-center gap-2 text-left">
            <Info className="w-4 h-4 text-[#8E8A7D] flex-shrink-0" />
            <p className="text-[11px] leading-relaxed">
              Выпуски сохраняются прямо на вашем устройстве, чтобы вы могли читать их оффлайн за утренней чашкой кофе.
            </p>
          </div>
        </footer>

      </div>
    </div>
  );
}
