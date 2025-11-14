import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Initialize Gemini Pro model
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 2048,
  },
});

// Prompt for parsing meal and habit messages
export const mealAndHabitParserPrompt = (message: string) => `
You are a health tracking assistant. Parse the following user message and extract information about meals, workouts, reading, studying, and meditation.

User message: "${message}"

Return a JSON object with this structure:
{
  "meal": { "description": "food items", "estimated_calories": number } or null,
  "workout": { "completed": boolean, "duration_minutes": number } or null,
  "reading": { "completed": boolean, "duration_minutes": number } or null,
  "study": { "completed": boolean, "duration_minutes": number } or null,
  "meditation": { "completed": boolean, "duration_minutes": number } or null,
  "sleep": { "start_time": "HH:MM or ISO string", "end_time": "HH:MM or ISO string", "duration_minutes": number } or null
}

Rules:
- For meals, estimate calories based on typical Indian/international food portions
- For activities, extract duration if mentioned (e.g., "20 mins", "half hour" = 30)
- If duration not mentioned but activity confirmed, set duration_minutes to 0
- Return null for categories not mentioned
- Be generous with interpretation (e.g., "had breakfast" counts as meal)

Return ONLY valid JSON, no markdown or explanation.
`;

// Prompt for parsing goal-setting messages
export const goalParserPrompt = (message: string) => `
You are a health goal assistant. Parse the following goal-setting message.

User message: "${message}"

Return a JSON object:
{
  "goal_type": "weight_loss" | "weight_gain" | "maintenance" | "fitness",
  "target_change_kg": number or null,
  "target_weeks": number or null,
  "daily_calorie_target": number,
  "protein_target_g": number or null,
  "workout_minutes": number or null,
  "steps_target": number or null,
  "notes": "any additional context"
}

Rules:
- Calculate daily_calorie_target based on goal (typical: 1600-2000 for loss, 2500+ for gain)
- Extract timeframe in weeks
- If weight change mentioned, extract kg amount
- Suggest protein target (1.6-2g per kg body weight for fitness goals)
- Return reasonable defaults if specifics not mentioned

Return ONLY valid JSON, no markdown or explanation.
`;

// Prompt for generating daily summaries
export const dailySummaryPrompt = (data: {
  meals: Array<{ description: string; calories: number; time: string }>;
  habits: Array<{ name: string; completed: boolean; duration?: number }>;
  goal: { calorie_target: number; goal_type: string };
}) => `
You are a health coach. Generate a daily summary and tomorrow's plan.

Today's Data:
- Meals: ${JSON.stringify(data.meals)}
- Habits: ${JSON.stringify(data.habits)}
- Goal: ${data.goal.calorie_target} kcal/day (${data.goal.goal_type})

Return a JSON object:
{
  "day_summary": {
    "total_calories": number,
    "habits_done": ["habit names"],
    "habits_missed": ["habit names"],
    "highlights": "brief positive note"
  },
  "goal_gap_analysis": {
    "calorie_delta": number (actual - target),
    "notes": "analysis of progress"
  },
  "tomorrow_plan": {
    "meals": ["breakfast suggestion", "lunch suggestion", "dinner suggestion"],
    "habits": ["habit reminders"],
    "focus": "one key focus area"
  },
  "motivation_snippet": "encouraging message (2-3 sentences)"
}

Return ONLY valid JSON, no markdown or explanation.
`;

// Helper function to call Gemini and parse JSON response
// simple delay
function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

// Try to extract JSON substring from text if JSON.parse fails
function extractJson(text: string) {
  const jsonMatch = text.match(/\{[\s\S]*\}/m);
  if (jsonMatch) return jsonMatch[0];
  return text;
}

export async function callGemini(prompt: string): Promise<any> {
  const maxAttempts = 4;
  let attempt = 0;

  while (attempt < maxAttempts) {
    try {
      attempt++;
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Clean up response (remove markdown code blocks if present)
      let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      try {
        return JSON.parse(cleanText);
      } catch (parseErr) {
        // Try to extract JSON substring and parse again
        const candidate = extractJson(cleanText);
        try {
          return JSON.parse(candidate);
        } catch (e) {
          console.error('JSON parse failed on Gemini output:', parseErr, e);
          throw new Error('Failed to parse JSON from Gemini response');
        }
      }
    } catch (error: any) {
      console.error(`Gemini API error (attempt ${attempt}):`, error?.message || error);
      // Retry on transient errors (503, 429) or network issues
      const status = error?.status || (error?.response && error.response.status);
      if (attempt >= maxAttempts) break;
      const backoff = 500 * Math.pow(2, attempt - 1);
      await delay(backoff);
      continue;
    }
  }

  throw new Error('Failed to process AI request after retries');
}

// Generate plain text response (not JSON) from Gemini
export async function generateText(prompt: string): Promise<string> {
  const maxAttempts = 3;
  let attempt = 0;

  while (attempt < maxAttempts) {
    try {
      attempt++;
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Remove surrounding code fences if any and trim
      const clean = text.replace(/```\w*\n?/g, '').replace(/```\n?/g, '').trim();
      return clean;
    } catch (error: any) {
      console.error(`Gemini text generation error (attempt ${attempt}):`, error?.message || error);
      if (attempt >= maxAttempts) break;
      const backoff = 400 * Math.pow(2, attempt - 1);
      await delay(backoff);
    }
  }

  throw new Error('Failed to generate text from Gemini after retries');
}

// Parse meal and habit message
export async function parseMealAndHabit(message: string) {
  const prompt = mealAndHabitParserPrompt(message);
  try {
    return await callGemini(prompt);
  } catch (err) {
    console.error('parseMealAndHabit failed:', err);
    // Fallback: return nulls so webhook can continue gracefully
    return {
      meal: null,
      workout: null,
      reading: null,
      study: null,
      meditation: null,
      _error: err instanceof Error ? err.message : String(err),
    };
  }
}

// Parse goal message
export async function parseGoal(message: string) {
  const prompt = goalParserPrompt(message);
  return await callGemini(prompt);
}

// Generate daily summary
export async function generateDailySummary(data: {
  meals: Array<{ description: string; calories: number; time: string }>;
  habits: Array<{ name: string; completed: boolean; duration?: number }>;
  goal: { calorie_target: number; goal_type: string };
}) {
  const prompt = dailySummaryPrompt(data);
  return await callGemini(prompt);
}
