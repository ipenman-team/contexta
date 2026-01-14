export type ViewId = "dashboard" | "contexta-ai" | "settings";

export type Selected =
  | { kind: "view"; id: ViewId }
  | { kind: "page"; id: string; title: string };
