/**
 * The letter (or short group name) a native A-Z jumplist rail shows for the
 * `Section` this is attached to. Native on iOS 26+ via a patch to `@expo/ui`
 * (`patches/@expo__ui@57.0.14.patch`); below that it no-ops.
 */
export function sectionIndexLabel(label: string): {$type: 'sectionIndexLabel'; label: string} {
	return {$type: 'sectionIndexLabel', label}
}
