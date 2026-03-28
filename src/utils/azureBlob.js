/**
 * Direct upload to Azure Blob Storage using a SAS token (hackathon / dev).
 * Never commit real SAS values; use .env locally. SAS in the browser is visible — use short expiry + scoped permissions.
 */

function normalizeSas(sas) {
  if (!sas) return '';
  const t = String(sas).trim();
  return t.startsWith('?') ? t.slice(1) : t;
}

export function getAzureBlobConfig() {
  const account = import.meta.env.VITE_AZURE_STORAGE_ACCOUNT?.trim();
  const container = import.meta.env.VITE_AZURE_STORAGE_CONTAINER?.trim();
  const sas = normalizeSas(import.meta.env.VITE_AZURE_STORAGE_SAS);
  if (!account || !container || !sas) return null;
  return { account, container, sas };
}

export function isAzureUploadConfigured() {
  return getAzureBlobConfig() !== null;
}

export function buildBlobUrl(account, container, blobPath, sas) {
  const q = normalizeSas(sas);
  const path = blobPath.split('/').map(encodeURIComponent).join('/');
  return `https://${account}.blob.core.windows.net/${container}/${path}?${q}`;
}

async function putBlob(absoluteUrl, body, contentType) {
  const headers = {
    'x-ms-blob-type': 'BlockBlob',
    'Content-Type': contentType || 'application/octet-stream',
  };
  const res = await fetch(absoluteUrl, { method: 'PUT', headers, body });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Azure PUT failed ${res.status}: ${text || res.statusText}`);
  }
}

export async function uploadSessionReplayToAzure({
  patientId,
  sessionId,
  videoBlob,
  meta,
}) {
  const cfg = getAzureBlobConfig();
  if (!cfg || !videoBlob || videoBlob.size === 0) return { ok: false, reason: 'no_config_or_blob' };

  const { account, container, sas } = cfg;
  const basePath = `${patientId}/${sessionId}`;
  const videoPath = `${basePath}/replay.webm`;
  const videoUrl = buildBlobUrl(account, container, videoPath, sas);

  await putBlob(videoUrl, videoBlob, videoBlob.type || 'video/webm');

  const latest = {
    patientId,
    sessionId,
    promptTitle: meta?.promptTitle ?? '',
    promptId: meta?.promptId ?? '',
    sessionDate: meta?.sessionDate ?? new Date().toISOString(),
    stressScore: meta?.stressScore ?? null,
    patientName: meta?.patientName ?? null,
    videoPath,
    source: 'voicecanvas',
  };

  const latestPath = `${patientId}/latest-replay.json`;
  const latestUrl = buildBlobUrl(account, container, latestPath, sas);
  const jsonBody = new Blob([JSON.stringify(latest, null, 0)], { type: 'application/json' });
  await putBlob(latestUrl, jsonBody, 'application/json');

  return { ok: true, videoPath };
}
