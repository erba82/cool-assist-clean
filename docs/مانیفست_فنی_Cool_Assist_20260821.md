# مانیفست فنی Cool-Assist

**نسخه:** ۱.۰
**تاریخ:** ۲۱ اوت ۲۰۲۶
**مقصود:** تبدیل Cool-Assist از یک prototype جذاب به یک بستر مهندسی چندرشته‌ایِ قابل‌اعتماد برای تبرید صنعتی، سپس HVAC و Electrical؛ بدون ادعای ساختگی، بدون وابستگی کورکورانه به AI و بدون حذف قابلیت‌های موجود.

## ۱. تعریف برتری

برتری ما «رندر زیباتر» یا «چت‌بات عمومی‌تر» نیست. برتری وقتی واقعی است که یک مهندس بتواند از یک brief یا مدارک پروژه به یک **رشتهٔ تصمیم قابل‌ردیابی** برسد: ورودی‌های منبع‌دار، فرض‌های صریح، محاسبات deterministic، انتخاب تجهیزات با evidence سازنده، P&ID معنایی، مدل سه‌بعدی متصل به پورت‌ها، BOM منبع‌دار، ریسک‌های ایمنی، و خروجی review-ready.

> Cool-Assist باید سریع‌تر از ابزارهای سنتی، شفاف‌تر از ابزارهای AI عمومی و محتاط‌تر از هر سیستمی باشد که عدد، تجهیز، قیمت یا compliance را بدون دلیل قابل‌بازرسی تولید می‌کند.

رقبا در لایه‌های منفرد قوی‌اند. ابزارهای سازنده مانند BITZER، GEA، Danfoss و Copeland دادهٔ محصول، envelope، مدارک و workflow انتخاب خود را دارند؛ Autodesk در CAD/P&ID/BIM و Augmenta در اتوماسیون هندسی MEP متمرکز است. [1] [2] [3] [4] [5] مزیت قابل‌دفاع Cool-Assist باید **orchestration میان لایه‌ها و میان سازندگان** باشد، نه ادعای برتری بی‌پشتوانه در تمام این لایه‌ها.

## ۲. پنج وعدهٔ غیرقابل‌مذاکره

| وعده | معنای اجرایی | رفتار ممنوع |
|---|---|---|
| حقیقت پیش از ظاهر | هر عدد و انتخاب به source، version، واحد، validity envelope و review state متصل است | نمایش COP، ظرفیت، DN، قیمت یا استاندارد به‌صورت قطعی در نبود evidence |
| تفکیک deterministic از AI | AI برای فهم درخواست، استخراج، پیشنهاد و توضیح استفاده می‌شود؛ engine deterministic برای محاسبه، constraint و تصمیم | سپردن selection، safety یا geometry critical به مدل زبانی بدون validator |
| semantic graph واحد | Project، discipline، system، equipment، port، circuit، pipe/duct/cable، calculation و document در یک قرارداد canonical نگه‌داری می‌شوند | اتصال مستقیم UI به دادهٔ محاسبه یا تبدیل پراکندهٔ نام‌ها بین 2D و 3D |
| سازنده‌محور و vendor-neutral | مدل سازنده فقط با compatibility declaration، source، revision و envelope انتخاب می‌شود؛ در نبود آن semantic role حفظ می‌شود | جایگزینی مدل آمونیاک به DX/CO₂ یا product substitution بدون declaration |
| review-by-design | خروجی هر مرحله وضعیت `preliminary`، `review-required`، `verified` یا `blocked` دارد و final issue فقط با گیت‌های مشخص ممکن است | تبدیل هشدار UI به ادعای compliance یا issue-for-construction خودکار |

## ۳. موتورهایی که باید بی‌نقص شوند

### ۳.۱ موتور فهم مهندسی

این موتور باید ورودی متن، PDF، DXF، تصویر، spreadsheet و دستور اصلاح را به **Engineering Intent** ساخت‌یافته تبدیل کند. خروجی آن باید discipline، system type، refrigerant/medium، operating point، scope، location، codes، evidence، confidence و missing inputs را داشته باشد. مدل AI حق تولید مقدار محاسباتی یا product model قطعی ندارد؛ فقط می‌تواند intent و evidence candidate بسازد. هر extraction باید به file hash، صفحه/ناحیه و confidence متصل شود.

### ۳.۲ موتور physics و calculation

تمام رشته‌ها باید provider-first باشند: خواص مبرد، weather، electrical fault/current data، psychrometrics، performance maps و standards metadata منبع‌دار باشند. محاسبه باید SI-internal، finite-guarded، unit-aware، testable و نسخه‌دار باشد. هر result باید اعلام کند که از provider، formula، table یا user-supplied value آمده است.

