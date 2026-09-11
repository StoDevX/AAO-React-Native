/** How one value reads in the debug list, and whether it can be opened. */
export interface ValueDescription {
	detail: string
	isDrillable: boolean
}

/// Beyond this a value would push the row's own key off the screen.
const MAX_STRING_LENGTH = 20

/**
 * Describes an arbitrary value for a debug row: short enough to sit beside its
 * key, and says whether there is anything inside worth opening.
 *
 * Arrays are counted rather than printed -- `Array(400)` is useful where four
 * hundred elements are not.
 */
export function describeValue(value: unknown): ValueDescription {
	if (Array.isArray(value)) {
		return {detail: `Array(${value.length})`, isDrillable: true}
	}

	// `typeof null` is 'object', so null has to be excluded here or it would
	// claim to be drillable and open an empty screen.
	if (typeof value === 'object' && value !== null) {
		// oxlint-disable-next-line typescript/no-base-to-string
		return {detail: value.toString(), isDrillable: true}
	}

	if (typeof value === 'string') {
		let detail =
			value.length > MAX_STRING_LENGTH
				? `"${value.substring(0, MAX_STRING_LENGTH)}…"`
				: JSON.stringify(value)
		return {detail, isDrillable: false}
	}

	return {detail: JSON.stringify(value), isDrillable: false}
}
