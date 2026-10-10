/**
 * The reader's screens: one route tree for every campus's paper. The paper is
 * the campus's the link names (`?campus=`), else the active campus's; every
 * link inside the reader passes the campus on (`usePaperCampus`).
 */
export const NEWSPAPER_ROUTES = {
	front: '/newspaper',
	story: '/newspaper/story',
	image: '/newspaper/image',
	column: '/newspaper/column',
	issue: '/newspaper/issue',
	issueSection: '/newspaper/issue-section',
	about: '/newspaper/about',
	staff: '/newspaper/staff',
	staffMember: '/newspaper/staff/[id]',
	customize: '/newspaper/customize',
	crosswords: '/newspaper/crosswords',
} as const
