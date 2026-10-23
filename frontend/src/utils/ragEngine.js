// GridShift-AI RAG (Retrieval-Augmented Generation) Engine
// Integrates domain knowledge on municipal waste, local Goa wards, C&D regulations,
// Automated Citizen Ticket Redressal, and latest free Gemini model (gemini-3.8-flash)
// with sliding-window rate limiting, HTTP 429 exponential backoff + jitter, and TTL cache.

const KNOWLEDGE_BASE = [
  {
    topic: "Construction & Demolition (C&D) Waste Rules",
    keywords: ["construction", "debris", "demolition", "concrete", "brick", "rubble", "renovation", "cement", "scaffolding"],
    content: "Under the Construction and Demolition Waste Management Rules (2016) and Goa State Pollution Control Board guidelines, all builders and renovators must segregate C&D debris into four streams: concrete/masonry, soil/sand, steel/metal, and wood/plastic. Direct roadside dumping in Madgaon is penalized under Section 133 of CrPC. Designated disposal yards are situated at the Cacora Solid Waste Treatment Facility and industrial zones. GridShift-AI maps real-time demolition permits to forecast surge tonnage."
  },
  {
    topic: "Madgaon City Wards & Collection Zones",
    keywords: ["madgaon", "margao", "fatorda", "borda", "navelim", "comba", "aquem", "pajifond", "goa", "market"],
    content: "Madgaon Municipality comprises 25 wards managed by the Margao Municipal Council (MMC). High micro-surge risk sectors include: (1) Margao Municipal Fish & Vegetable Market (Ward 7) with 18.5 Tons daily organic output; (2) Fatorda Stadium & Commercial Zone (Ward 2) experiencing weekend event spikes; (3) Aquem Commercial Complex (Ward 14); (4) Borda Residential Corridor (Ward 18); and (5) Comba Heritage District (Ward 10). Autonomous rovers R-1 and R-3 patrol curbside litter in commercial zones."
  },
  {
    topic: "Smart IoT Organics Bins & Hardware",
    keywords: ["iot", "sensor", "organics", "kitchen", "hardware", "fill", "temperature", "methane", "gw134", "bin"],
    content: "GridShift-AI IoT pods (such as Node GW-134 installed in commercial restaurant kitchens) employ ultrasonic depth sensors, load-cell weight sensors, and volatile gas detectors. Telemetry is transmitted every 15 seconds over LoRaWAN. When a commercial bin exceeds 80% fill capacity or 45kg load, the central server initiates an automated priority dispatch for organics collection within 30 minutes, preventing bacterial decomposition and odor issues."
  },
  {
    topic: "Autonomous Fleet & Rover Telemetry",
    keywords: ["fleet", "truck", "rover", "driver", "dispatch", "reroute", "t-402", "t-119", "t-304", "t-882", "r-1", "r-3"],
    content: "Active fleet vehicles: (1) Truck T-402 (Driver: M. Rodriguez, Downtown Hub, Load: 85%, Status: Active); (2) Truck T-119 (Driver: S. Chen, Ward 1, Load: 42%, Status: Rerouted); (3) Truck T-304 (Driver: J. Smith, Commercial Block A, Load: 92%, Status: Critical Alert); (4) Truck T-882 (Depot Maintenance). Autonomous Rovers R-1 and R-3 patrol pedestrian pathways along Bayshore Avenue and Margao Market with real-time computer vision debris detection."
  },
  {
    topic: "Citizen Waste Reporting, Ticket Redressal & Feedback Loop",
    keywords: ["report", "camera", "photo", "citizen", "litter", "illegal", "dumping", "gps", "ticket", "redressal", "sla", "feedback", "admin", "pranavkantak9"],
    content: "Citizens report waste incidents via the Geotagged Camera Modal, which generates a tracked Redressal Ticket (e.g., TKT-2026-401) with automated SLA targets (Critical: 4h, High: 12h, Medium: 24h, Low: 48h). Platform Administrator (pranavkantak9@gmail.com) has RBAC command authority to triage tickets, assign compactors/rovers, and mark tickets RESOLVED. Citizens then complete the closed-loop verification by rating the cleanup (1–5 stars): ratings >= 3 close the ticket as VERIFIED_CLOSED, while ratings <= 2 automatically reopen and escalate the ticket to Critical."
  },
  {
    topic: "Micro-Surge Machine Learning Models & Performance Optimization",
    keywords: ["model", "ml", "forecast", "xgboost", "accuracy", "algorithm", "prediction", "surge", "tonnage", "optimization", "performance"],
    content: "GridShift-AI utilizes an ensemble of XGBoost Regressors trained on municipal building permits, public holiday schedules, and historical waste tonnage data (94.2% accuracy). Performance optimizations include vectorized batch XGBoost prediction (/predict/batch), MongoDB bulk insertMany() instead of serial N+1 loops, memoized Deck.gl WebGL layers, and compressed citizen photo thumbnails."
  }
];

