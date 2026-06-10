import * as React from 'react'
import {
	GestureResponderEvent,
	Pressable,
	StyleProp,
	StyleSheet,
	Text,
	View,
	ViewStyle,
	ColorValue,
} from 'react-native'
import * as c from '@frogpond/colors'
import {useNavigation} from '@react-navigation/native'
import {NativeStackNavigationProp} from '@react-navigation/native-stack'
import {Ionicons as Icon} from '@react-native-vector-icons/ionicons'
import type IoniconsGlyphs from '@react-native-vector-icons/ionicons/glyphmaps/Ionicons.json'

type IoniconsGlyph = keyof typeof IoniconsGlyphs

import {RootStackParamList} from '../../navigation/types'
import {faqsOptions} from './query'
import {useQuery} from '@tanstack/react-query'
import {getFaqVersion, useFaqBannerStore} from './store'
import {useDevBannerStore} from './dev-banner-store'
import type {Faq, FaqTarget, FaqSeverity} from './types'

/** Shared helper to find a matching dev banner by faqId or target */
export function findDevBanner(
	devBanners: Faq[],
	devEnabled: boolean,
	faqId?: string,
	target?: FaqTarget,
): Faq | undefined {
	if (!devEnabled || devBanners.length === 0) {
		return undefined
	}
	if (faqId) {
		let match = devBanners.find((entry) => entry.id === faqId)
		if (match) return match
	}
	if (target) {
		return devBanners.find((entry) => entry.targets.includes(target))
	}
	return undefined
}

type Props = {
	style?: StyleProp<ViewStyle>
	target?: FaqTarget
	faqId?: string
	onPressOverride?: () => void
}

export function FaqBanner({
	style,
	target,
	faqId,
	onPressOverride,
}: Props): React.ReactNode {
	let navigation =
		useNavigation<NativeStackNavigationProp<RootStackParamList>>()
	let {data, isError} = useQuery(faqsOptions)
	let dismissFaq = useFaqBannerStore((state) => state.dismissFaq)
	let dismissedMap = useFaqBannerStore((state) => state.dismissed)
	let devBanners = useDevBannerStore((state) => state.devBanners)
	let devEnabled = useDevBannerStore((state) => state.enabled)

	let faq = React.useMemo(() => {
		// Dev banners take priority when enabled
		let devMatch = findDevBanner(devBanners, devEnabled, faqId, target)
		if (devMatch) return devMatch

		if (!data) {
			return undefined
		}

		if (faqId) {
			return data.faqs.find((entry) => entry.id === faqId)
		}

		if (target) {
			return data.faqs.find((entry) => entry.targets.includes(target))
		}

		return undefined
	}, [data, target, faqId, devBanners, devEnabled])

	if (!faq || isError) {
		return null
	}

	const resolvedFaq = faq
	let faqVersion = getFaqVersion(resolvedFaq)
	let dismissal = dismissedMap[resolvedFaq.id]
	let isDismissed =
		dismissal?.version === faqVersion &&
		!shouldShowAfterDelay(resolvedFaq, dismissal.dismissedAt)

	if (isDismissed) {
		return null
	}

	let palette = buildPalette(resolvedFaq)

	let onPress =
		onPressOverride ??
		(() => navigation.navigate('Faq', {faqId: resolvedFaq.id}))
	let onDismiss = (event?: GestureResponderEvent) => {
		event?.stopPropagation?.()
		dismissFaq(resolvedFaq.id, faqVersion)
	}

	return (
		<Pressable
			accessibilityRole="button"
			onPress={onPress}
			style={[
				styles.container,
				{
					backgroundColor: palette.background,
					borderColor: palette.border,
				},
				style,
			]}
			testID={`faq-banner-${faqId ?? target ?? 'unknown'}`}
		>
			<View style={styles.header}>
				<Icon
					accessibilityElementsHidden={true}
					color={palette.iconColor}
					name={palette.icon}
					size={18}
					style={styles.icon}
				/>
				<Text style={[styles.title, {color: palette.text}]}>
					{resolvedFaq.bannerTitle ?? resolvedFaq.question}
				</Text>
				{resolvedFaq.dismissable ? (
					<Pressable
						accessibilityLabel="Dismiss FAQ banner"
						accessibilityRole="button"
						hitSlop={8}
						onPress={onDismiss}
						style={[
							styles.dismissButton,
							{
								backgroundColor: palette.dismissBackground,
							},
						]}
					>
						<Text style={[styles.dismissText, {color: palette.dismissText}]}>
							×
						</Text>
					</Pressable>
				) : null}
			</View>
			{resolvedFaq.bannerText ? (
				<Text style={[styles.subtitle, {color: palette.secondaryText}]}>
					{resolvedFaq.bannerText}
				</Text>
			) : null}

			<View style={styles.ctaRow}>
				<Text style={[styles.cta, {color: palette.link}]}>
					{resolvedFaq.bannerCta ?? 'Learn more'}
				</Text>
			</View>
		</Pressable>
	)
}

type GroupProps = {
	target: FaqTarget
	style?: StyleProp<ViewStyle>
}

