type NavigationGuardOptions = {
	/** How long the stack must sit still after it changes before the next navigation is allowed. */
	settleMs: number
	/** The longest a navigation holds the lock when the stack never changes. */
	timeoutMs: number
}

type NavigationGuard = {
	/** Drops calls to `navigate` while an earlier navigation is still pending. */
	wrap: <Args extends unknown[]>(navigate: (...args: Args) => void) => (...args: Args) => void
	/** Tells the guard the navigation stack changed. */
	stateChanged: () => void
}

/**
 * Lets one navigation through at a time.
 *
 * A second tap that lands before the first screen has appeared would otherwise
 * push its own screen on top of the first. The lock starts on an accepted
 * navigation and ends once the stack has changed and then sat still for
 * `settleMs`, which covers the push animation. `timeoutMs` frees it when no
 * change comes, as when navigating to the screen already on top.
 */
export function createNavigationGuard({
	settleMs,
	timeoutMs,
}: NavigationGuardOptions): NavigationGuard {
	let locked = false
	let timer: ReturnType<typeof setTimeout> | undefined

	function unlockAfter(ms: number): void {
		clearTimeout(timer)
		timer = setTimeout(() => {
			locked = false
		}, ms)
	}

	return {
		wrap:
			(navigate) =>
			(...args) => {
				if (locked) {
					return
				}

				locked = true
				unlockAfter(timeoutMs)
				navigate(...args)
			},
		stateChanged: () => {
			if (locked) {
				unlockAfter(settleMs)
			}
		},
	}
}
