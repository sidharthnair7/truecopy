const BASE = import.meta.env.VITE_API_BASE ?? ''

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    ...options,
  })
  const text = await res.text()
  const body = text ? JSON.parse(text) : null
  if (!res.ok) {
    const message = body?.message ?? `${res.status} ${res.statusText}`
    const error = new Error(message)
    error.status = res.status
    error.body = body
    throw error
  }
  return body
}

const get = (path) => request(path)
const post = (path, data) => request(path, { method: 'POST', body: data === undefined ? undefined : JSON.stringify(data) })

export const api = {
  config: () => get('/api/config'),

  auth: {
    status: () => get('/api/auth/status'),
    url: () => get('/api/auth/url'),
    disconnect: () => post('/api/auth/disconnect'),
  },

  channel: () => get('/api/channel'),
  videos: (max = 25) => get(`/api/videos?max=${max}`),
  video: (id) => get(`/api/videos/${encodeURIComponent(id)}`),
  readback: (id, hl) => get(`/api/videos/${encodeURIComponent(id)}/readback?hl=${encodeURIComponent(hl)}`),
  quota: () => get('/api/quota'),

  translate: {
    preview: ({ title, description, language, sourceLanguage }) =>
      post('/api/translate/preview', { title, description, language, sourceLanguage }),
  },

  gate: {
    check: ({ sourceTitle, sourceDescription, translatedTitle, translatedDescription }) =>
      post('/api/gate/check', { sourceTitle, sourceDescription, translatedTitle, translatedDescription }),
    tokens: (text) => post('/api/gate/tokens', { text }),
  },

  runs: {
    start: ({ videoIds, languages, sourceLanguage, maxVideos, dryRun }) =>
      post('/api/runs', { videoIds, languages, sourceLanguage, maxVideos, dryRun }),
    list: () => get('/api/runs'),
    get: (id) => get(`/api/runs/${encodeURIComponent(id)}`),
  },
}

export function pollRun(id, onUpdate, intervalMs = 2000) {
  let stopped = false
  const tick = async () => {
    if (stopped) return
    try {
      const run = await api.runs.get(id)
      onUpdate(run)
      if (run.status === 'COMPLETED' || run.status === 'FAILED') return
    } catch (e) {
      onUpdate(null, e)
    }
    setTimeout(tick, intervalMs)
  }
  tick()
  return () => { stopped = true }
}
