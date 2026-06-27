/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./public/index.html"
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                primary: "#10B981",
                "primary-dark": "#0d9488",
                "primary-light": "#ccfbf1",
                "background-light": "#f3f4f6",
                "background-dark": "#111827",
                "surface-light": "#ffffff",
                "surface-dark": "#1f2937",
                "text-light": "#1f2937",
                "text-dark": "#f3f4f6",
                "text-muted-light": "#6b7280",
                "text-muted-dark": "#9ca3af",
                "border-light": "#E5E7EB",
                "border-dark": "#374151",
            },
            fontFamily: {
                display: ["Inter", "sans-serif"],
            },
            borderRadius: {
                DEFAULT: "0.5rem",
            },
            boxShadow: {
                'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.1)',
                'floating': '0 10px 40px -10px rgba(0, 0, 0, 0.2)',
            },
            animation: {
                'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
            },
            keyframes: {
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
        },
    },
    plugins: [],
    // Important: Don't purge MUI classes
    safelist: [
        { pattern: /^Mui/ },
    ],
}
