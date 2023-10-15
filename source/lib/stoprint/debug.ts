import React from 'react'
import {AppConfigKey} from '@frogpond/app-config/types'
import {useQuery} from '@tanstack/react-query'
import * as storage from '../../lib/storage'

export const useMockedStoprint = () => {
	const [mockStoprint, setMockStoprint] = React.useState(false)

	let {data: mockStoPrintData = false} = useQuery({
		queryKey: ['app', 'app:feature-flag'],
		queryFn: () => storage.getFeatureFlag(AppConfigKey.MockStoprintData),
		onSuccess: () => {
			setMockStoprint(mockStoPrintData)
		},
	})

	return mockStoprint
}

export const isStoprintMocked = false
