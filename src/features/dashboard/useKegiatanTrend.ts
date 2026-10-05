import { useCallback, useEffect, useRef, useState } from "react"
import { getKegiatanMonthlyStats } from "@/lib/utils.functions"

export interface MonthlyKegiatanStat {
    month: string
    label: string
    totalKegiatan: number
    totalHadir: number
    totalPeserta: number
    pctHadir: number
    byJenis: Array<{ jenis: string; count: number }>
}

export function useKegiatanTrend() {
    const [data, setData] = useState<MonthlyKegiatanStat[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const epochRef = useRef(0)

    const reload = useCallback(async () => {
        const epoch = ++epochRef.current
        setLoading(true)
        setError(null)
        try {
            const hasil = await getKegiatanMonthlyStats()
            if (epoch !== epochRef.current) return
            setData(hasil)
        } catch (err) {
            if (epoch !== epochRef.current) return
            setError(err instanceof Error ? err.message : "Gagal memuat data trend kegiatan")
        } finally {
            if (epoch === epochRef.current) setLoading(false)
        }
    }, [])

    useEffect(() => {
        void reload()
    }, [reload])

    return { data, loading, error, reload }
}