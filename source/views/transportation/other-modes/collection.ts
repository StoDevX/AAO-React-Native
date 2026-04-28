import {createCollection} from '@tanstack/db'
import {persistedCollectionOptions} from '@tanstack/react-native-db-sqlite-persistence'
import {
	queryCollectionOptions,
	type QueryCollectionUtils,
} from '@tanstack/query-db-collection'
import {client} from '@frogpond/api'
import {persistence} from '../../../init/tanstack-db'
import {queryClient} from '../../../init/tanstack-query'
import {OtherModeType} from '../types'

const collectionOptions = queryCollectionOptions({
	id: 'other-modes',
	queryKey: ['transit', 'modes'],
	queryClient,
	getKey: (mode: OtherModeType): string => mode.name,
	queryFn: ({signal}) => {
		return client.get('transit/modes', {signal}).json<{data: OtherModeType[]}>()
	},
	select: (response) => response.data,
	staleTime: 60 * 60 * 1000,
	refetchInterval: 60 * 60 * 1000,
})

export const otherModesCollection = createCollection(
	persistence
		? persistedCollectionOptions<
				OtherModeType,
				string,
				never,
				QueryCollectionUtils<OtherModeType, string>
			>({
				...collectionOptions,
				persistence,
				schemaVersion: 1,
			})
		: collectionOptions,
)
