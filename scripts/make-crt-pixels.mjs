/**
 * Draw the pixel layer of the CRT Old Main icon: `pixels.png` (green) and
 * `pixels-amber.png` (amber, the dark appearance) in assets/old-main-crt.icon/.
 * Each is rendered from an SVG kept beside it in `source/`, so edit the screen
 * below, or the SVG in a design tool, and run this to redraw the PNGs.
 *
 * The icon is Display P3 throughout. The palette holds P3 components, written
 * into the SVG as plain `rgb()`: librsvg would clip `color(display-p3 …)` to
 * sRGB. The render keeps those numbers as they are, and the PNG is then tagged
 * with the Display P3 profile rather than converted to it.
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

/** @param {typeof GREEN} palette */
export function pixelsSvg(palette) {
	let [r, g, b] = palette.glow.map((c) => round(c / 255, 4))
	let glow = GLOW.map(
		({blur, opacity}, i) =>
			`<feGaussianBlur in="SourceGraphic" stdDeviation="${blur}" result="blur${i}"/>
			<feColorMatrix in="blur${i}" values="0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${b}  0 0 0 ${opacity} 0" result="halo${i}"/>`,
	).join('\n\t\t\t')
	let cells = cellPositions(SCREEN)
		.map(({x, y}) => `<use href="#cell" x="${x}" y="${y}"/>`)
		.join('\n\t\t')
	let first = round(LEFT + PITCH)
	let last = round(LEFT + PITCH * (SCREEN[0].length - 1))

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}" viewBox="0 0 ${CANVAS} ${CANVAS}">
	<defs>
		<linearGradient id="phosphor" gradientUnits="userSpaceOnUse" x1="${first}" x2="${last}" y1="0" y2="0">
			<stop offset="0" stop-color="${rgb(palette.ends)}"/>
			<stop offset="0.08" stop-color="${rgb(palette.fill)}"/>
			<stop offset="0.92" stop-color="${rgb(palette.fill)}"/>
			<stop offset="1" stop-color="${rgb(palette.ends)}"/>
		</linearGradient>
		<filter id="glow" color-interpolation-filters="sRGB" x="-30%" y="-30%" width="160%" height="160%">
			${glow}
			<feMerge>${GLOW.map((_, i) => `<feMergeNode in="halo${GLOW.length - 1 - i}"/>`).join('')}</feMerge>
		</filter>
		<rect id="cell" x="${RIM / 2}" y="${RIM / 2}" width="${CELL - RIM}" height="${CELL - RIM}" rx="3" stroke-width="${RIM}"/>
		<g id="screen">
		${cells}
		</g>
	</defs>
	<use href="#screen" filter="url(#glow)"/>
	<use href="#screen" fill="url(#phosphor)" stroke="${rgb(palette.rim)}"/>
</svg>
`
}

/** @param {number} n @param {number} [places] */
function round(n, places = 2) {
	let scale = 10 ** places
	return Math.round(n * scale) / scale
}

const P3_PROFILE = '/System/Library/ColorSync/Profiles/Display P3.icc'
const ASSETS = join('assets', 'old-main-crt.icon', 'Assets')
const SOURCE = join('assets', 'old-main-crt.icon', 'source')

function main() {
	mkdirSync(SOURCE, {recursive: true})
	for (let palette of [GREEN, AMBER]) {
		let svg = join(SOURCE, `${palette.name}.svg`)
		let png = join(ASSETS, `${palette.name}.png`)
		writeFileSync(svg, pixelsSvg(palette))
		// The render is untagged, so -profile assigns P3 and leaves the pixels alone.
		execFileSync('magick', ['-background', 'none', svg, '-profile', P3_PROFILE, png])
		execFileSync('oxipng', ['--quiet', '--strip', 'safe', png])
		console.log(`make-crt-pixels: ${svg} -> ${png}`)
	}
}

if (import.meta.main) {
	main()
}
