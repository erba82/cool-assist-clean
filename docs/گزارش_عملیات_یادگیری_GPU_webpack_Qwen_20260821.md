# گزارش عملیات یادگیری خودکار، GPU، webpack و Qwen

**تاریخ:** ۲۱ اوت ۲۰۲۶

## نتیجهٔ اجرایی

سامانهٔ یادگیری agent از ثبت صرفاً proposal برای مشاهدات عادی خارج شده و اکنون telemetry مدل‌ها، feedback کاربر و semantic observationهای طراحی را به‌صورت خودکار در MongoDB محلی ثبت می‌کند. این تغییر، دادهٔ عملیاتی را بدون انتظار برای review ذخیره می‌کند؛ بااین‌حال، promotion هر داده به قاعدهٔ مهندسی، انتخاب تجهیز، property ترمودینامیکی، safety setting، claim استاندارد یا skill نصب‌شده همچنان عمداً مسدود است. این مرز از ایجاد تغییر خودکار و غیرقابل‌استناد در خروجی‌های تبرید جلوگیری می‌کند.

build production frontend نیز با حذف سه rule تکراری JavaScript، غیرفعال‌سازی پیش‌فرض source map سنگین production، filesystem cache، parallelism محدود و split chunkهای پایدار از حالت توقف طولانی خارج شد و با موفقیت کامل شد. مشکل GPU حل‌شدنی است اما در این نشست به سطح دسترسی administrator نیاز دارد؛ هیچ تغییر driver یا restart اجباری سیستم بدون اختیار کاربر اجرا نشد.

| حوزه | وضعیت تأییدشده | نتیجه |
|---|---|---|
| MongoDB learning | MongoDB محلی روی پورت 27017 فعال؛ datastore به‌صورت `ready` | PASS؛ eventهای router در collection خودکار ثبت شدند |
| یادگیری خودکار | telemetry، feedback و semantic observationها ingestion خودکار دارند | PASS؛ `automaticEngineeringChange=false` و `promotionBlocked=true` |
| backend و CoolProp | backend restart شد؛ sidecar healthy ماند | PASS |
| webpack production | پس از بهینه‌سازی، `npm run build` تمام شد | PASS؛ فقط 2 warning اندازهٔ bundle باقی مانده است |
| NVIDIA GPU / NVML | GTX 960M در Device Manager وضعیت OK و driver 582.66 دارد؛ `nvidia-smi` هنوز `Failed to initialize NVML: Unknown Error` می‌دهد | نیازمند اقدام administrator |
| DeepSeek محلی | Ollama loopback و `deepseek-r1:1.5b` پاسخ‌گو است | PASS؛ GPU acceleration تأیید نشده است |
| Qwen از TokenRouter | مدل واقعی از `/v1/models` با alias `qwen/qwen3.8-max` کشف و در router ثبت شد | اتصال و auth معتبر؛ completion به‌دلیل credit limit صفر، HTTP 403 گرفت |

## معماری یادگیری خودکار

فایل `AgentLearningStore.js` یک collection اختصاصی MongoDB با schema `cool-assist.agent-learning-event.v1` ایجاد می‌کند. هر event شامل شناسه، منبع، زمان، نوع observation، telemetry محدودشدهٔ provider/model/profile، success/failure و latency است. در هنگام قطع موقت MongoDB، event در outbox محلی نوشته می‌شود و پس از اتصال دوباره flush می‌گردد. این طراحی باعث از دست نرفتن observationها می‌شود، بدون آنکه prompt، پاسخ کامل، attachment یا secret وارد datastore شوند.

endpointهای `GET /api/learning/events` و `GET /api/learning/stats` وضعیت و aggregateهای secret-safe را ارائه می‌دهند. `POST /api/learning/feedback` اکنون feedback را فوراً به observational memory می‌نویسد. proposalهای پیشین حفظ شده‌اند، اما فقط برای changeهای production-impacting به کار می‌روند. تست واقعی MongoDB write/readback/stats و rejection scope ممنوعه با موفقیت گذشت.

