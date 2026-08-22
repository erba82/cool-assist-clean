# گزارش اصلاح Runtime NVIDIA و Intake طراحی

**تاریخ:** ۲۲ اوت ۲۰۲۶
**دامنه:** مسیر گفت‌وگوی طراحی، انتخاب provider، استخراج اطلاعات پروژه، تأیید طراحی و جلوگیری از خروجی حرارتی صفر
**وضعیت:** اصلاح‌شده، تست‌شده و آمادهٔ review انسانی

## خلاصهٔ مدیریتی

سه ایراد گزارش‌شده در تست واقعی بازتولید و رفع شد. نخست، NVIDIA در تنظیمات فعال بود اما مسیر **Design & Calculations Mode** تنها state machine محلی را اجرا می‌کرد و مسیر چندمدلی فقط در گفت‌وگوی عمومی دیده می‌شد؛ بنابراین نام NVIDIA در لاگ و UI طراحی قابل مشاهده نبود. دوم، intake با defaultهای پنهان، session مشترک و تشخیص ناقص follow-upها باعث تکرار سؤال و ایجاد برداشت نادرست از اطلاعات کاربر می‌شد. سوم، تأیید توصیه‌ها می‌توانست برچسب نمایشی `Ammonia (NH₃)` یا alias `R-717` را به موتور محاسبات بدهد و در حالت دیگری با بار کل صفر، خروجی ظاهراً موفق بسازد.

نسخهٔ جدید، درخواست intake را از طریق router حاکمیتی **NVIDIA → Gemini → Qwen → DeepSeek محلی → DeepSeek remote** پردازش می‌کند، provenance provider را در لاگ و کارت توصیه نمایش می‌دهد، session را به شناسهٔ پروژه متصل می‌سازد و فقط داده‌های صریح کاربر را برای محاسبه می‌پذیرد. ظرفیت ذخیره‌سازی بر حسب تن دیگر به بار برودتی یا ابعاد اتاق تبدیل نمی‌شود. پیش از تولید طراحی، بار برودتی صریح هر اتاق بر حسب kW باید دریافت شود؛ بنابراین خروجی صفر به‌عنوان طراحی معتبر ارائه نخواهد شد.

> **مرز ایمنی:** این اصلاح، قابلیت تولید طرح را به تأییدیهٔ ساخت، انتخاب قطعی تجهیزات، PHA/MOC/PSSR یا انطباق قانونی تبدیل نمی‌کند. محاسبهٔ جزءبه‌جزء بار فقط با ورودی‌های اعلام‌شده و قابل‌ردیابی انجام می‌شود.

## ریشه‌یابی

| مشاهدهٔ کاربر | علت قطعی | اصلاح اعمال‌شده | اثر قابل مشاهده |
|---|---|---|---|
| NVIDIA در لاگ startup نبود و در Design Mode استفاده نمی‌شد | `/api/chat/message` به `DesignOrchestrator.handleMessage` می‌رفت؛ این مسیر از `AIModelRouter.structuredProject` برای intake استفاده نمی‌کرد. لاگ‌های محلی نیز از `AIServiceRouter` قدیمیِ ammonia wizard می‌آمدند. | intake طراحی به `AIModelRouter.structuredProject` متصل شد؛ helperهای legacy به lazy-init منتقل شدند. | لاگ `Design intake provider: nvidia · ...` و Chip مدل NVIDIA در UI ظاهر می‌شود. |
| پاسخ `beef` چند بار به عنوان طراحی جدید دیده می‌شد یا اطلاعات کامل نمی‌شد | context همهٔ پروژه‌ها با `user-session-1` مشترک بود؛ parser و validator defaultهای تهران، مرغ و اتاق‌های ساخته‌شده داشتند. | session اکنون `project-{projectId}` است؛ defaultهای پنهان location/product/room حذف و clarificationهای product، اتاق و kW افزوده شدند. | پرسش اولیهٔ پاریس فقط ورودی واقعاً گمشده را نشان می‌دهد. |
| دمای `-18°C` در recommendation به `0°C` تبدیل شد | `Number(null)` مقدار `0` می‌دهد و null برای دمای تبخیر به اشتباه دمای معتبر تلقی می‌شد. | null پیش از تبدیل عددی تفکیک شد. | دمای صریح کاربر در UI و state بدون تغییر می‌ماند. |
| Confirm با `Unsupported refrigerant: Ammonia (NH₃)` شکست خورد | نمایش‌نام مبرد به جای code canonical به engine داده می‌شد. | canonicalizer برای `R-717 → R717` و همهٔ profileهای پشتیبانی‌شده افزوده شد. | Confirm برای مبرد پیشنهادی با `R717` وارد موتور می‌شود. |
| طراحی با بار کل صفر و P&ID ظاهراً موفق تولید شد | ظرفیت ذخیره‌سازی ۵۰۰۰ تن، بار حرارتی نیست؛ component load نیز ورودی‌های فیزیکی کامل نداشت. | gate صریح `coolingLoadPerRoomKW` پیش از Confirm افزوده شد و UI آن را حتی در completeness ۱۰۰٪ نمایش می‌دهد. | بدون kW/room هیچ طراحی نهایی ایجاد نمی‌شود؛ پس از مقدار اعلامی، همان مقدار به همهٔ اتاق‌ها منتقل می‌شود. |

