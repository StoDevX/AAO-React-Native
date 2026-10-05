import * as React from 'react'
import {
	jobDetailOptions,
	jobPostingsOptions,
	postingUnitsOptions,
	type JobCategory,
	type JobDetail,
	type JobSummary,
} from '@frogpond/ccc-jobs'
import {now} from '@frogpond/timer'
import {useQueries, useQuery, type UseQueryResult} from '@tanstack/react-query'
import {areaMembership, type AreaStatus, type StudentWorkArea} from './areas'
import {NO_AREAS, studentWorkAreasOptions} from './areas-query'
import type {FilterContext} from './filters'
import {newPostingIds} from './new-postings'
import {useSeenPostingsStore} from './store'
import {idsNeedingDetail, unitsAvailability, unitsByPosting, type UnitsAvailability} from './units'

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

/// The units the app read from details, by posting ID. A module-level
/// function, so useQueries rebuilds its result only when a detail changes.
function detailUnits(queries: Array<UseQueryResult<JobDetail>>): Map<string, string | null> {
	let units = new Map<string, string | null>()
	for (let query of queries) {
		if (query.data) units.set(query.data.id, query.data.unit)
	}
	return units
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
	let boardIdList = React.useMemo(() => jobs.map((job) => job.id), [jobs])
	let boardIds = React.useMemo(() => new Set(boardIdList), [boardIdList])

	let published = React.useMemo(
		() => (units.data === undefined ? undefined : new Map(Object.entries(units.data))),
		[units.data],
	)
	let missing = React.useMemo(
		() => idsNeedingDetail(boardIdList, published),
		[boardIdList, published],
	)
	let fromDetails = useQueries({
		queries: missing.map((id) => jobDetailOptions(id)),
		combine: detailUnits,
	})

	// What the details found, as text: a detail refetching with the same unit
	// leaves it unchanged, so the membership -- and every list's filters and
	// sections after it -- is only rebuilt when a unit is.
	let detailSignature = Array.from(fromDetails)
		.map(([id, unit]) => `${id}:${unit ?? ''}`)
		.join('|')
	let membership = React.useMemo(
		() =>
			availability === 'ready'
				? areaMembership(areas, unitsByPosting(published, fromDetails), boardIds)
				: new Map<string, AreaStatus>(),
		// fromDetails is a new map whenever any detail's fetch state changes;
		// detailSignature stands in for what it holds.
		// oxlint-disable-next-line react-hooks/exhaustive-deps
		[availability, areas, published, detailSignature, boardIds],
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
