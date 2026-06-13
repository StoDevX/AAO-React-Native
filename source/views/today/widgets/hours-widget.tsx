import * as React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import {useQuery} from '@tanstack/react-query'
import {useNavigation} from '@react-navigation/native'

import * as c from '@frogpond/colors'
import {useMomentTimer} from '@frogpond/timer'
import {WidgetCard, widgetStyles} from '../widget-card'
import {buildingsOptions} from '../../building-hours/query'
import {getDetailedBuildingStatus} from '../../building-hours/lib'
import {selectOpenSpaces} from '../lib'

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingVertical: 6,
	},
	name: {fontSize: 16, color: c.label, flex: 1},
	hours: {fontSize: 14, color: c.secondaryLabel, marginLeft: 8},
})

export const HoursWidget = React.memo(function HoursWidget(): React.ReactNode {
	let navigation = useNavigation()
	let {now} = useMomentTimer({intervalMs: 60000})
	let {data = []} = useQuery(buildingsOptions)
	let open = selectOpenSpaces(data, now)

	return (
		<WidgetCard
			actionLabel="See all"
			onPressAction={() => navigation.navigate('BuildingHours')}
			title="Open Now"
		>
			{open.length === 0 ? (
				<Text style={widgetStyles.empty}>No spaces are open right now.</Text>
			) : (
				open.map((building) => {
					let detailed = getDetailedBuildingStatus(building, now)
					let active = detailed.find((slot) => slot.isActive) ?? detailed[0]
					return (
						<View key={building.name} style={styles.row}>
							<Text numberOfLines={1} style={styles.name}>
								{building.name}
							</Text>
							<Text numberOfLines={1} style={styles.hours}>
								{active?.status ?? 'Open'}
							</Text>
						</View>
					)
				})
			)}
		</WidgetCard>
	)
})
