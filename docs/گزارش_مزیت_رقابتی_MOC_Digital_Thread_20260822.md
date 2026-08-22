# قابلیت جدید Cool-Assist: Digital Thread تغییرات و MOC Gate

**وضعیت:** پیاده‌سازی‌شده، read-only و review-gated.  
**دامنهٔ فعلی:** طراحی صنعتی برودت؛ به‌ویژه مسیر governed-beta تبرید و سناریوی R717.  
**عدم ادعا:** این قابلیت تأییدیهٔ MOC/PSSR، HAZOP/PHA، انطباق قانونی، صلاحیت تجهیز، اجازهٔ ساخت یا اجازهٔ بهره‌برداری نیست.

## این قابلیت چیست؟

قابلیت جدید، یک **موتور تحلیل اثر تغییر طراحی** است که دو نسخهٔ صریح از طراحی را مقایسه می‌کند. اگر کاربر مبرد، شرایط بهره‌برداری، گره/خط P&ID، DN، تجهیز، مدل/برند، Tier تدارکات، BIM port signature، baseline انرژی یا وضعیت compliance را تغییر دهد، موتور به‌صورت deterministic مشخص می‌کند چه artifactهایی متاثرند، شدت تغییر چیست و چه gateهایی باید دوباره توسط انسان بازبینی شوند.

به‌بیان ساده، محصول دیگر فقط «یک P&ID، BIM و BOM که جداگانه تغییر می‌کنند» نیست؛ بین requirement، calculation، P&ID، BIM، procurement، energy و compliance یک **رشتهٔ دیجیتال قابل‌ردیابی** ایجاد می‌شود. این ویژگی، مسئلهٔ واقعی **configuration drift** را هدف می‌گیرد: وضعیتی که یک تغییر کوچک در برند، مدل، مبرد یا سایز خط، در یک tab اعمال می‌شود اما اثر آن در tabهای دیگر یا در فرآیند review دیده نمی‌شود.

> خروجی جدید همیشه `finalIssueAllowed: false` است. هدف موتور، آشکارکردن تغییر و ساخت checklist برای review است، نه تبدیل تصمیم انسانی به automation.

## چرا این قابلیت ارزش رقابتی دارد؟

در سیستم‌های آمونیاک، IIAR بیان می‌کند هر تغییر غیر replacement-in-kind می‌تواند نیازمند ارزیابی MOC باشد تا مخاطرهٔ جدید وارد نشود و سیستم برای بهره‌برداری/نگهداشت ایمن بماند.[1] OSHA نیز P&ID، information equipment/process، operating limits و پیامد انحراف را در Process Safety Information قرار می‌دهد و MOC/PHA را بخشی از کنترل تغییر در فرایندهای مشمول می‌داند.[2]

بازار هم‌اکنون دو دسته ابزار دارد. ابزارهای BIM صنعتی مانند BAF بر مدل سه‌بعدی، coordination و clash detection تمرکز دارند.[3] ابزارهای PSM مانند AutoPSM و ePSM نیز recordkeeping، MOC، inspection، PHA، action item و equipment management را عرضه می‌کنند.[4] [5] مزیت Cool-Assist این نیست که نخستین ابزار BIM یا نخستین ابزار MOC است. **تمایز دقیق آن، قرار دادن یک change-impact engine semantic و version-aware در بطن موتور طراحی تبرید است**؛ یعنی تغییر یک line/equipment/tier قبل از release، به اثرهای P&ID/BIM/BOM/selection و checklist بازبینی تبدیل می‌شود.

