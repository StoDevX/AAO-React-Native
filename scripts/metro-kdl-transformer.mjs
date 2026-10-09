// Metro's transformer: a .kdl file becomes a module exporting its JSON, then
// goes through Expo's Babel transformer like any other module. Every other
// file goes straight to Expo's. metro-config.test.mjs checks that Expo's is
// still the transformer this one stands in front of.

import expo from '@expo/metro-config/build/babel-transformer.js'

import {kdlModuleSource} from './kdl-module.mjs'

/** `upstream` with .kdl files turned into JSON modules first. Exported for its test. */
export function withKdl(upstream) {
	return {
		...upstream,
		transform(args) {
			if (args.filename.endsWith('.kdl')) {
				return upstream.transform({...args, src: kdlModuleSource(args.src, args.filename)})
			}
			return upstream.transform(args)
		},
	}
}

const transformer = withKdl(expo)

export const {transform, getCacheKey} = transformer
