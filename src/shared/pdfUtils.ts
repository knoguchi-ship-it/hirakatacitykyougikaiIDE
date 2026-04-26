// Google Drive URL から /preview URL を生成するユーティリティ

export function toPdfPreviewUrl(url: string): string {
  if (!url) return '';
  const m = url.match(/\/file\/d\/([^/]+)/);
  if (m?.[1]) return `https://drive.google.com/file/d/${m[1]}/preview`;
  const q = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (q?.[1]) return `https://drive.google.com/file/d/${q[1]}/preview`;
  return url;
}

export function extractDriveFileId(url: string): string | null {
  if (!url) return null;
  const m = url.match(/\/file\/d\/([^/]+)/);
  if (m?.[1]) return m[1];
  const q = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return q?.[1] ?? null;
}
