# ممیزی رقابتی و آمادگی جهانی Cool-Assist

**تاریخ مبنای ارزیابی:** ۲۱ اوت ۲۰۲۶
**موضوع:** ارزیابی فنی، محصولی و تجاری Cool-Assist در برابر دسته‌های اصلی رقبای جهانیِ انتخاب تجهیزات برودت، BIM/CAD، AI-MEP و compliance.
**قاعدهٔ تفسیر:** امتیازها قضاوت تحلیلی شفاف‌اند، نه برآورد آماری از بازار یا تضمین مالی. هیچ ادعای انطباق استاندارد یا performance تجهیز بدون منبع سازنده معتبر تلقی نشده است.

## جمع‌بندی صریح

Cool-Assist در حال حاضر یک **prototype مهندسی پیشرفته و قابل‌نمایش** است، نه یک محصول جهانی آماده برای رقابت مستقیم با Autodesk Plant 3D/Revit، MagiCAD، BITZER SOFTWARE، GEA RTSelect یا Danfoss Coolselector 2. نقطهٔ قوت واقعی آن، ترکیب کم‌یابِ **گفت‌وگوی AI، پروفایل معنایی چندمبردی، مسیر P&ID به 3D، BOM/procurement، کنترل یادگیری و گیت‌های review** در یک جریان وب است. نقطهٔ ضعف تعیین‌کننده، فقدان دادهٔ عملکرد/کاتالوگ معتبر گسترده، خروجی CAD ساخت‌وساز، workflow compliance رسمی، evidence manufacturer-backed برای انتخاب نهایی و اثبات کاربری با مشتری واقعی است.

بنابراین، اگر تعریف موفقیت «جایگزینی نرم‌افزارهای مهندسی و CAD جهانی در دو سال آینده» باشد، شانس موفقیت پایین است. اگر تعریف موفقیت «ابزار تصمیم‌یار و طراحی اولیهٔ صنعتی برای پیمانکاران/یکپارچه‌سازان برودت، نخست در یک بازار جغرافیایی یا vertical مشخص» باشد، فرصت واقعی وجود دارد؛ مشروط به تمرکز، دادهٔ معتبر و اجرای pilot کنترل‌شده.

| سناریوی موفقیت | برآورد تحلیلی مشروط | دلیل اصلی |
|---|---:|---|
| جایگزینی مستقیم Autodesk/Plant 3D یا Revit برای پروژه‌های ساخت‌وساز در ۲۴ ماه | ۵ تا ۱۰ درصد | فاصلهٔ زیاد در CAD deliverables، اکوسیستم، coordination و اعتماد سازمانی |
| محصول pilot قابل‌فروش برای design-assist در برودت صنعتی طی ۱۲ تا ۱۸ ماه | ۲۵ تا ۳۵ درصد | مزیت workflow یکپارچه و niche روشن، به شرط دادهٔ سازنده و ۳ تا ۵ مشتری design-partner |
| کسب جایگاه جهانیِ niche در ۳ تا ۵ سال | ۳۰ تا ۴۵ درصد | تنها در صورت تمرکز بر یک vertical، performance-map معتبر، integration، auditability و اثبات ROI |
| فروش صرفاً به‌عنوان «AI همه‌کارهٔ مهندسی» بدون data moat و validation | کمتر از ۱۵ درصد | بازار با ادعاهای AI اشباع است و مسئولیت مهندسی/ایمنی مانع اعتماد می‌شود |

## مبنای آزمون فنی

در نسخهٔ commit `313d1f8eb`، آزمون کامل backend، آزمون sidecar، آزمون library/3D frontend، سناریوی E2E دبی R717 و production build اجرا شدند. همهٔ گیت‌های functional اجرا شدند، اما این موفقیت به معنای validation مهندسی یا آمادگی ساخت‌وساز نیست.

| سطح | شواهد اجراشده | نتیجه | برداشت درست |
|---|---|---|---|
| Backend governance | `npm test` با ۱۶ قرارداد | موفق | از input governance، P&ID، CO₂، MCP، learning و چندمبردی regression محافظت می‌شود |
| Provider | `npm run test:coolprop-sidecar` | موفق | خواص ۸ مبرد، R744 booster مقدماتی و منع fallback بین‌مبردی تست شد |
| مقایسه legacy | R717 parallel comparison | موفق اما هشداردهنده | COP legacy حدود ۷۴.۳۷٪ با provider اختلاف داشت؛ legacy selection-ready نیست |
| Library/3D | `frontend/npm test` | موفق | ۳۴ نماد P&ID، ۳۱ مدل renderable و ۱۲۶ mesh اعتبارسنجی شدند |
| E2E | سناریوی Dubai R717 در مرورگر | ۱۰ از ۱۰ کنترل موفق | summary، load، calculation book، BOM tier، equipment، P&ID 2D/3D، انرژی و compliance ظاهر شدند |
| Production build | `frontend/npm run build` | موفق با ۲ هشدار | bundle entrypoint برابر ۲.۴۸ MiB باقی ماند؛ performance/web delivery باید اصلاح شود |

