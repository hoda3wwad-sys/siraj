export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

    const { message, prompt } = req.body;
  const userInput = message !== undefined ? message : prompt;

  if (!apiKey) {
    return res.status(500).json({ error: 'مفتاح GEMINI_API_KEY غير معرف في Vercel' });
  }

  // تحويل أي دخل إلى نص صافي صريح لتفادي إرسال كائنات فارغة
  let extractedText = '';
  if (typeof userInput === 'string') {
    extractedText = userInput;
  } else if (typeof userInput === 'object' && userInput !== null) {
    extractedText = userInput.text || userInput.message || userInput.prompt || userInput.content || '';
  }
  if (!extractedText) {
    extractedText = String(userInput || '');
  }
  

  extractedText = extractedText.trim();

  if (!extractedText) {
    return res.status(400).json({ error: 'يرجى كتابة سؤال صحيح.' });
  }

  try {
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: extractedText }],
        },
      ],
      systemInstruction: {
        parts: [
          {
            text: "أنت مساعد ذكي متخصص في السيرة النبوية باسم 'سِراج'. تجيب بأمانة ودقة وتذكر المصادر الموثوقة (مثل السيرة النبوية لابن هشام، الرحيق المختوم، زاد المعاد) في نهاية الإجابة بصيغة 'المصدر: اسم الكتاب'.",
          },
        ],
      },
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'فشل الاتصال بـ Gemini API');
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'لم يتم استلام رد من النموذج.';

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
