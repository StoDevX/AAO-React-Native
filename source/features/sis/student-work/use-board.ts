import * as React from 'react'
import {
	jobPostingsOptions,
	unitPostingsOptions,
	type JobCategory,
	type JobSummary,
} from '@frogpond/ccc-jobs'
import {now} from '@frogpond/timer'
import {useQueries, useQuery, type UseQueryResult} from '@tanstack/react-query'
import {areaMembership, type StudentWorkArea, type UnitResult} from './areas'
import {studentWorkAreasOptions} from './areas-query'
import type {FilterContext} from './filters'
import {newPostingIds} from './new-postings'
import {useSeenPostingsStore} from './store'

export type StudentWorkBoard = {
	board: UseQueryResult<JobCategory[]>
	jobs: JobSummary[]
	/// Undefined until the areas file has loaded; see `studentWorkAreasOptions`.
	areas: StudentWorkArea[] | undefined
	context: FilterContext
}

function unitResultOf(query: UseQueryResult<string[]>): UnitResult {
	if (query.isSuccess) return {status: 'success', ids: query.data}
	if (query.isError) return {status: 'error'}
	return {status: 'pending'}
}

/// Everything both Student Work screens read: the board, the areas, what each
/// area holds, and what is new since the last visit.
export function useStudentWorkBoard(): StudentWorkBoard {
	let board = useQuery(jobPostingsOptions)
	let {data: areas} = useQuery(studentWorkAreasOptions)

	let units = React.useMemo(() => (areas ?? []).flatMap((area) => area.units), [areas])
	let unitResults = useQueries({
		queries: units.map((unit) => unitPostingsOptions(unit)),
		// One map for the lot, rebuilt only when some search's state changes.
		combine: (queries) =>
			new Map(
				units.map((unit, index) => [
					unit,
					unitResultOf(queries[index] as UseQueryResult<string[]>),
				]),
			),
	})

	let jobs = React.useMemo(
		() => (board.data ?? []).flatMap((category) => category.jobs),
		[board.data],
	)
	let boardIds = React.useMemo(() => new Set(jobs.map((job) => job.id)), [jobs])

	let membership = React.useMemo(
		() => areaMembership(areas ?? [], unitResults, boardIds),
		[areas, unitResults, boardIds],
	)

	// The store changes only when the student leaves Student Work, so the dots
	// stay put while they move between the landing, lists, and postings.
	let seenIds = useSeenPostingsStore((state) => state.seenIds)
	let newIds = React.useMemo(
		() =>
			newPostingIds(
				jobs.map((job) => job.id),
				seenIds,
			),
		[jobs, seenIds],
	)

	let context = React.useMemo(
		(): FilterContext => ({areas: areas ?? [], membership, newIds, today: now().toDate()}),
		[areas, membership, newIds],
	)

	return {board, jobs, areas, context}
}
