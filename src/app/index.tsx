import { useEffect, useState } from 'react'
import { Stack, useRouter, useRootNavigationState } from 'expo-router'
import { configureApiRoot } from '../../source/init/api'
import '../../source/init/constants'

const useIsNavigationReady = () => {
	const rootNavigationState = useRootNavigationState()
	return rootNavigationState.key != null
}

const Index = (): React.JSX.Element => {
	const router = useRouter()
	const isNavigationReady = useIsNavigationReady()
	const [isInitializing, setIsInitializing] = useState(true)

	useEffect(() => {
		const initializeApp = async () => {
			try {
				await configureApiRoot()
			} catch (error) {
				console.error('Error configuring API root:', error)
			}
		}
	
		initializeApp().catch((error: unknown) => {
			console.error('Unhandled error during app initialization:', error)
		}).finally(() => {
			setIsInitializing(false)
		})
	}, [])

	useEffect(() => {
		if (isNavigationReady && !isInitializing) {
			router.replace('/home/v1/home')
		}
	}, [isNavigationReady, isInitializing, router])

	return <Stack />
}

export default Index
