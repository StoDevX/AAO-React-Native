#!/usr/bin/env node
/**
 * Measure the native app for the pull request report: what one iPhone
 * installs from an unsigned Release archive built without its JS bundle.
 *
 * Unsigned means no App Store thinning, so the asset catalog is thinned here
 * with assetutil for one device. The figure tracks App Store Connect's
 * closely without matching it exactly.
 */

import {execFileSync} from 'node:child_process'
import {cpSync, lstatSync, mkdtempSync, readdirSync, statSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {basename, join} from 'node:path'

import {APP_SIZE_VERSION} from './report-version.mjs'

/** The iPhone the report measures for. Current iPhones thin almost alike. */
export const DEVICE = 'iPhone18,3'

/**
 * assetutil's thinning traits for DEVICE. They come within 0.1% of actool's
 * own `--filter-for-device-model` thinning. The catalog has no memory- or
 * GPU-specific renditions, so those two only need to be plausible.
 */
const THINNING_ARGS = [
	'--idiom',
	'phone',
	'--scale',
	'3',
	'--display-gamut',
	'p3',
	'--memory',
	'8',
	'--graphicsclass',
	'APPLE10',
	'--deployment-target',
	'2027',
]

/**
 * Every regular file under `dir`, with its bytes, as paths relative to `dir`.
 * A symlink counts as nothing and is not followed: the file it points at is
 * counted where it lives.
 */
export function listFiles(dir, prefix = '') {
	let files = []
	for (let name of readdirSync(join(dir, prefix))) {
		let path = prefix ? `${prefix}/${name}` : name
		let stat = lstatSync(join(dir, path))
		if (stat.isDirectory()) {
			files.push(...listFiles(dir, path))
		} else if (stat.isFile()) {
			files.push({path, bytes: stat.size})
		}
	}
	return files
}

/**
 * Names the group a file in the `.app` belongs to: the asset catalog, its
 * framework or plug-in, the main binary, or `(other)`.
 */
export function groupOf(path, executable) {
	let [top, name] = path.split('/')
	if ((top === 'Frameworks' || top === 'PlugIns') && name !== undefined) {
		return `${top}/${name}`
	}
	if (path === 'Assets.car' || path === executable) {
		return path
	}
	return '(other)'
}

/** Sums file bytes by group. */
export function groupFiles(files, executable) {
	let groups = {}
	for (let {path, bytes} of files) {
		let group = groupOf(path, executable)
		groups[group] = (groups[group] ?? 0) + bytes
	}
	return groups
}

/**
 * Sums `assetutil --info`'s renditions by asset name. Its first element
 * describes the catalog and has no size, so only entries with one count.
 */
export function bytesByAsset(info) {
	let assets = {}
	for (let entry of info) {
		if (Number.isFinite(entry.SizeOnDisk)) {
			let name = entry.Name ?? '(unnamed)'
			assets[name] = (assets[name] ?? 0) + entry.SizeOnDisk
		}
	}
	return assets
}

/**
 * Throws unless thinning removed something. A car no smaller than the
 * universal one means the traits matched no variant, which would report the
 * universal size as one iPhone's.
 */
export function checkThinned(universalBytes, thinnedBytes) {
	if (thinnedBytes <= 0) {
		throw new Error('The thinned Assets.car is empty.')
	}
	if (thinnedBytes >= universalBytes) {
		throw new Error(
			`The thinned Assets.car (${thinnedBytes} B) is no smaller than the universal one (${universalBytes} B); check the thinning traits.`,
		)
	}
}

/** Builds `app-size.json`. The install size is every group's bytes. */
export function buildAppReport({sha, measuredSha, byGroup, byAsset, downloadBytes}) {
	return {
		version: APP_SIZE_VERSION,
		sha,
		measuredSha,
		device: DEVICE,
		installBytes: Object.values(byGroup).reduce((sum, bytes) => sum + bytes, 0),
		downloadBytes,
		byGroup,
		byAsset,
	}
}

/**
 * Measures the archive's `.app` with its asset catalog thinned for DEVICE,
 * and writes the report to `out`.
 */
function main() {
	let [archive, out] = process.argv.slice(2)
	let sha = process.env.APP_SIZE_SHA
	if (!sha) {
		throw new Error('APP_SIZE_SHA is not set.')
	}
	let apps = join(archive, 'Products/Applications')
	let appName = readdirSync(apps).find((name) => name.endsWith('.app'))
	if (!appName) {
		throw new Error(`No .app in ${apps}.`)
	}

	// A copy, so swapping in the thinned car leaves the archive as built.
	let work = mkdtempSync(join(tmpdir(), 'app-size-'))
	let app = join(work, appName)
	cpSync(join(apps, appName), app, {recursive: true, verbatimSymlinks: true})

	let car = join(app, 'Assets.car')
	let thinned = join(work, 'Assets.car')
	execFileSync('xcrun', ['assetutil', ...THINNING_ARGS, '-o', thinned, car], {stdio: 'inherit'})
	checkThinned(statSync(car).size, statSync(thinned).size)
	cpSync(thinned, car)

	let executable = execFileSync(
		'plutil',
		['-extract', 'CFBundleExecutable', 'raw', join(app, 'Info.plist')],
		{encoding: 'utf8'},
	).trim()
	let info = JSON.parse(execFileSync('xcrun', ['assetutil', '--info', car], {encoding: 'utf8'}))

	let zip = join(work, 'app.zip')
	execFileSync('zip', ['-q', '-r', '-X', '-y', zip, basename(app)], {cwd: work})

	let report = buildAppReport({
		sha,
		measuredSha: sha,
		byGroup: groupFiles(listFiles(app), executable),
		byAsset: bytesByAsset(info),
		downloadBytes: statSync(zip).size,
	})
	writeFileSync(out, `${JSON.stringify(report, null, '\t')}\n`)
	console.error(`Wrote ${out}`)
}

if (import.meta.main) {
	main()
}
