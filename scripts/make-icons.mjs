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

/**
 * @param {string[]} entries the names in assets/
 * @returns {{input: string, output: string, points: number}[]}
 */
export function exportPlan(entries) {
	return entries
		.filter((entry) => entry.endsWith('.icon'))
		.flatMap((entry) =>
			PREVIEWS.map(({suffix, points}) => ({
				input: join(SOURCE_DIR, entry),
				output: join(OUTPUT_DIR, `${basename(entry, '.icon')}-${suffix}.png`),
				points,
			})),
		)
}

function main() {
	let plan = exportPlan(readdirSync(SOURCE_DIR))

	for (let {input, output, points} of plan) {
		console.log(`make-icons: ${input} -> ${output}`)
		execFileSync(ICTOOL, [
			input,
			'--export-image',
			'--output-file',
			output,
			'--platform',
			'iOS',
			'--rendition',
			'Default',
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
