/**
 * Byte and percentage formatting for the pull request report.
 */

const UNITS = ['B', 'KiB', 'MiB', 'GiB']

/** Formats a byte count: `512 B`, `12.3 KiB`, `4.21 MiB`. */
export function formatBytes(bytes) {
	let size = Math.abs(bytes)
	let unit = 0
	let text = size.toFixed(0)
	// Round before picking the unit, so 1048575 B reads `1.00 MiB`, not `1024.0 KiB`.
	while (Number(text) >= 1024 && unit < UNITS.length - 1) {
		size /= 1024
		unit += 1
		text = size.toFixed(unit === 1 ? 1 : 2)
	}
	return `${bytes < 0 ? '-' : ''}${text} ${UNITS[unit]}`
}

/** Formats a change with its sign: `+12.3 KiB`, `-512 B`, `0 B`. */
export function formatDelta(bytes) {
	return bytes > 0 ? `+${formatBytes(bytes)}` : formatBytes(bytes)
}

/**
 * Formats a change as a percentage of `before`: `+0.3%`, `+0.02%` where one
 * place would round a real change to nothing, `<0.01%` where two would; empty
 * when there is no before.
 */
export function formatPercent(delta, before) {
	if (!before) {
		return ''
	}
	let percent = (delta / before) * 100
	let places = delta !== 0 && Math.abs(percent) < 0.05 ? 2 : 1
	if (delta !== 0 && Math.abs(percent) < 0.005) {
		return '<0.01%'
	}
	return `${percent > 0 ? '+' : ''}${percent.toFixed(places)}%`
}
