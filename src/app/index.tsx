import {useEffect} from 'react'
import {Stack, useRouter, useRootNavigationState} from 'expo-router'

const useIsNavigationReady = () => {
	const rootNavigationState = useRootNavigationState()
	return rootNavigationState.key != null
}

const Index = (): React.JSX.Element => {
	const router = useRouter()
	const isReady = useIsNavigationReady()

	useEffect(() => {
		if (isReady) {
			const routeToNavigate = '/home/v1/home'
			router.replace(routeToNavigate)
		}
	}, [router, isReady])

	return <Stack />
}

export default Index
