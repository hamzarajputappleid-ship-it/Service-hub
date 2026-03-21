import { Router, Request, Response } from 'express';
import Groq from 'groq-sdk';

const router = Router();

const SYSTEM_PROMPT = `You are ServiceHub Assistant, a helpful customer support chatbot for ServiceHub — Pakistan's top platform for hiring professional workers (plumbers, electricians, web developers, civil engineers, painters, and more).

You help users with:
- How to find and book workers
- How payments work (PKR currency, Stripe-secured)
- How to check booking status
- How messaging between customers and workers works
- How to become a registered worker/freelancer
- General questions about the platform

Keep responses concise (2-4 sentences max), friendly, and professional. If asked something outside ServiceHub, politely redirect the user. Always respond in the same language the user writes in.`;

router.post('/message', async (req: Request, res: Response) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ message: 'message is required' });
  }

  const apiKey = process.env.GROQAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      reply: "I'm temporarily unavailable. Please add your GROQAI_API_KEY to the backend .env file."
    });
  }

  try {
    const groq = new Groq({ apiKey });

    // Build chat history in the correct format for the SDK
    const chatHistory = (history || [])
      .filter((h: any) => h.role && h.text)
      .map((h: any) => ({
        role: h.role === 'model' || h.role === 'assistant' ? 'assistant' : 'user',
        content: String(h.text),
      }));

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...chatHistory,
      { role: 'user', content: message }
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages: messages as any,
      model: 'llama-3.3-70b-versatile',
    });

    const reply = chatCompletion.choices[0]?.message?.content || "I'm unable to answer right now.";

    res.json({ reply });
  } catch (error: any) {
    const errorMsg = error?.message || '';
    console.error('Groq AI error:', errorMsg);

    res.status(500).json({ reply: "Sorry, I'm having trouble connecting right now. Please try again shortly." });
  }
});

export default router;

