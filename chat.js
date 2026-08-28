module.exports = async (req, res) => {
    // تفعيل CORS للسماح بالطلبات
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ reply: 'Method not allowed' });
    }

    try {
        // قراءة السؤال سواء وصل كـ Object أو String
        let body = req.body;
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch(e){}
        }

        const userPrompt = body?.prompt || body?.userText || body?.message || "";
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            return res.status(500).json({ reply: "خطأ: لم يتم العثور على مفتاح الـ API في إعدادات Vercel." });
        }

        if (!userPrompt) {
            return res.status(400).json({ reply: "لم يتم إرسال أي نص للسؤال." });
        }

        const SYSTEM_INSTRUCTION = `
أنت مساعد ذكي متخصص في السيرة النبوية الشريفة لموقع "سِراج السيرة".
- أجب عن أسئلة المستخدم بأسلوب محترم وواضح ومبسط.
- اعتمد حصرياً على أمهات كتب السيرة (مثل: الرحيق المختوم، السيرة النبوية لابن هشام، زاد المعاد).
- اذكر اسم المصدر/المرجع في نهاية كل إجابة بالشكل: المصدر: [اسم الكتاب].
`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    role: 'user',
                    parts: [{ text: `${SYSTEM_INSTRUCTION}\n\nسؤال المستخدم: ${userPrompt}` }]
                }]
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(500).json({ reply: `خطأ من Gemini: ${data.error.message}` });
        }

        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "عذراً، لم أستطع العثور على إجابة مناسبة.";
        return res.status(200).json({ reply: textResponse });

    } catch (error) {
        return res.status(500).json({ reply: `حدث خطأ بالسيرفر: ${error.message}` });
    }
};