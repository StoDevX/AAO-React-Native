import {create} from 'zustand'

import type {LineFile} from './line-file'

/** Where a run records what the probe saw. */
export const FINDINGS_FILE = 'chaos-findings.jsonl'

/** What the probe saw. */
export type FindingKind =
	| 'fatal'
	| 'unhandled-rejection'
	| 'divergence'
	| 'console-error'
	| 'out-of-app'
	| 'mutation'
	| 'stall'

/** One thing the probe saw, as written to the findings file. */
export type Finding = {
	kind: FindingKind
	message: string
	stack: string | null
	at: string
	/** The launch it was made in, so the runner can tell a cold start's findings apart. */
	launch: number
	/** How long after the bundle loaded it was made, which tells a cold start from later. */
	sinceLaunchMs: number
}

const STOPPING: ReadonlyArray<FindingKind> = ['fatal', 'unhandled-rejection', 'divergence']

/** Whether a finding ends the run, rather than being listed in its report. */
export function isStopping(kind: FindingKind): boolean {
	return STOPPING.includes(kind)
}

/** When this bundle loaded: a launch's findings are timed from here. */
const LOADED_AT = Date.now()

type FindingsState = {
	/** The first stopping finding, as the beacon shows it; empty while none. */
	latest: string
	file: LineFile | null
	/** The launch findings are being made in. */
	launch: number
}

/** The run's findings, for the beacon to show. */
export const useChaosFindings = create<FindingsState>(() => ({latest: '', file: null, launch: 0}))

/** Where findings are written from now on, and the launch they are made in. */
export function setFindingsFile(file: LineFile, launch = 0): void {
	useChaosFindings.setState({file, launch})
}

/** A message and stack from whatever was thrown or logged. Never throws. */
export function describe(error: unknown): {message: string; stack: string | null} {
	if (error instanceof Error) {
		return {message: error.message, stack: error.stack ?? null}
	}
	if (Array.isArray(error)) {
		return {
			message: error
				.map((part) => {
					try {
						return describe(part).message
					} catch {
						return '[unprintable]'
					}
				})
				.join(' '),
			stack: null,
		}
	}
	try {
		return {message: String(error), stack: null}
	} catch {
		return {message: '[unprintable]', stack: null}
	}
}

/** Records a finding, and shows it on the beacon when it ends the run. */
export function reportFinding(kind: FindingKind, error: unknown): void {
	let {message, stack} = describe(error)
	let {file, latest, launch} = useChaosFindings.getState()
	let finding: Finding = {
		kind,
		message,
		stack,
		at: new Date().toISOString(),
		launch,
		sinceLaunchMs: Date.now() - LOADED_AT,
	}
	try {
		file?.append(JSON.stringify(finding))
	} catch {
		// Silently skip file write failures (disk full, permissions, etc)
	}
	if (isStopping(kind) && !latest) {
		useChaosFindings.setState({latest: `${kind}: ${message}`})
	}
}

/** Records something a chaos run stopped from leaving the app. */
export function reportOutOfApp(what: string): void {
	reportFinding('out-of-app', what)
}
