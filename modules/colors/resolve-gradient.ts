import {
	blueGradient,
	goldGradient,
	grayGradient,
	greenGradient,
	indigoGradient,
	lightBlueGradient,
	mintGradient,
	orangeGradient,
	paleGoldGradient,
	pinkGradient,
	purpleGradient,
	redGradient,
	sageGradient,
	tanGradient,
	violetGradient,
	yellowGradient,
	type Gradient,
} from './gradients'

/// The names a data file may use, in the kebab-case those files are written in.
/// Mirrored by the `gradient` enum in `data/_schemas/contact-info.yaml`;
/// renaming an exported gradient breaks both.
const NAMED_GRADIENTS = new Map<string, Gradient>([
	['red', redGradient],
	['orange', orangeGradient],
	['gold', goldGradient],
	['yellow', yellowGradient],
	['green', greenGradient],
	['mint', mintGradient],
	['light-blue', lightBlueGradient],
	['blue', blueGradient],
	['indigo', indigoGradient],
	['purple', purpleGradient],
	['violet', violetGradient],
	['pink', pinkGradient],
	['gray', grayGradient],
	['sage', sageGradient],
	['tan', tanGradient],
	['pale-gold', paleGoldGradient],
])

/** Every gradient name a data file may use. */
export const GRADIENT_NAMES: readonly string[] = [...NAMED_GRADIENTS.keys()]

/** Painted when a data file names a gradient that does not exist. */
export const FALLBACK_GRADIENT: Gradient = grayGradient

/**
 * Resolves the `gradient` a data file carries: either one of `GRADIENT_NAMES`,
 * or an explicit `[inner, outer]` pair of Display P3 colours.
 *
 * Takes `unknown` because the value arrives as parsed JSON from the server,
 * where nothing has checked it. Falls back rather than throwing, so a typo
 * upstream paints a dull tile instead of taking the screen down.
 */
export function resolveGradient(value: unknown): Gradient {
	if (typeof value === 'string') {
		return NAMED_GRADIENTS.get(value) ?? FALLBACK_GRADIENT
	}

	if (Array.isArray(value) && value.length === 2) {
		let [inner, outer] = value
		if (typeof inner === 'string' && typeof outer === 'string') {
			return [inner, outer]
		}
	}

	return FALLBACK_GRADIENT
}