| قابلیت بازار | نقطهٔ قوت موجود | gap که قابلیت جدید هدف می‌گیرد |
|---|---|---|
| BIM/coordination | مشاهدهٔ 3D، clash، همکاری و update مدل | اتصال deterministic تغییر requirement/selection به graph، BOM و MOC review artifact به‌صورت design-native. |
| PSM/MOC software | workflow، فرم، امضا، audit، inspection و action tracking | تبدیل خودکار و کنترل‌شدهٔ semantic change در P&ID/BIM/BOM به impact matrix پیش از انتشار طراحی. |
| Digital twin/IoT | monitoring، energy analytics و predictive maintenance | جلوگیری از drift بین «طراحی مصوب» و «تغییر انجام‌شده» پیش از آن‌که telemetry یا عملیات به آن برسد. |

## چگونه در برنامه کار می‌کند؟

کاربر در tab **Compliance** پس از مشاهدهٔ یک طراحی، دکمهٔ `Capture Active Design as Baseline` را می‌زند. این کار تنها snapshot داده‌های صریح طراحی فعال را در session مرورگر ذخیره می‌کند. سپس، مثلاً در Calculation Book، Tier تدارکات را از Premium به Budget تغییر می‌دهد. با بازگشت به Compliance و فشردن `Evaluate Change Impact`، frontend snapshot جدید را به endpoint زیر می‌فرستد:

```text
POST /api/core/change-impact/evaluate
```

backend دو snapshot را با canonicalization ترتیب‌ناوابسته مقایسه می‌کند؛ یعنی جابه‌جایی ترتیب node یا row به‌تنهایی change ایجاد نمی‌کند. تغییرها با severity `medium`، `high` یا `critical`، gateهای متاثر، evidence لازم و MOC checklist گزارش می‌شوند. تغییر صرف Tier، به‌تنهایی medium است؛ تغییر واقعی model/brand/catalogue compatibility یا topology/port/DN شدت بالاتر می‌گیرد. تغییر مبرد، system type یا شرایط SI critical است و physics/selection/graph را همزمان دوباره review-required می‌کند.

| تغییر شناسایی‌شده | سطح اولیه | اثر اعلام‌شده |
|---|---:|---|
| R717 به R744، نوع سیستم یا operating condition SI | Critical | input، physics، graph، selection و delivery؛ property provenance و manufacturer envelope باید بازبینی شوند. |
| تغییر node/connection/service/DN P&ID یا BIM port | High | P&ID/BIM port continuity، route/support/clearance و PSSR review باید توسط انسان بررسی شوند. |
| تغییر model/brand/catalogue compatibility تجهیز | High | manufacturer evidence، operating envelope، procurement و BIM/P&ID label باید بازبینی شوند. |
| تغییر فقط Tier تدارکات | Medium | procurement، labelهای BIM/P&ID و دلیل compatibility باید بررسی شود؛ severity به‌تنهایی به‌اشتباه High نمی‌شود. |
| تغییر baseline/strategy انرژی | Medium | M&V boundary و baseline باید بازبینی شوند. |

## شواهد اجرای واقعی

سناریوی واقعی R717 دبی با بار 500 kW، تبخیر `−30°C` و تقطیر `+35°C` پس از اضافه‌شدن قابلیت اجرا شد. E2E نهایی **13 check** را گذراند: طراحی، همهٔ tabهای اصلی، tier switching، P&ID، BIM، Energy، Compliance، General Chat و دو check جدید `changeImpactMocRendered` و `changeImpactProcurementTierDetected`.[6]

در آزمون live API، تغییر فقط `premium → budget` برای Tier و row انتخابی، خروجی `review-required` با severity کلی `medium` و `finalIssueAllowed: false` ایجاد کرد. gateهای متاثر `procurement`، `bim` و `delivery` بودند و هیچ approval خودکاری تولید نشد.[7] تصویر واقعی پنل نیز ردیف‌های تغییر Tier، برچسب medium و checklist بازبینی انسانی را نشان می‌دهد.[8]

