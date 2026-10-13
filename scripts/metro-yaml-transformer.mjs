// Metro's transformer: a .yaml file becomes a module exporting its JSON, then
// goes through Expo's Babel transformer like any other module. Every other
// file goes straight to Expo's. metro-config.test.mjs checks that Expo's is
// still the transformer this one stands in front of.

import {createHash} from 'node:crypto'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'

import expo from '@expo/metro-config/build/babel-transformer.js'

import {yamlModuleSource} from './yaml-module.mjs'

/** The loader's own hash, so editing it refreshes Metro's cached .yaml modules. */
const LOADER_KEY = createHash('sha1')
	.update(readFileSync(join(import.meta.dirname, 'yaml-module.mjs')))
	.digest('hex')

/** `upstream` with .yaml files turned into JSON modules first. Exported for its test. */
export function withYaml(upstream) {
	return {
		...upstream,
		transform(args) {
			if (args.filename.endsWith('.yaml')) {
				return upstream.transform({...args, src: yamlModuleSource(args.src, args.filename)})
			}
			return upstream.transform(args)
		},
		getCacheKey: (...args) => `${upstream.getCacheKey?.(...args) ?? ''}${LOADER_KEY}`,
	}
}

const transformer = withYaml(expo)

export const {transform, getCacheKey} = transformer
