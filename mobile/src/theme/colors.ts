export const colors = {
  background: "#ecd3b2",
  surface: "#fff5ee",
  surfaceElevated: "#f8f4f0",
  content: "#58381f",
  contentMuted: "#765433",
  contentOnAccent: "#f8f4f0",
  accent: "#efb56b",
  accentPressed: "#d99a4e",
  border: "#c9a77e",
  disabledSurface: "#d6c6b6",
  disabledContent: "#735f4e",
  danger: "#b42318",
  dangerPressed: "#8f1c13",
  dangerSurface: "#fee4e2",
  success: "#357a38",
  successSurface: "#e5f4e6",
  warning: "#9a5800",
  warningSurface: "#fff0d5",
  scrim: "rgba(0, 0, 0, 0.55)",
} as const;

export type AppColor = keyof typeof colors;
