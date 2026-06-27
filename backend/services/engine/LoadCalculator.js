/**
 * LoadCalculator.js
 * موتور محاسباتی بار برودتی بر اساس اصول ASHRAE HBM (ساده‌سازی شده برای وب)
 */

class LoadCalculator {
    
    calculateRoomLoad(room, ambientTemp) {
        // 1. بار جداره‌ها (Transmission Load)
        // Q = U * A * dT
        const area = 2 * ((room.L * room.H) + (room.W * room.H) + (room.L * room.W));
        
        // تعیین ضریب انتقال حرارت (U-Value) بر اساس دما
        // سردخانه‌های زیر صفر عایق ضخیم‌تر (15cm) و بالای صفر (10cm)
        const uValue = room.temp < -10 ? 0.17 : 0.22; 
        
        const dT = ambientTemp - room.temp;
        const qTrans = (area * uValue * dT) / 1000; // kW

        // 2. بار محصول (Product Load)
        // Q = m * dh / t
        let qProd = 0;
        if (room.product) {
            // آنتالپی انجماد/سردکردن
            let enthalpyChange = 0;
            if (room.product.type.includes('freez') || room.temp < -5) {
                // سرد کردن + انجماد + زیرسرد کردن
                // Cp_above * dT1 + Latent + Cp_below * dT2
                // تقریب مهندسی برای گوشت/مرغ: حدود 350 kJ/kg کل انرژی
                enthalpyChange = 360; 
            } else {
                // فقط سرد کردن
                enthalpyChange = 90; 
            }

            const timeSeconds = (room.product.time || 24) * 3600;
            if (timeSeconds > 0) {
                qProd = (room.product.mass * enthalpyChange) / timeSeconds;
            }
        }

        // 3. بارهای داخلی (Internal Loads)
        // فن‌ها، روشنایی، لیفتراک، افراد (تقریباً 15-20 درصد بار کل)
        const qInternal = (qTrans + qProd) * 0.15;

        // 4. بار نفوذ هوا (Infiltration) - تخمینی
        const qInfiltration = (qTrans + qProd) * 0.10;

        const totalKW = (qTrans + qProd + qInternal + qInfiltration) * 1.1; // 10% ضریب اطمینان

        return {
            transmission: qTrans,
            product: qProd,
            internal: qInternal,
            total: totalKW
        };
    }
}

module.exports = new LoadCalculator();