نتیجهٔ تست این است که برنامه **از نظر regression داخلی و نمایش جریان اصلی پایدارتر شده است**. با این حال، E2E فقط یک سناریوی R717 را در مرورگر پوشش می‌دهد؛ آزمون end-to-end مرورگری برای R744، R290، R32، R404A، R410A، R134a و R22 هنوز وجود ندارد. در نتیجه، ادعای «کیفیت یکسان همه مبردها در UI نهایی» هنوز قابل‌اتکا نیست.

## scorecard آمادگی محصول

امتیاز ۳۹.۵ از ۱۰۰ از یک rubric وزنی و محافظه‌کارانه به دست آمده است. وزن‌ها به دلیل حساسیت صنعت برودت صنعتی روی محاسبات، انتخاب تجهیز، CAD/BIM، compliance و reliability گذاشته شده‌اند. این score یک valuation نیست؛ تصویری از آمادگی برای عرضهٔ حرفه‌ای است.

| محور | وزن | امتیاز از ۵ | سهم | شواهد و توضیح |
|---|---:|---:|---:|---|
| محاسبات و خواص | ۱۸٪ | ۲.۰ | ۷.۲ | CoolProp sidecar و R744 preliminary افزوده شده، اما legacy اختلاف بزرگ دارد و map سازنده وجود ندارد |
| انتخاب تجهیزات و دادهٔ کاتالوگ | ۱۵٪ | ۱.۰ | ۳.۰ | resolver مانع substitution نادرست است، اما evidence سازنده برای اغلب مبردها/دسته‌ها موجود نیست |
| P&ID و BIM semantic | ۱۵٪ | ۲.۵ | ۷.۵ | templateهای مبردی، پورت‌ها و render library وجود دارد؛ خروجی ساخت‌وساز و CAD interoperability وجود ندارد |
| Compliance و ایمنی | ۱۰٪ | ۱.۵ | ۳.۰ | review gate مناسب است، اما PHA، مدیریت تغییر، checklist رسمی و evidence pack وجود ندارد |
| workflow، AI و UX | ۱۲٪ | ۳.۰ | ۷.۲ | chat، upload، MCP draft، learning review و procurement workflow تمایز ایجاد می‌کنند |
| QA و reliability | ۱۲٪ | ۳.۰ | ۷.۲ | ۱۶ قرارداد backend، testهای 3D و E2E وجود دارد؛ coverage سناریوی UI و test vectors مستقل محدود است |
| integration و delivery | ۸٪ | ۱.۵ | ۲.۴ | API/readiness و sidecar خوب است؛ export IFC/DWG/Plant3D، SSO، tenancy و audit delivery اثبات نشده‌اند |
| commercial readiness | ۱۰٪ | ۱.۰ | ۲.۰ | prototype و roadmap قوی است، اما design-partner، pricing، support SLA و reference customer موجود نیست |
| **جمع** | **۱۰۰٪** | — | **۳۹.۵ / ۱۰۰** | **Prototype قوی؛ نه product جهانیِ آمادهٔ خرید حساس** |

## مقایسه با دسته‌های رقیب

