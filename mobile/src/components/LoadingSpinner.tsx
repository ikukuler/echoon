import React from "react";
import { View, Text, ActivityIndicator } from "react-native";

interface LoadingSpinnerProps {
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  text = "Loading...",
}) => {
  return (
    <View className="flex-1 justify-center items-center bg-gray-50">
      <ActivityIndicator size="large" color="#0ea5e9" />
      <Text className="text-accentSecondary text-lg mt-4 font-inter-bold font-bold">
        {text}
      </Text>
    </View>
  );
};
