import {queryOptions} from '@tanstack/react-query'

import * as storage from '../../lib/storage'

/** The server address saved under `storageKey`, a campus's `api.storageKey`; empty means its default. */
// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const serverUrlOptions = (storageKey: string) =>
	queryOptions({
		queryKey: ['settings', 'server-url', storageKey],
		queryFn: () => storage.getServerAddressFor(storageKey),
	})
