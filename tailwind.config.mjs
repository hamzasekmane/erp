/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#020617',
        foreground: '#ededed',
        
        // ألوان النظام الأساسية
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        zinc: {
          950: '#09090b',
          900: '#18181b',
          800: '#27272a',
          700: '#3f3f46',
          600: '#52525b',
          500: '#71717a',
          400: '#a1a1aa',
          300: '#d4d4d8',
          200: '#e4e4e7',
          100: '#f4f4f5',
          50: '#fafafa',
        },
        
        // ألوان الحالات (Status Colors)
        success: {
          DEFAULT: '#10b981',
          light: '#d1fae5',
          dark: '#065f46',
        },
        warning: {
          DEFAULT: '#f59e0b',
          light: '#fef3c7',
          dark: '#92400e',
        },
        error: {
          DEFAULT: '#ef4444',
          light: '#fee2e2',
          dark: '#991b1b',
        },
        info: {
          DEFAULT: '#3b82f6',
          light: '#dbeafe',
          dark: '#1e3a8a',
        },
        
        // ألوان الفواتير (Status Invoice)
        invoice: {
          paid: '#10b981',
          partial: '#06b6d4',
          draft: '#71717a',
          overdue: '#ef4444',
          pending: '#f59e0b',
        },
      },
      
      animation: {
        // الأساسية
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'fade-out': 'fadeOut 0.3s ease-in-out',
        'slide-in-from-left': 'slideInFromLeft 0.3s ease-in-out',
        'slide-in-from-right': 'slideInFromRight 0.3s ease-in-out',
        'slide-in-from-top': 'slideInFromTop 0.3s ease-in-out',
        'slide-in-from-bottom': 'slideInFromBottom 0.3s ease-in-out',
        
        // المتقدمة
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'spin-reverse': 'spin 3s linear infinite reverse',
        
        // للوحة التحكم
        'glow': 'glow 2s ease-in-out infinite',
        'loading': 'loading 2s ease-in-out infinite',
        'scale-in': 'scaleIn 0.2s ease-out',
        'scale-out': 'scaleOut 0.2s ease-in',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideInFromLeft: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideInFromRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideInFromTop: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideInFromBottom: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        
        // أنيميشنات جديدة
        glow: {
          '0%, 100%': { 
            boxShadow: '0 0 10px rgba(6, 182, 212, 0.3)',
            opacity: '1'
          },
          '50%': { 
            boxShadow: '0 0 30px rgba(6, 182, 212, 0.6)',
            opacity: '0.8'
          },
        },
        loading: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(400%)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.9)', opacity: '0' },
        },
      },
      
      // تأخيرات للأنيميشن
      transitionDelay: {
        '0': '0ms',
        '100': '100ms',
        '200': '200ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
        '600': '600ms',
        '700': '700ms',
        '800': '800ms',
        '900': '900ms',
        '1000': '1000ms',
      },
      
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'Arial', 'Helvetica', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'Menlo', 'Monaco', 'monospace'],
        display: ['var(--font-display)', 'sans-serif'],
        cyber: ['var(--font-cyber)', 'monospace'],
      },
      
      fontSize: {
        'xxs': '0.625rem',    // 10px
        'xs': '0.75rem',       // 12px
        'sm': '0.875rem',      // 14px
        'base': '1rem',        // 16px
        'lg': '1.125rem',      // 18px
        'xl': '1.25rem',       // 20px
        '2xl': '1.5rem',       // 24px
        '3xl': '1.875rem',     // 30px
        '4xl': '2.25rem',      // 36px
        '5xl': '3rem',         // 48px
        '6xl': '3.75rem',      // 60px
        '7xl': '4.5rem',       // 72px
        '8xl': '6rem',         // 96px
      },
      
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
        'full': '9999px',
      },
      
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        '3xl': '32px',
        '4xl': '48px',
      },
      
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
        '160': '40rem',
        '192': '48rem',
      },
      
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
        'modal': '1000',
        'overlay': '900',
        'dropdown': '800',
        'header': '700',
        'footer': '600',
      },
      
      // تدرجات مخصصة
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-glass': 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)',
        'gradient-cyber': 'linear-gradient(90deg, #06b6d4 0%, #8b5cf6 100%)',
      },
      
      // ظلال مخصصة
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-lg': '0 16px 48px 0 rgba(0, 0, 0, 0.47)',
        'glow': '0 0 20px rgba(6, 182, 212, 0.3)',
        'glow-lg': '0 0 40px rgba(6, 182, 212, 0.5)',
        'inner-glow': 'inset 0 0 20px rgba(6, 182, 212, 0.2)',
        'neon': '0 0 5px #06b6d4, 0 0 20px #06b6d4',
      },
      
      // شفافيات مخصصة
      opacity: {
        '15': '0.15',
        '35': '0.35',
        '65': '0.65',
        '85': '0.85',
      },
    },
  },
  plugins: [
    // Plugin مخصص للإضافات
    function({ addUtilities, addComponents, addBase, theme }) {
      
      // إضافات أساسية (Base styles)
      addBase({
        '@font-face': {
          fontFamily: 'Inter',
          fontStyle: 'normal',
          fontWeight: '100 900',
          fontDisplay: 'swap',
          src: 'url("/fonts/inter.woff2") format("woff2")',
        },
        '::selection': {
          backgroundColor: theme('colors.cyan.500'),
          color: theme('colors.white'),
        },
      });
      
      // مكونات مخصصة (Components)
      addComponents({
        '.glass-card': {
          background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: theme('borderRadius.3xl'),
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: 'rgba(6, 182, 212, 0.3)',
            boxShadow: '0 0 30px rgba(6, 182, 212, 0.1)',
          },
        },
        '.stat-card': {
          background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: theme('borderRadius.3xl'),
          padding: theme('spacing.6'),
          transition: 'all 0.3s ease',
        },
        '.btn-ghost': {
          padding: theme('spacing.2'),
          color: theme('colors.zinc.400'),
          borderRadius: theme('borderRadius.lg'),
          border: '1px solid transparent',
          transition: 'all 0.2s ease',
          '&:hover': {
            color: theme('colors.cyan.400'),
            backgroundColor: 'rgba(6, 182, 212, 0.1)',
            borderColor: 'rgba(6, 182, 212, 0.3)',
          },
        },
      });
      
      // أدوات مساعدة (Utilities)
      addUtilities({
        '.scrollbar-thin': {
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: '4px',
            height: '4px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(255, 255, 255, 0.05)',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#1e293b',
            borderRadius: '20px',
            border: '1px solid rgba(6, 182, 212, 0.2)',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#06b6d4',
          },
        },
        '.scrollbar-none': {
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '.text-balance': {
          textWrap: 'balance',
        },
        '.text-pretty': {
          textWrap: 'pretty',
        },
        '.bg-gradient-custom': {
          background: 'linear-gradient(to bottom right, rgba(6, 182, 212, 0.1), rgba(79, 70, 229, 0.1))',
        },
        '.backdrop-blur-custom': {
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        },
        '.glow-text': {
          textShadow: '0 0 10px rgba(6, 182, 212, 0.5)',
        },
        '.glow-border': {
          boxShadow: '0 0 10px rgba(6, 182, 212, 0.3)',
        },
      }, ['responsive', 'hover']);
    },
    
    // إضافة plugin لتحسين الأداء
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms')({
      strategy: 'class', // استخدام class بدلاً من auto
    }),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/container-queries'),
  ],
};

export default config;