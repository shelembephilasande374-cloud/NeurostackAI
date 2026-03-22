import { getAuth } from "@clerk/nextjs/server";

const FREE_LIMIT = 3;
const usageStore = {};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId } = getAuth(req);
  const userKey = userId || req.headers['x-forwarded-for'] || 'anonymous';
  const currentUsage = usageStore[userKey] || 0;

  if (currentUsage >= FREE_LIMIT) {
    return res.status(403).json({
      error: 'free_limit_reached',
      message: `You have used all ${FREE_LIMIT} free generations. Upgrade to Student plan for unlimited access.`,
      usage: currentUsage,
      limit: FREE_LIMIT,
    });
  }

  const { notes } = req.body;
  if (!notes || notes.trim().length < 20) {
    return res.status(400).json({ error: 'Please provide more text (at least 20 characters).' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured.' });
  }

  const prompt = `You are an expert study assistant. Given the notes below, produce two things:

1. A SUMMARY: A clean, concise summary of the key concepts in bullet points. Max 10 bullets. Each bullet should be one clear sentence.

2. FLASHCARDS: 8 to 12 flashcards that test understanding (not just definitions). Each card should have:
   - A question that makes the student think
   - An answer that is clear and concise (1-3 sentences)
   - A hint that is a simple analogy or memory trick (one short sentence)

Respond ONLY with valid JSON in this exact format, no extra text:
{
  "summary": ["bullet 1", "bullet 2"],
  "flashcards": [
    { "question": "...", "answer": "...", "hint": "..." }
  ]
}

NOTES:
${notes.slice(0, 8000)}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 2048 }
        })
      }
    );

    if (!response.ok) {
      return res.status(500).json({ error: 'AI request failed. Check your API key.' });
    }

    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!parsed.summary || !parsed.flashcards) {
      return res.status(500).json({ error: 'Unexpected AI response. Try again.' });
    }

    usageStore[userKey] = currentUsage + 1;

    return res.status(200).json({
      ...parsed,
      usage: currentUsage + 1,
      limit: FREE_LIMIT,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
