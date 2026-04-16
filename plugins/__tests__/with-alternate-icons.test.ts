import path from 'node:path'

import {describe, expect, it, jest} from '@jest/globals'
import xcode from 'xcode'

import type {XcodeProject} from '../with-alternate-icons'
import {
	addAlternateIcons,
	addWindmillResources,
	ALTERNATE_ICON_FILE,
	ALTERNATE_ICON_KEY,
	WINDMILL_RESOURCE_FILES,
} from '../with-alternate-icons'

function loadFixtureProject(): XcodeProject {
	const fixturePath = path.join(
		__dirname,
		'../../ios/AllAboutOlaf.xcodeproj/project.pbxproj',
	)
	const project = xcode.project(fixturePath)
	project.parseSync()
	return project as unknown as XcodeProject
}

function stripExistingWindmillRefs(project: XcodeProject): void {
	for (const filename of WINDMILL_RESOURCE_FILES) {
		try {
			;(
				project as unknown as {removeResourceFile: (f: string) => void}
			).removeResourceFile(filename)
		} catch {
			// not present — ignore
		}
	}
}

function findResourceBuildFile(
	project: XcodeProject,
	filename: string,
): unknown {
	const buildFiles = (
		project as unknown as {
			pbxBuildFileSection: () => Record<string, {fileRef_comment?: string}>
		}
	).pbxBuildFileSection()
	for (const key of Object.keys(buildFiles)) {
		if (key.endsWith('_comment')) continue
		if (buildFiles[key].fileRef_comment?.includes(filename)) {
			return buildFiles[key]
		}
	}
	return undefined
}

function countWindmillBuildFiles(project: XcodeProject): number {
	const buildFiles = (
		project as unknown as {
			pbxBuildFileSection: () => Record<string, {fileRef_comment?: string}>
		}
	).pbxBuildFileSection()
	let count = 0
	for (const key of Object.keys(buildFiles)) {
		if (key.endsWith('_comment')) continue
		const ref = buildFiles[key].fileRef_comment
		if (ref && WINDMILL_RESOURCE_FILES.some((f) => ref.includes(f))) count++
	}
	return count
}

describe('addAlternateIcons', () => {
	it('adds windmill entry to CFBundleIcons and CFBundleIcons~ipad when neither exists', () => {
		const result = addAlternateIcons({CFBundleName: '$(PRODUCT_NAME)'})

		const expectedEntry = {
			CFBundleIconFiles: [ALTERNATE_ICON_FILE],
			UIPrerenderedIcon: true,
		}

		const phoneIcons = result.CFBundleIcons as {
			CFBundleAlternateIcons: Record<string, unknown>
		}
		const ipadIcons = result['CFBundleIcons~ipad'] as {
			CFBundleAlternateIcons: Record<string, unknown>
		}
		expect(phoneIcons.CFBundleAlternateIcons[ALTERNATE_ICON_KEY]).toEqual(
			expectedEntry,
		)
		expect(ipadIcons.CFBundleAlternateIcons[ALTERNATE_ICON_KEY]).toEqual(
			expectedEntry,
		)
	})

	it('is idempotent — running twice produces the same result', () => {
		const input = {CFBundleName: '$(PRODUCT_NAME)'}
		const once = addAlternateIcons(input)
		const twice = addAlternateIcons(once)
		expect(twice).toEqual(once)
	})

	it('preserves unrelated alternate icons on both keys', () => {
		const input = {
			CFBundleIcons: {
				CFBundleAlternateIcons: {
					other_icon: {
						CFBundleIconFiles: ['other'],
						UIPrerenderedIcon: false,
					},
				},
			},
		}
		const result = addAlternateIcons(input)
		const phoneIcons = result.CFBundleIcons as {
			CFBundleAlternateIcons: Record<string, unknown>
		}
		expect(phoneIcons.CFBundleAlternateIcons.other_icon).toEqual({
			CFBundleIconFiles: ['other'],
			UIPrerenderedIcon: false,
		})
		expect(phoneIcons.CFBundleAlternateIcons[ALTERNATE_ICON_KEY]).toEqual({
			CFBundleIconFiles: ['windmill'],
			UIPrerenderedIcon: true,
		})
	})

	it('does not mutate other top-level Info.plist keys', () => {
		const input = {
			CFBundleName: '$(PRODUCT_NAME)',
			CFBundleDisplayName: 'All About Olaf',
			NSAppTransportSecurity: {NSAllowsArbitraryLoads: false},
		}
		const result = addAlternateIcons(input)
		expect(result.CFBundleName).toBe('$(PRODUCT_NAME)')
		expect(result.CFBundleDisplayName).toBe('All About Olaf')
		expect(result.NSAppTransportSecurity).toEqual({
			NSAllowsArbitraryLoads: false,
		})
	})
})

describe('addWindmillResources', () => {
	it('registers all four windmill PNGs on the main app target', () => {
		const project = loadFixtureProject()
		stripExistingWindmillRefs(project)

		const result = addWindmillResources(project)

		for (const filename of WINDMILL_RESOURCE_FILES) {
			const added = findResourceBuildFile(result, filename)
			expect(added).toBeDefined()
		}
	})

	it('is idempotent — does not register duplicates on second run', () => {
		const project = loadFixtureProject()
		stripExistingWindmillRefs(project)

		addWindmillResources(project)
		const afterFirst = countWindmillBuildFiles(project)

		addWindmillResources(project)
		const afterSecond = countWindmillBuildFiles(project)

		expect(afterFirst).toBe(WINDMILL_RESOURCE_FILES.length)
		expect(afterSecond).toBe(WINDMILL_RESOURCE_FILES.length)
	})

	it('throws a descriptive error if the main app target is absent', () => {
		const fakeProject = {
			pbxTargetByName: () => undefined,
			addResourceFile: jest.fn(),
		} as unknown as XcodeProject
		expect(() => addWindmillResources(fakeProject)).toThrow(
			/could not find target "AllAboutOlaf"/,
		)
	})
})
