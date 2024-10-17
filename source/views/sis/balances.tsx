import * as React from 'react'
import {
	StyleSheet,
	ScrollView,
	View,
	Text,
	RefreshControl,
	StyleProp,
	ViewStyle,
} from 'react-native'
import {Cell, TableView, Section} from '@frogpond/tableview'
import {BalancesShapeType, useBalances} from '../../lib/financials'
import * as c from '@frogpond/colors'
import {sto} from '../../lib/colors'
import {useNavigation} from 'expo-router'
import {NoCredentialsError, useUsername} from '../../lib/login'

const DISCLAIMER = 'This data may be outdated or otherwise inaccurate.'

export const BalancesView = (): React.JSX.Element => {
	let navigation = useNavigation()
	let {data: username = ''} = useUsername()

	let {
		data = {} as BalancesShapeType,
		error,
		isError,
		isInitialLoading,
		refetch,
		isRefetching,
	} = useBalances(username)

	let openSettings = () => {
		navigation.navigate('Settings')
	}
	let refresh = <RefreshControl onRefresh={refetch} refreshing={isRefetching} />

	return (
		<ScrollView contentContainerStyle={styles.stage} refreshControl={refresh}>
			<TableView>
				<Section footer={DISCLAIMER} header="BALANCES">
					<View style={styles.balancesRow}>
						<FormattedValueCell
							indeterminate={isInitialLoading}
							label="Flex"
							value={data.flex}
						/>

						<FormattedValueCell
							indeterminate={isInitialLoading}
							label="Ole"
							value={data.ole}
						/>

						<FormattedValueCell
							indeterminate={isInitialLoading}
							label="Copy/Print"
							style={styles.finalCell}
							value={data.print}
						/>
					</View>
				</Section>

				<Section footer={DISCLAIMER} header="MEAL PLAN">
					<View style={styles.balancesRow}>
						<FormattedValueCell
							indeterminate={isInitialLoading}
							label="Daily Meals Left"
							value={data.daily}
						/>

						<FormattedValueCell
							indeterminate={isInitialLoading}
							label="Weekly Meals Left"
							style={styles.finalCell}
							value={data.weekly}
						/>
					</View>
					{Boolean(data.plan) && data.plan != null && (
						<Cell cellStyle="Subtitle" detail={data.plan} title="Meal Plan" />
					)}
				</Section>

				{isError && error instanceof Error && (
					<Section footer="You'll need to log in in order to see this data.">
						{error instanceof NoCredentialsError ? (
							<Cell
								accessory="DisclosureIndicator"
								cellStyle="Basic"
								onPress={openSettings}
								title="Log in with St. Olaf"
							/>
						) : (
							<Cell
								cellStyle="Basic"
								title={error.message}
								titleTextColor={sto.red}
							/>
						)}
					</Section>
				)}
			</TableView>
		</ScrollView>
	)
}

let styles = StyleSheet.create({
	stage: {
		paddingVertical: 20,
	},

	balances: {
		borderRightWidth: StyleSheet.hairlineWidth,
		borderRightColor: c.separator,
	},

	finalCell: {
		borderRightWidth: 0,
	},

	balancesRow: {
		flexDirection: 'row',
		marginTop: 0,
		marginBottom: -10,
	},

	rectangle: {
		backgroundColor: c.secondarySystemGroupedBackground,
		height: 88,
		flex: 1,
		alignItems: 'center',
		paddingVertical: 10,
		paddingHorizontal: 10,
		marginBottom: 10,
	},

	// Text styling
	financialText: {
		paddingTop: 8,
		color: c.secondaryLabel,
		textAlign: 'center',
		fontWeight: '200',
		fontSize: 23,
	},
	rectangleButtonText: {
		paddingTop: 15,
		color: c.label,
		textAlign: 'center',
		fontSize: 16,
	},
})

function getValueOrNa(value: string | undefined): string {
	if (value === undefined) {
		return 'N/A'
	}
	return value
}

function FormattedValueCell(props: {
	indeterminate: boolean
	label: string
	value: string | undefined
	style?: StyleProp<ViewStyle>
	formatter?: (str: string | undefined) => string
}) {
	let {indeterminate, label, value, style, formatter = getValueOrNa} = props

	return (
		<View style={[styles.rectangle, styles.balances, style]}>
			<Text selectable={true} style={styles.financialText}>
				{indeterminate ? '…' : formatter(value)}
			</Text>
			<Text style={styles.rectangleButtonText}>{label}</Text>
		</View>
	)
}
