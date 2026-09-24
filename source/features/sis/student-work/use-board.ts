import * as React from 'react'
import {
	jobPostingsOptions,
	keys,
	unitPostingsOptions,
	type JobCategory,
	type JobSummary,
} from '@frogpond/ccc-jobs'
import {now} from '@frogpond/timer'
import {useQueries, useQuery, useQueryClient, type UseQueryResult} from '@tanstack/react-query'
import {areaMembership, type StudentWorkArea} from './areas'
import {studentWorkAreasOptions} from './areas-query'
import type {FilterContext} from './filters'
import {newPostingIds} from './new-postings'
import {useSeenPostingsStore} from './store'
import {unitResultOf} from './unit-result'

export type StudentWorkBoard = {
	board: UseQueryResult<JobCategory[]>
	jobs: JobSummary[]
	/// Always there: the areas query starts from the copy the app ships.
	areas: StudentWorkArea[]
	context: FilterContext
	/// Refetch the board and every unit search, for pull-to-refresh: a failed
	/// unit search would otherwise stay failed until it went stale.
	refresh: () => Promise<void>
}

/// Everything both Student Work screens read: the board, the areas, what each
/// area holds, and what is new since the last visit.
///
/// `checkForNewPostings` refetches the board on mount even while it is fresh:
/// the landing does, since new postings are why a student opens Student Work,
/// and a list opened from the landing then reuses what it just fetched.
export function useStudentWorkBoard({
	checkForNewPostings = false,
}: {checkForNewPostings?: boolean} = {}): StudentWorkBoard {
	let queryClient = useQueryClient()
	let board = useQuery({
		...jobPostingsOptions,
		refetchOnMount: checkForNewPostings ? 'always' : true,
	})
	let {data: areas} = useQuery(studentWorkAreasOptions)

	let units = React.useMemo(() => areas.flatMap((area) => area.units), [areas])
	// Stable while the units are, so useQueries rebuilds the map only when some
	// search's result changes; an inline function would rebuild it every render.
	let combine = React.useCallback(
		(queries: Array<UseQueryResult<string[]>>) =>
			new Map(units.map((unit, index) => [unit, unitResultOf(queries[index])])),
		[units],
	)
	let unitResults = useQueries({
		queries: units.map((unit) => unitPostingsOptions(unit)),
		combine,
	})

	let jobs = React.useMemo(
		() => (board.data ?? []).flatMap((category) => category.jobs),
		[board.data],
	)
	let boardIds = React.useMemo(() => new Set(jobs.map((job) => job.id)), [jobs])

	// What the searches found, as text: a search starting or finishing with
	// the same postings leaves it unchanged, so the membership -- and every
	// list's filters and sections after it -- is only rebuilt when a result is.
	let unitSignature = Array.from(unitResults)
		.map(
			([unit, result]) =>
				`${unit}:${result.status === 'success' ? result.ids.join(',') : result.status}`,
		)
		.join('|')
	let membership = React.useMemo(
		() => areaMembership(areas, unitResults, boardIds),
		// unitResults is a new map whenever any search's fetch state changes;
		// unitSignature stands in for what it holds.
		// oxlint-disable-next-line react-hooks/exhaustive-deps
		[areas, unitSignature, boardIds],
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
		(): FilterContext => ({areas, membership, newIds, today: now().toDate()}),
		[areas, membership, newIds],
	)

	let refetchBoard = board.refetch
	let refresh = React.useCallback(async () => {
		await Promise.all([
			refetchBoard(),
			// Only what is stale or failed: fresh searches have nothing new, and
			// waiting on all fifty-one would make every pull slow.
			queryClient.refetchQueries({
				queryKey: keys.units,
				type: 'active',
				predicate: (query) => query.state.status === 'error' || query.isStale(),
			}),
		])
	}, [refetchBoard, queryClient])

	return {board, jobs, areas, context, refresh}
}
