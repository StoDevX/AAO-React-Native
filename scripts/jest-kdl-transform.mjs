import {kdlModuleSource} from './kdl-module.mjs'

/** Jest's transform for an imported .kdl file; see kdl-module.mjs. */
export default {
	process(source, filename) {
		return {code: kdlModuleSource(source, filename)}
	},
}
