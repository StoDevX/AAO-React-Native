import {cp, mkdtemp} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {DATA_BASE} from './paths.mjs'

/** A scratch copy of the repo's data, which a test may break. */
export async function scratchData() {
	let root = await mkdtemp(path.join(tmpdir(), 'data-editor-'))
	let dataDir = path.join(root, 'data')
	await cp(DATA_BASE, dataDir, {recursive: true})
	return {root, dataDir}
}
