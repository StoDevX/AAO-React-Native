import {router} from 'expo-router'

import {createNavigationGuard} from './navigation-guard'

/**
 * The guard on every `router.navigate` in the app.
 *
 * `useRouter()` hands every screen this same `router` object, so wrapping its
 * method here covers each call site at once. `push` is left alone: lint bans
 * it. The stack must change and then sit still for 400ms before another
 * navigation is allowed -- a push animation runs about that long -- and 2s
 * frees the lock when a navigation changes nothing.
 */
export const navigationGuard = createNavigationGuard({settleMs: 400, timeoutMs: 2000})

router.navigate = navigationGuard.wrap(router.navigate)
