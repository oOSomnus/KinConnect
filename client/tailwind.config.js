// tailwind.config.js
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./index.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
    "./components/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#3B82F6", // blue-500
          light: "#60A5FA", // blue-400
          dark: "#1D4ED8", // blue-700
        },
        secondary: {
          DEFAULT: "#10B981", // green-500
        },
        warning: {
          DEFAULT: "#F59E0B", // orange-500
        },
        background: {
          DEFAULT: "#F9FAFB", // slate-50
        },
      },
      fontSize: {
        title: 28,
        subtitle: 22,
        body: 18,
        small: 16,
      },
      borderRadius: {
        xl: 20, // 大圆角按钮
        "2xl": 28,
      },
      spacing: {
        safe: 16, // 用于 padding, margin
      },
    },
  },
  plugins: [],
  presets: [require("nativewind/preset")],
};
