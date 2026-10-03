import {File, Paths} from 'expo-file-system'

/** A file of one record per line, appended as a run goes. */
export type LineFile = {
	append(line: string): void
	readLines(): string[]
}

/**
 * A line file in the app's Documents, which `--reset-state` leaves alone, so
 * it outlives a relaunch and scripts/chaos.mjs can collect it after the run.
 * Written synchronously, so a line written just before a crash is kept.
 */
export function documentLineFile(name: string): LineFile {
	let file = new File(Paths.document, name)
	return {
		append(line) {
			if (!file.exists) {
				file.create()
			}
			file.write(`${line}\n`, {append: true})
		},
		readLines() {
			return file.exists ? file.textSync().split('\n') : []
		},
	}
}

/** A line file held in memory, for code that needs one without a device. */
export function memoryLineFile(lines: string[] = []): LineFile {
	let held = [...lines]
	return {
		append(line) {
			held.push(line)
		},
		readLines() {
			return [...held]
		},
	}
}
