/**
 * Trace a logo into a custom SF Symbol: `assets/symbols/<name>.symbolset`,
 * which plugins/with-custom-symbols copies into the asset catalog.
 *
 *     node scripts/trace-symbol.mjs <image> <name>
 *
 * The image's dark pixels become the symbol and its light or transparent ones
 * the gaps, so a white mark on a dark disc traces as a disc with the mark cut
 * out. Needs ImageMagick and potrace: `brew install imagemagick potrace`.
 */
import {execFileSync} from 'node:child_process'
import {mkdirSync, mkdtempSync, readFileSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

const OUTPUT_DIR = join('assets', 'symbols')

/** circle.fill's diameter at Regular-M, so a traced disc matches the system's. */
const MEDIUM_SIZE = 99.6

/** SF Pro's cap height in template units; symbols centre on half of it. */
const CAP_HEIGHT = 70.459

/**
 * The scales the template draws, at Apple's scale factors, with each one's
 * baseline on the template. iOS falls back across weights but not scales, so
 * a missing scale draws nothing: the home screen asks for large.
 */
export const SCALES = [
	{scale: 'S', factor: 0.783, baseline: 696},
	{scale: 'M', factor: 1, baseline: 1126},
	{scale: 'L', factor: 1.29, baseline: 1556},
]

/** Where each variant's left margin sits on the template. */
const LEFT = 1400

/**
 * Restate one potrace path in a template variant's own space: x from the left
 * margin, y down from the baseline, centred on the cap height. Potrace writes
 * tenths of a bitmap pixel with y up, and uses only M, C, L and Z, absolute in
 * upper case and relative in lower.
 *
 * @param {string} d the path's data, as potrace writes it
 * @param {{height: number, unit: number}} geometry the bitmap's height in
 *   pixels, and the template units one pixel spans
 * @returns {string}
 */
export function symbolPath(d, {height, unit}) {
	let absolute = (x, y) => [(x / 10) * unit, (height / 2 - y / 10) * unit - CAP_HEIGHT / 2]
	let relative = (dx, dy) => [(dx / 10) * unit, (-dy / 10) * unit]

	let commands = d.match(/[MCLZ][^MCLZ]*/giu) ?? []
	return commands
		.map((command) => {
			let op = command[0]
			if (op === 'Z' || op === 'z') {
				return 'Z'
			}
			let numbers = (command.slice(1).match(/-?[\d.]+/gu) ?? []).map(Number)
			let place = op === op.toUpperCase() ? absolute : relative
			let points = []
			for (let i = 0; i < numbers.length; i += 2) {
				points.push(...place(numbers[i], numbers[i + 1]).map((n) => n.toFixed(4)))
			}
			return `${op}${points.join(' ')}`
		})
		.join('')
}

const MARGIN_STYLE = 'style="fill:none;stroke:#00AEEF;stroke-width:0.5;opacity:1.0;"'
const GUIDE_STYLE = 'style="fill:none;stroke:#27AAE1;opacity:1;stroke-width:0.5;"'

/**
 * An SF Symbols template holding the traced paths at Regular, at every scale.
 *
 * @param {{description: string, paths: string[], width: number, height: number}} trace
 *   potrace's paths, and the bitmap's size in pixels
 * @returns {string}
 */
export function symbolTemplate({description, paths, width, height}) {
	let guides = []
	let variants = []
	for (let {scale, factor, baseline} of SCALES) {
		let size = MEDIUM_SIZE * factor
		let unit = size / Math.max(width, height)
		let right = (LEFT + width * unit).toFixed(4)
		let capline = (baseline - CAP_HEIGHT).toFixed(3)
		let span = `y1="${(baseline - 95.21).toFixed(2)}" y2="${(baseline + 24.12).toFixed(2)}"`

		guides.push(
			`  <line id="Baseline-${scale}" ${GUIDE_STYLE} x1="263" x2="3036" y1="${baseline}" y2="${baseline}"/>`,
			`  <line id="Capline-${scale}" ${GUIDE_STYLE} x1="263" x2="3036" y1="${capline}" y2="${capline}"/>`,
			`  <line id="left-margin-Regular-${scale}" ${MARGIN_STYLE} x1="${LEFT}" x2="${LEFT}" ${span}/>`,
			`  <line id="right-margin-Regular-${scale}" ${MARGIN_STYLE} x1="${right}" x2="${right}" ${span}/>`,
		)
		variants.push(
			`  <g id="Regular-${scale}" transform="matrix(1 0 0 1 ${LEFT} ${baseline})">`,
			...paths.map(
				(d) =>
					`   <path class="monochrome-0 hierarchical-0:primary" d="${symbolPath(d, {height, unit})}"/>`,
			),
			'  </g>',
		)
	}

	return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="3300" height="2200">
 <g id="Notes">
  <rect height="2200" id="artboard" style="fill:white;opacity:1" width="3300" x="0" y="0"/>
  <text id="template-version" style="stroke:none;fill:black;font-family:sans-serif;font-size:13;text-anchor:end;" transform="matrix(1 0 0 1 3036 1933)">Template v.6.0</text>
  <text id="descriptive-name" style="stroke:none;fill:black;font-family:sans-serif;font-size:13;text-anchor:end;" transform="matrix(1 0 0 1 3036 1969)">${description}</text>
 </g>
 <g id="Guides">
${guides.join('\n')}
 </g>
 <g id="Symbols">
${variants.join('\n')}
 </g>
</svg>
`
}

/**
 * The asset catalog's record of a symbol set.
 *
 * @param {string} name
 * @returns {string}
 */
export function symbolSetContents(name) {
	let contents = {
		info: {author: 'xcode', version: 1},
		symbols: [{filename: `${name}.svg`, idiom: 'universal'}],
	}
	return `${JSON.stringify(contents, null, 2)}\n`
}

/**
 * Trace `image` with potrace, after ImageMagick flattens it onto white and
 * thresholds it to black and white.
 *
 * @param {string} image
 * @returns {{paths: string[], width: number, height: number}}
 */
function trace(image) {
	let dir = mkdtempSync(join(tmpdir(), 'trace-symbol-'))
	let bitmap = join(dir, 'trace.pbm')
	let vector = join(dir, 'trace.svg')

	// Flatten transparency onto white, threshold at mid-grey, and crop to the mark.
	let flatten = ['-background', 'white', '-alpha', 'remove']
	let threshold = ['-colorspace', 'gray', '-threshold', '50%']
	execFileSync('magick', [image, ...flatten, ...threshold, '-trim', '+repage', bitmap])
	// Smooth corners a little (-a), merge curves loosely (-O), and drop specks
	// under 20 pixels (-t).
	execFileSync('potrace', [bitmap, '-s', '-t', '20', '-a', '1.0', '-O', '0.4', '-o', vector])

	let svg = readFileSync(vector, 'utf8')
	let viewBox = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/u)
	if (!viewBox) {
		throw new Error('trace-symbol: potrace wrote no viewBox.')
	}
	return {
		paths: [...svg.matchAll(/<path d="([^"]+)"/gu)].map((match) => match[1]),
		width: Number(viewBox[1]),
		height: Number(viewBox[2]),
	}
}

function requireTool(command, flag) {
	try {
		execFileSync(command, [flag], {stdio: 'ignore'})
	} catch {
		throw new Error(
			`trace-symbol: needs ${command}. Install it with \`brew install imagemagick potrace\`.`,
		)
	}
}

function main() {
	let [image, name] = process.argv.slice(2)
	if (!image || !name) {
		console.error('usage: node scripts/trace-symbol.mjs <image> <name>')
		process.exit(2)
	}
	requireTool('magick', '-version')
	requireTool('potrace', '--version')

	let traced = trace(image)
	let dir = join(OUTPUT_DIR, `${name}.symbolset`)
	mkdirSync(dir, {recursive: true})
	writeFileSync(join(dir, `${name}.svg`), symbolTemplate({description: name, ...traced}))
	writeFileSync(join(dir, 'Contents.json'), symbolSetContents(name))
	console.log(`trace-symbol: wrote ${dir}`)
}

if (import.meta.main) {
	main()
}
