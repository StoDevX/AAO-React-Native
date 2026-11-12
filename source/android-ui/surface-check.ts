import type * as AndroidUI from './index'

/**
 * Every name the app imports from `@expo/ui/swift-ui`. On Android those
 * imports resolve to `./index`, so a name missing there is `undefined` at
 * runtime -- a crash on the first screen that draws it. This list fails the
 * type check instead. Regenerate it with:
 *
 *     grep -rhzoE "import \{[^}]*\} from '@expo/ui/swift-ui'" app source modules --include='*.ts*'
 */
type ImportedNames =
	| 'BottomSheet'
	| 'Button'
	| 'Circle'
	| 'ContentUnavailableView'
	| 'ContextMenu'
	| 'DatePicker'
	| 'DisclosureGroup'
	| 'Divider'
	| 'Form'
	| 'Grid'
	| 'Group'
	| 'HangingText'
	| 'Host'
	| 'HStack'
	| 'Image'
	| 'Label'
	| 'LabeledContent'
	| 'LazyHStack'
	| 'LazyVStack'
	| 'Link'
	| 'List'
	| 'Menu'
	| 'Picker'
	| 'ProgressView'
	| 'Rectangle'
	| 'RNHostView'
	| 'RoundedRectangle'
	| 'ScrollView'
	| 'SecureField'
	| 'Section'
	| 'Spacer'
	| 'SwipeActions'
	| 'TabView'
	| 'Text'
	| 'TextField'
	| 'Toggle'
	| 'useNativeState'
	| 'VStack'
	| 'ZStack'

/** The imported names this layer lacks; `never` when it has them all. */
type Missing = Exclude<ImportedNames, keyof typeof AndroidUI>

/** Fails to type-check, naming what is missing, if any imported name is. */
export const SURFACE_COMPLETE: [Missing] extends [never] ? true : Missing = true
