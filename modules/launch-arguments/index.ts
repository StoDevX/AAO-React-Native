import {NativeModule, requireNativeModule} from 'expo-modules-core'

interface LaunchArgumentsModule extends NativeModule {
	isUITesting: boolean
}

const LaunchArguments = requireNativeModule<LaunchArgumentsModule>('LaunchArguments')

export const isUITesting: boolean = LaunchArguments.isUITesting
