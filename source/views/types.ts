/* eslint-disable no-unused-vars */
export type AnyObject = Record<string, unknown>

export type TopLevelViewPropsType = TopLevelViewPropsTypeWithParams<any>

export type TopLevelViewPropsTypeWithParams<P = AnyObject> = {
	navigation: {
		navigate: (routeName: string, params?: AnyObject) => mixed
		push: (routeName: string, params?: AnyObject) => mixed
		goBack: () => mixed
		getParam: (paramName: string, defaultValue: any) => any
		state: {params: P}
	}
}