// Latest free-tier Gemini models (primary + fallback)
export const GEMINI_FREE_MODELS = [
  "gemini-3.8-flash",
  "gemini-flash-latest",
  "gemini-2.5-flash"
];

// Client-side sliding-window rate limiter & TTL response cache
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_MINUTE = 12;
const requestTimestamps = [];
const responseCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function checkClientRateLimit() {
  const now = Date.now();
  while (requestTimestamps.length > 0 && now - requestTimestamps[0] > RATE_LIMIT_WINDOW_MS) {
    requestTimestamps.shift();
  }
  if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    const retryAfterSec = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - requestTimestamps[0])) / 1000);
    return { allowed: false, retryAfterSec, remaining: 0 };
  }
  requestTimestamps.push(now);
  return {
    allowed: true,
    retryAfterSec: 0,
    remaining: MAX_REQUESTS_PER_MINUTE - requestTimestamps.length
  };
}

export function getGeminiRateLimitTelemetry() {
  const now = Date.now();
  const active = requestTimestamps.filter((ts) => now - ts <= RATE_LIMIT_WINDOW_MS);
  return {
    model: GEMINI_FREE_MODELS[0],
    usedLastMinute: active.length,
    limitPerMinute: MAX_REQUESTS_PER_MINUTE,
    remainingQuota: Math.max(0, MAX_REQUESTS_PER_MINUTE - active.length),
    cacheEntries: responseCache.size
  };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchGeminiWithBackoff(promptText, apiKey, maxRetries = 3) {
  let lastError = null;

  for (const modelName of GEMINI_FREE_MODELS) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [{ text: promptText }]
                }
              ],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 650
              }
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return { text, modelUsed: modelName, retries: attempt };
          }
        }

        // Handle HTTP 429 Too Many Requests / Quota Exceeded or 503 Overload
        if (response.status === 429 || response.status === 503) {
          const retryAfterHeader = response.headers.get("Retry-After");
          const retryAfterMs = retryAfterHeader ? parseInt(retryAfterHeader, 10) * 1000 : null;
          const backoffMs = retryAfterMs || Math.min(8000, 1000 * Math.pow(2, attempt) + Math.floor(Math.random() * 450));
          console.warn(`[Gemini Rate-Limit Guard] HTTP ${response.status} on ${modelName} (attempt ${attempt + 1}/${maxRetries + 1}). Backing off ${backoffMs}ms...`);
          if (attempt < maxRetries) {
            await sleep(backoffMs);
            continue;
          }
        }

        // If 404 (model alias not available on endpoint), break inner loop to try next model alias
        if (response.status === 404) {
          break;
        }

        const errBody = await response.text().catch(() => "");
        lastError = new Error(`HTTP ${response.status}: ${errBody}`);
        break;
      } catch (networkErr) {
        lastError = networkErr;
        if (attempt < maxRetries) {
          const backoffMs = 800 * Math.pow(2, attempt) + Math.floor(Math.random() * 300);
          await sleep(backoffMs);
        }
      }
    }
  }

  throw lastError || new Error("All Gemini free model endpoints exhausted");
}

