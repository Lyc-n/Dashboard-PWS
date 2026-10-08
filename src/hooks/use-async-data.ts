import { useCallback, useEffect, useRef, useState } from 'react'
import type { DependencyList } from 'react'

export interface UseAsyncDataOptions<T> {
  mapError: (err: unknown) => string
  cancel?: boolean
  onSuccess?: (data: T) => void
}

export function useAsyncData<T>(
  loader: () => Promise<T>,
  deps: DependencyList,
  initial: T,
  options: UseAsyncDataOptions<T>,
): {
  data: T
  loading: boolean
  error: string | null
  reload: () => Promise<void>
} {
  const [data, setData] = useState(initial)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loaderRef = useRef(loader)
  loaderRef.current = loader
  const optionsRef = useRef(options)
  optionsRef.current = options
  const epochRef = useRef(0)

  const reload = useCallback(async (): Promise<void> => {
    const opts = optionsRef.current
    const batal = opts.cancel !== false
    const epoch = ++epochRef.current
    setLoading(true)
    setError(null)
    try {
      const hasil = await loaderRef.current()
      if (batal && epoch !== epochRef.current) return
      setData(hasil)
      opts.onSuccess?.(hasil)
      setLoading(false)
    } catch (err) {
      if (batal && epoch !== epochRef.current) return
      setError(opts.mapError(err))
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
    return () => {
      epochRef.current += 1
    }
  }, deps)

  return { data, loading, error, reload }
}
