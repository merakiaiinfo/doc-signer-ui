/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#1D76D2',
                'background-light': '#F8FAFC',
                'background-dark': '#0F172A',
                'card-light': '#FFFFFF',
                'card-dark': '#1E293B',
                'border-light': '#E2E8F0',
                'border-dark': '#334155',
                emerald: '#009688',
                ruby: '#D32F2F',
                'amber-accent': '#f59e0b',
                professional: {
                    cobalt: '#1D76D2',
                    emerald: '#009688',
                    ruby: '#D32F2F',
                    amber: '#FF9800',
                    mist: '#F4F7F9',
                    onyx: '#263238',
                    slate: '#78909C',
                }
            },
            fontFamily: {
                display: ["Inter", "sans-serif"],
                sans: ["Inter", "sans-serif"],
                mono: ["JetBrains Mono", "monospace"],
            },
            borderRadius: {
                '8px': '8px',
                DEFAULT: '8px',
            }
        },
    },
    plugins: [],
}

