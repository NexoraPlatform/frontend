export const TRUSTORA_THEME_ATTRIBUTE = "class";
export const TRUSTORA_THEME_DEFAULT = "system";
export const TRUSTORA_THEME_STORAGE_KEY = "trustora-theme";

// Keep this in sync with the current next-themes config used in the locale layout.
export function buildTrustoraThemeBootstrapScript() {
  return `!function(){try{var d=document.documentElement,c=d.classList;c.remove('light','dark');var e=localStorage.getItem('${TRUSTORA_THEME_STORAGE_KEY}');if('system'===e||(!e&&true)){var t='(prefers-color-scheme: dark)',m=window.matchMedia(t);if(m.media!==t||m.matches){d.style.colorScheme = 'dark';c.add('dark')}else{d.style.colorScheme = 'light';c.add('light')}}else if(e){c.add(e|| '')}if(e==='light'||e==='dark')d.style.colorScheme=e}catch(e){}}()`;
}
