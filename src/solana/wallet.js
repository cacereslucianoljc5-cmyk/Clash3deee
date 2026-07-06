// Lightweight Solana integration.
//
// Instead of pulling the full wallet-adapter dependency tree (and its Node
// polyfills), this talks directly to an injected wallet provider (Phantom,
// Solflare, Backpack, …) and to a JSON-RPC endpoint over plain `fetch`. That is
// enough to: connect a wallet, show its address, read the devnet SOL balance,
// and sign a message so a submitted score is provably tied to the wallet.

export const RPC_ENDPOINT =
  import.meta.env.VITE_SOLANA_RPC || 'https://api.devnet.solana.com';

export const CLUSTER = import.meta.env.VITE_SOLANA_CLUSTER || 'devnet';

const LAMPORTS_PER_SOL = 1_000_000_000;

// Detect the injected provider. Phantom exposes `window.solana`; others expose
// themselves under `window.<name>` but almost all set `isPhantom`-style flags.
export function getProvider() {
  if (typeof window === 'undefined') return null;
  const anyWin = window;
  if (anyWin.solana?.isPhantom) return anyWin.solana;
  if (anyWin.phantom?.solana) return anyWin.phantom.solana;
  if (anyWin.backpack) return anyWin.backpack;
  if (anyWin.solflare?.isSolflare) return anyWin.solflare;
  if (anyWin.solana) return anyWin.solana; // generic wallet-standard provider
  return null;
}

export function hasWallet() {
  return !!getProvider();
}

export async function connect() {
  const provider = getProvider();
  if (!provider) {
    throw new Error(
      'No se detectó una wallet de Solana. Instala Phantom, Solflare o Backpack.',
    );
  }
  const res = await provider.connect();
  const publicKey =
    res?.publicKey?.toString?.() || provider.publicKey?.toString?.();
  if (!publicKey) throw new Error('La wallet no devolvió una clave pública.');
  return { provider, publicKey };
}

export async function disconnect() {
  const provider = getProvider();
  try {
    await provider?.disconnect?.();
  } catch (_) {
    /* ignore */
  }
}

// Balance via JSON-RPC — no web3.js needed.
export async function getBalance(publicKey) {
  const body = {
    jsonrpc: '2.0',
    id: 1,
    method: 'getBalance',
    params: [publicKey, { commitment: 'confirmed' }],
  };
  const resp = await fetch(RPC_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`RPC error ${resp.status}`);
  const json = await resp.json();
  if (json.error) throw new Error(json.error.message || 'RPC error');
  const lamports = json.result?.value ?? 0;
  return lamports / LAMPORTS_PER_SOL;
}

const textEncoder = new TextEncoder();

// Ask the wallet to sign an arbitrary message. Returns a base64 signature or
// null if the wallet can't sign messages (score is still submitted, unsigned).
export async function signMessage(provider, message) {
  if (!provider?.signMessage) return null;
  try {
    const encoded = textEncoder.encode(message);
    const res = await provider.signMessage(encoded, 'utf8');
    const sig = res?.signature ?? res;
    if (!sig) return null;
    return btoa(String.fromCharCode(...new Uint8Array(sig)));
  } catch (_) {
    return null; // user declined
  }
}

export function shortAddress(pk, size = 4) {
  if (!pk) return '';
  return `${pk.slice(0, size)}…${pk.slice(-size)}`;
}
