# سِراج — دليل النشر على Vercel

## فكرة الحل
المتصفح مايكلمش Anthropic مباشرة (ده كان بيفشل ويكشف أي مفتاح لو حطيته). بدل كده:

```
المتصفح  →  /api/chat (دالة Vercel)  →  api.anthropic.com
```

مفتاح الـ API بيتخزن في إعدادات Vercel السرية (Environment Variables) وميظهرش أبداً في كود الموقع.

---

## الخطوات

### 1. جيب مفتاح API
من https://console.anthropic.com → API Keys → Create Key.
(محتاج رصيد/Billing مفعّل على الحساب عشان الطلبات تشتغل.)

### 2. اعمل حساب Vercel
https://vercel.com — تقدر تسجل بحساب GitHub مباشرة.

### 3. ارفع المشروع
أسهل طريقة: ارفع الفولدر ده على مستودع GitHub جديد، بعدين:
- من Vercel Dashboard → **Add New Project** → اختار المستودع.
- Vercel هيكتشف تلقائياً إن فيه `api/chat.js` ويشغّلها كـ Serverless Function.

أو لو عايز تنشر من التيرمينال مباشرة من غير GitHub:
```bash
npm install -g vercel
cd siraj-vercel
vercel
```
واتبع التعليمات اللي هتظهرلك.

### 4. ضيف المفتاح كـ Environment Variable
من Vercel Dashboard:
**Project → Settings → Environment Variables**
- Name: `ANTHROPIC_API_KEY`
- Value: المفتاح اللي جبته من الخطوة 1
- طبّقه على Production و Preview و Development

اختياري:
- Name: `ALLOWED_ORIGIN`
- Value: الدومين النهائي بتاع موقعك (مثال: `https://siraj.vercel.app`)

بعد إضافة المتغيرات، اعمل **Redeploy** للمشروع عشان تتفعّل.

### 5. جرّب محلياً قبل النشر (اختياري)
```bash
cp .env.example .env.local
# حط المفتاح الحقيقي جوه .env.local
vercel dev
```
وافتح `http://localhost:3000`

---

## ملاحظات أمان مهمة
- **متحطش المفتاح أبداً** جوه `index.html` أو أي كود بيشتغل في المتصفح — لازم يفضل بس جوه `api/chat.js` على السيرفر.
- ملف `.env.local` متضاف بالفعل في `.gitignore` عشان ميترفعش لـ GitHub بالغلط.
- الدالة فيها حد أقصى لعدد الرسائل وطولها لتقليل فرص إساءة الاستخدام أو تضخم الفاتورة.
- لو عايز حماية إضافية، تقدر تضيف Rate Limiting (زي Vercel's Edge Config أو خدمة زي Upstash) لاحقاً.

## بنية المشروع
```
siraj-vercel/
├── index.html       ← الموقع (الفرونت إند)
├── api/
│   └── chat.js       ← الدالة الوسيطة (السيرفر)
├── vercel.json       ← إعدادات النشر
├── package.json
└── .env.example
```
