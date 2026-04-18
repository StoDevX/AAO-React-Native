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
import {BalancesShapeType, balancesOptions} from '../../lib/financials'
import * as c from '@frogpond/colors'
import {sto} from '../../lib/colors'
import {useNavigation} from '@react-navigation/native'
import {NoCredentialsError, credentialsOptions} from '../../lib/login'
import {useQuery} from '@tanstack/react-query'
import {FaqBannerGroup} from '../faqs'
import {FAQ_TARGETS} from '../faqs/constants'

const DISCLAIMER = 'This data may be outdated or otherwise inaccurate.'

export const BalancesView = (): React.ReactNode => {
	let navigation = useNavigation()
	let {data: username = ''} = useQuery({
		...credentialsOptions,
		select: (data) => data?.username,
	})

	let {
		data = {} as BalancesShapeType,
		error,
		isError,
		isLoading,
		refetch,
		isRefetching,
	} = useQuery(balancesOptions(username))

	let openSettings = () => navigation.navigate('Settings')
	let refresh = <RefreshControl onRefresh={refetch} refreshing={isRefetching} />

	return (
		<ScrollView
			contentContainerStyle={styles.stage}
			refreshControl={refresh}
			testID="balances-view"
		>
			<FaqBannerGroup style={styles.banner} target={FAQ_TARGETS.SIS} />
			<TableView>
				<Section footer={DISCLAIMER} header="BALANCES">
					<View style={styles.balancesRow}>
						<FormattedValueCell
							indeterminate={isLoading}
							label="Flex"
							value={data.flex}
						/>

						<FormattedValueCell
							indeterminate={isLoading}
							label="Ole"
							value={data.ole}
						/>

						<FormattedValueCell
							indeterminate={isLoading}
							label="Copy/Print"
							style={styles.finalCell}
							value={data.print}
						/>
					</View>
				</Section>

				<Section footer={DISCLAIMER} header="MEAL PLAN">
					<View style={styles.balancesRow}>
						<FormattedValueCell
							indeterminate={isLoading}
							label="Daily Meals Left"
							value={data.daily}
						/>

						<FormattedValueCell
							indeterminate={isLoading}
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
	banner: {
		marginHorizontal: 16,
		marginBottom: 16,
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