## رفتار جدید در سناریوی واقعی

سناریوی زیر از مرورگر واقعی اجرا شد:

```text
Design a 5000 ton cold storage with 12 rooms, for beef at -18C, in Paris
Each room is 60m x 40m x 9m
150 kW per room
Confirm
```

| مرحله | نتیجهٔ واقعی | کنترل حاکمیتی |
|---|---|---|
| Intake اولیه | ۸۰٪ کامل؛ تنها ابعاد اتاق‌ها درخواست شد. | محصول beef، موقعیت Paris/France، دمای -18°C و ۱۲ اتاق تشخیص داده شد. |
| پس از ابعاد | کارت توصیه با provenance `nvidia` و مدل موفق NVIDIA نمایش داده شد. | مدل NVIDIA درون ترتیب provider تأیید شد؛ Ultra یا Super تنها به‌عنوان fallback درون‌provider رخ می‌دهد. |
| Confirm بدون kW/room | طراحی نهایی مسدود و فرم «بار طراحی هر اتاق» نمایش داده شد. | ظرفیت ذخیره‌سازی به بار طراحی تبدیل نشد. |
| `150 kW per room` و Confirm | طراحی با **۱۲ اتاق × ۱۵۰ kW = ۱۸۰۰ kW** در UI ایجاد شد. | بار اعلامی کاربر، مبنای sizing است و برچسب `user-specified-per-room-design-load` دریافت می‌کند. |

## فایل‌های اصلی تغییرکرده

| فایل | تغییر |
|---|---|
| `backend/services/AIModelRouter.js` | parse مقاوم JSON ساختاری، حفظ provenance حتی در parse ناموفق، دستور JSON-only برای intake. |
| `backend/core/ai/DesignOrchestrator.js` | NVIDIA-first intake، session state، canonical مبرد، gate بار هر اتاق، materialization دادهٔ صریح اتاق. |
| `backend/core/ai/InputParser.js` | استخراج Paris، ابعاد سه‌بعدی صریح، room count، ظرفیت storage و `kW per room` بدون defaultهای پنهان. |
| `backend/core/ai/IntentClassifier.js` | تشخیص clarificationهای مبرد، اتاق و بار هر اتاق. |
| `backend/core/ai/RequiredInfoValidator.js` | validation معنادار برای مقدارهای null/array/object و نگاشت product/temperature. |
| `backend/services/AmmoniaDesignWizardService.js` | lazy-init برای routerهای محلی legacy؛ حذف سروصدای startup و عدم رقابت ظاهری با router حاکمیتی. |
| `frontend/src/components/UnifiedChatPage.tsx` | session مستقل پروژه و نمایش provenance intake در recommendation. |
| `frontend/src/components/InformationGatheringPanel.tsx` | نمایش gate مهندسی حتی با completeness intake برابر ۱۰۰٪. |
| `backend/core/test_conversational_intake_nvidia_regression.js` | regression برای کل flow پاریس، NVIDIA، دمای منفی، canonical R717 و kW per room. |
| `frontend/e2e_paris_5000t_intake.cjs` | E2E مرورگر برای input، provider، load gate و خروجی طراحی. |

