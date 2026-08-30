import {LinkGroup} from '../types'

/// ccc-server's combineResponses silently discarded an extras group whose
/// letter the upstream did not publish — and St. Olaf publishes no Q, X, Y or
/// Z. Here a missing letter is created and inserted in sorted position instead.
export function mergeAToZ(upstream: LinkGroup[], extras: LinkGroup[]): LinkGroup[] {
	let merged: LinkGroup[] = upstream.map((group) => ({title: group.title, data: [...group.data]}))

	for (let group of extras) {
		if (group.data.length === 0) continue

		let target = merged.find((entry) => entry.title === group.title)

		if (!target) {
			target = {title: group.title, data: []}
			let index = merged.findIndex((entry) => entry.title.localeCompare(group.title) > 0)
			merged.splice(index === -1 ? merged.length : index, 0, target)
		}

		target.data.push(...group.data)
		target.data.sort((a, b) => a.label.localeCompare(b.label))
	}

	return merged
}
