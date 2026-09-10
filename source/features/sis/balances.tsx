import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Host, HStack, List, RNHostView, Section, Text, VStack} from '@expo/ui/swift-ui'
import {
	font,
	foregroundStyle,
	frame,
	listStyle,
	multilineTextAlignment,
	refreshable,
	textSelection,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {BalancesShapeType, balancesOptions} from '../../lib/financials'
import {sto} from '../../lib/colors'
import {useRouter} from 'expo-router'
import {NoCredentialsError, credentialsOptions} from '../../lib/login'
import {useQuery} from '@tanstack/react-query'
import {FaqBannerGroup} from '../../features/faqs/banner'
import {FAQ_TARGETS} from '../../features/faqs/constants'
import {DetailRow, DisclosureRow} from '../../components/rows'
import {balanceValue} from './lib'

const DISCLAIMER = 'This data may be outdated or otherwise inaccurate.'

export const BalancesView = (): React.ReactNode => {
	let router = useRouter()

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
	} = useQuery(balancesOptions(username))

	// Settings hasn't been migrated to expo-router yet, so there's no route
	// to send this to without landing on an "Unmatched Route" screen --
	// leave it a no-op (matching today's actual behavior, since Settings is
	// unreachable already) until that migration lands.
	// oxlint-disable-next-line typescript/no-empty-function
	let openSettings = () => {}

	return (
		<Host style={styles.host} testID="balances-view">
			<List
				modifiers={[
					listStyle('insetGrouped'),
					refreshable(async () => {
						await refetch()
					}),
				]}
			>
				<Section>
					<RNHostView matchContents={true}>
						<FaqBannerGroup
							onPressFaq={(faqId) => router.push({pathname: '/Faq', params: {faqId}})}
							target={FAQ_TARGETS.SIS}
						/>
					</RNHostView>
				</Section>

				<Section footer={<Text>{DISCLAIMER}</Text>} title="BALANCES">
					<HStack spacing={0}>
						<BalanceTile isLoading={isLoading} label="Flex" value={data.flex} />
						<BalanceTile isLoading={isLoading} label="Ole" value={data.ole} />
						<BalanceTile isLoading={isLoading} label="Copy/Print" value={data.print} />
					</HStack>
				</Section>

				<Section footer={<Text>{DISCLAIMER}</Text>} title="MEAL PLAN">
					<HStack spacing={0}>
						<BalanceTile isLoading={isLoading} label="Daily Meals Left" value={data.daily} />
						<BalanceTile isLoading={isLoading} label="Weekly Meals Left" value={data.weekly} />
					</HStack>
					{data.plan ? <DetailRow label="Meal Plan" value={data.plan} /> : null}
				</Section>

				{isError && error instanceof Error ? (
					<Section footer={<Text>You&apos;ll need to log in in order to see this data.</Text>}>
						{error instanceof NoCredentialsError ? (
							<DisclosureRow onPress={openSettings} title="Log in with St. Olaf" />
						) : (
							<Text modifiers={[foregroundStyle(sto.red)]}>{error.message}</Text>
						)}
					</Section>
				) : null}
			</List>
		</Host>
	)
}

/**
 * One figure and what it counts, sharing a row with its siblings.
 *
 * `frame(maxWidth: Infinity)` on each is what splits the row evenly: three
 * balances or two meal counts, without either arrangement needing to say how
 * many there are.
 */
function BalanceTile(props: {
	isLoading: boolean
	label: string
	value: string | undefined
}): React.ReactNode {
	let {isLoading, label, value} = props

	return (
		<VStack modifiers={[frame({maxWidth: Infinity})]} spacing={6}>
			<Text
				modifiers={[
					font({textStyle: 'title2', weight: 'ultraLight'}),
					foregroundStyle(c.secondaryLabel),
					multilineTextAlignment('center'),
					textSelection(true),
				]}
			>
				{balanceValue(value, isLoading)}
			</Text>
			<Text
				modifiers={[
					font({textStyle: 'subheadline'}),
					foregroundStyle(c.label),
					multilineTextAlignment('center'),
				]}
			>
				{label}
			</Text>
		</VStack>
	)
}

let styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})