## وضعیت Qwen و ترتیب router

TokenRouter با Bearer authentication و endpoint سازگار با chat completions افزوده شده است. فهرست modelهای authenticated، alias دقیق `qwen/qwen3.8-max` را بازگرداند؛ بنابراین نام بازاری حدس‌زده‌شده در کد استفاده نشده است. Qwen فعلاً فقط برای text ثبت شده، چون هنوز یک تست واقعی attachment برای این provider اجرا نشده است. ترتیب runtime اکنون چنین است:

| ترتیب | provider | نقش فعلی |
|---:|---|---|
| 1 | NVIDIA Ultra / Super / Nano Omni | profile بر اساس capability و سپس fallback داخلی NVIDIA |
| 2 | Gemini 3.5 Flash | fallback چندرسانه‌ای پایدار |
| 3 | TokenRouter Qwen 3.8 Max | fallback reasoning متنی |
| 4 | DeepSeek R1 محلی از Ollama | fallback خصوصی loopback-only |
| 5 | DeepSeek remote | فقط در صورت پیکربندی صریح |

probe مستقیم TokenRouter نشان داد key پذیرفته شده و alias مدل معتبر است، اما حساب TokenRouter در لحظهٔ تست credit limit باقی‌ماندهٔ صفر داشت. بنابراین درخواست completion HTTP 403 گرفت. router این failure را evidence ثبت می‌کند و به provider بعدی fallback می‌کند؛ اعتبار key یا alias را نامعتبر اعلام نمی‌کند. پس از افزایش یا فعال‌شدن credit، تنها اجرای مجدد probe لازم است.

## تحلیل GPU و اقدام لازم

Device Manager برای NVIDIA GeForce GTX 960M مشکل صفر و وضعیت OK نشان می‌دهد. binary و NVML library نسخهٔ 582.66 دارند و NVIDIA Display Container نیز running است. با وجود این، NVML خطای unknown برمی‌گرداند. نشست فعلی administrator نیست؛ تلاش برای restart سرویس NVIDIA نیز به علت permission denied متوقف شد. این وضعیت معمولاً با reload یا clean reinstall driver در نشست administrator و reboot قابل بررسی است، ولی در این اجرا ادعای GPU acceleration نشده است.

> اقدام کاربر: یک PowerShell را با **Run as administrator** باز کنید، درایور رسمی NVIDIA لپ‌تاپ را با گزینهٔ **Clean installation** نصب یا repair کنید، سیستم را reboot کنید، سپس `nvidia-smi -L` را اجرا کنید. تنها پس از نمایش GPU در این دستور می‌توان Ollama را GPU-accelerated اعلام کرد.

## وضعیت webpack و performance backlog

build production اکنون تمام می‌شود. هشدارهای باقی‌مانده failure نیستند، اما نشان می‌دهند bundleها هنوز بزرگ‌اند: vendor حدود 2.14 MiB، Three.js حدود 777 KiB و main حدود 524 KiB هستند. مرحلهٔ بعدی performance باید lazy import برای BIM viewer، P&ID canvas، PDF/export و کتابخانه‌های visualization باشد؛ این کار جدا از رفع build انجام می‌شود تا خروجی فعلی بدون regression باقی بماند.

## تأییدیه‌ها

| کنترل | نتیجه |
|---|---|
| `npm test` backend با test MongoDB و Qwen router | PASS |
| تست datastore واقعی MongoDB | PASS |
| syntax router و APIها | PASS |
| build production frontend | PASS با 2 warning size |
| status live backend | Qwen configured، MongoDB ready، CoolProp healthy |
| skill reusable | `governed-multimodel-agent-runtime-operations` validated |

## منابع

[1] [Qwen3.8-Max announcement and capability overview](https://qwen.ai/blog?id=qwen3.8)

[2] [Qwen API platform and OpenAI-compatible chat-completions overview](https://qwen.ai/apiplatform)
