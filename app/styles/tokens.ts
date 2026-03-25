export const tokens = {
    colors: {
        background: '#030712', // Strict slate-950/black baseline
        surface: '#0a0f1e', // Premium dark surface
        border: 'rgba(255, 255, 255, 0.08)', // Subtle white borders
        primary: '#8b5cf6', // Indigo/Purple
        accent: '#3b82f6', // Blue
    },
    spacing: {
        4: '0.25rem',
        8: '0.5rem',
        12: '0.75rem',
        16: '1rem',
        20: '1.25rem',
        24: '1.5rem',
        32: '2rem',
    },
    radius: {
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
    },
    shadows: {
        card: '0 4px 20px rgba(0, 0, 0, 0.5)',
        elevated: '0 10px 40px rgba(0, 0, 0, 0.6)',
    }
} as const;
