import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useThemeStore } from "@/store/themeStore";
import { Colors } from "@/constants/Colors";

export const LoadingSpinner: React.FC = () =>{
    const { isDark } = useThemeStore();
    const colors = isDark ? Colors.dark : Colors.light;

    return (
        <View style={styles.container}>
            <ActivityIndicator size='large' color={colors.primary}/>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});