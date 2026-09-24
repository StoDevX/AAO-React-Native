import * as React from 'react'
import {useDebounce} from '@frogpond/use-debounce'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import {SearchBar} from '../../../source/components/search-bar'
import {studentWorkAreasOptions} from '../../../source/features/sis/student-work/areas-query'
import {prefillFromParams} from '../../../source/features/sis/student-work/prefill'
import {PostingsList} from '../../../source/features/sis/student-work/postings-list'

/// Mirrored by TestIdentifiers.StudentWork.postingsTitle.
const TITLE = 'Job Postings'

/// Student Work's postings, opened from a tile or preset with its filters
/// prefilled from the route; see prefill.ts for the parameters.
export default function StudentWorkPostingsPage(): React.ReactNode {
	let params = useLocalSearchParams<{
		area?: string
		posted?: string
		level?: string
		term?: string
	}>()
	let {data: areas} = useQuery(studentWorkAreasOptions)

	let [query, setQuery] = React.useState('')
	let searchQuery = useDebounce(query, 200)

	// The areas query starts from the copy the app ships, so the prefill can
	// check an area's slug straight away.
	let initialChosen = React.useMemo(() => prefillFromParams(params, areas), [areas, params])

	return (
		<>
			<Stack.Title>{TITLE}</Stack.Title>
			<Stack.Toolbar placement="bottom">
				<Stack.Toolbar.SearchBarSlot />
			</Stack.Toolbar>
			<SearchBar onChangeText={setQuery} value={query} />
			<PostingsList initialChosen={initialChosen} searchQuery={searchQuery} />
		</>
	)
}
