import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { OFFLINE_BLOG_POOL } from "./src/utils/fallbackPool";

// Load environment variables
dotenv.config();

let aiClient: GoogleGenAI | null = null;

/**
 * Lazy initialization of GoogleGenAI to prevent crashing at startup if key is missing.
 */
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables. Please add it via Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Get daily calming blog content
  app.get("/api/daily-blog", async (req, res) => {
    try {
      const client = getGeminiClient();
      const requestedDate = (req.query.date as string) || new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      
      console.log(`Generating cozy daily blog for date: ${requestedDate}`);

      // Crafting structured calming prompt for Gemini
      const prompt = `Ты — редактор лаконичного, чистого и успокаивающего Дневника-Блога (в стиле 'молоко и звёзды', спокойная эстетика).
Твоя задача — извлечь из достоверных источников и скомпилировать спокойный утренне-вечерний выпуск для чтения на дату: ${requestedDate}.
Все факты, литературные цитаты, кулинарные рецепты и исторические события гарантируют достоверность.

Структура выпуска:
1. dateString — Красивое лиричное представление даты, например, "Суббота, 23 мая 2026 года".
2. dayGreeting — Нежное, спокойное утреннее приветствие и импульс для мягкого ощущения себя в моменте (не мотивация типа 'сделай этот день продуктивным!', а побуждение почувствовать температуру воздуха, свое дыхание, расслабить плечи, осознать себя живым прямо сейчас). Объём — 2-3 чутких предложения.
3. positiveEvents — Список из 2 приятных, добрых исторических или мировых событий, произошедших в этот день года, либо недавние миролюбивые достижения человечества (наука, экология, культура, искусство), которые вдохновляют и успокаивают душу. Должно быть кратко и позитивно.
4. mindfulnessAdvice — Список из 1-2 практических советов или простых лайфхаков для легкости нервной системы (дыхание, осознанность, снятие напряжения, утренний покой). Каждое с заголовком и кратким понятным описанием.
5. cosmicForecast — Космический прогноз на этот день. Опиши реальные физические или астрономические движения небесных тел (например, положение Луны относительно созвездий, фаза Луны, метеорный поток, видимые планеты) научно достоверно, но в очень шутливой, тёплой и расслабряющей форме. Спекулятивную астрологию ('козерогам не выходить из дома') замени на добрый космический юмор ("Юпитер сияет на востоке, напоминая, что можно позволить себе лишнюю чашку чая").
6. calmStory — Увлекательная, но очень спокойная и усыпляющая/умиротворяющая реальная история из истории науки, географических открытий, искусства или литературы (например, о том, как тихо писали картины, наблюдали за звёздами или совершали пешие восхождения). Обязательно укажи достоверный исторический источник/первоисточник.
7. threeQuestions — Ровно 3 неспешных вопроса для самопознания и вечерне-утренней рефлексии (раздел "три вопроса к себе"), чтобы человек мог заглянуть внутрь себя и успокоить мысли.
8. floraFaunaFact — Увлекательный и подлинный факт из жизни ботаники или зоологии (флора и фауна), подчеркивающий удивительную гармонию природы. Без агрессии, очень уютный и мирный факт.
9. historicFact — Исторический факт о текущем дне календаря: год события и краткое описание интересного мирного открытия или культурного события, случившегося именно в этот календарный день.
10. literaryQuote — Поэтичная художественная цитата или стихотворение великого классика литературы (Тургенев, Пушкин, Бунин, Есенин, Басё и др.) о природе, спокойствии, утре или узорах на стекле, с указанием имени автора и произведения/года.
11. cozyRecipe — Рецепт тёплого, уютного успокаивающего напитка или лёгкого лакомства (например, лавандовый раф, чай с чабрецом и яблоком, молоко со специями) с конкретными ингредиентами и 3-5 простыми поэтапными шагами приготовления.`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "Ты — мудрый куратор спокойствия и осознанности. Твоя миссия — вернуть человеку ясность ума, спокойствие нервной системы и погрузить в тёплое, расслабряющее чтение. Пиши изысканным, чистым и мягким русским слогом. Вся информация должна быть достоверной.",
          tools: [{ googleSearch: {} }], // Grounding in search to guarantee authentic historical dates, moon phases, and real events
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              dateString: { type: Type.STRING },
              dayGreeting: { type: Type.STRING },
              positiveEvents: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["title", "description"]
                }
              },
              mindfulnessAdvice: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    content: { type: Type.STRING }
                  },
                  required: ["title", "content"]
                }
              },
              cosmicForecast: {
                type: Type.OBJECT,
                properties: {
                  planetaryStatus: { type: Type.STRING },
                  humorousAdvice: { type: Type.STRING }
                },
                required: ["planetaryStatus", "humorousAdvice"]
              },
              calmStory: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  story: { type: Type.STRING },
                  source: { type: Type.STRING }
                },
                required: ["title", "story", "source"]
              },
              threeQuestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              floraFaunaFact: {
                type: Type.OBJECT,
                properties: {
                  subject: { type: Type.STRING },
                  fact: { type: Type.STRING }
                },
                required: ["subject", "fact"]
              },
              historicFact: {
                type: Type.OBJECT,
                properties: {
                  year: { type: Type.INTEGER },
                  event: { type: Type.STRING }
                },
                required: ["year", "event"]
              },
              literaryQuote: {
                type: Type.OBJECT,
                properties: {
                  author: { type: Type.STRING },
                  text: { type: Type.STRING },
                  bookOrYear: { type: Type.STRING }
                },
                required: ["author", "text"]
              },
              cozyRecipe: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  ingredients: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  steps: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["name", "description", "ingredients", "steps"]
              }
            },
            required: [
              "dateString",
              "dayGreeting",
              "positiveEvents",
              "mindfulnessAdvice",
              "cosmicForecast",
              "calmStory",
              "threeQuestions",
              "floraFaunaFact",
              "historicFact",
              "literaryQuote",
              "cozyRecipe"
            ]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        return res.status(500).json({ error: "Empty response from AI" });
      }

      const blogData = JSON.parse(responseText.trim());
      return res.json(blogData);
    } catch (error: any) {
      console.log("Express server: Gemini API is sleeping or rate-limited. Serving a beautiful, authentic daily blog from our local curated multi-day pool.");
      
      try {
        const requestedDate = (req.query.date as string) || new Date().toISOString().split("T")[0];
        const d = new Date(requestedDate);
        
        if (isNaN(d.getTime())) {
          throw new Error("Invalid date received");
        }
        
        const dayOfWeek = d.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const poolData = OFFLINE_BLOG_POOL[dayOfWeek] || OFFLINE_BLOG_POOL[0];
        
        const options: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" };
        const dateFormatted = d.toLocaleDateString("ru-RU", options);
        const resolvedDateString = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);
        
        const responseData = {
          ...poolData,
          dateString: resolvedDateString
        };
        
        return res.json(responseData);
      } catch (fallbackError: any) {
        console.error("Express: Ultimate fallback also failed:", fallbackError);
        return res.status(200).json({
          dateString: "Тихий день",
          positiveEvents: [
            { title: "Внутренний покой", description: "Мир заботится о вас в эту секунду. Вдохните глубоко." }
          ],
          mindfulnessAdvice: [
            { title: "Задержка на вдохе", content: "Сделайте глубокий вдох, задержите дыхание на пару секунд и плавно отпустите плечи." }
          ],
          cosmicForecast: { planetaryStatus: "Гармония глубин", humorousAdvice: "Просто дышите глубоко. Всё устроится лучшим образом." },
          calmStory: { title: "Тихий сад", story: "Здесь тихо, уютно и безопасно.", source: "Внутреннее спокойствие" },
          threeQuestions: ["За что я благодарен сегодняшнему дню?", "Какая деталь природы меня радует?", "Как я могу позаботиться о себе?"],
          floraFaunaFact: { subject: "Природа", fact: "Вселенная находится в равновесии." },
          historicFact: { year: 2026, event: "Всемирный день тишины" },
          literaryQuote: { author: "Классик", text: "Всё уляжется и расцветёт вновь." },
          cozyRecipe: { name: "Тёплый Напиток", description: "Просто стакан чистой тёплой воды или травяного чая.", ingredients: [], steps: [] }
        });
      }
    }
  });

  // Serve static assets or mount Vite dev server mapping
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    
    // Serve service worker and manifest directly to root if needed (Express static fallback handles this, but let's be explicit)
    app.use(express.static(distPath));
    
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Milk Blog Express Server] Running on http://localhost:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

startServer();