| آزمون | نتیجه |
|---|---|
| Unit test موتور MOC | گذر از no-change، independence از ترتیب snapshot، تغییر مبرد critical، تغییر DN/P&ID، تغییر tier/model، snapshot ناقص و HVAC blocked. |
| API زنده | خروجی review-required، severity medium برای tier-only، و final issue ممنوع. |
| Backend regression | `npm test` موفق؛ test جدید بخشی از governance suite شد. |
| Frontend build | `npm run build` موفق؛ فقط دو هشدار اندازهٔ bundle موجود پروژه (`vendors` و `three`) باقی ماند. |
| Browser E2E | 13/13 check موفق؛ تصویر MOC واقعی ایجاد شد. |

## محدودیت‌های شفاف و نقشهٔ تکامل

نسخهٔ فعلی intentionally محافظه‌کار است. baseline در `sessionStorage` مرورگر نگه‌داری می‌شود؛ هنوز repository نسخهٔ سروری، e-signature، workflow چندنفره، retention policy یا اتصال production به ePSM/CMMS ندارد. این محدودیت باعث می‌شود قابلیت را نباید جایگزین PSM system-of-record دانست.

همچنین موتور فقط داده‌های صریح موجود در snapshot را مقایسه می‌کند. دادهٔ گمشده را محاسبه یا حدس نمی‌زند؛ unstructured PDF/image P&ID را به‌تنهایی به evidence مهندسی تبدیل نمی‌کند؛ HAZOP/PHA انجام نمی‌دهد؛ و تشخیص قانونی replacement-in-kind را به کارفرما/تیم process-safety واگذار می‌کند. HVAC و Electrical نیز همچنان blocked هستند و MOC engine نباید برای آن‌ها به‌عنوان موتور طراحی اجرایی تبلیغ شود.

گام‌های بعدیِ باارزش عبارت‌اند از ایجاد repository نسخه و approval record در backend، امکان MCP/API اختیاری برای ePSM/CMMS با تأیید کاربر، نگاشت semantic P&ID version به BIM instance revisions، ثبت source/revision سازنده در snapshot، و تولید بستهٔ MOC/PSSR draft قابل دانلود. این توسعه‌ها باید با مالکیت داده، retention، نقش‌های دسترسی و بازبینی مسئول process-safety انجام شوند.

## فایل‌ها و اتصال‌ها

| فایل | نقش |
|---|---|
| `backend/core/engineering/ChangeImpactMocGate.js` | canonicalization، hash، diff deterministic، impact matrix، checklist و final-issue block. |
| `backend/core/test_change_impact_moc_gate.js` | regression contract برای سناریوهای معتبر، مرزی و blocked. |
| `backend/routes/coreDesign.js` | endpoint read-only `POST /api/core/change-impact/evaluate`. |
| `frontend/src/components/ChangeImpactMocPanel.tsx` | capture baseline، مقایسه و نمایش review checklist در UI. |
| `frontend/src/components/UnifiedChatPage.tsx` | mount پنل در Compliance با `activeDesign` واقعی. |
| `frontend/e2e_dubai_r717_scenario.cjs` | دو assertion جدید MOC و تصویر واقعی `08_change_impact_moc_tab.png`. |

## مراجع

[1]: https://www.iiar.org/IIAR/IIAR/Events/Event_Display.aspx?EventKey=SEP2024 "IIAR — Management of Change for Ammonia Refrigeration Systems"
[2]: https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.119 "OSHA — 29 CFR 1910.119 Process Safety Management"
[3]: https://baf.ie/products-solutions/bim/ "BAF Industrial Refrigeration — BIM"
[4]: https://ammonia-training.com/autopsm/ "ARTS — AutoPSM"
[5]: https://epsm.r717.net/ "ePSM — Process Safety Management Software"
[6]: ../frontend/e2e-artifacts/dubai_r717_e2e_result.json "نتیجهٔ E2E نهایی 13 check"
[7]: ./moc_live_api_tier_change_20260822.json "خروجی API زندهٔ tier-only"
[8]: ../frontend/e2e-artifacts/08_change_impact_moc_tab.png "اسکرین‌شات واقعی پنل MOC"
