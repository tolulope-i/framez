import React from "react";
import { View, ViewProps } from "react-native";
import { useThemeStore } from "@/store/themeStore";
import { Colors } from "@/constants/Colors";

export const ThemedView: React.FC<ViewProps> = ({style, ...props}) =>{
    const { isDark} = useThemeStore();
    const colors = isDark ? Colors.dark : Colors.light;

    return(
        <View
            style={[{backgroundColor: colors.background}, style]}
            {...props}
        />
    )
}