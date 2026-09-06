import { useEffect, useState } from 'react'
import { ShieldCheck, Youtube, KeyRound } from 'lucide-react'
import { api } from './lib/api.js'

export default function App() {
  const [config, setConfig] = useState(null)
  const [auth, setAuth] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.config().then(setConfig).catch((e) => setError(e.message))
    api.auth.status().then(setAuth).catch((e) => setError(e.message))
  }, [])

  const connect = async () => {
    const { url } = await api.auth.url()
    window.location.href = url
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-emerald-400" />
          <div>
            <h1 className="text-2xl font-semibold">TrueCopy</h1>
            <p className="text-zinc-400 text-sm">Your channel in every language, certified a true copy.</p>
          </div>
        </header>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <section className="rounded-lg border border-zinc-800 p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <KeyRound className="w-4 h-4" />
            <span>LLM: {config ? `${config.llmProvider} / ${config.llmModel} (${config.llmKeyPresent ? 'key present' : 'no key'})` : '…'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Youtube className="w-4 h-4" />
            <span>
              {auth
                ? auth.connected
                  ? `Connected to ${auth.channelTitle}`
                  : auth.message
                : '…'}
            </span>
            {auth && !auth.connected && auth.configured && (
              <button onClick={connect} className="ml-auto rounded bg-emerald-500 px-3 py-1 text-sm text-black hover:bg-emerald-400">
                Connect YouTube
              </button>
            )}
          </div>
        </section>

        <p className="text-zinc-500 text-xs">
          Backend client lives in <code>src/lib/api.js</code>. Replace this screen.
        </p>
      </div>
    </main>
  )
}
