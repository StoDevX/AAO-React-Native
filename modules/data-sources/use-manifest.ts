import {useIsRestoring, useQuery} from '@tanstack/react-query'
import {manifestOptions} from './resolve'
import type {Jrd} from './types'

/// A manifest with no links: resolving against it gives the bundled entries.
const NOTHING_CACHED: Jrd = {subject: '', links: []}

/// The manifest in the cache however old it is, which a fetch refreshes behind
/// it; a failed fetch leaves the cached copy standing, in storage as well (see
/// `manifestOptions`). Only with nothing cached at all does it have no links,
/// so that `resolveSource` gives the bundled entries.
///
/// This is not `fetchManifest`'s rule 1, which drops to the bundled copy when
/// a fetch fails: it is for a feature that would rather use a source it last
/// saw than one the build shipped with. While the saved cache is still being
/// read back there is no telling which it will be, so this is undefined until
/// it has been.
export function useManifest(): Jrd | undefined {
	let restoring = useIsRestoring()
	let {data} = useQuery(manifestOptions)
	if (restoring) {
		return undefined
	}
	return data ?? NOTHING_CACHED
}
