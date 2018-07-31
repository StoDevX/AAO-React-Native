// @flow

import mapValues from 'lodash/mapValues'
import {AllHtmlEntities} from 'html-entities'
import {toLaxTitleCase} from 'titlecase'
import {trimStationName, trimItemLabel} from './lib/trim-names'
import {getTrimmedTextWithSpaces, parseHtml} from '../../lib/html'

import {JsonUrl /*, bonAppMenu*/} from '@app/fetch'

import type {BonAppMenuInfoType} from './types'

const entities = new AllHtmlEntities()

export let bonAppMenu = JsonUrl({
	beforeRequest() {
		this.url = 'https://legacy.cafebonappetit.com/api/2/menus'
		this.query = {cafe: this.args.cafeId}
	},

	beforeStore() {
		;(this.data: BonAppMenuInfoType)
		let {items} = this.data

		items = mapValues(items, item => ({
			...item, // we want to edit the item, not replace it
			station: entities.decode(toLaxTitleCase(trimStationName(item.station))), // <b>@station names</b> are a mess
			label: entities.decode(trimItemLabel(item.label)), // clean up the titles
			description: getTrimmedTextWithSpaces(parseHtml(item.description || '')), // clean up the descriptions
		}))

		this.data = {...this.data, items}
	},
})

export let bonAppCafe = JsonUrl({
	beforeRequest() {
		this.url = 'https://legacy.cafebonappetit.com/api/2/cafes'
		this.query = {cafe: this.args.cafeId}
	},
})