export async function askGeminiWithRAG(userQuery, activeContext = {}) {
  const queryLower = userQuery.toLowerCase().trim();

  // Check 5-minute TTL cache first to save free-tier RPM quota
  const cached = responseCache.get(queryLower);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.text;
  }

  // 1. RETRIEVE RELEVANT KNOWLEDGE CHUNKS
  const scoredChunks = KNOWLEDGE_BASE.map((item) => {
    let score = 0;
    item.keywords.forEach((kw) => {
      if (queryLower.includes(kw)) score += 2;
    });
    const topicWords = item.topic.toLowerCase().split(" ");
    topicWords.forEach((w) => {
      if (w.length > 3 && queryLower.includes(w)) score += 1.5;
    });
    return { ...item, score };
  });

  scoredChunks.sort((a, b) => b.score - a.score);
  const relevantChunks = scoredChunks.filter((c) => c.score > 0).slice(0, 3);

  const retrievedText =
    relevantChunks.length > 0
      ? relevantChunks.map((c) => `[TOPIC: ${c.topic}]\n${c.content}`).join("\n\n")
      : `${KNOWLEDGE_BASE[0].content}\n\n${KNOWLEDGE_BASE[4].content}`;

  // Pull live ticket redressal counts from localStorage
  let ticketStats = { total: 4, open: 2, resolved: 1, verified: 1 };
  try {
    const savedTickets = JSON.parse(localStorage.getItem("gridshift_redressal_tickets") || "[]");
    if (savedTickets.length > 0) {
      ticketStats = {
        total: savedTickets.length,
        open: savedTickets.filter((t) => !["RESOLVED", "VERIFIED_CLOSED"].includes(t.status)).length,
        resolved: savedTickets.filter((t) => t.status === "RESOLVED").length,
        verified: savedTickets.filter((t) => t.status === "VERIFIED_CLOSED").length
      };
    }
  } catch {
    // ignore storage parse issues
  }

  const liveContextText = `
CURRENT SYSTEM TELEMETRY (Madgaon Municipal Area, Goa):
- Monitored Nodes: 140 Smart Units (All Online, 12ms latency)
- Construction Debris Hotspots: 5 active sites (Fatorda High-Rise 14.5T, Aquem Commercial 8.2T, Margao Bypass 22T, Navelim 11.4T, Borda 6.8T)
- Active Municipal Trucks: 3 en route (T-402, T-119, T-304), 1 in maintenance (T-882)
- Autonomous Rovers: R-1 (Active Bayshore), R-3 (Margao Market)
- Redressal Tickets: ${ticketStats.total} total (${ticketStats.open} active in SLA queue, ${ticketStats.resolved} awaiting citizen verification, ${ticketStats.verified} verified closed)
- Platform Admin (RBAC): pranavkantak9@gmail.com
- Active Surges: Margao Fish Market (18T Critical), Comba Ward (9.5T High)
`;

  const systemPrompt = `You are GridShift Copilot, an intelligent AI municipal waste and urban sanitation assistant for GridShift-AI in Madgaon, Goa.
Answer the user's inquiry clearly, professionally, and actionably. Use the provided retrieved knowledge and live telemetry.
Keep your response concise (2-4 paragraphs or formatted bullet points).

--- RETRIEVED KNOWLEDGE ---
${retrievedText}

--- LIVE SYSTEM TELEMETRY ---
${liveContextText}
`;

  // 2. CHECK SLIDING-WINDOW RATE LIMITER
  const rateStatus = checkClientRateLimit();
  if (!rateStatus.allowed) {
    return `⏱️ **Gemini Free-Tier Rate Limit Guard Active:**\n\nYou have reached the safety threshold of **${MAX_REQUESTS_PER_MINUTE} requests/minute**. Automatic cooldown is active — please retry in **${rateStatus.retryAfterSec}s**.\n\n---\n${buildLocalFallbackResponse(queryLower, ticketStats)}`;
  }

  // 3. TRY SERVER-SIDE PROXY FIRST (/api/gemini/copilot), THEN CLIENT-SIDE WITH EXPONENTIAL BACKOFF
  try {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "";
    const proxyEndpoint = backendUrl ? `${backendUrl}/api/gemini/copilot` : "/api/gemini/copilot";
    const proxyRes = await fetch(proxyEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: userQuery,
        systemPrompt
      })
    });

    if (proxyRes.ok) {
      const proxyData = await proxyRes.json();
      if (proxyData?.text) {
        responseCache.set(queryLower, { text: proxyData.text, timestamp: Date.now() });
        return proxyData.text;
      }
    }
  } catch {
    // Server proxy unreachable or static Vercel deployment — proceed to client-side Gemini call with backoff
  }

  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
  if (geminiKey && geminiKey !== "MY_GEMINI_API_KEY") {
    try {
      const { text } = await fetchGeminiWithBackoff(
        `${systemPrompt}\n\nUSER QUESTION: ${userQuery}`,
        geminiKey,
        3
      );
      if (text) {
        responseCache.set(queryLower, { text, timestamp: Date.now() });
        return text;
      }
    } catch (err) {
      console.warn("Gemini API exhausted retries, using synthesized local RAG response:", err);
    }
  }

  // 4. ROBUST LOCAL RAG FALLBACK
  const fallbackText = buildLocalFallbackResponse(queryLower, ticketStats);
  responseCache.set(queryLower, { text: fallbackText, timestamp: Date.now() });
  return fallbackText;
}

