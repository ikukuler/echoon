import React from "react";
import { FeedbackState } from "./ui";

interface LoadingSpinnerProps {
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  text = "Loading...",
}) => {
  return <FeedbackState title={text} loading />;
};
