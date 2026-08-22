# مدل فنی قابلیت «Digital Thread تغییرات و MOC Gate»

## هدف

این قابلیت برای حل **configuration drift** در پروژه‌های تبرید صنعتی طراحی شده است: هنگامی که requirement، مبرد، شرایط بهره‌برداری، topology، تجهیز، P&ID/BIM یا tier تدارکات تغییر می‌کند، محصول باید اثر آن را بر artifactهای وابسته آشکار کند و revision را تا بازبینی انسان به‌عنوان final issue معرفی نکند.

> این موتور یک ابزار **read-only change-impact analysis** است. خروجی آن PHA، HAZOP، PSSR، تأیید طراحی، approval قانونی، انتخاب نهایی تجهیز یا اجازهٔ بهره‌برداری نیست.

## مدل دادهٔ snapshot

هر snapshot یک JSON فقط-داده با schema `cool-assist.design-snapshot.v1` است. داده‌های معتبر و قابل‌مقایسه شامل `discipline`، `project`، `calculation`، `graph`، `selection`، `procurement`، `bim`، `energy`، `compliance` و `evidence` است. هویت node/connection/equipment باید با id/tag پایدار مقایسه شود؛ ترتیب آرایه نباید نتیجهٔ diff را تغییر دهد.

| حوزه | شناسه/فیلدهای اثر | artifact بازبینی |
|---|---|---|
| Project/cycle | refrigerant، systemType، operatingConditionsSI | property provenance، cycle review |
| Graph/P&ID | node id/type، connection id/from/to/service/DN | topology و port/service review |
| BIM | instance id/family/model/port signature | fit/clearance/elevation/port continuity review |
| Equipment | selection id/family/model/manufacturer/status | manufacturer envelope و source revision |
| Procurement | row id/tier/brand/model/catalogueModelId | supplier/evidence، compatibility و price-source review |
| Energy | baseline/meter/strategy ids | M&V boundary و baseline review |
| Compliance | check standard/status | PHA/MOC/PSSR/compliance review |

## قواعد تصمیم‌گیری

| نوع تغییر | شدت پایه | gateهای اثرپذیر |
|---|---|---|
| مبرد، system type یا شرایط SI | critical | input، physics، graph، selection، delivery |
| node/connection/service/DN P&ID | high یا critical | graph، BIM، delivery |
| خانواده/مدل/سازنده/selection equipment | high | selection، procurement، delivery |
| tier/brand/model procurement | medium یا high | procurement، selection، BIM label، delivery |
| BIM family/port signature | high | graph، BIM، delivery |
| baseline/meter strategy انرژی | medium | energy، delivery |
| check استاندارد/status | high | compliance، delivery |

هر تغییر engineering یک وضعیت حداقل `review-required` تولید می‌کند. اگر snapshot ناقص، discipline ناشناخته/blocked یا مقدار غیرمتناهی باشد، وضعیت `blocked` است. این سرویس هیچگاه `finalIssueAllowed=true` برنمی‌گرداند.

## MOC/PSSR framing

موتور فقط trigger بالقوه را تعیین می‌کند. `mocAssessment` یکی از `not-applicable`، `review-required` یا `blocked` است. اگر تغییر material باشد، `replacementInKind` صریحاً `true` نباشد و discipline در مسیر governed موجود باشد، checklist MOC/PSSR می‌سازد. تصمیم اینکه MOC واقعاً طبق jurisdiction یا رویهٔ سایت لازم است، با کارفرما و تیم process-safety است.

## رابط API

`POST /api/core/change-impact/evaluate`

ورودی:

```json
{
  "baseline": { "schema": "cool-assist.design-snapshot.v1" },
  "proposed": { "schema": "cool-assist.design-snapshot.v1" },
  "changeContext": {
    "reason": "Optional, human-authored change reason",
    "replacementInKind": false,
    "finalIssueRequested": false
  }
}
```

خروجی شامل hash snapshot، change set مرتب و deterministic، impact matrix، evidenceRequired، MOC/PSSR checklist، `status`، `finalIssueAllowed:false` و disclaimer است. Endpoint چیزی ذخیره، approve یا به بیرون ارسال نمی‌کند.

## اتصال اولیه به UI

در tab Compliance، کاربر می‌تواند snapshot فعال را capture کند. تغییر tier مالی از همان snapshot واقعی `activeDesign` در frontend با snapshot بعدی مقایسه می‌شود. پنل نتایج، تغییرهای semantic، gateهای اثرپذیر و دلیل review را نشان می‌دهد. بدون baseline، پنل فقط امکان capture دارد و هیچ change ادعایی تولید نمی‌کند.

## اعتبارسنجی

تست باید no-change، تغییر مبرد/شرایط، تغییر P&ID، تغییر procurement tier/model، snapshot ناقص، discipline blocked، ordering پایدار و ممنوعیت final issue را پوشش دهد. build frontend و regression backend اجباری هستند.
