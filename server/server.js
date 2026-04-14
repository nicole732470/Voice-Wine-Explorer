import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.error("Missing OPENROUTER_API_KEY in .env");
}

function cleanModelText(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.post("/api/parse-question", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "Missing or invalid question." });
    }

    const prompt = `
You are a query parser for a wine explorer app.

Your job is NOT to answer the user's wine question directly.
Your job is to convert the user's natural-language question into structured JSON.

The wine dataset contains these columns:
- ABV
- Appellation
- Country
- Id
- Name
- Producer
- Region
- Retail
- Upc
- Varietal
- Vintage
- color
- image_url
- professional_ratings
- reference_url
- volume_ml

Important rules:
1. Return ONLY valid JSON.
2. Do NOT use markdown.
3. Do NOT include code fences.
4. Do NOT include any explanation outside the JSON.
5. Only use fields that exist in the dataset.
6. If the user asks for something unsupported by the dataset, set intent to "unsupported".
7. Use "professional_ratings" when the user asks for best-rated / highest-rated / top-rated.
8. Use "Retail" for price.
9. Use "contains" for natural-language text matching unless a numeric comparison is clearly needed.
10. If the user asks for recommendations like gifts or housewarming, use intent "recommend".
11. Default limit to 5, but use 3 for "best", "top", "highest-rated", or recommendation-style requests.
12. Only parse the final user question provided after "Now parse this question:".
13. Do not reuse or copy filters from the examples unless they are directly supported by the current user question.
14. If the user question is vague, meaningless, or does not map clearly to the dataset, return:
{
  "intent": "unsupported",
  "filters": [],
  "sort": { "field": "none", "order": "none" },
  "limit": 5,
  "select": ["Name", "Producer", "Retail", "Country", "Region", "Varietal", "color"],
  "explanation": "The question is unclear or not grounded enough to query the dataset."
}
  
Return JSON with this exact schema:
{
  "intent": "search | recommend | unsupported",
  "filters": [
    {
      "field": "one of the dataset column names",
      "operator": "equals | contains | lt | lte | gt | gte",
      "value": "string or number"
    }
  ],
  "sort": {
    "field": "one of the dataset column names or professional_ratings or none",
    "order": "asc | desc | none"
  },
  "limit": number,
  "select": ["array of dataset column names to show"],
  "explanation": "short explanation of what the user is asking for"
}

Examples:

Question: Which are the best-rated wines under $50?
JSON:
{
  "intent": "search",
  "filters": [
    { "field": "Retail", "operator": "lte", "value": 50 }
  ],
  "sort": { "field": "professional_ratings", "order": "desc" },
  "limit": 3,
  "select": ["Name", "Producer", "Retail", "Country", "Region", "Varietal"],
  "explanation": "The user wants the highest-rated wines under $50."
}

Question: What do you have from Burgundy?
JSON:
{
  "intent": "search",
  "filters": [
    { "field": "Region", "operator": "contains", "value": "Burgundy" }
  ],
  "sort": { "field": "none", "order": "none" },
  "limit": 5,
  "select": ["Name", "Producer", "Country", "Region", "Retail", "Varietal"],
  "explanation": "The user wants wines from Burgundy."
}

Question: Which bottles would make a good housewarming gift?
JSON:
{
  "intent": "recommend",
  "filters": [],
  "sort": { "field": "professional_ratings", "order": "desc" },
  "limit": 3,
  "select": ["Name", "Producer", "Retail", "Country", "Region", "Varietal"],
  "explanation": "The user wants gift-friendly wine recommendations."
}

Question: Show me sparkling wines from France under $80.
JSON:
{
  "intent": "search",
  "filters": [
    { "field": "color", "operator": "contains", "value": "sparkling" },
    { "field": "Country", "operator": "contains", "value": "France" },
    { "field": "Retail", "operator": "lte", "value": 80 }
  ],
  "sort": { "field": "none", "order": "none" },
  "limit": 5,
  "select": ["Name", "Producer", "Retail", "Country", "Region", "Varietal", "color"],
  "explanation": "The user wants sparkling wines from France under $80."
}

Now parse this question:
${question}
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [
          {
            role: "system",
            content: prompt,
          },
          {
            role: "user",
            content: question,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: "OpenRouter API request failed.",
        details: data,
      });
    }

    const rawText = data?.choices?.[0]?.message?.content || "";
    const cleanedText = cleanModelText(rawText);

    let parsed;
    try {
      parsed = JSON.parse(cleanedText);
    } catch {
      return res.status(500).json({
        error: "Failed to parse model response as JSON.",
        raw: rawText,
      });
    }

    return res.json(parsed);
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      error: "Unexpected server error.",
      details: error.message,
    });
  }
});

app.listen(3001, () => {
  console.log("Server listening on http://localhost:3001");
});