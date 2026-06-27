/**
 * EquipmentModel.js
 * مدل‌سازی رفتار تجهیزات و بهینه‌سازی سیکل‌های ترانس‌کریتیکال
 */

class EquipmentModel {
    
    /**
     * بهینه‌سازی فشار گاز کولر در سیکل‌های CO2 ترانس‌کریتیکال
     * طبق فرمول Liao & Groll (فصل ۵ گزارش)
     * @param {number} tEvap - دمای اواپراتور (C)
     * @param {number} tGasCoolerOut - دمای خروجی گاز کولر (معمولا دمای محیط + 3)
     */
    calculateOptimalCO2Pressure(tEvap, tGasCoolerOut) {
        // P_opt = (2.778 - 0.0157 * Tevap) * Tgc_out + (0.381 * Tevap - 9.34)
        const pOpt = (2.778 - 0.0157 * tEvap) * tGasCoolerOut + (0.381 * tEvap - 9.34);
        
        // محدودیت‌های ایمنی (حداقل 75 بار برای حالت فوق بحرانی)
        return Math.max(75, Math.min(pOpt, 120)); 
    }

    /**
     * انتخاب نوع کمپرسور بر اساس مبرد و ظرفیت
     */
    selectCompressorTechnology(refrigerant, capacityKW, stageTemp) {
        if (refrigerant === 'NH3') {
            if (capacityKW > 100) return 'Screw';
            return 'Reciprocating';
        }
        
        if (refrigerant === 'R744') {
            return 'Transcritical Reciprocating'; // CO2 معمولا پیستونی فشار بالاست
        }

        // HFCs
        if (capacityKW > 200) return 'Screw';
        if (capacityKW > 50) return 'Scroll';
        return 'Reciprocating';
    }

    /**
     * تخمین توان مصرفی کمپرسور (COP Estimation)
     */
    estimatePower(coolingLoadKW, tEvap, tCond, refrigerant) {
        // محاسبه نسبت فشار
        // فرمول ساده شده برای تخمین: Power = Load / COP
        // COP واقعی تابعی از اختلاف دماست
        
        let copFactor = 3.5; // پایه
        if (refrigerant === 'NH3') copFactor = 4.2; // آمونیاک راندمان بالاتر
        if (tEvap < -20) copFactor *= 0.6; // کاهش راندمان در دمای پایین
        
        const deltaT = tCond - tEvap;
        const estimatedCOP = (copFactor * 30) / deltaT; // فرمول تجربی کارنو
        
        return coolingLoadKW / Math.max(0.5, estimatedCOP);
    }
}

module.exports = new EquipmentModel();