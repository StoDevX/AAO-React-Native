/**
 * Draw the pixel layers of the Old Main (Retro) icon in assets/old-main-retro.icon/:
 * green for the light appearance, amber for the dark. Each color gets two
 * layers, so edit the screen below and run this to redraw both:
 *
 * - `pixels.svg`, the lit cells, which Icon Composer draws as a vector.
 * - `pixels-glow.png`, the glow under them, rendered from `source/pixels-glow.svg`
 *   at quarter size, since Icon Composer ignores SVG filters.
 *
 * The icon is Display P3 throughout. The palette holds P3 components, written
 * into the SVGs as plain `rgb()`. icon.json reads untagged SVG colors as P3,
 * and librsvg would clip `color(display-p3 …)` to sRGB. The glow's render keeps
 * those numbers as they are, and the PNG is then tagged with the Display P3
 * profile rather than converted to it.
 */
import {execFileSync} from 'node:child_process'
import {mkdirSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'

/**
 * Old Main on its hill, one character per phosphor pixel. The hill mirrors left
 * to right; the flag above the spire does not.
 */
export const SCREEN = [
	'...........##.............',
	'............#.............',
	'............#.............',
	'............#.............',
	'............#.............',
	'............##............',
	'...........####...........',
	'...........####...........',
	'...........####...........',
	'..........######..........',
	'..........######..........',
	'..........######..........',
	'..........######..........',
	'..##......######......##..',
	'..##......######......##..',
	'.###......######......###.',
	'.########################.',
	'.########################.',
	'.########################.',
	'.########################.',
	'.########################.',
	'.########################.',
	'.########........########.',
	'.####....########....####.',
	'.....################.....',
	'.########################.',
	'..######################..',
	'...####################...',
]

const CANVAS = 1024
const PITCH = 26.83
const CELL = 22
const RIM = 2
/** The left edge of the first column and the bottom edge of the last row. */
const LEFT = 166
const BOTTOM = 918 + CELL

/** Display P3 components, 0 to 255. `ends` is the screen's darker left and right edge. */
export const GREEN = {
	name: 'pixels',
	fill: [202, 255, 53],
	ends: [186, 255, 49],
	rim: [160, 255, 42],
	glow: [150, 255, 40],
}

export const AMBER = {
	name: 'pixels-amber',
	fill: [255, 148, 0],
	ends: [255, 137, 0],
	rim: [250, 122, 0],
	glow: [235, 111, 0],
}

/** The glow is a tight halo under a wide one; fitted to the layer this replaced. */
const GLOW = [
	{blur: 4, opacity: 0.95},
	{blur: 20, opacity: 0.7},
]

/**
 * @param {string[]} screen
 * @returns {{x: number, y: number}[]} the top-left corner of each lit pixel
 */
export function cellPositions(screen) {
	let positions = []
	for (let [row, line] of screen.entries()) {
		for (let col = 0; col < line.length; col++) {
			if (line[col] !== '.') {
				positions.push({
					x: round(LEFT + PITCH * col),
					y: round(BOTTOM - CELL - PITCH * (screen.length - 1 - row)),
				})
			}
		}
	}
	return positions
}

/** @param {number[]} c */
const rgb = (c) => `rgb(${c.join(' ')})`

/**
 * An SVG of the screen: every lit cell as a `<use>` of `#cell`, inside `#screen`.
 *
 * @param {string} defs the gradient or filter the body draws with
 * @param {string} body what to draw, as uses of `#screen`
 */
function screenSvg(defs, body) {
	let cells = cellPositions(SCREEN)
		.map(({x, y}) => `<use href="#cell" x="${x}" y="${y}"/>`)
		.join('\n\t\t')

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}" viewBox="0 0 ${CANVAS} ${CANVAS}">
	<defs>
		${defs}
		<rect id="cell" x="${RIM / 2}" y="${RIM / 2}" width="${CELL - RIM}" height="${CELL - RIM}" rx="3" stroke-width="${RIM}"/>
		<g id="screen">
		${cells}
		</g>
	</defs>
	${body}
</svg>
`
}

/**
 * The lit cells, without their glow. Icon Composer reads this SVG itself, and
 * it drops filters without a word, so the glow is a separate raster layer.
 *
 * @param {typeof GREEN} palette
 */
export function cellsSvg(palette) {
	let first = round(LEFT + PITCH)
	let last = round(LEFT + PITCH * (SCREEN[0].length - 1))

	return screenSvg(
		`<linearGradient id="phosphor" gradientUnits="userSpaceOnUse" x1="${first}" x2="${last}" y1="0" y2="0">
			<stop offset="0" stop-color="${rgb(palette.ends)}"/>
			<stop offset="0.08" stop-color="${rgb(palette.fill)}"/>
			<stop offset="0.92" stop-color="${rgb(palette.fill)}"/>
			<stop offset="1" stop-color="${rgb(palette.ends)}"/>
		</linearGradient>`,
		`<use href="#screen" fill="url(#phosphor)" stroke="${rgb(palette.rim)}"/>`,
	)
}

/**
 * The glow under the cells alone, for librsvg to render into the glow layer.
 *
 * @param {typeof GREEN} palette
 */
export function glowSvg(palette) {
	let [r, g, b] = palette.glow.map((c) => round(c / 255, 4))
	let halos = GLOW.map(
		({blur, opacity}, i) =>
			`<feGaussianBlur in="SourceGraphic" stdDeviation="${blur}" result="blur${i}"/>
			<feColorMatrix in="blur${i}" values="0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${b}  0 0 0 ${opacity} 0" result="halo${i}"/>`,
	).join('\n\t\t\t')

	return screenSvg(
		`<filter id="glow" color-interpolation-filters="sRGB" x="-30%" y="-30%" width="160%" height="160%">
			${halos}
			<feMerge>${GLOW.map((_, i) => `<feMergeNode in="halo${GLOW.length - 1 - i}"/>`).join('')}</feMerge>
		</filter>`,
		`<use href="#screen" filter="url(#glow)"/>`,
	)
}

/** @param {number} n @param {number} [places] */
function round(n, places = 2) {
	let scale = 10 ** places
	return Math.round(n * scale) / scale
}

const P3_PROFILE = '/System/Library/ColorSync/Profiles/Display P3.icc'
const ASSETS = join('assets', 'old-main-retro.icon', 'Assets')
const SOURCE = join('assets', 'old-main-retro.icon', 'source')
/**
 * The glow layer's width in pixels. The blur leaves nothing a full-size layer
 * would show, and icon.json scales the layer up by `CANVAS / GLOW_SIZE`.
 */
const GLOW_SIZE = 256

function main() {
	mkdirSync(SOURCE, {recursive: true})
	for (let palette of [GREEN, AMBER]) {
		let cells = join(ASSETS, `${palette.name}.svg`)
		writeFileSync(cells, cellsSvg(palette))
		console.log(`make-crt-pixels: ${cells}`)

		let svg = join(SOURCE, `${palette.name}-glow.svg`)
		let png = join(ASSETS, `${palette.name}-glow.png`)
		writeFileSync(svg, glowSvg(palette))
		// The render is untagged, so -profile assigns P3 and leaves the pixels alone.
		execFileSync('magick', [
			'-background',
			'none',
			svg,
			'-resize',
			`${GLOW_SIZE}x${GLOW_SIZE}`,
			'-depth',
			'8',
			'-profile',
			P3_PROFILE,
			png,
		])
		execFileSync('oxipng', ['--quiet', '--strip', 'safe', png])
		console.log(`make-crt-pixels: ${svg} -> ${png}`)
	}
}

if (import.meta.main) {
	main()
}
