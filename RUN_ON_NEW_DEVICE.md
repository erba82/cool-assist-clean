# راهنمای راه‌اندازی Cool-Assist روی دستگاه جدید

این مخزن شامل برنامهٔ طراحی و مستندسازی برودت صنعتی است. خروجی‌های محاسباتی، انتخاب تجهیزات، P&ID، مدل BIM، BOM و پیشنهادهای یادگیری باید همواره با دادهٔ ورودی قابل‌ردیابی، کاتالوگ سازنده یا تأیید مهندس مسئول استفاده شوند. برنامه به‌طور عمدی برای خواص ترمودینامیکی و قواعد ایمنیِ تأییدنشده، مجوز صدور مقدار یا اعمال تغییر خودکار ندارد.

## پیش‌نیازها

| مورد | حداقل نسخه / توضیح |
|---|---|
| سیستم‌عامل | Windows 10/11، Linux یا macOS |
| Node.js | 22.x LTS یا نسخهٔ سازگار با lockfile |
| npm | همراه Node.js |
| Git | برای دریافت نسخهٔ کنترل‌شدهٔ مخزن |
| مرورگر | Chromium، Chrome یا Edge جدید |
| Python | 3.12+، فقط در صورت فعال‌سازی sidecar محلی CoolProp |

ابتدا مخزن را دریافت کنید، سپس در هر دو پوشهٔ `backend` و `frontend` وابستگی‌ها را دقیقاً از روی lockfile نصب نمایید. نصب `node_modules` از دستگاه دیگر توصیه نمی‌شود.

```powershell
# از ریشهٔ مخزن
cd backend
npm ci
Copy-Item .env.example .env
# سپس مقادیر کلیدهای API مورد نیاز را فقط در backend/.env وارد کنید.

cd ..\frontend
npm ci
```

## پیکربندی مدل‌های هوش مصنوعی

فایل `backend/.env.example` را با نام `backend/.env` کپی کنید. ترتیب تلاش مدل‌ها **NVIDIA NIM → Gemini → DeepSeek** است. هر ارائه‌دهنده‌ای که کلید آن خالی باشد رد می‌شود؛ بنابراین برای کار پایهٔ محلی وجود کلید الزامی نیست، اما قابلیت پاسخ‌گویی هوش مصنوعی از ارائه‌دهندهٔ بعدی استفاده خواهد کرد.

| اولویت | متغیرهای ضروری | پیش‌فرض مدل |
|---|---|---|
| 1. NVIDIA NIM | `NVIDIA_API_KEY` | `meta/llama-3.3-70b-instruct` |
| 2. Gemini | `GEMINI_API_KEY` یا `GOOGLE_API_KEY` | `gemini-1.5-flash` |
| 3. DeepSeek | `DEEPSEEK_API_KEY` | `deepseek-v4-pro` |

> هیچ کلید API، فایل `.env`، فایل پیوست کاربر یا خروجی runtime را commit نکنید. این موارد در `.gitignore` محافظت شده‌اند.

## sidecar محلی اختیاری برای خواص CoolProp

برنامه به‌صورت پیش‌فرض بدون provider اجرا می‌شود و هیچ درخواست شبکه‌ای برای خواص ترمودینامیکی نمی‌فرستد. برای محاسبات مقدماتی property-based هر هشت مبرد، ابتدا sidecar loopback را در یک ترمینال جدا اجرا کنید. این اسکریپت یک virtual environment محلی ایجاد می‌کند و `CoolProp==8.0.0` را با نسخهٔ pinned نصب می‌کند.

```powershell
# ترمینال اختیاری provider؛ از ریشهٔ پروژه
powershell -NoProfile -ExecutionPolicy Bypass -File backend\thermophysical-sidecar\start-sidecar.ps1 -Port 5011 -ReferenceState IIR
```

سپس، فقط بعد از مشاهدهٔ health موفق sidecar، این متغیرها را در `backend/.env` قرار دهید و backend را restart کنید:

```dotenv
THERMOPHYSICAL_PROVIDER_MODE=coolprop-sidecar
THERMOPHYSICAL_PROVIDER_URL=http://127.0.0.1:5011
THERMOPHYSICAL_PROVIDER_ALLOW_OUTBOUND=true
THERMOPHYSICAL_PROVIDER_REFERENCE_STATE=IIR
THERMOPHYSICAL_PROVIDER_TIMEOUT_MS=3000
```

