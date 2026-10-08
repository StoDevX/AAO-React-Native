import {queryOptions} from '@tanstack/react-query'
import * as storage from '../../lib/storage'
import type {Campus} from '../campus/store'

/** The server address saved for `campus`; empty means the default. */
// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const serverUrlOptions = (campus: Campus) =>
	queryOptions({
		queryKey: ['settings', campus === 'carleton' ? 'carleton-server-url' : 'server-url'],
		queryFn: () =>
			campus === 'carleton' ? storage.getCarletonServerAddress() : storage.getServerAddress(),
	})
