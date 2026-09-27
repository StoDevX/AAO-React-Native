import type {HourlyWages} from './wages'

/// The 2026–27 rates, frozen. UI-test launches and the Jest wage tests use
/// these rather than data/student-wages.yaml, so neither breaks when the
/// monthly scrape changes a rate. `TestIdentifiers.StudentWork.fixtureCodedJobWage`
/// expects NST1's $13.50.
export const FIXED_WAGES: HourlyWages = {
	ST: {1: 12.0, 2: 12.5, 3: 13.0},
	NST: {1: 13.5, 2: 14.5, 3: 15.5},
	OSA: {1: 12.5, 2: 13.25, 3: 14.0},
}
