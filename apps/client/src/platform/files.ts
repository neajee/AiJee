export interface DocumentPickerAsset { uri: string; name: string; mimeType?: string; size?: number; file?: globalThis.File; }
export interface DocumentPickerResult { canceled: boolean; assets: DocumentPickerAsset[]; }

export async function getDocumentAsync(options: { multiple?: boolean; type?: string; copyToCacheDirectory?: boolean; base64?: boolean }): Promise<DocumentPickerResult> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = options.multiple ?? false;
    input.accept = options.type && options.type !== "*/*" ? options.type : "*/*";
    input.onchange = () => resolve({ canceled: !input.files?.length, assets: Array.from(input.files ?? []).map((file) => ({ uri: URL.createObjectURL(file), name: file.name, mimeType: file.type, size: file.size, file })) });
    input.click();
  });
}

export const Paths = { document: "" };
export class File {
  constructor(public readonly uri: string, public readonly name = "download") {}
  get exists(): boolean { return false; }
  delete(): void {}
  create(_options?: unknown): void {}
  write(_data: Uint8Array): void {}
  async base64(): Promise<string> { const bytes = new Uint8Array(await (await fetch(this.uri)).arrayBuffer()); let binary = ""; bytes.forEach((byte) => { binary += String.fromCharCode(byte); }); return btoa(binary); }
}