برای تبرید، CoolProp sidecar مسیر properties را فراهم می‌کند، اما selection final به performance map و envelope سازنده نیاز دارد. برای R744، booster preliminaries باید از simple-cycle جدا بمانند و high-side controls به‌صورت صریح وارد شوند. برای HVAC و Electrical نیز همین اصل اعمال می‌شود: بدون psychrometric/weather data یا protection/co-ordination study معتبر، خروجی فقط preliminary است.

### ۳.۳ موتور semantic P&ID/BIM/CAD

P&ID نباید تصویر باشد؛ باید graph حاوی node type، fluid/service، port، direction، DN/rating، isolation/relief/instrumentation intent و source selection باشد. BIM نیز نباید یک scene صرف باشد؛ هر instance باید origin، bounds، port frame، material، clearance، support rule، family revision و پیوند P&ID را داشته باشد.

هدف آینده، export به IFC و connectorهای Revit/Plant 3D است، نه تقلید ظاهری از CAD. Autodesk Plant 3D در P&ID، equipment/piping 3D و isometric/orthographic drawings معیار delivery محسوب می‌شود. [4] Cool-Assist باید ابتدا semantic graph و drawing-sheet قابل‌اعتماد را کامل کند و سپس interoperability را بسازد.

### ۳.۴ موتور equipment intelligence

این موتور باید profile/service را به package candidate تبدیل کند، سپس vendor evidence را کنترل کند. به جای یک JSON catalogue خام، هر record باید manufacturer، model، revision، medium compatibility، operating envelope، capacity map، GA, ports, BIM family, documents, distributor territory و expiry داشته باشد. Resolver باید بتواند نتیجه را به چهار دسته روشن تقسیم کند: `verified-candidate`، `candidate-with-review`، `semantic-role-only` و `blocked`.

### ۳.۵ موتور safety، compliance و change governance

Compliance page نباید checklist تزئینی باشد. باید از source-licensed rule metadata، jurisdiction، applicability، evidence requirement، reviewer، decision، date و change history تشکیل شود. استانداردها و دستورالعمل‌ها باید با حقوق دسترسی و مجوز مناسب استفاده شوند؛ ASHRAE نیز استفاده از محتوای انتشارات خود در AI را محدود کرده است. [6] در آمونیاک، PHA، documentation، revalidation، piping/valves، vessels، controls، startup/shutdown و human factors موضوعات واقعی فرآیند ایمنی هستند، نه یک badge سبز در UI. [7]

## ۴. قرارداد مشترک چندرشته‌ای

تبرید، HVAC و Electrical باید سه implementation برای یک قرارداد مشترک باشند، نه سه برنامهٔ جدا. canonical object hierarchy به این شکل است:

```text
Project
  └─ Discipline (refrigeration | hvac | electrical)
       └─ System
            └─ Circuit / Network
                 └─ Asset / Equipment
                      └─ Port / Terminal
                           └─ Connection (pipe | duct | cable | control)
```

هر Discipline یک engine مستقل، validator مستقل، catalogue resolver مستقل و rule pack مستقل دارد؛ اما چهار قرارداد را مشترک نگه می‌دارد: `EngineeringIntent`، `EvidenceRecord`، `DesignGraph` و `ReviewGate`. UI فقط این قراردادها را render می‌کند و engineها به React/Three.js وابسته نیستند.

| قرارداد | فیلدهای اجباری | وظیفه |
|---|---|---|
| EngineeringIntent | discipline، scope، input evidence، operating conditions، location، units، missing inputs | جلوگیری از شروع محاسبه با brief مبهم |
| EvidenceRecord | source، revision، hash/URL، effective date، license state، confidence، reviewer | traceability داده و جلوگیری از value fabrication |
| DesignGraph | semantic nodes، ports، connections، service، dimensions، status | source واحد P&ID، BIM، BOM و reports |
| ReviewGate | status، blockers، required evidence، reviewer role، timestamp | منع issue/selection نهایی در مسیر ناقص |

## ۵. مسیر توسعهٔ رشته‌ها

| مرحله | تبرید صنعتی | HVAC | Electrical | گیت خروج |
|---|---|---|---|---|
| Foundation | پروفایل ۸ مبرد، properties sidecar، semantic P&ID، catalogue gates | intent schema، psychrometric provider contract، space/load schema | intent schema، load schedule، voltage/protection contract | هیچ discipline بدون readiness matrix وارد UI production نشود |
| Engineering beta | performance maps، pressure-drop governed، line/equipment schedule، drawing sheet | cooling/heating load، AHU/FCU/duct semantic graph، equipment evidence | demand/load calculation، panel/cable semantic graph، equipment evidence | golden projects و reviewer sign-off |
| Delivery beta | IFC/Plant3D connector، vendor documents، pilot review pack | Revit/IFC connector، duct schedules، clash interfaces | Revit/IFC connector، panel schedule، cable tray interfaces | handoff واقعی به CAD/BIM و no-silent-fallback |
| Commercial pilot | ۳ تا ۵ pilot صنعتی R717/CO₂ | فقط پس از تثبیت تبرید | فقط پس از تثبیت تبرید | KPI زمان طراحی، error escape، reviewer acceptance و ROI measured |

