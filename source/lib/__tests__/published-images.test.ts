import {existsSync} from 'node:fs'
import {join} from 'node:path'
import {describe, expect, it} from '@jest/globals'

import groups from '../../../images/groups.json'
import {OLAF_MESSENGER, STOLAF_NEWS} from '../../features/news/sources'
import {STATIONS} from '../../features/streaming/radio/stations'
import {IMAGE_GROUPS} from '../remote-images'

const IMAGES = join(__dirname, '..', '..', '..', 'images')

const published = (group: string, name: string): boolean =>
	existsSync(join(IMAGES, group, `${name}.webp`))

// `scripts/bundle-images.test.mjs` checks the names the yaml data gives; these
// are the names written in code, which nothing else would catch a rename of.
describe('the images the code names', () => {
	it('are all published', () => {
		let streaming = Object.values(STATIONS).flatMap((station) =>
			station.logos.map((logo) => logo.imageName),
		)
		let news = [OLAF_MESSENGER, STOLAF_NEWS].flatMap((source) =>
			source.thumbnail === false ? [] : [source.thumbnail],
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
