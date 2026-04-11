import {queryOptions} from '@tanstack/react-query'
import * as storage from '../../../../lib/storage'

export const serverUrlOptions = queryOptions({
	queryKey: ['settings', 'server-url'] as const,
	queryFn: () => storage.getServerAddress(),
})
