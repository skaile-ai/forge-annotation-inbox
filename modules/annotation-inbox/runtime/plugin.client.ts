import { defineNuxtPlugin, useRuntimeConfig } from '#app'
import { mountAnnotationToolbar } from './mount'
import type { AnnotationToolbarOptions } from './mount'

/**
 * The Nuxt end of the shared mount. Registered by the package's Nuxt module;
 * the `.client` suffix and `mode: 'client'` keep it out of Nitro, because the
 * mount touches `document` and the toolbar reads `sessionStorage`. The base and
 * the toolbar's default placement are the module's `base` and
 * `toolbarPlacement` options, handed over through public runtime config; the
 * mount validates the placement.
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig().public.annotationInbox as AnnotationToolbarOptions | undefined
  mountAnnotationToolbar({ base: config?.base, toolbarPlacement: config?.toolbarPlacement })
})
