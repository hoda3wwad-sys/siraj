// api/chat.js
// دالة Vercel Serverless تعمل كوسيط آمن بين الموقع و Anthropic API.
// مفتاح الـ API بيفضل مخفي هنا في السيرفر، وميظهرش أبداً في كود المتصفح.

const SYSTEM_PROMPT = `أنت "سِراج"، مساعد ذكاء اصطناعي متخصص حصرياً في السيرة النبوية لرسول الله محمد ﷺ (المولد، البعثة، الدعوة في مكة، الهجرة، غزواته ﷺ، فتح مكة، حجة الوداع، وأخلاقه وشمائله).
قواعد صارمة يجب الالتزام بها:
- أجب دائماً باللغة العربية الفصحى، بأسلوب واضح ومحترم ومختصر (فقرة إلى فقرتين كحد أقصى ما لم يُطلب التفصيل).
- استند فقط إلى المصادر الموثوقة المعتمدة في السيرة: السيرة النبوية لابن هشام، الرحيق المختوم، زاد المعاد، تاريخ الطبري، صحيح البخاري ومسلم وغيرها من كتب الحديث والسيرة المعتبرة.
- اذكر دائماً في نهاية إجابتك اسم المصدر أو المصادر التي استندت إليها بصيغة: "المصدر: ...".
- إذا كانت هناك اختلافات بين الروايات التاريخية في تفصيلة معينة، أشر إلى ذلك بأمانة بدل الجزم.
- عند ذكر اسم النبي ﷺ استخدم دائماً الصلاة عليه (ﷺ).
- لا تصف أو تتخيل شكل النبي ﷺ أو الصحابة الجسدي إطلاقاً، التزاماً بالأدب الشرعي.
- إذا سُئلت عن موضوع خارج السيرة النبوية تماماً، اعتذر بلطف ووجّه السائل للعودة لسؤال متعلق بالسيرة.
- لا تخترع معلومات أو تواريخ؛ إن لم تكن متأكداً، صرّح بذلك.`;

// أقصى عدد رسائل نرسلها من تاريخ المحادثة (لتقليل التكلفة ومنع إساءة الاستخدام)
const MAX_HISTORY_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 2000;

module.exports = async function handler(req, res) {
  // السماح بطلبات POST فقط
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS: اسمح فقط لدومين موقعك الفعلي بعد النشر (غيّر القيمة دي)
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'الخادم غير مهيأ بمفتاح API' });
  }

  try {
    const { messages } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'لا توجد رسائل صالحة' });
    }

    // تحقّق وتنظيف بسيط لمنع إرسال بيانات ضخمة أو غير متوقعة
    const cleanMessages = messages
      .slice(-MAX_HISTORY_MESSAGES)
      .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map(m => ({
        role: m.role,
        content: m.content.slice(0, MAX_MESSAGE_CHARS)
      }));

    if (cleanMessages.length === 0) {
      return res.status(400).json({ error: 'الرسائل غير صالحة' });
    }

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: cleanMessages
      })
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error('Anthropic API error:', anthropicRes.status, errText);
      return res.status(502).json({ error: 'تعذّر الوصول لخدمة الذكاء الاصطناعي' });
    }

    const data = await anthropicRes.json();
    const textBlock = (data.content || []).find(b => b.type === 'text');
    const reply = textBlock ? textBlock.text : 'تعذّرت صياغة إجابة، حاول بسؤال آخر.';

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
};