## شواهد آزمون

| آزمون | نتیجه |
|---|---|
| `backend/npm test` | موفق؛ تمام تست‌های governance، چندمبردی، router، MOC و intake جدید عبور کردند. |
| `frontend/npm run build` | موفق؛ فقط دو هشدار قبلی حجم chunkهای async `vendors` و `three` باقی است. |
| E2E مرورگر پاریس | موفق؛ ۸ کنترل: intake ۸۰٪، سؤال فقط ابعاد، provenance NVIDIA، دمای منفی، Paris، مسدودسازی بار صفر، تولید طراحی بعد از kW/room، نمایش ۱۸۰۰ kW. |
| Probe provider زنده | NVIDIA پیکربندی‌شده و اولین provider حاکمیتی است؛ نمونهٔ زنده با NVIDIA Ultra اجرا شد. |

## محدودیت‌های باقی‌مانده و رفتار صحیح سیستم

برای محاسبهٔ component-load قابل استناد، افزون بر بار طراحیِ صریح، ورودی‌های محیطی و بهره‌برداری باید اعلام شوند: مشخصات عایق و ضخامت، دمای بیرون و زمین، ورود محصول و throughput یا batch/cycle، و برنامهٔ درب/نفرات/روشنایی/تجهیزات. اگر این داده‌ها غایب باشند، سیستم نباید transmission، product یا infiltration را به‌صورت حدسی تولید کند. در این وضعیت، بار اعلامی کاربر مبنای sizing است و بخش‌های component-load باید با وضعیت `input-required` برای review باقی بمانند.

هشدارهای `punycode` و `util._extend` در خروجی Node/webpack، deprecation هشدارهای dependency هستند؛ مانع اجرای backend، provider NVIDIA یا E2E نبودند. هشدارهای حجم bundle نیز باقی‌اند اما به مسیر runtime این اصلاح مرتبط نیستند.

## راهنمای تست دستی برای کاربر

پس از refresh سخت frontend، در **Design & Calculations Mode** یک پروژهٔ جدید بسازید و متن زیر را مرحله‌ای وارد کنید:

```text
Design a 5000 ton cold storage with 12 rooms, for beef at -18C, in Paris
Each room is 60m x 40m x 9m
```

در کارت recommendation باید Chip با متن `AI intake: nvidia · ...`، مکان France و دمای `-18°C` دیده شود. با کلیک **Confirm & Calculate**، برنامه باید بار هر اتاق را بخواهد؛ سپس وارد کنید:

```text
150 kW per room
```

پس از توصیهٔ مجدد و Confirm، خروجی طراحی با بار اعلامی کل ۱۸۰۰ kW نمایش داده می‌شود. این سناریو صرفاً آزمون نرم‌افزار است و برای پروژهٔ واقعی باید بار، شرایط محیطی، throughput، نقشه و evidence واقعی جایگزین شوند.

## نتیجه

اشکال‌های گزارش‌شده به یک نقص واحد تقلیل پیدا نمی‌کردند: هم مسیر provider، هم state conversation و هم contract فیزیکی ورودی‌ها نیاز به اصلاح داشتند. نسخهٔ فعلی NVIDIA را در intake طراحی واقعاً استفاده و آشکار می‌کند، اطلاعات صریح کاربر را از defaultهای پنهان جدا می‌سازد، و از هرگونه طراحی با بار حرارتی صفر جلوگیری می‌کند. این امر مسیر برنامه را از یک جریان ظاهراً پاسخ‌گو به یک intake review-gated و قابل‌ممیزی نزدیک‌تر می‌کند.
