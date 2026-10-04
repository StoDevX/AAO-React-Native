import {readFileSync, existsSync} from 'node:fs'
import {join} from 'node:path'
import {describe, expect, it} from '@jest/globals'

import {OLAF_MESSENGER, STOLAF_NEWS} from '../../features/news/sources'
import {RECORD_IMAGE_NAME, STATIONS} from '../../features/streaming/radio/stations'
import {IMAGE_GROUPS} from '../remote-images'

const IMAGES = join(__dirname, '..', '..', '..', 'images')

const published = (group: string, name: string): boolean =>
	existsSync(join(IMAGES, group, `${name}.webp`))

// `scripts/bundle-images.test.mjs` checks the names the yaml data gives; these
// are the names written in code, which nothing else would catch a rename of.
describe('the images the code names', () => {
	it('are all published', () => {
		let streaming = [
			...Object.values(STATIONS).flatMap((station) => station.logos.map((logo) => logo.imageName)),
			RECORD_IMAGE_NAME,
		]
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
	it('are the same ones the publishing script has', () => {
		let script = readFileSync(join(IMAGES, '..', 'scripts', 'make-images.mjs'), 'utf-8')
		let listed = /IMAGE_GROUPS = \[([^\]]*)\]/u.exec(script)?.[1] ?? ''
		let scriptGroups = [...listed.matchAll(/'([a-z-]+)'/gu)].map((match) => match[1])

		expect([...IMAGE_GROUPS].toSorted()).toStrictEqual(scriptGroups.toSorted())
	})
})
