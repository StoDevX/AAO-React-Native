import {useHasEverBeenFocused} from '../../lib/use-has-ever-been-focused'
import {useHomeLayoutStore} from '../home/store'

/**
 * Whether a cafe should hold off building its menu.
 *
 * The tiled home opens Menus as tabs, and `NativeTabs` builds every tab the
 * moment Menus opens, so a reader who only wants one cafe pays for all of
 * them. A cafe defers until it is asked for. The other layouts open each cafe
 * on its own, so the cafe is already the one in front and has nothing to wait for.
 */
export function useCafeDeferred(): boolean {
	let tabbed = useHomeLayoutStore((state) => state.layout === 'tiled')
	let hasBeenFocused = useHasEverBeenFocused()

	return tabbed && !hasBeenFocused
}
