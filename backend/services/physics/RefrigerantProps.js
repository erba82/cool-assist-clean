/**
 * RefrigerantProps.js
 * محاسبه خواص ترمودینامیکی مبردها بر اساس معادلات حالت (EOS) و همبستگی‌های مهندسی
 * پشتیبانی از: R717 (Ammonia), R744 (CO2), R404A, R134a
 */

class RefrigerantProps {
    constructor() {
        // ضرایب ساده‌سازی شده برای آنتالپی و فشار اشباع (برای سرعت بالا در Node.js)
        this.data = {
            'NH3': { type: 'natural', criticalTemp: 132.25, gwp: 0, safety: 'B2L' },
            'R744': { type: 'natural', criticalTemp: 30.98, gwp: 1, safety: 'A1' }, // CO2
            'R404A': { type: 'hfc', criticalTemp: 72.0, gwp: 3922, safety: 'A1' },
            'R134a': { type: 'hfc', criticalTemp: 101.06, gwp: 1430, safety: 'A1' }
        };
    }

    /**
     * بررسی نوع مبرد و خواص پایه
     */
    getProperties(refrigerantName) {
        // نرمال‌سازی نام مبرد
        let ref = refrigerantName.toUpperCase();
        if (ref.includes('AMMONIA') || ref.includes('NH3')) ref = 'NH3';
        else if (ref.includes('CO2') || ref.includes('CARBON')) ref = 'R744';
        
        return this.data[ref] || this.data['R404A']; // پیش‌فرض
    }

    /**
     * محاسبه فشار اشباع (Bar) بر اساس دما (C)
     * فرمول آنتوان اصلاح شده (Antonie Modified)
     */
    getSaturationPressure(tempC, refrigerant) {
        const T = tempC + 273.15; // Kelvin
        let lnP; // P in MPa

        if (refrigerant === 'NH3') {
            // ضرایب آمونیاک
            lnP = 16.3 - (3650 / T) - 200000 / Math.pow(T, 2);
        } else if (refrigerant === 'R744') {
            // ضرایب CO2 (Dukhin et al)
            lnP = 86.6 - (4050 / T); // تقریب برای زیر نقطه بحرانی
        } else {
            // R404A Generic
            lnP = 14.5 - (3000 / T);
        }

        return Math.exp(lnP); // خروجی تقریبی برای شبیه‌سازی
    }

    /**
     * محاسبه آنتالپی تبخیر (Latent Heat) برای محاسبه دبی جرمی
     * خروجی: kJ/kg
     */
    getLatentHeat(tempC, refrigerant) {
        if (refrigerant === 'NH3') return 1370 - (2.5 * tempC); // بسیار بالا
        if (refrigerant === 'R744') return 200 - (3 * tempC);   // در نزدیکی نقطه بحرانی کم می‌شود
        return 180 - (1.2 * tempC); // فریون‌ها
    }
}

module.exports = new RefrigerantProps();