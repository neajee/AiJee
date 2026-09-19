import type { ReactNode } from "react";

export interface useMarkdownHookOptions { styles?: Record<string, any>; colorScheme?: "light" | "dark"; theme?: { colors?: Record<string, string>; spacing?: Record<string, number> }; baseUrl?: string; tokenizer?: unknown; }
export class Renderer { private key = 0; getKey() { return `markdown-${this.key++}`; } code(text: string, _language?: string): ReactNode { return text; } table(header: ReactNode[][], rows: ReactNode[][][]): ReactNode { return [...header, ...rows].flat().flat() as ReactNode; } }
