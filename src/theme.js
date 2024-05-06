// Colors and typography
import { createContext, useState, useMemo } from 'react';
import { createTheme } from '@mui/material/styles';

export const tokens = (mode) => ({
    ...(mode === 'dark'
        ? {
            'grey': {
                DEFAULT: '#666666',
                50: '#C2C2C2',
                100: '#B8B8B8',
                200: '#A3A3A3',
                300: '#8F8F8F',
                400: '#7A7A7A',
                500: '#666666',
                600: '#4A4A4A',
                700: '#2E2E2E',
                800: '#121212',
                900: '#000000',
                950: '#000000'
            },
            'primary': {
                DEFAULT: '#141B2D',
                50:      '#667EBB',
                100:     '#5872B5',
                200:     '#465F9E',
                300:     '#3A4E82',
                400:     '#2D3D65',
                500:     '#212C49',
                600:     '#141B2D',
                700:     '#030406',
                800:     '#000000',
                900:     '#000000',
                950:     '#000000'
            },
            'greenAccent': {
                DEFAULT: '#4CCEAC',
                50: '#DCF5EF',
                100: '#CCF1E7',
                200: '#ACE8D9',
                300: '#8CE0CA',
                400: '#6CD7BB',
                500: '#4CCEAC',
                600: '#31B190',
                700: '#24856C',
                800: '#185948',
                900: '#0C2D25',
                950: '#061713'
            },
            'red': {
                DEFAULT: '#DB4F4A',
                50:  '#F9E4E3',
                100: '#F6D3D2',
                200: '#EFB2B0',
                300: '#E9918E',
                400: '#E2706C',
                500: '#DB4F4A',
                600: '#C62D27',
                700: '#97221E',
                800: '#681815',
                900: '#390D0B',
                950: '#220807'
            },
        }
    : {
            'grey': {
                DEFAULT: '#666666',
                950: '#C2C2C2',
                900: '#B8B8B8',
                800: '#A3A3A3',
                700: '#8F8F8F',
                600: '#7A7A7A',
                500: '#666666',
                400: '#4A4A4A',
                300: '#2E2E2E',
                200: '#121212',
                100: '#000000',
                50:  '#000000'
            },
            'primary': {
                DEFAULT: '#141B2D',
                950:     '#667EBB',
                900:     '#5872B5',
                800:     '#465F9E',
                700:     '#3A4E82',
                600:     '#2D3D65',
                500:     '#212C49',
                400:     '#141B2D',
                300:     '#030406',
                200:     '#000000',
                100:     '#000000',
                50:      '#000000'
            },
            'greenAccent': {
                DEFAULT: '#4CCEAC',
                950: '#DCF5EF',
                900: '#CCF1E7',
                800: '#ACE8D9',
                700: '#8CE0CA',
                600: '#6CD7BB',
                500: '#4CCEAC',
                400: '#31B190',
                300: '#24856C',
                200: '#185948',
                100: '#0C2D25',
                50:  '#061713'
            },
            'red': {
                DEFAULT: '#DB4F4A',
                950: '#F9E4E3',
                900: '#F6D3D2',
                800: '#EFB2B0',
                700: '#E9918E',
                600: '#E2706C',
                500: '#DB4F4A',
                400: '#C62D27',
                300: '#97221E',
                200: '#681815',
                100: '#390D0B',
                50:  '#220807'
            },
        }),
})

// mui theme settings
export const themeSettings = (mode) => {
    const colors = tokens(mode);
    return {
        palette: {
            mode: mode,
            ...(mode === 'dark'
                ? {
                    primary : {
                        main: colors.primary[500],
                    },
                    secondary: {
                        main: colors.greenAccent[500],
                    },
                    neutral: {
                        dark: colors.grey[700],
                        main: colors.grey[500],
                        light: colors.grey[100]
                    },
                    background: {
                        default: colors.primary[600],
                    }
                } : {
                    primary : {
                        main: colors.primary[500],
                    },
                    secondary: {
                        main: colors.greenAccent[500],
                    },
                    neutral: {
                        dark: colors.grey[700],
                        main: colors.grey[500],
                        light: colors.grey[100]
                    },
                    background: {
                        default: '#fcfcfc',
                    },
                }
            ),
        },
        typography: {
            fontFamily: ['Source Sans 3', 'sans-serif'].join(','),
            fontSize: 14,
            h1: {
                fontFamily: ['Source Sans 3', 'sans-serif'].join(','),
                fontSize: 40,
            },
            h2: {
                fontFamily: ['Source Sans 3', 'sans-serif'].join(','),
                fontSize: 32,
            },
            h3: {
                fontFamily: ['Source Sans 3', 'sans-serif'].join(','),
                fontSize: 24,
            },
            h4: {
                fontFamily: ['Source Sans 3', 'sans-serif'].join(','),
                fontSize: 20,
            },
            h5: {
                fontFamily: ['Source Sans 3', 'sans-serif'].join(','),
                fontSize: 16,
            },
            h6: {
                fontFamily: ['Source Sans 3', 'sans-serif'].join(','),
                fontSize: 14,
            },
        },
    };
};

// context for color mode
export const ColorModeContext = createContext({
    toggleColorMode: () => {}
})

export const useMode = () => {
    const [mode, setMode] = useState('dark');
    const colorMode = useMemo(
        () => ({
            toggleColorMode: () =>
                setMode((prev) => (prev === 'light' ? 'dark' : 'light')),
        }),
        []
    );

    const theme = useMemo( () => createTheme(themeSettings(mode)), [mode]);

    return [theme, colorMode];
}