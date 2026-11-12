import * as c from '@frogpond/colors'

/** The colours a Markdown body draws in, as `react-native-enriched-markdown` takes them. */
export type MarkdownColors = {
	label: string
	link: string
	secondarySystemBackground: string
	separator: string
}

// `c.label`/`c.link` are `PlatformColor(...)` objects. `MarkdownStyle`'s
// public type declares `color?: string`, but the library's own
// `normalizeMarkdownStyle` pipes colors through RN's `processColor()` into
// the Fabric codegen schema, which types color props as real `ColorValue` —
// so `PlatformColor` values work at runtime and adapt to the system color
// scheme automatically. The casts only satisfy the narrower public type.
const COLORS: MarkdownColors = {
	label: c.label as unknown as string,
	link: c.link as unknown as string,
	secondarySystemBackground: c.secondarySystemBackground as unknown as string,
	separator: c.separator as unknown as string,
}

/** The Markdown colours: iOS's semantic colours, which follow light and dark on their own. */
export function useMarkdownColors(): MarkdownColors {
	return COLORS
}
