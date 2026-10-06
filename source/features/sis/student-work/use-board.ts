import * as React from 'react'
import {
	jobPostingsOptions,
	postingUnitsOptions,
	type JobCategory,
	type JobSummary,
} from '@frogpond/ccc-jobs'
import {now} from '@frogpond/timer'
import {useQuery, type UseQueryResult} from '@tanstack/react-query'
import {areaMembership, type AreaStatus, type StudentWorkArea} from './areas'
import {NO_AREAS, studentWorkAreasOptions} from './areas-query'
import type {FilterContext} from './filters'
import {newPostingIds} from './new-postings'
import {useSeenPostingsStore} from './store'
import {unitsAvailability, type UnitsAvailability} from './units'

export type StudentWorkBoard = {
	board: UseQueryResult<JobCategory[]>
	jobs: JobSummary[]
	/// Empty until the areas load.
	areas: StudentWorkArea[]
	/// Whether postings can be sorted into areas yet.
	availability: UnitsAvailability
	context: FilterContext
	/// Refetch the board and the units map, for pull-to-refresh.
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
	let board = useQuery({
		...jobPostingsOptions,
		refetchOnMount: checkForNewPostings ? 'always' : true,
	})
	let {data: areas = NO_AREAS} = useQuery(studentWorkAreasOptions)
	let units = useQuery(postingUnitsOptions)
	let availability = unitsAvailability(units)

	let jobs = React.useMemo(
		() => (board.data ?? []).flatMap((category) => category.jobs),
		[board.data],
	)
	let boardIds = React.useMemo(() => new Set(jobs.map((job) => job.id)), [jobs])

	let published = React.useMemo(
		() => (units.data === undefined ? undefined : new Map(Object.entries(units.data))),
		[units.data],
	)
	// A posting the map lacks, usually one that went up since the server's last
	// hour, belongs to no area until the map has it.
	let membership = React.useMemo(
		() =>
			availability === 'ready' && published !== undefined
				? areaMembership(areas, published, boardIds)
				: new Map<string, AreaStatus>(),
		[availability, areas, published, boardIds],
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
	let refetchUnits = units.refetch
	let refresh = React.useCallback(async () => {
		await Promise.all([refetchBoard(), refetchUnits()])
	}, [refetchBoard, refetchUnits])

	return {board, jobs, areas, availability, context, refresh}
}
