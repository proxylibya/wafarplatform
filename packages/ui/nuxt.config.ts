// The Wafar UI layer: the tokens, the component primitives, and the shell. A
// consuming app imports the layer's CSS and inherits its components.
import { fileURLToPath } from 'node:url';

// Resolved against this file, because a layer's `~` is the consuming app's
// source directory and the components live in the layer's own `app/` tree.
const componentsDir = fileURLToPath(new URL('./app/components', import.meta.url));

export default defineNuxtConfig({
  dir: {
    app: 'app',
  },
  // The consuming app imports `@wafar/ui/tokens.css` from its own entry; the
  // layer does not repeat the import here, where Nuxt resolves `~` against the
  // consuming application's source directory.
  components: [{ path: componentsDir, pathPrefix: false }],
  imports: {
    dirs: ['composables'],
  },
  typescript: {
    strict: true,
  },
});
