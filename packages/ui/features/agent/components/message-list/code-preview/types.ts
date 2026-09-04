export interface CodePreviewProps {
  code: string;
  isDark: boolean;
  maxHeight?: number;
  startLine?: number;
  language?: string;
  diffLanguage?: string;
  showLineNumbers?: boolean;
  fill?: boolean;
  bare?: boolean;
}
