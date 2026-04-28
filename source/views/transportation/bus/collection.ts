import {createCollection} from '@tanstack/db'
import {persistedCollectionOptions} from '@tanstack/react-native-db-sqlite-persistence'
import {
	queryCollectionOptions,
	type QueryCollectionUtils,
} from '@tanstack/query-db-collection'
import {client} from '@frogpond/api'
import {persistence} from '../../../init/tanstack-db'
import {queryClient} from '../../../init/tanstack-query'
import {UnprocessedBusLine} from './types'

const collectionOptions = queryCollectionOptions({
	id: 'bus-lines',
	queryKey: ['transit', 'bus-routes'],
	queryClient,
	getKey: (line: UnprocessedBusLine): string => line.line,
	queryFn: ({signal}) => {
		return client
			.get('transit/bus', {signal})
			.json<{data: UnprocessedBusLine[]}>()
	},
	select: (response) => response.data,
	staleTime: 60 * 60 * 1000,
	refetchInterval: 60 * 60 * 1000,
})

export const busLinesCollection = createCollection(
	persistence
		? persistedCollectionOptions<
				UnprocessedBusLine,
				string,
				never,
				QueryCollectionUtils<UnprocessedBusLine, string>
			>({
				...collectionOptions,
				persistence,
				schemaVersion: 1,
			})
		: collectionOptions,
)
