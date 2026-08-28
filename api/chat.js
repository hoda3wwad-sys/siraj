export default async function handler(req, res) {
    // التأكد من أن الطلب POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt } = req.body;
    
    // سحب الـ API Key من متغيرات البيئة في Vercel
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'API Key is missing in server configuration' });
    }

    const SYSTEM_INSTRUCTION = `
أنت مساعد ذكي متخصص في السيرة النبوية الشريفة لموقع "سِراج السيرة".
- أجب عن أسئلة المستخدم بأسلوب محترم وواضح ومبسط.
- اعتمد حصرياً على أمهات كتب السيرة (مثل: الرحيق المختوم، السيرة النبوية لابن هشام، زاد المعاد).
- اذكر اسم المصدر/المرجع في نهاية كل إجابة.
- إذا كان السؤال خارج نطاق السيرة النبوية، اعتذر بأسلوب لَبِق ووجه المستخدم للسؤال عن السيرة.
- لا تجسد أو تصور النبي ﷺ أو الصحابة بأي شكل.
`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: `${SYSTEM_INSTRUCTION}\n\nسؤال المستخدم: ${prompt}` }]
                    }
                ]
            })
        });

        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "عذراً، لم أستطع العثور على إجابة مناسبة.";

        return res.status(200).json({ reply: textResponse });
    } catch (error) {
        return res.status(500).json({ error: 'حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.' });
    }
}