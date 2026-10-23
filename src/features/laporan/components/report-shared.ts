export const TODAY = new Date().toLocaleDateString('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export const BRAND_ADDRESS =
  'Puskesmas Trajeng · Jl. Panglima Sudirman 12, Kota Pasuruan'

export function paginate<T>(rows: T[], page: number, pageSize: number) {
  const maxPage = Math.max(1, Math.ceil(rows.length / pageSize))
  const pageClamped = Math.min(page, maxPage)
  const pageRows = rows.slice(
    (pageClamped - 1) * pageSize,
    pageClamped * pageSize,
  )
  const info = `Hal ${pageClamped} · ${(pageClamped - 1) * pageSize + 1}–${Math.min(pageClamped * pageSize, rows.length)} dari ${rows.length}`
  return { maxPage, pageClamped, pageRows, info }
}
