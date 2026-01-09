export type ActionType =
  | "fix-grammar"
  | "shorten"
  | "expand"
  | "professional-tone"
  | "casual-tone"
  | "friendly-tone"
  | "email-writer"
  | "custom";

export interface Action {
  id: ActionType;
  label: string;
  icon: string;
  description?: string;
}

export const ACTIONS: Action[] = [
  { id: "fix-grammar", label: "Fix Grammar", icon: "✍️" },
  { id: "shorten", label: "Shorten Text", icon: "✂️" },
  { id: "expand", label: "Make Longer", icon: "📝" },
  { id: "professional-tone", label: "Professional Tone", icon: "💼" },
  { id: "casual-tone", label: "Casual Tone", icon: "😊" },
  { id: "friendly-tone", label: "Friendly Tone", icon: "🤝" },
  { id: "email-writer", label: "Write Email", icon: "📧" },
  { id: "custom", label: "Custom Prompt", icon: "⚡" },
];
