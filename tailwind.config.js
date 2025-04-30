// tailwind.config.js
module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx}',  // for app directory
        './pages/**/*.{js,ts,jsx,tsx}', // for pages directory (if used)
        './components/**/*.{js,ts,jsx,tsx}', // for components
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Poppins', 'sans-serif'], // <-- define font-poppins here
            },
        },
    },
    plugins: [],
}
