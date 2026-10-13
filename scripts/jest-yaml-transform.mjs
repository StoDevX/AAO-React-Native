import {yamlModuleSource} from './yaml-module.mjs'

/** Jest's transform for an imported .yaml file; see yaml-module.mjs. */
export default {
	process(source, filename) {
		return {code: yamlModuleSource(source, filename)}
	},
}
