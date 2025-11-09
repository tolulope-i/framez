import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_KEY = '@framez_theme';

export const storage = {
    async getTheme(): Promise<'light' | 'dark'> {
        try {
            const theme = await AsyncStorage.getItem(
                THEME_KEY
            );
            return (theme as 'light' | 'dark') || 'dark';
        } catch {
            return 'dark';
        }
    },

    async setTheme (theme: 'light' | 'dark') : Promise<void> {
        try {
            await AsyncStorage.setItem(THEME_KEY, theme);
        } catch (error){
            console.log('Error saving theme:', error)
        }
    },
};