| دسته/نمونه | مزیت تثبیت‌شدهٔ رقیب | وضعیت Cool-Assist | نتیجهٔ رقابتی امروز |
|---|---|---|---|
| انتخاب سازنده: Danfoss Coolselector 2 | محاسبه از conditions، انتخاب قطعه، sizing خطوط و BOM برای اکوسیستم Danfoss [1] | workflow چندمبردی و BOM دارد، اما data-backed selection محدود است | Cool-Assist مکمل یا orchestrator بالقوه است؛ جایگزین selection tool سازنده نیست |
| انتخاب سازنده: BITZER SOFTWARE | performance، application limit، compressor polynomial، seasonal calculation، PDF/CSV، drawings/3D models و CO₂/compound systems [2] | ۳۱ مدل 3D و sidecar دارد، اما performance maps، limits، polynomials و deliverables ندارد | فاصلهٔ بزرگ در engine/data؛ مزیت تنها در multi-vendor workflow و AI است |
| configure-to-quote: GEA RTSelect | project wizard، package recommendation، sales verification، quotation، technical documents و 2D/3D package files [3] | procurement tier و BOM موجود است، اما quotation/source-doc automation ندارد | فرصت همکاری/API با سازندگان بیشتر از رقابت مستقیم است |
| CAD/P&ID: Autodesk Plant 3D | P&ID، 3D piping/equipment/supports، isometric و orthographic drawings و SDK [4] | P&ID editable و 3D visualization موجود است | تا زمانی که deliverables، drawing control و interoperability اضافه نشوند، فاصلهٔ جدی وجود دارد |
| BIM MEP: Revit/MagiCAD | modelling، fabrication/estimating handoff و manufacturer BIM data [5] | HVAC/Electrical در roadmap است | به‌هیچ‌وجه نباید امروز جایگزین Revit/MagiCAD معرفی شود |
| AI construction: Augmenta | spatial-AI، electrical coordination و تمرکز construction workflow؛ mechanical/plumbing هنوز coming soon [6] | AI chat و semantic topology صنعتی دارد | niche برودت مزیت بالقوه است، اما geometry/coordination solver و enterprise proof کم است |
| محاسبه/انرژی: Copeland | performance، envelope، annual analysis، weather data، reference drawings و BOM [7] | Energy Hub review-gated است، اما telemetry/weather/performance evidence ندارد | عدد صرفه‌جویی یا cost نباید تا زمان data integration ادعا شود |

> ادعای مزیت قابل دفاع Cool-Assist این نیست که «از همه بهتر CAD می‌کشد». مزیت بالقوه این است که بین گفت‌وگوی پروژه، intent مهندسی، cycle مبرد، P&ID، BIM preview، procurement و review governance یک جریان واحد می‌سازد. اگر همین claim به‌صورت narrow و data-backed عرضه شود، قابل‌فروش‌تر از یک ادعای جایگزینی همه نرم‌افزارهای جهان است.

## نقاط قوت واقعی

Cool-Assist هم‌اکنون یک معماری قابل‌توجه برای محصولی در این مرحله دارد. normalization مبردها در پروفایل مرکزی، templateهای معنایی جداگانه، گیت CO₂ مستقل، جلوگیری از بازگشت آمونیاک در طراحی R404A/R744، چک ارتفاع آمونیاک، registry یادگیری review-gated، MCP draft-only و attachment analysis نشان می‌دهند که محصول صرفاً یک UI تولید تصویر نیست.

داشتن P&ID editable و BIM preview در کنار BOM tier، location-aware procurement intent و chat، برای پیمانکار یا تیم فروش فنی می‌تواند زمان تبدیل یک brief به design review را کاهش دهد. همین قسمت برای بازار اولیه ارزش دارد، زیرا رقبا غالباً در یک vendor یا یک لایهٔ CAD/selection متمرکز هستند.

## نقاط ضعف بازدارنده

بزرگ‌ترین خطر، فاصلهٔ بین UI حرفه‌ای و evidence مهندسی است. در صنعت برودت، یک compression model، DN یا قیمت ظاهراً دقیق اما بدون source revision و manufacturer map می‌تواند به اعتماد محصول آسیب جدی بزند. اصلاح اخیر که model ساختگی را حذف و `review-required` را آشکار کرد، مسیر درست است؛ اما تجربهٔ کاربر هنوز باید این وضعیت را به‌وضوح به «کار بعدی» تبدیل کند، نه صرفاً یک warning کوچک.

دومین ضعف، data moat است. Danfoss، BITZER، GEA و Copeland دادهٔ محصول، performance، limits، drawing، document و تیم پشتیبانی خود را دارند. Cool-Assist تا وقتی قرارداد رسمی با یک یا دو سازنده، importer یا distributor معتبر نداشته باشد، نمی‌تواند انتخاب قطعی یا procurement واقعی را در سطح آنان ارائه دهد.

سومین ضعف، deliverable است. صنعت برای ساخت به IF C/REVIT/Plant3D، drawing sheet، isometric، line list، valve schedule، nozzle schedule، cable schedule، revision control و audit trail نیاز دارد. یک صحنهٔ Three.js باکیفیت برای فروش دمو مفید است، اما در procurement و construction کافی نیست.