## ۶. گیت‌های کیفیت محصول

هر قابلیت جدید باید از پنج گیت عبور کند. گیت اول، `Source Gate`، بررسی می‌کند data واقعی و مجوز استفاده دارد. گیت دوم، `Physics Gate`، واحد، finite result، range و convergence را کنترل می‌کند. گیت سوم، `Graph Gate`، پورت، connection، service و 2D/3D consistency را کنترل می‌کند. گیت چهارم، `Selection Gate`، compatibility و manufacturer evidence را کنترل می‌کند. گیت پنجم، `Delivery Gate`، completeness، revision، approvals و blockers را قبل از export کنترل می‌کند.

این گیت‌ها باید در API هم وجود داشته باشند، نه فقط در UI. خروجی graph یا report اگر یکی از گیت‌ها unresolved باشد باید `preliminary` باقی بماند. کاربر می‌تواند preview ببیند و edit کند، اما سیستم اجازه ندارد آن را به‌عنوان final design یا compliance approved معرفی کند.

## ۷. سیستم فکر کردن برنامه

قدرت فکر کردن برنامه از ترکیب **مدل زبانی + حافظهٔ قابل‌حاکمیت + engine deterministic + evidence graph + reviewer feedback** می‌آید، نه از تعداد مدل‌های LLM. NVIDIA → Gemini → DeepSeek فقط مسیر پاسخ است؛ هستهٔ اعتماد باید از validation مستقل باشد.

یادگیری باید چهار مرحله داشته باشد: observation از پروژه، proposal با evidence و impact، human review، و promotion versioned به rule/skill. هیچ feedback یا فایل آپلودی نباید rule production را بدون review تغییر دهد. هر skill جدید باید scope، constraints، test cases، owner و expiry داشته باشد.

## ۸. معیارهای موفقیت پیش از پایلوت

| شاخص | هدف قبل از فروش pilot |
|---|---|
| Golden projects | حداقل ۵ پروژهٔ anonymized با ورودی، خروجی، source و review مستقل |
| Source-backed selection | حداقل ۲ مبرد و ۴ category تجهیز با data/revision سازنده |
| Regression | آزمون deterministic، invalid/boundary و E2E برای همهٔ مبردها |
| Traceability | ۱۰۰٪ results حساس دارای provenance و review state |
| Delivery | equipment schedule، line/valve schedule، BOM source links و report revisioned |
| Field proof | حداقل ۳ design-partner با معیار زمان، خطا و acceptance از پیش تعریف‌شده |

## ۹. زبان فروش مجاز و غیرمجاز

زبان مجاز این است: «Cool-Assist یک design-review copilot برای تبدیل intent به graph مهندسی review-gated است و شکاف‌های داده/ایمنی را پیش از صدور طراحی آشکار می‌کند.» زبان غیرمجاز این است: «هر P&ID را خودکار و بدون مهندس به مدل ساخت‌وساز صحیح تبدیل می‌کند»، «انتخاب تجهیز و compliance را تضمین می‌کند»، یا «جایگزین Revit/Plant 3D/ابزارهای سازنده است.»

## ۱۰. تعهد اجرایی

از این مرحله، هر توسعه باید به یک advantage دفاع‌پذیر وصل باشد: evidence، deterministic physics، semantic graph، interoperability، delivery یا pilot proof. قابلیت جدیدی که یکی از این‌ها را تقویت نکند، اولویت ندارد. کیفیت و قابلیت اتکا بر سرعت نمایش و تعداد feature مقدم هستند.

## منابع

[1] [Danfoss Coolselector 2](https://www.danfoss.com/en-us/service-and-support/downloads/dcs/coolselector-2/)
[2] [BITZER SOFTWARE](https://www.bitzer.de/hu/en/press/new-bitzer-software-even-clearer-and-more-comprehensive.jsp)
[3] [GEA RTSelect](https://www.gea.com/en/campaigns/rtselect/)
[4] [Autodesk Plant 3D and P&ID](https://aps.autodesk.com/developer/overview/autocad-plant-3d-and-pid)
[5] [Augmenta Autonomous Building Design](https://www.augmenta.ai/)
[6] [ASHRAE Refrigeration Resources and AI Policy](https://www.ashrae.org/technical-resources/refrigeration)
[7] [OSHA reference to IIAR PSM guidelines](https://www.osha.gov/etools/ammonia-refrigeration/additional-references/iiar-psm-guidelines)
