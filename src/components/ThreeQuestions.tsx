import React, { useState, useEffect } from "react";
import { HelpCircle, Check, BookOpen, Clock, Trash } from "lucide-react";
import { UserDiaryEntry } from "../types";

interface ThreeQuestionsProps {
  questions: string[];
  dateKey: string; // "YYYY-MM-DD"
}

export default function ThreeQuestions({ questions, dateKey }: ThreeQuestionsProps) {
  const [answers, setAnswers] = useState<string[]>(["", "", ""]);
  const [diaryEntries, setDiaryEntries] = useState<UserDiaryEntry[]>([]);
  const [isSaved, setIsSaved] = useState(false);

  // Load answers and total history from localStorage
  useEffect(() => {
    // 1. Load active answers for today
    const storedEntries = localStorage.getItem("milk_blog_diary");
    let parsedEntries: UserDiaryEntry[] = [];
    if (storedEntries) {
      try {
        parsedEntries = JSON.parse(storedEntries);
        setDiaryEntries(parsedEntries);
      } catch (e) {
        console.error(e);
      }
    }

    const todayEntry = parsedEntries.find((entry) => entry.date === dateKey);
    if (todayEntry) {
      setAnswers(todayEntry.answers);
      setIsSaved(true);
    } else {
      setAnswers(["", "", ""]);
      setIsSaved(false);
    }
  }, [dateKey]);

  const handleAnswerChange = (index: number, val: string) => {
    const updated = [...answers];
    updated[index] = val;
    setAnswers(updated);
    setIsSaved(false);
  };

  const saveAnswers = () => {
    const newEntry: UserDiaryEntry = {
      date: dateKey,
      answers,
      createdAt: new Date().toISOString(),
    };

    // Filter out previous entry for today if exists, then append new entry
    const filtered = diaryEntries.filter((e) => e.date !== dateKey);
    const updatedEntries = [...filtered, newEntry];

    localStorage.setItem("milk_blog_diary", JSON.stringify(updatedEntries));
    setDiaryEntries(updatedEntries);
    setIsSaved(true);
  };

  const deleteEntry = (dateToDelete: string) => {
    const updated = diaryEntries.filter((e) => e.date !== dateToDelete);
    localStorage.setItem("milk_blog_diary", JSON.stringify(updated));
    setDiaryEntries(updated);
    if (dateToDelete === dateKey) {
      setAnswers(["", "", ""]);
      setIsSaved(false);
    }
  };

  const isFormValid = answers.some((ans) => ans.trim().length > 0);

  return (
    <div id="three-questions-block" className="outline-none">
      <div className="bg-[#FAF9F6] border border-[#E5E2DA] rounded-3xl p-6 sm:p-8 shadow-xs max-w-2xl mx-auto transition-all duration-300">
        <div className="flex items-center gap-2.5 mb-6">
          <HelpCircle className="w-5 h-5 text-[#8E8A7D]" />
          <h3 className="font-display font-medium text-base text-[#1F2421]">Три вопроса к себе</h3>
        </div>

        <p className="text-sm text-[#8E8A7D] font-light mb-6">
          Простые, неспешные вопросы для утренней настройки или вечерней разгрузки. Нет правильных ответов, просто прислушайтесь к себе.
        </p>

        {questions && questions.length >= 3 ? (
          <div className="space-y-6">
            {questions.slice(0, 3).map((q, idx) => (
              <div key={idx} className="block text-left">
                <label className="block text-sm font-medium text-[#4A463B] font-display mb-2">
                  {idx + 1}. {q}
                </label>
                <textarea
                  value={answers[idx] || ""}
                  onChange={(e) => handleAnswerChange(idx, e.target.value)}
                  placeholder="Ваши мысли..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-2xl border border-[#E5E2DA] bg-white text-[#1F2421] text-sm focus:outline-none focus:ring-1 focus:ring-[#8E8A7D] focus:border-[#8E8A7D] placeholder-[#BFBBB0] font-sans transition-all"
                />
              </div>
            ))}

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={saveAnswers}
                disabled={!isFormValid}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-display text-sm tracking-wide transition-all ${
                  isSaved
                    ? "bg-[#DDE2D3] text-[#3D4F31] border border-[#C5CDBC]"
                    : "bg-[#1F2421] hover:bg-black text-[#FAF9F6] disabled:opacity-40 disabled:cursor-not-allowed"
                }`}
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Сохранено</span>
                  </>
                ) : (
                  <span>Сохранить в дневник</span>
                )}
              </button>

              {isSaved && (
                <span className="text-xs text-[#8DAB7E] font-medium font-sans">
                  Запись сохранена на этом устройстве
                </span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#8E8A7D] italic">Загрузка вопросов для размышления...</p>
        )}

        {/* Local Storage Offline History */}
        {diaryEntries.length > 0 && (
          <div className="mt-10 border-t border-[#E5E2DA] pt-8">
            <h4 className="font-display font-medium text-sm text-[#1F2421] mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#8E8A7D]" />
              <span>История размышлений</span>
            </h4>
            <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
              {diaryEntries.map((entry) => (
                <div
                  key={entry.date}
                  className="p-4 rounded-2xl bg-white border border-[#E5E2DA] text-left transition-all hover:shadow-xs"
                >
                  <div className="flex items-center justify-between mb-3 text-xs text-[#8E8A7D]">
                    <span className="font-display font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {entry.date}
                    </span>
                    <button
                      onClick={() => deleteEntry(entry.date)}
                      className="text-red-400 hover:text-red-600 transition-colors flex items-center gap-1 p-1 hover:bg-red-50 rounded-lg"
                      title="Удалить запись"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {entry.answers.map((ans, i) => {
                      if (!ans || ans.trim() === "") return null;
                      return (
                        <div key={i} className="text-xs font-sans">
                          {questions && questions[i] ? (
                            <p className="text-[#8E8A7D] font-light mb-0.5">{questions[i]}</p>
                          ) : (
                            <p className="text-[#8E8A7D] font-light mb-0.5">Вопрос {i+1}</p>
                          )}
                          <p className="text-[#1F2421] font-normal italic pl-2 border-l border-amber-200">
                            {ans}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