چهارمین ضعف، اعتبارسنجی میدانی است. testهای فعلی regression را اثبات می‌کنند، نه اینکه سیستم در سه پروژهٔ واقعی، با P&ID مشتری، کاتالوگ واقعی و امضای مهندس مسئول به نتیجهٔ درست رسیده است. این gap با test بیشتر در isolation حل نمی‌شود؛ باید با design-partner و golden dataset حل شود.

## برنامهٔ اولویت‌دار برای تبدیل شدن به محصول قابل‌رقابت

| بازه | هدف قابل‌سنجش | اقدام لازم | معیار خروج |
|---|---|---|---|
| ۰ تا ۱۲ هفته | قابل‌اعتماد شدن design-assist | یک vertical مشخص انتخاب شود: مثلاً سردخانه صنعتی R717/CO₂ در MENA. پنج golden project anonymized با input/source واقعی ساخته شود. legacy selection از provider جدا و report provenance امضاشده تولید شود. | ۵ پروژهٔ replayable، zero silent fallback، review pack قابل‌خروجی |
| ۳ تا ۶ ماه | data moat اولیه | یک partner سازنده برای کمپرسور/valve و یک partner برای evaporator/condenser انتخاب شود. performance map، envelope، GA، nozzle و revision وارد schema versioned شود. | انتخاب evidence-backed برای حداقل ۲ مبرد و ۴ category اصلی |
| ۳ تا ۶ ماه | خروجی مهندسی واقعی | drawing-sheet export، line list، equipment/valve schedule، BOM source links و report revision کنترل‌شده پیاده‌سازی شود. | یک deliverable توسط مهندس بیرونی review شود و قابل issue-for-review باشد |
| ۶ تا ۱۲ ماه | BIM/CAD interoperability | IFC یا connector به Revit/Plant3D از semantic graph تولید شود؛ port mapping، supports و clash ruleهای deterministic افزوده شود. | یک پروژهٔ pilot با coordination واقعی و handoff به CAD/BIM |
| ۶ تا ۱۲ ماه | compliance workflow | metadata دارای مجوز برای rules، PHA/what-if checklist، decision trace و change management اضافه شود. | safety review pack بدون ادعای خودکار compliance |
| ۱۲ تا ۲۴ ماه | اثبات بازار و مقیاس | سه تا پنج design-partner پولی، SLA، support process، telemetry اختیاری و ROI baseline ایجاد شود. | reference customer، renewal signal و case study verified |

## توصیهٔ راهبردی

بهترین مسیر تجاری، **AI design-review copilot برای برودت صنعتی** است، نه «AutoCAD/Revit killer». محصول باید نخست در یک زیر‌بخش پرریسک و پرهزینه، مانند R717/CO₂ سردخانه صنعتی، با سه خروجی مشخص بفروشد: کاهش زمان design review، جلوگیری از خطای cross-refrigerant/equipment و تولید documentation review-ready. سپس با دادهٔ سازنده و export به اکوسیستم موجود رشد کند.

محصول نباید تا زمان تکمیل roadmap، pricing یا marketing خود را بر «طراحی خودکارِ قابل‌ساخت» یا «compliance خودکار» بنا کند. زبان فروش دقیق‌تر این است: **طراحی اولیهٔ review-gated، orchestration چندلایه و شفاف‌سازی شکاف‌های داده/ایمنی پیش از صدور طراحی**.

## منابع

[1] [Danfoss Coolselector 2](https://www.danfoss.com/en-us/service-and-support/downloads/dcs/coolselector-2/)
[2] [BITZER: New BITZER SOFTWARE](https://www.bitzer.de/hu/en/press/new-bitzer-software-even-clearer-and-more-comprehensive.jsp)
[3] [GEA RTSelect](https://www.gea.com/en/campaigns/rtselect/)
[4] [Autodesk Plant 3D and P&ID](https://aps.autodesk.com/developer/overview/autocad-plant-3d-and-pid)
[5] [Autodesk Revit for MEP Engineering](https://www.autodesk.com/products/revit/mep)
[6] [Augmenta Autonomous Building Design](https://www.augmenta.ai/)
[7] [Copeland Product Selection Software](https://www.copeland.com/en-us/tools-resources/product-selection-software)
[8] [ASHRAE Refrigeration Technical Resources](https://www.ashrae.org/technical-resources/refrigeration)
[9] [OSHA reference: IIAR PSM Guidelines](https://www.osha.gov/etools/ammonia-refrigeration/additional-references/iiar-psm-guidelines)
