import type {ColorValue} from 'react-native'

/// Colours reach SwiftUI through `UIColor(red:green:blue:alpha:)`, which since
/// iOS 10 is *extended* sRGB: components outside 0...1 are legal and address
/// colours beyond sRGB's gamut. That is the only way to name a Display P3
/// colour from here. Expo's colour parser has no P3 syntax -- hex, rgb(), hsl()
/// and hwb() all land in that same initializer with their components clamped
/// into sRGB -- but a colour given as an array of numbers is passed through
/// unclamped, so components can go where a string cannot.
///
/// This matters because the card gradients were sampled from screenshots that
/// are themselves Display P3. Passing those raw values back as sRGB hex renders
/// a visibly more saturated colour than the one that was measured: sampled
/// #7fe07e came back off a device as #95dc87.

/// sRGB and Display P3 share a white point (D65) and a transfer function, and
/// differ only in their primaries, so converting between them is one matrix
/// applied in linear light. These are the RGB-to-XYZ matrices for each.
type Matrix = readonly [
	readonly [number, number, number],
	readonly [number, number, number],
	readonly [number, number, number],
]
type Triple = [number, number, number]

const P3_TO_XYZ: Matrix = [
	[0.4865709, 0.2656677, 0.1982173],
	[0.2289746, 0.6917385, 0.0792869],
	[0.0, 0.0451134, 1.0439444],
]
const XYZ_TO_SRGB: Matrix = [
	[3.2409699, -1.5373832, -0.4986108],
	[-0.9692436, 1.8759675, 0.0415551],
	[0.0556301, -0.203977, 1.0569715],
]

function apply(matrix: Matrix, [x, y, z]: Triple): Triple {
	return [
		matrix[0][0] * x + matrix[0][1] * y + matrix[0][2] * z,
		matrix[1][0] * x + matrix[1][1] * y + matrix[1][2] * z,
		matrix[2][0] * x + matrix[2][1] * y + matrix[2][2] * z,
	]
}

/// The sRGB transfer function, and its inverse, extended through zero by
/// mirroring. Extended sRGB is defined that way, and a P3 colour outside the
/// sRGB gamut lands on the negative side of it.
function toLinear(value: number): number {
	let magnitude = Math.abs(value)
	let linear =
		magnitude <= 0.04045
			? magnitude / 12.92
			: ((magnitude + 0.055) / 1.055) ** 2.4
	return Math.sign(value) * linear
}

function fromLinear(value: number): number {
	let magnitude = Math.abs(value)
	let encoded =
		magnitude <= 0.0031308
			? magnitude * 12.92
			: 1.055 * magnitude ** (1 / 2.4) - 0.055
	return Math.sign(value) * encoded
}

/// Reads the CSS Color 4 `color(display-p3 r g b)` form, with an optional
/// `/ alpha`. Components are 0...1 numbers or percentages.
///
/// Colours are written this way rather than as hex so that a P3 value cannot be
/// mistaken for an sRGB one. They are different colours that would otherwise
/// look identical in source, and passing one where the other is expected is a
/// silently-wrong render rather than an error. React Native's own parser
/// rejects this syntax, so the mistake fails loudly there too.
///
/// It is also the syntax React Native's own wide-gamut proposal uses, so if
/// that ever lands on the JS side these values can be passed straight through
/// and the conversion below deleted.
const FUNCTION_NAME = 'color'
const COLOUR_SPACE = 'display-p3'

function component(text: string): number {
	let value = text.endsWith('%')
		? Number(text.slice(0, -1)) / 100
		: Number(text)
	if (Number.isNaN(value) || text === '') {
		throw new Error(`"${text}" is not a number or percentage`)
	}
	return value
}

function parseDisplayP3(css: string): [Triple, number] {
	let reject = (): never => {
		throw new Error(`"${css}" is not a color(display-p3 ...) colour`)
	}

	// Split on delimiters rather than matching with a regular expression. An
	// expression general enough to allow whitespace anywhere ends up able to
	// attribute the same run of spaces to more than one part of itself, which
	// backtracks badly on input that never matches -- CodeQL flags it as a
	// polynomial ReDoS, and it is one. Scanning is linear and says what it means.
	let text = css.trim()
	let open = text.indexOf('(')
	if (open === -1 || !text.endsWith(')')) reject()
	if (text.slice(0, open).trim().toLowerCase() !== FUNCTION_NAME) reject()

	let body = text.slice(open + 1, -1).trim()
	let space = body.search(/\s/u)
	if (space === -1) reject()
	if (body.slice(0, space).toLowerCase() !== COLOUR_SPACE) reject()

	let [components, alpha, ...rest] = body.slice(space).split('/')
	if (rest.length > 0) reject()

	let parts = components.trim().split(/\s+/u)
	if (parts.length !== 3) {
		throw new Error(
			`color(${COLOUR_SPACE} ...) takes three components, got ${parts.length}`,
		)
	}
	let [red, green, blue] = parts.map(component) as Triple
	return [[red, green, blue], alpha === undefined ? 1 : component(alpha.trim())]
}

/// The components of a Display P3 colour, expressed in extended sRGB.
export type ExtendedSrgbComponents = [number, number, number, number]

/// Converts a `color(display-p3 ...)` colour into the components that reproduce
/// it. Values outside 0...1 are expected and must not be clamped:
/// they are what carries a colour sRGB cannot otherwise reach.
export function displayP3Components(css: string): ExtendedSrgbComponents {
	let [p3, alpha] = parseDisplayP3(css)
	let linearP3 = p3.map(toLinear) as Triple
	let [red, green, blue] = apply(XYZ_TO_SRGB, apply(P3_TO_XYZ, linearP3)).map(
		fromLinear,
	) as Triple
	return [red, green, blue, alpha]
}

/// The same thing, typed for the props that take a colour.
///
/// @expo/ui types a colour as `string | ColorValue | NamedColor`, which is what
/// its *parser* accepts; the array form goes to the same place but is missing
/// from the type. The cast is the one place that gap is papered over, rather
/// than at each of the call sites.
export function displayP3(css: string): ColorValue {
	return displayP3Components(css) as unknown as ColorValue
}
