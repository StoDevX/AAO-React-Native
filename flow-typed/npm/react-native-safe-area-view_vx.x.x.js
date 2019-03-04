// flow-typed signature: cb2c9a90ff7a6666ce4f91fe6560603b
// flow-typed version: <<STUB>>/react-native-safe-area-view_v0.13.0/flow_v0.78.0

declare module 'react-native-safe-area-view' {
	// $FlowFixMe: Flow library definitions currently don't support type dependencies between libraries. See https://github.com/flowtype/flow-typed/issues/16.
	import type { ViewProps } from 'react-native/Libraries/Components/View/ViewPropTypes';

	declare export type SafeAreaViewForceInsetValue = 'always' | 'never';

	declare export type ForceInset = {|
	  top?: SafeAreaViewForceInsetValue,
	  bottom?: SafeAreaViewForceInsetValue,
	  left?: SafeAreaViewForceInsetValue,
	  right?: SafeAreaViewForceInsetValue,
	  horizontal?: SafeAreaViewForceInsetValue,
	  vertical?: SafeAreaViewForceInsetValue
	|};

	declare export type SafeAreaViewProps = $ReadOnly<{|
	  ...ViewProps,
	  forceInset?: ?ForceInset
	|}>;

	declare export default class SafeAreaView extends React$Component<SafeAreaViewProps> {}

	declare export function withSafeArea(
	  forceInset?: ?ForceInset
	): <T: React$ComponentType<*>>(WrappedComponent: T) => T;
}
