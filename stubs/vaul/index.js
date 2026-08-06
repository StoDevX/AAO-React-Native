// vaul is a web drawer library. @expo/ui depends on it unconditionally, but only
// its web BottomSheet implementations import it -- nothing under swift-ui does,
// and this app is iOS only. Pulling the real package in drags 28 transitive
// packages (@radix-ui/*, react-dom) into the tree for code that can never run.
//
// Anything that reaches this at runtime is importing a web-only component on
// iOS, so fail loudly rather than silently rendering nothing.
const notAvailable = () => {
	throw new Error(
		"vaul is stubbed: @expo/ui's web BottomSheet is not available in this app. " +
			'Use a SwiftUI component from @expo/ui/swift-ui instead, or remove the ' +
			'vaul override in package.json if the web implementation is genuinely needed.',
	)
}

export const Drawer = new Proxy({}, {get: notAvailable, apply: notAvailable})
