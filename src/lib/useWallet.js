import { useCallback, useState } from 'react'

/**
 * Minimal wallet connect. Uses a real EIP-1193 provider (window.ethereum) when
 * present, otherwise falls back to a deterministic demo address so the landing
 * stays fully interactive without a wallet installed.
 *
 * Swap in wagmi/viem here when wiring the real contract; the returned shape
 * ({ address, connecting, connect, disconnect }) is what the UI consumes.
 */
export function useWallet() {
  const [address, setAddress] = useState(null)
  const [connecting, setConnecting] = useState(false)

  const connect = useCallback(async () => {
    setConnecting(true)
    try {
      const eth = typeof window !== 'undefined' ? window.ethereum : null
      if (eth && eth.request) {
        const accounts = await eth.request({ method: 'eth_requestAccounts' })
        if (accounts && accounts[0]) {
          setAddress(accounts[0])
          return
        }
      }
      // Demo fallback — lets the whole flow work with no wallet installed.
      await new Promise((r) => setTimeout(r, 650))
      setAddress('0xR0gue00000000000000000000000000000dEcaf')
    } finally {
      setConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => setAddress(null), [])

  const short = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : null

  return { address, short, connecting, connect, disconnect }
}
