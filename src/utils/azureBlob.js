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

async function getBlobJson(account, container, blobPath, sas) {
  const url = buildBlobUrl(account, container, blobPath, sas);
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/** Prepends session to rolling list (max 100) for clinic session picker. */
async function mergeSessionsManifest(cfg, patientId, sessionEntry) {
  const path = `${patientId}/sessions-manifest.json`;
  const { account, container, sas } = cfg;
  let prev = await getBlobJson(account, container, path, sas);
  const sessions = Array.isArray(prev?.sessions) ? prev.sessions : [];
  const existing = sessions.find((s) => String(s.sessionId) === String(sessionEntry.sessionId));
  const filtered = sessions.filter((s) => String(s.sessionId) !== String(sessionEntry.sessionId));
  // Preserve existing videoPath / drawingPath if the new entry doesn't have them
  // (happens when triggerAzureShare re-uploads only the drawing, not the video)
  const merged = {
    ...sessionEntry,
    videoPath: sessionEntry.videoPath ?? existing?.videoPath ?? null,
    drawingPath: sessionEntry.drawingPath ?? existing?.drawingPath ?? null,
  };
  const next = [merged, ...filtered].slice(0, 100);
  const doc = {
    patientId,
    sessions: next,
    updatedAt: new Date().toISOString(),
  };
  const url = buildBlobUrl(account, container, path, sas);
  await putBlob(url, new Blob([JSON.stringify(doc)], { type: 'application/json' }), 'application/json');
}

/**
 * @param {Blob | null} videoBlob - Webcam recording
 * @param {Blob | null} [canvasBlob] - PNG from canvas.toBlob() (preferred; avoids fetch(dataURL) failures on large canvases)
 * @param {string} [canvasDataUrl] - Fallback if canvasBlob not provided
 */
export async function uploadSessionReplayToAzure({
  patientId,
  sessionId,
  videoBlob,
  canvasBlob,
  canvasDataUrl,
  meta,
}) {
  const cfg = getAzureBlobConfig();
  if (!cfg) return { ok: false, reason: 'no_config' };

  const hasVideo = videoBlob && videoBlob.size > 0;

  let pngBlob = null;
  if (canvasBlob instanceof Blob && canvasBlob.size > 0) {
    pngBlob = canvasBlob;
  } else if (typeof canvasDataUrl === 'string' && canvasDataUrl.startsWith('data:')) {
    try {
      pngBlob = await fetch(canvasDataUrl).then((r) => r.blob());
    } catch (e) {
      console.warn('Azure: could not convert canvas data URL to blob', e);
    }
  }
  const hasDrawing = pngBlob && pngBlob.size > 0;

  if (!hasVideo && !hasDrawing) return { ok: false, reason: 'nothing_to_upload' };

  const { account, container, sas } = cfg;
  const basePath = `${patientId}/${sessionId}`;

  let videoPath = null;
  if (hasVideo) {
    try {
      const vp = `${basePath}/replay.webm`;
      await putBlob(
        buildBlobUrl(account, container, vp, sas),
        videoBlob,
        videoBlob.type || 'video/webm'
      );
      videoPath = vp;
    } catch (e) {
      console.warn('Azure: video upload failed', e);
    }
  }

  let drawingPath = null;
  if (hasDrawing) {
    try {
      const dp = `${basePath}/drawing.png`;
      await putBlob(
        buildBlobUrl(account, container, dp, sas),
        pngBlob,
        pngBlob.type || 'image/png'
      );
      drawingPath = dp;
    } catch (e) {
      console.warn('Azure: drawing PNG upload failed', e);
    }
  }

  if (!videoPath && !drawingPath) return { ok: false, reason: 'all_uploads_failed' };

  // If this call has no video, preserve the existing videoPath from latest-replay.json
  let preservedVideoPath = videoPath;
  let preservedDrawingPath = drawingPath;
  if (!videoPath || !drawingPath) {
    const latestExisting = await getBlobJson(account, container, `${patientId}/latest-replay.json`, sas);
    if (latestExisting && String(latestExisting.sessionId) === String(sessionId)) {
      if (!videoPath) preservedVideoPath = latestExisting.videoPath ?? null;
      if (!drawingPath) preservedDrawingPath = latestExisting.drawingPath ?? null;
    }
  }

  const latest = {
    patientId,
    sessionId,
    promptTitle: meta?.promptTitle ?? '',
    promptId: meta?.promptId ?? '',
    sessionDate: meta?.sessionDate ?? new Date().toISOString(),
    stressScore: meta?.stressScore ?? null,
    patientName: meta?.patientName ?? null,
    videoPath: preservedVideoPath,
    drawingPath: preservedDrawingPath,
    source: 'voicecanvas',
  };

  const latestPath = `${patientId}/latest-replay.json`;
  const latestUrl = buildBlobUrl(account, container, latestPath, sas);
  const jsonBody = new Blob([JSON.stringify(latest, null, 0)], { type: 'application/json' });
  await putBlob(latestUrl, jsonBody, 'application/json');

  const sessionEntry = {
    sessionId,
    videoPath: preservedVideoPath,
    drawingPath: preservedDrawingPath,
    promptTitle: meta?.promptTitle ?? '',
    promptId: meta?.promptId ?? '',
    sessionDate: latest.sessionDate,
    stressScore: meta?.stressScore ?? null,
    patientName: meta?.patientName ?? null,
  };
  await mergeSessionsManifest(cfg, patientId, sessionEntry);

  return { ok: true, videoPath, drawingPath };
}
