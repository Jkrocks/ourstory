// One place for every photo/video source the app understands:
//   scene:…  painted demo art      idb:…  saved in this browser
//   sb:…     uploaded to the family's cloud storage      yt:…  a YouTube video
import { sceneUrl } from './scenes';
import { getMediaUrl, mediaUrlSync as localSync, putMedia, deleteMedia } from './storage';
import { cloudUrl, cloudUrlSync, removeFromCloud } from './cloud';
import { uid } from './utils';
import { uploadToDrive } from './drive';

let mode: 'local' | 'cloud' | 'inline' = 'local';
export const setMediaMode = (m: 'local' | 'cloud' | 'inline') => { mode = m; };
export const mediaMode = () => mode;

export async function uploadMedia(blob: Blob, kind: 'photo' | 'video'): Promise<string> {
  // Live site: photos and videos go to Google Drive only. (Older sb: files still show.)
  if (mode === 'cloud') return `gd:${await uploadToDrive(blob, kind)}`;
  if (mode === 'inline') {
    // the album is embedded in the page, so photos travel as small data URLs; video files are too big
    if (kind === 'video') throw new Error('video_inline');
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });
  }
  const id = uid();
  await putMedia(id, blob);
  return `idb:${id}`;
}

export function mediaUrlSync(src?: string): string | undefined {
  if (!src) return undefined;
  if (src.startsWith('scene:')) return sceneUrl(src);
  if (src.startsWith('idb:')) return localSync(src.slice(4));
  if (src.startsWith('sb:')) return cloudUrlSync(src.slice(3));
  if (src.startsWith('yt:')) return ytThumb(src.slice(3));
  if (src.startsWith('gd:')) return driveImage(src.slice(3));
  return src;
}

export async function mediaUrl(src?: string): Promise<string | undefined> {
  if (!src) return undefined;
  if (src.startsWith('idb:')) return getMediaUrl(src.slice(4));
  if (src.startsWith('sb:')) return cloudUrl(src.slice(3));
  return mediaUrlSync(src);
}

export function removeMedia(src: string) {
  if (src.startsWith('idb:')) deleteMedia(src.slice(4));
  if (src.startsWith('sb:')) removeFromCloud(src.slice(3)).catch(() => {});
}

/* ---------- Google Drive ----------
   The file stays in your own Drive; the album only keeps its link.
   The file must be shared as "Anyone with the link can view" for it to show here. */
export function driveId(input: string): string | null {
  const s = input.trim();
  try {
    const u = new URL(s.startsWith('http') ? s : `https://${s}`);
    if (!/(^|\.)google\.com$/.test(u.hostname)) return null;
    const m = u.pathname.match(/\/(?:file|document|presentation)\/d\/([\w-]{20,})/) ?? u.pathname.match(/\/d\/([\w-]{20,})/);
    if (m) return m[1];
    const q = u.searchParams.get('id');
    if (q && /^[\w-]{20,}$/.test(q)) return q;
  } catch { /* not a url */ }
  return null;
}
export const isDriveFolder = (input: string) => /drive\.google\.com\/drive\/(u\/\d+\/)?folders\//.test(input);
export const driveImage = (id: string, w = 1600) => `https://drive.google.com/thumbnail?id=${id}&sz=w${w}`;
export const drivePreview = (id: string) => `https://drive.google.com/file/d/${id}/preview`;
export const driveOpen = (id: string) => `https://drive.google.com/file/d/${id}/view`;

/* ---------- YouTube ---------- */
export function ytId(input: string): string | null {
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s.startsWith('http') ? s : `https://${s}`);
    const host = u.hostname.replace(/^www\.|^m\./, '');
    if (host === 'youtu.be') return u.pathname.slice(1, 12) || null;
    if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
      const v = u.searchParams.get('v');
      if (v) return v.slice(0, 11);
      const m = u.pathname.match(/\/(?:shorts|embed|live|v)\/([\w-]{11})/);
      if (m) return m[1];
    }
  } catch { /* not a url */ }
  return null;
}
export const ytThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
export const ytWatch = (id: string) => `https://www.youtube.com/watch?v=${id}`;
export const ytEmbed = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
