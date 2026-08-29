import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // ضبط الرأس لإرجاع JSON دائماً
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body || {};

    if (!prompt) {
      return res.status(400).json({ error: 'الرجاء إدخال نص السؤال' });
    }

    // جلب المفتاح مع إزالة أي مسافات زائدة
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'مفتاح GEMINI_API_KEY غير موجود في Vercel' });
    }

    const genAI = new GoogleGenerativeAI(apiKey.trim());
    
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: "أنت مساعد ذكي متخصص في السيرة النبوية باسم 'سِراج'. تجيب بأمانة ودقة وتذكر المصادر الموثوقة (مثل السيرة النبوية لابن هشام، الرحيق المختوم، زاد المعاد) في نهاية الإجابة بصيغة 'المصدر: اسم الكتاب'."
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return res.status(200).json({ reply: responseText });
  } catch (error) {
    console.error("API Error Details:", error);
    return res.status(500).json({ error: error.message || 'حدث خطأ في الاتصال بالنموذج' });
  }
}