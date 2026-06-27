// backend/services/equipment/CO2Optimizer.js

class CO2Optimizer {
    /**
     * یافتن فشار بهینه گاز کولر در سیکل‌های ترانس‌کریتیکال
     * @param {number} tEvap - دمای اواپراتور (C)
     * @param {number} tGasCoolerOut - دمای خروجی گاز کولر (C)
     */
    static calculateOptimalPressure(tEvap, tGasCoolerOut) {
        // فرمول Liao & Groll:
        // P_opt = (2.778 - 0.0157 * Tevap) * Tgc_out + (0.381 * Tevap - 9.34)
        
        const pOpt = (2.778 - 0.0157 * tEvap) * tGasCoolerOut + (0.381 * tEvap - 9.34);
        
        // اعمال محدودیت‌های ایمنی (مثلاً حداکثر ۱۲۰ بار)
        return Math.min(Math.max(pOpt, 75), 120); // فشار به بار
    }
    
    /**
     * الگوریتم اغتشاش و مشاهده (Perturb & Observe) برای کنترل بلادرنگ
     * مناسب برای شبیه‌سازی گام‌به‌گام
     */
    static perturbAndObserve(currentP, currentCOP, prevP, prevCOP) {
        const deltaP = 0.5; // bar
        
        if (currentCOP > prevCOP) {
            // مسیر درست است، ادامه بده
            return currentP + (currentP > prevP ? deltaP : -deltaP);
        } else {
            // مسیر غلط است، جهت را عوض کن
            return currentP + (currentP > prevP ? -deltaP : deltaP);
        }
    }
}

module.exports = CO2Optimizer;