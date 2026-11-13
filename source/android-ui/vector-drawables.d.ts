/**
 * An Android vector drawable, which Metro bundles as an asset: importing one
 * gives the asset's id, as importing a PNG does (see `types/images.d.ts`).
 */
declare module '*.xml' {
	import type {ImageRequireSource} from 'react-native'
	const source: ImageRequireSource
	export default source
}