این مجوز صرفاً برای درخواست backend به loopback است؛ URL غیرمحلی توسط adapter رد می‌شود و sidecar اینترنت‌گردی نمی‌کند. برای R744 باید فشار high-side، فشار flash-gas و دمای خروجی gas cooler صریحاً وارد شوند؛ setpoint کنترل به‌طور خودکار ساخته نمی‌شود. جزئیات قرارداد در `backend/thermophysical-sidecar/README.md` موجود است.

## اجرای محلی

دو ترمینال باز کنید. در ترمینال اول backend را اجرا کنید و در ترمینال دوم frontend را. backend به‌طور پیش‌فرض روی پورت `5000` و frontend روی پورت `3001` اجرا می‌شود؛ frontend درخواست‌های `/api` را به backend پراکسی می‌کند.

```powershell
# ترمینال 1
cd backend
npm start

# ترمینال 2
cd frontend
npm start
```

سپس به آدرس `http://localhost:3001/chat` بروید.

## تست و build پیش از تحویل

تست‌های backend اکنون قراردادهای حاکمیتی و مهندسی را شامل می‌شوند: ورودی محاسبات، قراردادهای P&ID و پورت، P&ID تمام مبردها، CO₂، capability و readiness چندمبردی، منع جایگزینی کاتالوگ بین‌مبردی، روتر AI، یادگیری کنترل‌شده، فایل‌های چندوجهی، MCP، قواعد ارتفاع آمونیاک، انرژی و ارکستراسیون طراحی.

```powershell
# ترمینال 1: backend
cd backend
npm test

# فقط وقتی sidecar محلی در حال اجرا و در backend/.env فعال است
npm run test:coolprop-sidecar

# ترمینال 2: frontend
cd frontend
npm test
npm run build
```

برای اجرای سناریوی E2E دبی با R717، ابتدا هر دو سرور را اجرا کنید و سپس دستور زیر را در پوشهٔ `frontend` بزنید. اسکرین‌شات‌ها به‌صورت پایدار در `frontend/e2e-artifacts/` نوشته می‌شوند، مستقل از محل اجرای دستور.

```powershell
cd frontend
npm run test:e2e:strict
```

## محدودهٔ قابلیت و گیت‌های ایمنی

| حوزه | وضعیت عملیاتی |
|---|---|
| مبردها | R717، R744، R290، R32، R404A، R410A، R134a و R22 با template معنایی جداگانه |
| خواص مبرد | sidecar محلی CoolProp برای هر ۸ مبرد با provenance، SI و review-required قابل‌فعال‌سازی است؛ مسیر پیش‌فرض خاموش است |
| R744 | P&ID semantic booster و محاسبهٔ مقدماتی transcritical booster با فشارهای صریح پشتیبانی می‌شود؛ optimization و manufacturer-map هنوز گیت بازبینی دارند |
| انتخاب نهایی تجهیزات | operating point، performance map سازنده، envelope، revision و تأیید مهندس لازم است؛ برنامه مقدار یا مدل جعلی تولید نمی‌کند |
| یادگیری | feedback و findings به proposal بازبینی‌شونده تبدیل می‌شوند؛ هیچ قاعده یا skill به‌صورت خودکار فعال نمی‌شود |
| MCP | اتصال ابتدا draft است و تا تأیید مدیر هیچ ارتباط شبکه‌ای برقرار نمی‌شود؛ localhost نیز مسدود است |
| فایل‌ها | PDF، DOCX، XLSX، DXF، تصویر، متن و رسانه قابل تحلیل‌اند، اما خروجی مهندسی آن‌ها نیازمند بازبینی انسانی است |
| فولدر `ammonia-bim-engine/` | فولدر ایدهٔ کاربر است، خارج از کنترل نسخه نگه داشته شده و هنوز در محصول ادغام نشده است |

## پاک‌سازی و ساخت بستهٔ قابل انتقال

فولدرهای `node_modules`، `dist`، `e2e-artifacts`، `backend/runtime` و backupهای موقت نباید همراه سورس فشرده شوند. برای انتقال، فقط سورس کنترل‌شده، فایل‌های lock و این راهنما را منتقل کنید؛ سپس روی دستگاه مقصد `npm ci` را اجرا نمایید.

> قبل از استفاده از خروجی برای خرید، اجرا، ایمنی یا اخذ تأییدیه، همهٔ نتایج محاسباتی، mapping تجهیزات، سایزینگ، استانداردهای محل نصب و اطلاعات قیمت/تأمین را توسط مهندس دارای صلاحیت و اسناد سازنده کنترل کنید.
