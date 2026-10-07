import { useEffect, useState } from "react";

/**
 * Ikuti breakpoint media query lewat `matchMedia`, bukan lewat CSS.
 *
 * Nilai awal selalu `false`: hook ini dipanggil saat render, sementara
 * `matchMedia` hanya boleh dibaca di browser. Render pertama di mobile
 * karena itu selalu melihat kondisi "bukan mobile", lalu efek di bawah yang
 * mengoreksinya setelah hidrasi.
 *
 * Pakai CSS (`max-md:hidden`) kalau hanya butuh menyembunyikan elemen —
 * tanpa ada flash dan tanpa hook. Hook ini untuk kasus yang butuh
 * percabangan render beneran, bukan sekadar visibilitas.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

/** `true` saat viewport lebih sempit dari breakpoint Tailwind `md` (768px). */
export function useIsMobile(breakpoint = 768): boolean {
  return useMediaQuery(`(max-width: ${breakpoint - 1}px)`);
}
