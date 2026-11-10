// The appearance state: per device, light by default, one stored choice, and a
// pre-paint bootstrap that sets the attribute before first paint (FR-025).
import { ref } from 'vue';

const STORAGE_KEY = 'wafar.appearance';
export type Appearance = 'light' | 'dark';

/** The inline bootstrap: it runs before paint and never flashes. */
export const appearanceBootstrap = `(function(){try{var v=localStorage.getItem('${STORAGE_KEY}');document.documentElement.dataset.appearance=v==='dark'?'dark':'light';}catch(e){document.documentElement.dataset.appearance='light';}})();`;

function read(): Appearance {
  if (typeof localStorage === 'undefined') return 'light';
  return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
}

export function useAppearance() {
  const appearance = ref<Appearance>('light');

  function apply(next: Appearance): void {
    appearance.value = next;
    if (typeof document !== 'undefined') {
      document.documentElement.dataset['appearance'] = next;
    }
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // A blocked store leaves the session's choice in memory only.
    }
  }

  function init(): void {
    apply(read());
  }

  function toggle(): void {
    apply(appearance.value === 'dark' ? 'light' : 'dark');
  }

  return { appearance, init, apply, toggle };
}
