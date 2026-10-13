import {clientFor} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'

import {OtherModeType} from '../types'
import {groupBy} from '@frogpond/collections'
import type {CampusId} from '../../../campuses'

export const keys = {
	/** By server, so each campus's modes sit under its own key. */
	forServer: (server: CampusId) => [server, 'transit', 'modes'] as const,
}

async function fetchOtherModes(
	server: CampusId,
	{signal}: {signal: AbortSignal},
): Promise<OtherModeType[]> {
	let response = await clientFor(server).get('transit/modes', {signal}).json()
	return (response as {data: OtherModeType[]}).data
}

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
	return Object.entries(grouped).map(([key, value]) => ({title: key || undefined, data: value}))
}

/** The other ways to travel on `server`, the active campus's transit server, as the screen's sections. */
// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const otherModesGroupedOptionsFor = (server: CampusId) =>
	queryOptions({
		queryKey: keys.forServer(server),
		queryFn: (context) => fetchOtherModes(server, context),
		select: groupOtherModes,
	})
