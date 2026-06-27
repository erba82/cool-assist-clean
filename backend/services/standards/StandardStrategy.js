// backend/services/standards/StandardStrategy.js

class StandardContext {
    constructor(strategy) {
        this.strategy = strategy;
    }

    calculateLoad(data) {
        return this.strategy.calculate(data);
    }
}

// استراتژی ASHRAE (پیش‌فرض)
class AshraeStrategy {
    calculate(data) {
        // استفاده از HBM یا RTSM
        console.log("Calculating using ASHRAE HBM...");
        // فراخوانی HeatBalanceSolver
    }
}

// استراتژی چین (GB 50736)
class GBStrategy {
    calculate(data) {
        console.log("Calculating using GB Harmonic Method...");
        // استفاده از ضرایب CLTD هارمونیک
        // تولید "روز طراحی" مصنوعی
    }
}

// استراتژی ژاپن (JIS)
class JISStrategy {
    calculate(data) {
        console.log("Calculating APF (Annual Performance Factor)...");
        // اجرای شبیه‌سازی در نقاط Bin دمایی
    }
}

module.exports = { StandardContext, AshraeStrategy, GBStrategy, JISStrategy };