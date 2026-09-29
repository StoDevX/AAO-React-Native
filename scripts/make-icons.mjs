/**
 * Render the in-app previews of each Icon Composer document in assets/: the
 * Settings picker's tile and the Credits screen's logo. Run after editing an
 * `.icon`; the PNGs are committed, since the renderer only ships with Xcode.
 */
import {execFileSync} from 'node:child_process'
import {readdirSync} from 'node:fs'
import {basename, join} from 'node:path'

/**
 * Icon Composer's own renderer. `xcrun ictool` is a different tool that shares
 * the name and rejects `--export-image`.
 */
const ICTOOL =
	'/Applications/Xcode.app/Contents/Applications/Icon Composer.app/Contents/Executables/ictool'

const SOURCE_DIR = 'assets'
const OUTPUT_DIR = join('images', 'icons')

/** Every iPhone the app supports is @3x; an iPad scales the preview down. */
const SCALE = 3

/** The size in points each preview is drawn at. */
const PREVIEWS = [
	// The picker row's tile; ICON_SIZE in change-icon.tsx.
	{suffix: 'icon', points: 28},
	// AppLogo on the Credits screen.
	{suffix: 'logo', points: 100},
]

/** ictool's renditions, one per app appearance the previews follow. */
const APPEARANCES = [
	{suffix: '', rendition: 'Default'},
	{suffix: '-dark', rendition: 'Dark'},
]

/**
 * The home screen's tinted look, which the app cannot detect, so nothing
 * shows these. `--all` renders them to review an icon change by eye; they
 * are gitignored.
 */
const TINTED_APPEARANCES = [
	{suffix: '-tinted-light', rendition: 'TintedLight'},
	{suffix: '-tinted-dark', rendition: 'TintedDark'},
]

/**
 * @param {string[]} entries the names in assets/
 * @param {{all?: boolean}} [options] `all` adds the tinted renditions
 * @returns {{input: string, output: string, points: number, rendition: string}[]}
 */
export function exportPlan(entries, {all = false} = {}) {
	let appearances = all ? [...APPEARANCES, ...TINTED_APPEARANCES] : APPEARANCES
	return entries
		.filter((entry) => entry.endsWith('.icon'))
		.flatMap((entry) =>
			PREVIEWS.flatMap(({suffix, points}) =>
				appearances.map((appearance) => ({
					input: join(SOURCE_DIR, entry),
					output: join(OUTPUT_DIR, `${basename(entry, '.icon')}-${suffix}${appearance.suffix}.png`),
					points,
					rendition: appearance.rendition,
				})),
			),
		)
}

function main() {
	let plan = exportPlan(readdirSync(SOURCE_DIR), {all: process.argv.includes('--all')})

	for (let {input, output, points, rendition} of plan) {
		console.log(`make-icons: ${input} -> ${output}`)
		execFileSync(ICTOOL, [
			input,
			'--export-image',
			'--output-file',
			output,
			'--platform',
			'iOS',
			'--rendition',
			rendition,
			'--width',
			String(points),
			'--height',
			String(points),
			'--scale',
			String(SCALE),
		])
	}

	execFileSync(
		'oxipng',
		['-o', 'max', '--strip', 'safe', '--zopfli', ...plan.map((p) => p.output)],
		{
			stdio: 'inherit',
		},
	)
}

if (import.meta.main) {
	main()
}
