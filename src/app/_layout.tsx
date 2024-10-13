import {Stack, useNavigationContainerRef} from 'expo-router'
import {useReactNavigationDevTools} from '@dev-plugins/react-navigation'
import {useReactQueryDevTools} from '@dev-plugins/react-query'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

const queryClient = new QueryClient({})

export default function RootLayout() {
	const navigationRef = useNavigationContainerRef()
	useReactNavigationDevTools(navigationRef)

	useReactQueryDevTools(queryClient)

	return (
		<QueryClientProvider client={queryClient}>
			<Stack>
				<Stack.Screen name="index" />
			</Stack>
		</QueryClientProvider>
	)
}
