import * as React from 'react'
import {Section} from '@frogpond/tableview'
import {PushButtonCell} from '@frogpond/tableview/cells'
import {useNavigation} from '@react-navigation/native'

export const NotificationsSection = (): React.ReactNode => {
	const navigation = useNavigation()
	return (
		<Section header="NOTIFICATIONS">
			<PushButtonCell
				onPress={() => navigation.navigate('Notifications')}
				title="Notifications"
			/>
		</Section>
	)
}
