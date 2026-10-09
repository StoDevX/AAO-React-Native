import type {Paper} from '../../features/mess/campus-section'

/** Wiki Monkeys' student paper, read by the same reader as every paper. */
export const VALLEY_ECHO: Paper = {
	id: 'valley-echo',
	title: 'The Valley Echo',
	shortTitle: 'The Echo',
	label: 'Valley Echo',
	site: 'echo.college.example',
	mainSections: ['News', 'Opinion', 'Slopes', 'Arts', 'Variety'],
	logoMediaIds: new Set(),
	contactPageSlug: 'contact',
	masthead: null,
}
