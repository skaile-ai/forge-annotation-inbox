import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

// The package's own runner. Nothing here needs a DOM or Nuxt: one spec drives
// the inbox handler through a real `http.createServer`, the other reads the
// package's source off disk. It exists so the layer can be checked out on its
// own — after the extraction this directory is a repository — and a repository
// whose tests only run from inside somebody else's suite has no tests. While
// the layer is still in tree the host repo's root config includes the same
// files in its `unit` project, so both entry points run them.
// `plugin-vue` compiles `src/vue/AnnotationList.vue` for its component spec,
// which opts into a DOM per file (`@vitest-environment happy-dom`); everything
// else stays on the node environment. `agentation-vue` is inlined for the same
// reason: it ships `AgentationVue.vue` as a raw SFC in `dist/`, which Node
// cannot load, and the toolbar-placement spec runs the library's settings store.
export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'node',
    include: ['test/**/*.spec.ts'],
    server: { deps: { inline: ['agentation-vue'] } },
  },
})
