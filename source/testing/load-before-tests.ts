import * as ReactNative from 'react-native'

/**
 * Loads the named React Native exports now, rather than in whichever test first renders them.
 * React Native loads each export on first use, and Jest's preset builds the stand-ins for
 * several, `Modal` and `Image` among them, from the real modules: over a second to load with a
 * cold transform cache, and several on a busy machine. Called at a suite's top level, before any
 * test's five-second timeout starts, that cost cannot time a test out.
 */
export function loadBeforeTests(...names: Array<keyof typeof ReactNative>): void {
	for (let name of names) {
		void ReactNative[name]
	}
}
