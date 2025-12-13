import * as React from 'react'
import {
	GestureResponderEvent,
	Pressable,
	StyleProp,
	StyleSheet,
	Text,
	View,
	ViewStyle,
} from 'react-native'
import * as c from '@frogpond/colors'
import {useNavigation} from '@react-navigation/native'
import {NativeStackNavigationProp} from '@react-navigation/native-stack'

import {RootStackParamList} from '../../navigation/types'
import {FaqTarget, useFaqs} from './query'
import {getFaqVersion, useFaqBannerStore} from './store'

type Props = {
	style?: StyleProp<ViewStyle>
	target: FaqTarget
	onPressOverride?: () => void
}

export function FaqBanner({
	style,
	target,
	onPressOverride,
}: Props): JSX.Element | null {
	let navigation =
		useNavigation<NativeStackNavigationProp<RootStackParamList>>()
	let {data, isError} = useFaqs()
	let dismissFaq = useFaqBannerStore((state) => state.dismissFaq)
	let dismissedMap = useFaqBannerStore((state) => state.dismissed)

	let faq = React.useMemo(() => {
		if (!data) {
			return undefined
		}

		return data.faqs.find((entry) => entry.targets.includes(target))
	}, [data, target])

	let faqVersion = faq ? getFaqVersion(faq) : ''
	let isDismissed = Boolean(faq && dismissedMap[faq.id] === faqVersion)

	if (!faq || isError || isDismissed) {
		return null
	}

	let onPress =
		onPressOverride ?? (() => navigation.navigate('Faq', {faqId: faq.id}))
	let onDismiss = (event: GestureResponderEvent) => {
		event.stopPropagation()
		dismissFaq(faq.id, faqVersion)
	}

	return (
		<Pressable
			accessibilityRole="button"
			onPress={onPress}
			style={[styles.container, style]}
			testID={`faq-banner-${target}`}
		>
			<View style={styles.header}>
				<Text style={styles.title}>{faq.bannerTitle ?? faq.question}</Text>
				<Pressable
					accessibilityLabel="Dismiss FAQ banner"
					accessibilityRole="button"
					hitSlop={8}
					onPress={onDismiss}
					style={styles.dismissButton}
				>
					<Text style={styles.dismissText}>×</Text>
				</Pressable>
			</View>
			{faq.bannerText ? (
				<Text style={styles.subtitle}>{faq.bannerText}</Text>
			) : null}

			<View style={styles.ctaRow}>
				<Text style={styles.cta}>Learn more</Text>
			</View>
		</Pressable>
	)
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: c.white,
		borderColor: c.separator,
		borderRadius: 14,
		borderWidth: StyleSheet.hairlineWidth,
		padding: 16,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		justifyContent: 'space-between',
		marginBottom: 6,
	},
	dismissButton: {
		alignItems: 'center',
		backgroundColor: c.secondarySystemBackground,
		borderRadius: 12,
		height: 24,
		justifyContent: 'center',
		marginLeft: 8,
		width: 24,
	},
	dismissText: {
		color: c.systemBlue,
		fontSize: 16,
		fontWeight: '600',
	},
	title: {
		flex: 1,
		color: c.label,
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 0,
		marginRight: 8,
	},
	subtitle: {
		color: c.secondaryLabel,
		fontSize: 14,
		lineHeight: 18,
		marginBottom: 12,
	},
	ctaRow: {
		flexDirection: 'row',
	},
	cta: {
		color: c.link,
		fontWeight: '600',
	},
})
