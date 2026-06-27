// backend/services/physics/Psychrometrics.js
const math = require('mathjs'); // برای عملیات ماتریسی و ریاضی دقیق

class Psychrometrics {
    constructor() {
        // ضرایب Hyland-Wexler برای فشار بخار اشباع (مثال)
        this.C = [-5.8002206E+03, 1.3914993, -4.8640239E-02, 4.1764768E-05, -1.4452093E-08, 6.5459673];
    }

    /**
     * محاسبه فشار بخار اشباع با متد Hyland-Wexler (فصل ۶ گزارش)
     * @param {number} T - دما به کلوین
     */
    saturationPressure(T) {
        // ln(Pws) = C1/T + C2 + C3*T + C4*T^2 + C5*T^3 + C6*ln(T)
        const lnP = (this.C[0] / T) + this.C[1] + (this.C[2] * T) + 
                    (this.C[3] * Math.pow(T, 2)) + (this.C[4] * Math.pow(T, 3)) + 
                    (this.C[5] * Math.log(T));
        return Math.exp(lnP);
    }

    // سایر خواص (آنتالپی، حجم مخصوص) با استفاده از ضرایب ویریال در اینجا اضافه می‌شوند
}

module.exports = new Psychrometrics();