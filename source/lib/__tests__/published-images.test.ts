import {existsSync} from 'node:fs'
import {join} from 'node:path'
import {describe, expect, it} from '@jest/globals'

import groups from '../../../images/groups.json'
import {CAMPUSES, type CampusDefinition} from '../../campuses'
import {IMAGE_GROUPS} from '../remote-images'

const IMAGES = join(__dirname, '..', '..', '..', 'images')

const published = (group: string, name: string): boolean =>
	existsSync(join(IMAGES, group, `${name}.webp`))

// `scripts/bundle-images.test.mjs` checks the names the yaml data gives; these
// are the names written in code, which nothing else would catch a rename of.
describe('the images the code names', () => {
	it('are all published', () => {
		let campuses: ReadonlyArray<CampusDefinition> = CAMPUSES
		// A dev-only campus's logos may name no image yet (KMNK's doesn't); the
		// player draws a blank label for those.
		let streaming = campuses
			.filter((campus) => !campus.devOnly)
			.flatMap((campus) => campus.radio?.stations ?? [])
			.flatMap((station) => station.logos.map((logo) => logo.imageName))
		let news = campuses.flatMap((campus) =>
			campus.news && campus.news.source.thumbnail !== false ? [campus.news.source.thumbnail] : [],
		)

		expect([
			...streaming.filter((name) => !published('streaming', name)),
			...news.filter((name) => !published('news-sources', name)),
		]).toStrictEqual([])
	})
})

describe('the image groups', () => {
	it('are the ones images/groups.json lists, which the publishing scripts read', () => {
		expect([...IMAGE_GROUPS].toSorted()).toStrictEqual([...groups].toSorted())
	})
})
