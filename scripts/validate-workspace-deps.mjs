#!/usr/bin/env node

// Every `modules/*` package must declare the packages it imports, and declare
// the `@frogpond/*` packages it lists only if it imports them. See
// `workspace-deps.mjs` for why the root's own dependencies hide the mistake.

import fs from 'node:fs'
import path from 'node:path'
import {MODULES_BASE} from './paths.mjs'
import {moduleProblems} from './workspace-deps.mjs'

let problems = fs
	.readdirSync(MODULES_BASE, {withFileTypes: true})
	.filter((entry) => entry.isDirectory())
	.map((entry) => path.join(MODULES_BASE, entry.name))
	.filter((dir) => fs.existsSync(path.join(dir, 'package.json')))
	.sort()
	.flatMap((dir) => moduleProblems(dir))

for (let problem of problems) {
	console.log(`error: ${problem}`)
}

if (problems.length > 0) {
	console.log('')
	console.log('A module must declare every package it imports, and only the @frogpond')
	console.log('packages it imports. Add a package the app also provides as a peer at the')
	console.log("app's version, one only the module uses as a dependency, and one only its")
	console.log('tests use as a dev dependency; add a @frogpond package as "workspace:*".')
	console.log('Then run `pnpm install` so the lockfile and workspace links match.')
	process.exit(1)
}
