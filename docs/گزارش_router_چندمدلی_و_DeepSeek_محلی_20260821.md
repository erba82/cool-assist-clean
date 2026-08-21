# گزارش اجرای router چندمدلی و DeepSeek محلی

**تاریخ:** ۲۱ اوت ۲۰۲۶

**وضعیت:** آماده برای ورود کلیدهای محلی و تست زندهٔ cloud providerها

**محدوده:** NVIDIA NIM، Gemini، DeepSeek/Ollama، provenance و یادگیری review-gated

## نتیجهٔ اجرایی

router قبلی که تنها بر اساس ترتیب ثابت NVIDIA، Gemini و DeepSeek عمل می‌کرد، به یک router قطعی با سیاست `capability-latency-provenance` تبدیل شد. اولویت providerها همچنان NVIDIA، سپس Gemini، سپس DeepSeek محلی و در پایان DeepSeek remote است. بااین‌حال، انتخاب مدل NVIDIA اکنون بر پایهٔ نوع درخواست صورت می‌گیرد: درخواست‌های high-stakes و project-intake به Ultra، تحلیل‌ها و وظایف مهندسی agentic به Super، و محتوای چندرسانه‌ای به Nano Omni هدایت می‌شوند. latency و failure telemetry صرفاً برای provenance و circuit breaker داخلی استفاده می‌شود؛ هیچ تغییر خودکار در policy، محاسبات، selection تجهیز، قواعد مهندسی یا skill رخ نمی‌دهد.

> یک خروجی مدل، شاهد مهندسی یا مجوز صدور نقشه/انتخاب تجهیز نیست. تمامی نتایج مهندسی همچنان به گیت‌های deterministic، evidence و تأیید انسان وابسته‌اند.

| provider / model | نقش در router | وضعیت این اجرا |
|---|---|---|
| NVIDIA Nemotron 3 Ultra 550B-A55B | reasoning پیشرفته، تحلیل high-stakes و long-context | model ID تأیید شد؛ کلید محلی وارد نشده است |
| NVIDIA Nemotron 3 Super 120B-A12B | وظایف agentic و تحلیل مهندسی متنی | model ID تأیید شد؛ کلید محلی وارد نشده است |
| NVIDIA Nemotron 3 Nano Omni 30B-A3B Reasoning | فایل‌های image/video/audio/PDF و تحلیل چندرسانه‌ای | model ID تأیید شد؛ کلید محلی وارد نشده است |
| Gemini 3.5 Flash | fallback چندرسانه‌ای پایدار | model ID تأیید شد؛ کلید محلی وارد نشده است |
| DeepSeek R1 1.5B از Ollama | fallback خصوصی و loopback-only برای گفت‌وگوی متنی | تست زنده با پاسخ موفق گذشت |

## فایل‌ها و رفتار افزوده‌شده

فایل‌های `backend/.env` و `backend/.env.example` اکنون تمامی مدل‌ها، اولویت router، endpointهای loopback و فیلدهای کلید خالی را دارند. فایل `.env` توسط Git نادیده گرفته می‌شود و هیچ secret غیرخالی در فایل قابل‌ردیابی ثبت نشده است. NVIDIA تنها به یک مقدار `NVIDIA_API_KEY` نیاز دارد و سه profile آن با `NVIDIA_MODEL_ULTRA`، `NVIDIA_MODEL_SUPER` و `NVIDIA_MODEL_NANO_OMNI` پیکربندی شده‌اند.

`AIModelRouter.js` انتخاب capability-aware، fallback شفاف، telemetry، circuit breaker بعد از failureهای پی‌درپی و `buildLearningProposal()` را اجرا می‌کند. `GeminiService.js` اکنون model را از تنظیمات می‌خواند و fallback پنهان به Ollama ندارد؛ بنابراین provenance پاسخ Gemini مخدوش نمی‌شود. مسیر `POST /api/chat/general` فقط از router واحد استفاده می‌کند و نتیجهٔ آن provider، model، profile و تصمیم routing را برمی‌گرداند. مسیر `GET /api/chat/providers` نیز فقط status غیرمحرمانه و telemetry را نمایش می‌دهد.

برای DeepSeek محلی، فایل `backend/local-ai-runtime/Start-LocalDeepSeek.ps1` اضافه شده است. این launcher فقط loopback را می‌پذیرد، process در حال اجرای Ollama را kill نمی‌کند و مدل جدید را خودکار دانلود نمی‌کند. فایل batch ارسالی کاربر اجرا نشد، زیرا `taskkill /F` داشت و می‌توانست workload موجود را بدون بررسی قطع کند.

## شواهد تست

| کنترل | نتیجه |
|---|---|
| unit tests انتخاب Super / Ultra / Nano Omni، Gemini fallback، DeepSeek محلی، circuit breaker و provenance | PASS |
| `npm test` در backend | PASS |
| `npm run test:ai-router-local` با Ollama واقعی | PASS |
| launcher محلی DeepSeek، مدل `deepseek-r1:1.5b`، loopback-only | healthy؛ پاسخ واقعی دریافت شد |
| `POST /api/chat/general` پس از restart backend | PASS؛ provider=`deepseek-local` و model=`deepseek-r1:1.5b` |
| CoolProp sidecar بعد از restart backend | healthy |
| build production frontend | شروع شد اما بعد از ۱۸۰ ثانیه بدون خروجی متوقف شد؛ تغییری در frontend انجام نشده است |

یک proposal واقعی از telemetry router در `backend/runtime/learning-review-proposals.json` ثبت شد. وضعیت آن `proposed` است و `requiresHumanApproval=true` و `promotionBlocked=true` دارد. این ثبت، یک skill یا rule جدید ایجاد نمی‌کند و برای review انسانی باقی می‌ماند.

## اقدام لازم برای تست cloud providerها

کاربر باید تنها در `backend/.env` مقادیر `NVIDIA_API_KEY` و `GEMINI_API_KEY` را وارد کند و فایل را ذخیره کند. سپس backend restart می‌شود و هر provider مستقل با یک درخواست حداقلی تست خواهد شد. نتیجه شامل status، model ID، latency و provider انتخاب‌شده خواهد بود، اما هیچ credential یا prompt خصوصی در log یا Git گزارش نخواهد شد.

## ملاحظات GPU

Ollama و مدل DeepSeek محلی در دسترس و پاسخ‌گو هستند. بااین‌حال، `nvidia-smi` در probe این نشست خطای NVML برگرداند؛ بنابراین استفادهٔ GPU تأیید نشده است. پاسخ‌گویی مدل به‌تنهایی اثبات GPU acceleration نیست. پیش از هر ادعای GPU، driver و NVML باید سالم گزارش شوند.

## منابع

[1] [NVIDIA Nemotron 3 Ultra API reference](https://docs.api.nvidia.com/nim/reference/nvidia-nemotron-3-ultra-550b-a55b)

[2] [NVIDIA Nemotron 3 Super API reference](https://docs.api.nvidia.com/nim/reference/nvidia-nemotron-3-super-120b-a12b)

[3] [NVIDIA Nemotron 3 Nano Omni API guide](https://docs.nvidia.com/nim/vision-language-models/1.7.0/examples/nemotron-3-nano-omni-30b-a3b-reasoning/api.html)

[4] [Google Gemini 3.5 Flash model reference](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash)
