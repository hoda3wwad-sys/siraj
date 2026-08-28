import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'الرجاء إدخال نص السؤال' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // تجربة الموديل gemini-1.5-flash-latest أو gemini-1.5-pro-latest
    let model;
    try {
      model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash-latest",
        systemInstruction: "أنت مساعد ذكي متخصص في السيرة النبوية باسم 'سِراج'. تجيب بأمانة ودقة وتذكر المصادر الموثوقة (مثل السيرة النبوية لابن هشام، الرحيق المختوم، زاد المعاد) في نهاية الإجابة بصيغة 'المصدر: اسم الكتاب'."
      });
    } catch (e) {
      model = genAI.getGenerativeModel({ model: "gemini-pro" });
    }

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return res.status(200).json({ reply: responseText });
  } catch (error) {
    console.error("API Error Details:", error);
    return res.status(500).json({ error: error.message || 'حدث خطأ أثناء معالجة الطلب' });
  }
}