function buildLocalFallbackResponse(queryLower, ticketStats) {
  if (queryLower.includes("ticket") || queryLower.includes("redressal") || queryLower.includes("sla") || queryLower.includes("feedback") || queryLower.includes("admin")) {
    return `🎫 **Automated Citizen Ticket Redressal & RBAC Status:**\n\n* **Live Queue:** **${ticketStats.total} total tickets** tracked (**${ticketStats.open} active in SLA**, **${ticketStats.resolved} awaiting citizen verification**, **${ticketStats.verified} verified closed**).\n* **Admin Authority:** Account **pranavkantak9@gmail.com** has full RBAC privileges to override triage severity, assign compactors/rovers (T-402, T-304, R-1), and mark incidents **RESOLVED**.\n* **Citizen Verification Loop:** Once marked resolved, the reporting citizen rates the cleanup (1–5 stars). Ratings **≥ 3 stars** transition the ticket to **VERIFIED_CLOSED**; ratings **≤ 2 stars** automatically **REOPEN** and escalate the ticket to **Critical (4h SLA)**.`;
  }

  if (queryLower.includes("construction") || queryLower.includes("debris") || queryLower.includes("demolition")) {
    return `🏗️ **Construction & Demolition Debris Overview (Madgaon, Goa):**\n\nThere are currently **5 active C&D debris zones** marked on the Live Map, including the **Margao Bypass Flyover expansion (22.0 Tons)** and **Fatorda High-Rise demolition (14.5 Tons)**.\n\n* **Regulations:** Under Goa Municipal Solid Waste & C&D Rules 2016, all masonry and concrete must be segregated from municipal household waste and hauled to designated facilities (e.g. Cacora treatment plant).\n* **Dispatch Status:** Heavy dump truck T-304 is assigned for commercial bulk transfer, while Rover R-1 continues curbside dust and rubble monitoring.`;
  }

  if (queryLower.includes("rover") || queryLower.includes("truck") || queryLower.includes("fleet")) {
    return `🚛 **Fleet & Autonomous Rover Status:**\n\n* **Active Vehicles:** 24 municipal units total; 3 compactor trucks currently active (T-402, T-119, T-304).\n* **Autonomous Rovers:** Rover R-1 is patrolling Bayshore Avenue with real-time AI object detection; Rover R-3 is clearing pedestrian corridors around Margao Municipal Fish Market.\n* **Reroutes Today:** 3 automated reroutes were initiated by the XGBoost forecasting model to prevent dumpster overflow in Ward 7.`;
  }

  if (queryLower.includes("report") || queryLower.includes("photo") || queryLower.includes("camera")) {
    return `📸 **Citizen Waste Reporting & Ticket Redressal Guide:**\n\n1. Click **Report Incident** in the top navigation bar to open the live geotagging camera.\n2. Snap or upload a photo and choose category (**Construction Debris**, **Illegal Dump**, or **Overflowing Bin**).\n3. Your report automatically generates a tracked **Redressal Ticket (TKT-2026-XXXX)** with an SLA countdown timer and pins to the Live Map.\n4. Track dispatch progress and verify resolution in the **Ticket Redressal** tab!`;
  }

  return `🤖 **GridShift AI Telemetry Report (Madgaon, Goa):**\n\nAll **140 Smart IoT units** are operating online over LoRaWAN (12ms latency). Current highest priority sector is the **Margao Municipal Market** with an 18-ton organic surge projected for peak evening hours.\n\n* **Ticket Redressal Queue:** ${ticketStats.open} open tickets being serviced, ${ticketStats.resolved} awaiting citizen star-rating verification.\n* **AI Engine:** Powered by **gemini-3.8-flash** with sliding-window rate-limit protection and exponential backoff.`;
}
