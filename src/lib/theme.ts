export type ThemeMode = "light" | "dark";

export function readThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem("theme");
  return stored === "light" ? "light" : "dark";
}

export function applyThemeMode(mode: ThemeMode) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved = mode === "dark" ? (prefersDark ? "dark" : "light") : mode;
  const root = document.documentElement;
  root.classList.add("theme-anim");
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  if (mode === "dark") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", mode);
  }
  root.style.colorScheme = resolved;
  window.setTimeout(() => root.classList.remove("theme-anim"), 400);
}

export const THEME_INIT_SCRIPT = `(function(){try{(function(){var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark')?stored:'light';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='dark'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='dark'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;})()}catch(e){}})();`;