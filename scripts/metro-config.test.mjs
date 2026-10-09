import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {join} from 'node:path'
import {test} from 'node:test'

const require = createRequire(import.meta.url)

test("the .kdl transformer stands in front of Expo's", async () => {
	let config = await require('../metro.config.js')
	assert.match(config.transformer.babelTransformerPath, /metro-kdl-transformer\.mjs$/u)
	assert.ok(config.resolver.sourceExts.includes('kdl'))
	let {getDefaultConfig} = require('@expo/metro-config')
	let base = getDefaultConfig(join(import.meta.dirname, '..'))
	assert.match(
		base.transformer.babelTransformerPath,
		/@expo[\\/]metro-config[\\/]build[\\/]babel-transformer\.js$/u,
	)
})

test('Metro hands Expo a .kdl file as a module exporting its JSON, and anything else untouched', async () => {
	let {withKdl} = await import('./metro-kdl-transformer.mjs')
	let seen = []
	let transformer = withKdl({transform: (args) => seen.push(args.src)})
	transformer.transform({filename: 'a.kdl', src: '(object)- { name "Summit Library" }'})
	transformer.transform({filename: 'b.ts', src: 'export {}'})
	assert.deepEqual(seen, ['module.exports = {"name":"Summit Library"};\n', 'export {}'])
})
