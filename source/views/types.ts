/* eslint-disable no-unused-vars */
export type TopLevelViewPropsType = TopLevelViewPropsTypeWithParams<any>

export type TopLevelViewPropsTypeWithParams<P = {}> = {
	navigation: {
		navigate: (routeName: string, props: ?Object) => mixed
		push: (routeName: string, props: ?Object) => mixed
		goBack: () => mixed
		getParam: (paramName: string, defaultValue: any) => any
		state: {params: P}
	}
}
