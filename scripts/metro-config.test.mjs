import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {join} from 'node:path'
import {test} from 'node:test'

const require = createRequire(import.meta.url)

test("the .yaml transformer stands in front of Expo's", async () => {
	let config = await require('../metro.config.js')
	assert.match(config.transformer.babelTransformerPath, /metro-yaml-transformer\.mjs$/u)
	assert.ok(config.resolver.sourceExts.includes('yaml'))
	let {getDefaultConfig} = require('@expo/metro-config')
	let base = getDefaultConfig(join(import.meta.dirname, '..'))
	assert.match(
		base.transformer.babelTransformerPath,
		/@expo[\\/]metro-config[\\/]build[\\/]babel-transformer\.js$/u,
	)
})

test('Metro hands Expo a .yaml file as a module exporting its JSON, and anything else untouched', async () => {
	let {withYaml} = await import('./metro-yaml-transformer.mjs')
	let seen = []
	let transformer = withYaml({transform: (args) => seen.push(args.src)})
	transformer.transform({filename: 'a.yaml', src: 'name: Summit Library'})
	transformer.transform({filename: 'b.ts', src: 'export {}'})
	assert.deepEqual(seen, ['module.exports = {"name":"Summit Library"};\n', 'export {}'])
})
