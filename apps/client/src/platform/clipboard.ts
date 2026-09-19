export async function setStringAsync(value: string): Promise<void> {
  if (!navigator.clipboard) throw new Error("Clipboard access is unavailable");
  await navigator.clipboard.writeText(value);
}
