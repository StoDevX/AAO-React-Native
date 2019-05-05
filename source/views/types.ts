export type TopLevelViewPropsType = TopLevelViewPropsTypeWithParams<any>

export type TopLevelViewPropsTypeWithParams<P = {}> = {
	navigation: {
		navigate: (string, ?Object) => mixed,
		push: (string, ?Object) => mixed,
		goBack: () => mixed,
		getParam: (string, any) => any,
		state: {params: P},
	},
}
