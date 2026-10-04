/**
 * Byte and percentage formatting for the pull request report.
 */

const UNITS = ['B', 'KiB', 'MiB', 'GiB']

/** Formats a byte count: `512 B`, `12.3 KiB`, `4.21 MiB`. */
export function formatBytes(bytes) {
	let size = Math.abs(bytes)
	let unit = 0
	while (size >= 1024 && unit < UNITS.length - 1) {
		size /= 1024
		unit += 1
	}
	let digits = unit === 0 ? 0 : unit === 1 ? 1 : 2
	return `${bytes < 0 ? '-' : ''}${size.toFixed(digits)} ${UNITS[unit]}`
}

/** Formats a change with its sign: `+12.3 KiB`, `-512 B`, `0 B`. */
export function formatDelta(bytes) {
	return bytes > 0 ? `+${formatBytes(bytes)}` : formatBytes(bytes)
}

/** Formats a change as a percentage of `before`: `+0.3%`; empty when there is no before. */
export function formatPercent(delta, before) {
	if (!before) {
		return ''
	}
	let percent = (delta / before) * 100
	return `${percent > 0 ? '+' : ''}${percent.toFixed(1)}%`
}
