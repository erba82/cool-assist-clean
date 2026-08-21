# گزارش بهینه‌سازی Bundle و Feedback Loop مدل‌ها

**تاریخ:** ۲۱ اوت ۲۰۲۶

## جمع‌بندی

frontend به‌گونه‌ای بازآرایی شد که routeها و tabهای سنگین فقط هنگام نیاز دانلود شوند. این کار بدون حذف BIM، P&ID، دفترچهٔ محاسبات، visualization انرژی یا قابلیت‌های گزارش‌گیری انجام شد. در build نهایی، حجم entrypoint اولیه از **2.79 MiB** به **297 KiB** رسید؛ معادل **90.0%** کاهش محاسبه‌شده در payload آغازین. این اندازه‌گیری مربوط به فایل‌های اعلام‌شده توسط webpack است و جایگزین سنجش شبکه در مرورگر واقعی نیست.

هم‌زمان، telemetry خودکار از یک log صرف به feedback loop محدود و قابل‌ممیزی ارتقا یافت. سیستم اکنون outcomeهای مدل و feedback دارای provenance را در MongoDB aggregate می‌کند و فقط profileهای هم‌provider را در صورت داشتن sample کافی رتبه‌بندی می‌کند. ترتیب providerها، گیت‌های مهندسی، circuit breaker و محدودیت‌های مبردی ثابت مانده‌اند.

| شاخص build | قبل از splitting route/tab | بعد از splitting نهایی | تفسیر |
|---|---:|---:|---|
| Initial entrypoint | 2.79 MiB | 297 KiB | 90.0% کاهش در دانلود اولیه |
| Three.js chunk | 777 KiB | 777 KiB، async | حجم حذف نشده؛ فقط تا بازشدن BIM/P&ID 3D بارگذاری نمی‌شود |
| Shared async vendor | — | 2.4 MiB | dependencyهای pageهای lazy از entrypoint جدا شده‌اند |
| Warning build | 2 warning | 2 warning | هشدار حجم async performance backlog است، نه failure build |

## تغییرات bundle

`App.tsx` تمام pageهای route را با `React.lazy` و یک `Suspense` سطح route بارگذاری می‌کند. Dashboard shell نیز lazy شده است، بنابراین route عمومی اولیه به dependencyهای dashboard وابسته نیست. در `UnifiedChatPage.tsx`، canvasهای P&ID، Calculation Book، Energy Management، chartهای Recharts و canvasهای Three.js پشت fallbackهای موضعی قرار گرفته‌اند. این الگو state داخلی tabهای در حال استفاده را تغییر نمی‌دهد؛ فقط درخواست module را تا زمان بازشدن capability عقب می‌اندازد.

پیکربندی webpack نیز cache group عمومی `vendors` را از `all` به `async` تغییر داده است. در نتیجه dependencyهای pageهایی که lazy هستند دیگر به دلیل cache group اشتراکی وارد entrypoint آغازین نمی‌شوند. source map production همچنان opt-in است و filesystem cache و parallelism محدود نیز حفظ شده‌اند.

> گام بعدی performance باید اندازه‌گیری مرورگر واقعی با Web Vitals و تحلیل waterfall باشد. سپس، در صورت نیاز، lazy import برای PDF/export و تقسیم کوچک‌تر vendor async را می‌توان با data واقعی انجام داد؛ بدون حذف مدل‌های 3D یا قابلیت‌های مهندسی.

## ساختار telemetry خودکار

هر event در collection `agent_learning_events` با schema `cool-assist.agent-learning-event.v1` ذخیره می‌شود. event routing شامل `provider`، `model`، `profile`، `purpose`، `success`، `latencyMs`، شمار failure متوالی و category خطا است. feedback کاربر، در صورت ارسال provenance پاسخ، علاوه بر rating شامل همان provider/model/profile/purpose خواهد بود. prompt، پاسخ کامل، attachment و credential وارد datastore نمی‌شوند.

| لایه | ورودی | aggregate | مصرف |
|---|---|---|---|
| Router outcome | provider/model/profile/purpose، success و latency | attempt count، success rate و average latency | profile ranking درون یک provider |
| User feedback | rating 0–5 به‌همراه provenance پاسخ | feedback count و average rating | نهایتاً 10% score profile |
| Semantic observation | مبرد، cycle template و status گیت | memory مشاهده‌ای | فقط traceability؛ بدون اثر مستقیم بر routing |
| Proposal registry | promotion درخواستی برای rule یا skill | review record | خارج از مسیر وزن‌دهی خودکار |

endpointهای `GET /api/learning/routing-metrics` و `GET /api/learning/stats` داده‌های secret-safe لازم برای بازبینی را عرضه می‌کنند. در runtime زنده، adaptive policy فعال است، حداقل sample برابر 3، پنجره برابر 30 روز و refresh برابر 60 ثانیه است.

## فرمول وزن‌دهی و محدودیت‌ها

برای profileهایی که در purpose یکسان دست‌کم 3 attempt دارند، score به‌صورت زیر محاسبه می‌شود:

> `score = 0.70 × reliability + 0.20 × latencyScore + 0.10 × feedbackScore`

`reliability` از success rate، `latencyScore` از latency میانگین bounded و `feedbackScore` از rating میانگین bounded محاسبه می‌شود. feedback تنها وقتی دست‌کم 3 feedback دارای provenance وجود داشته باشد وارد score می‌شود؛ در غیر این صورت مقدار neutral می‌گیرد. این محدودیت مانع اثرگذاری یک feedback منفرد یا بدون context بر مسیر مدل می‌شود.

adaptive ranking فقط profileهای متعلق به **یک provider** را جابه‌جا می‌کند. بنابراین ممکن است Ultra و Super درون NVIDIA، پس از sample کافی، ترتیبشان عوض شود؛ اما NVIDIA پیش از Gemini، Gemini پیش از Qwen و Qwen پیش از DeepSeek باقی می‌مانند. هیچ telemetry نمی‌تواند قواعد مهندسی، انتخاب تجهیز، property ترمودینامیکی، safety setting، claim استاندارد یا skill نصب‌شده را تغییر دهد.

## تأییدیه‌ها

| کنترل | نتیجه |
|---|---|
| تست واقعی MongoDB write/readback/aggregate feedback | PASS |
| تست adaptive profile ranking و حفظ precedence provider | PASS |
| regression کامل backend | PASS |
| build production frontend پس از splitting نهایی | PASS با 2 warning اندازهٔ async bundle |
| endpoint live metrics | PASS؛ adaptive policy فعال و provider precedence حفظ شده است |
| skill reusable update | در انتظار validation نهایی همین مرحله |
