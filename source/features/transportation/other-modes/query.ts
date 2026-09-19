import {client} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
import {groupBy, toPairs} from 'lodash'
import {OtherModeType} from '../types'

export const keys = {
	all: ['transit', 'modes'] as const,
}

export const otherModesOptions = queryOptions({
	queryKey: keys.all,
	queryFn: async ({signal}) => {
		let response = await client.get('transit/modes', {signal}).json()
		return (response as {data: OtherModeType[]}).data
	},
})

/**
 * The modes as the screen's sections, in the order the server listed their
 * categories.
 *
 * A mode with no category gets a section with no title rather than one titled
 * `''`: the row it holds points at the college's own transportation page, which
 * is a pointer rather than a category and reads better without a heading. The
 * `undefined` passes straight to `Section`, which draws no header for it.
 */
export function groupOtherModes(
	modes: OtherModeType[],
): Array<{title: string | undefined; data: OtherModeType[]}> {
	let grouped = groupBy(modes, (m) => m.category)
	return toPairs(grouped).map(([key, value]) => ({title: key || undefined, data: value}))
}

export const otherModesGroupedOptions = queryOptions({
	queryKey: keys.all,
	queryFn: async ({signal}) => {
		let response = await client.get('transit/modes', {signal}).json()
		return (response as {data: OtherModeType[]}).data
	},
	select: groupOtherModes,
})