export function FaqBannerGroup({target, style}: GroupProps): React.ReactNode {
	let {data, isError} = useQuery(faqsOptions)
	let devBanners = useDevBannerStore((state) => state.devBanners)
	let devEnabled = useDevBannerStore((state) => state.enabled)

	if (!data || isError) {
		return null
	}

	let matching = data.faqs.filter((entry) => entry.targets.includes(target))

	// Merge dev banners targeting this screen
	if (devEnabled && devBanners.length > 0) {
		let devMatching = devBanners.filter(
			(entry) =>
				entry.targets.includes(target) &&
				!matching.some((m) => m.id === entry.id),
		)
		matching = [...devMatching, ...matching]
	}

	if (!matching.length) {
		return null
	}

	return (
		<View style={[styles.groupContainer, style]}>
			{matching.map((entry) => (
				<FaqBanner
					key={entry.id}
					faqId={entry.id}
					style={styles.groupBanner}
					target={target}
				/>
			))}
		</View>
	)
}

type Palette = {
	background: ColorValue
	border: ColorValue
	text: ColorValue
	secondaryText: ColorValue
	link: ColorValue
	icon: IoniconsGlyph
	iconColor: ColorValue
	dismissBackground: ColorValue
	dismissText: ColorValue
}

const SEVERITY_MAP: Record<FaqSeverity, Palette> = {
	notice: {
		background: c.white as ColorValue,
		border: c.separator as ColorValue,
		text: c.label as ColorValue,
		secondaryText: c.secondaryLabel as ColorValue,
		link: c.link as ColorValue,
		icon: 'information-circle',
		iconColor: c.systemBlue as ColorValue,
		dismissBackground: c.secondarySystemBackground as ColorValue,
		dismissText: c.systemBlue as ColorValue,
	},
	info: {
		background: '#f0f9ff',
		border: '#b6e0fe',
		text: '#0f172a',
		secondaryText: '#0f172a',
		link: '#075985',
		icon: 'help-circle',
		iconColor: '#075985',
		dismissBackground: '#dbeafe',
		dismissText: '#1d4ed8',
	},
	alert: {
		background: '#fef2f2',
		border: '#fecaca',
		text: '#7f1d1d',
		secondaryText: '#7f1d1d',
		link: '#b91c1c',
		icon: 'alert-circle',
		iconColor: '#b91c1c',
		dismissBackground: '#fee2e2',
		dismissText: '#b91c1c',
	},
}

type PresentationProps = {
	faq: Faq
	style?: StyleProp<ViewStyle>
	onPress?: () => void
}

/**
 * A purely presentational banner component that renders a given Faq object
 * without reading from any store. Useful for local previews.
 */
export function FaqBannerPresentation({
	faq,
	style,
	onPress,
}: PresentationProps): React.ReactNode {
	let palette = buildPalette(faq)

	return (
		<Pressable
			accessibilityRole="button"
			onPress={onPress}
			style={[
				styles.container,
				{
					backgroundColor: palette.background,
					borderColor: palette.border,
				},
				style,
			]}
			testID={`faq-banner-preview-${faq.id}`}
		>
			<View style={styles.header}>
				<Icon
					accessibilityElementsHidden={true}
					color={palette.iconColor}
					name={palette.icon}
					size={18}
					style={styles.icon}
				/>
				<Text style={[styles.title, {color: palette.text}]}>
					{faq.bannerTitle ?? faq.question}
				</Text>
				{faq.dismissable ? (
					<View
						style={[
							styles.dismissButton,
							{backgroundColor: palette.dismissBackground},
						]}
					>
						<Text style={[styles.dismissText, {color: palette.dismissText}]}>
							×
						</Text>
					</View>
				) : null}
			</View>
			{faq.bannerText ? (
				<Text style={[styles.subtitle, {color: palette.secondaryText}]}>
					{faq.bannerText}
				</Text>
			) : null}

			<View style={styles.ctaRow}>
				<Text style={[styles.cta, {color: palette.link}]}>
					{faq.bannerCta ?? 'Learn more'}
				</Text>
			</View>
		</Pressable>
	)
}

function buildPalette(faq: Faq): Palette {
	let severity = faq.severity ?? 'notice'
	let base = SEVERITY_MAP[severity]

	return {
		...base,
		background: faq.backgroundColor ?? base.background,
		text: faq.foregroundColor ?? base.text,
		secondaryText: faq.foregroundColor
			? faq.foregroundColor
			: base.secondaryText,
		icon: (faq.icon as IoniconsGlyph | undefined) ?? base.icon,
	}
}

function shouldShowAfterDelay(faq: Faq, dismissedAt?: number): boolean {
	if (!faq.repeatRule || !dismissedAt) {
		return false
	}

	return Date.now() - dismissedAt >= faq.repeatRule.intervalMs
}

const styles = StyleSheet.create({
	container: {
		borderRadius: 14,
		borderWidth: StyleSheet.hairlineWidth,
		padding: 16,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 6,
		gap: 8,
	},
	dismissButton: {
		alignItems: 'center',
		borderRadius: 12,
		height: 24,
		justifyContent: 'center',
		width: 24,
	},
	dismissText: {
		fontSize: 16,
		fontWeight: '600',
	},
	title: {
		flex: 1,
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 0,
	},
	subtitle: {
		fontSize: 14,
		lineHeight: 18,
		marginBottom: 12,
	},
	ctaRow: {
		flexDirection: 'row',
	},
	cta: {
		fontWeight: '600',
	},
	icon: {
		marginRight: 4,
	},
	groupContainer: {
		gap: 12,
	},
	groupBanner: {
		marginVertical: 0,
	},
})
