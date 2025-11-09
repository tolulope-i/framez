import {create} from 'zustand';
import { ThemeState } from '@/types';
import { storage } from '@/utils/storage';


export const useThemeStore = create< ThemeState> ((set, get) => ({
    isDark: true,
    toggleTheme: async () =>{
        const newTheme = !get().isDark;
        set({isDark: newTheme});
        await storage.setTheme(newTheme ? 'dark' : 'light');
    },
    initializeTheme: async () =>{
        const theme = await storage.getTheme();
        set({isDark: theme === 'dark'});
    },
}));