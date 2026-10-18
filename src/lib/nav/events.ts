// Simple event emitter for cross-component communication
type Listener = () => void

const listeners = new Set<Listener>()

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function emit(): void {
  listeners.forEach((listener) => listener())
}
