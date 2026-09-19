export interface ImageContent {
  type: "image";
  data: string;
  mimeType: string;
}

export interface TextContentBlock {
  type: "text";
  text: string;
}

export interface ThinkingContentBlock {
  type: "thinking";
  thinking: string;
}

export interface ToolCallContentBlock {
  type: "toolCall";
  id: string;
  name: string;
  arguments: Record<string, string>;
}

export type ContentBlock = TextContentBlock | ThinkingContentBlock | ToolCallContentBlock;

export interface ToolProgressStep {
  tool: string;
  args: string;
  endMs?: number;
}

export interface ToolProgressSnapshot {
  agent?: string;
  status?: string;
  durationMs?: number;
  toolCount?: number;
  recentTools?: ToolProgressStep[];
  recentOutput?: string[];
}

export interface ToolResultDetails {
  truncation?: string | null;
  fullOutputPath?: string | null;
  progress?: ToolProgressSnapshot[];
  [key: string]: unknown;
}

export interface ToolContent {
  content: ContentBlock[];
  details?: ToolResultDetails | null;
}
