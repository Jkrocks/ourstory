// Uploads go straight from the browser into the signed-in person's own Google Drive.
// The site can only see files it created itself (scope: drive.file).
export const GOOGLE_CLIENT_ID = ((import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? '').trim();
export const driveUploadReady = () => !!GOOGLE_CLIENT_ID;

const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const FOLDER_KEY = 'ourstory-drive-folder';
let token = '';
let expires = 0;
let gis: Promise<void> | null = null;

function loadGis(): Promise<void> {
  gis ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => { gis = null; reject(new Error('drive_script')); };
    document.head.appendChild(s);
  });
  return gis;
}
/** Warm up so the Google pop-up can open the moment a button is pressed. */
export const prepareDrive = () => { if (GOOGLE_CLIENT_ID) loadGis().catch(() => {}); };

/** Ask Google for permission (a pop-up the first time). Call this directly from a button press. */
export async function connectDrive(): Promise<string> {
  if (!GOOGLE_CLIENT_ID) throw new Error('drive_not_set');
  if (token && Date.now() < expires - 60_000) return token;
  await loadGis();
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = (window as any).google;
    const client = g.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPE,
      callback: (r: { access_token?: string; expires_in?: number; error?: string }) => {
        if (!r.access_token) return reject(new Error(r.error || 'drive_denied'));
        token = r.access_token;
        expires = Date.now() + (Number(r.expires_in) || 3600) * 1000;
        resolve(token);
      },
      error_callback: (e: { type?: string }) => reject(new Error(e?.type || 'drive_popup')),
    });
    client.requestAccessToken({ prompt: token ? '' : undefined });
  });
}

async function api(path: string, init: RequestInit = {}) {
  const t = await connectDrive();
  const r = await fetch(`https://www.googleapis.com/${path}`, { ...init, headers: { ...(init.headers ?? {}), Authorization: `Bearer ${t}` } });
  if (!r.ok) throw new Error(`drive_${r.status}`);
  return r.json();
}

async function folderId(): Promise<string> {
  let saved = '';
  try { saved = localStorage.getItem(FOLDER_KEY) ?? ''; } catch { /* private window */ }
  if (saved) {
    try { const f = await api(`drive/v3/files/${saved}?fields=id,trashed`); if (!f.trashed) return saved; } catch { /* gone, make a new one */ }
  }
  const q = encodeURIComponent("name='OurStory' and mimeType='application/vnd.google-apps.folder' and trashed=false");
  const found = await api(`drive/v3/files?q=${q}&fields=files(id)&pageSize=1`);
  const id: string = found.files?.[0]?.id ?? (await api('drive/v3/files?fields=id', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'OurStory', mimeType: 'application/vnd.google-apps.folder' }),
  })).id;
  try { localStorage.setItem(FOLDER_KEY, id); } catch { /* fine */ }
  return id;
}

/** Puts the file in the "OurStory" folder of the person's Drive, makes it viewable by link, returns its id. */
export async function uploadToDrive(blob: Blob, kind: 'photo' | 'video'): Promise<string> {
  const parent = await folderId();
  const type = blob.type || (kind === 'photo' ? 'image/jpeg' : 'video/mp4');
  const ext = type.split('/')[1]?.split(';')[0] || (kind === 'photo' ? 'jpg' : 'mp4');
  const name = `ourstory-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
  const boundary = `os${Math.random().toString(36).slice(2)}`;
  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name, parents: [parent] })}\r\n`,
    `--${boundary}\r\nContent-Type: ${type}\r\n\r\n`, blob, `\r\n--${boundary}--`,
  ]);
  const file = await api('upload/drive/v3/files?uploadType=multipart&fields=id', {
    method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body,
  });
  await api(`drive/v3/files/${file.id}/permissions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'reader', type: 'anyone' }),
  });
  return file.id as string;
}
