import * as React from 'react'
import {Alert, ScrollView, Share, StyleSheet, Text, View} from 'react-native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {Cell, Section, TableView} from '@frogpond/tableview'
import {
	CellTextField,
	CellToggle,
	PushButtonCell,
	ButtonCell,
} from '@frogpond/tableview/cells'
import * as c from '@frogpond/colors'
import jsYaml from 'js-yaml'

import {FaqBanner} from '../../../faqs/banner'
import {useDevBannerStore} from '../../../faqs/dev-banner-store'
import type {Faq, FaqSeverity, FaqTarget} from '../../../faqs/types'
import {FAQ_TARGET_SCREENS} from '../../../faqs/types'

const SEVERITY_OPTIONS: FaqSeverity[] = ['notice', 'info', 'alert']

const TARGET_OPTIONS = FAQ_TARGET_SCREENS

function generateId(): string {
	return `dev-${Date.now().toString(36)}`
}

function buildYamlEntry(faq: Faq): string {
	let entry: Record<string, unknown> = {
		id: faq.id,
		question: faq.question,
		answer: faq.answer,
		bannerTitle: faq.bannerTitle,
		bannerText: faq.bannerText,
		targets: faq.targets,
		severity: faq.severity,
		dismissable: faq.dismissable,
		updatedAt: new Date().toISOString(),
	}
	if (faq.bannerCta) {
		entry.bannerCta = faq.bannerCta
	}
	if (faq.icon) {
		entry.icon = faq.icon
	}
	if (faq.backgroundColor) {
		entry.backgroundColor = faq.backgroundColor
	}
	if (faq.foregroundColor) {
		entry.foregroundColor = faq.foregroundColor
	}
	return jsYaml.dump({faqs: [entry]}, {lineWidth: -1})
}

export function BannerBuilderView(): React.ReactNode {
	let upsertBanner = useDevBannerStore((state) => state.upsertBanner)

	let [id] = React.useState(generateId)
	let [bannerTitle, setBannerTitle] = React.useState('')
	let [bannerText, setBannerText] = React.useState('')
	let [question, setQuestion] = React.useState('')
	let [answer, setAnswer] = React.useState('')
	let [severity, setSeverity] = React.useState<FaqSeverity>('notice')
	let [icon, setIcon] = React.useState('')
	let [backgroundColor, setBackgroundColor] = React.useState('')
	let [foregroundColor, setForegroundColor] = React.useState('')
	let [dismissable, setDismissable] = React.useState(true)
	let [bannerCta, setBannerCta] = React.useState('')
	let [selectedTargets, setSelectedTargets] = React.useState<FaqTarget[]>([
		'Home',
	])

	let currentFaq: Faq = React.useMemo(
		() => ({
			id,
			question: question || bannerTitle || 'Untitled FAQ',
			answer: answer || bannerText || 'No answer provided.',
			bannerTitle: bannerTitle || 'Banner Title',
			bannerText: bannerText || 'Banner description text.',
			bannerCta: bannerCta || undefined,
			severity,
			icon: icon || undefined,
			backgroundColor: backgroundColor || undefined,
			foregroundColor: foregroundColor || undefined,
			dismissable,
			targets: selectedTargets,
		}),
		[
			id,
			question,
			answer,
			bannerTitle,
			bannerText,
			bannerCta,
			severity,
			icon,
			backgroundColor,
			foregroundColor,
			dismissable,
			selectedTargets,
		],
	)

	let [applied, setApplied] = React.useState(false)

	let toggleTarget = (target: FaqTarget) => {
		setSelectedTargets((prev) =>
			prev.includes(target)
				? prev.filter((t) => t !== target)
				: [...prev, target],
		)
	}

	let applyToApp = () => {
		upsertBanner(currentFaq)
		setApplied(true)
		Alert.alert(
			'Banner Applied',
			`Banner "${currentFaq.bannerTitle}" will persist on: ${selectedTargets.join(', ')}. Clear it from Settings > Dev > Dev Banner Overlay.`,
		)
	}

	let exportYaml = () => {
		let yaml = buildYamlEntry(currentFaq)
		Share.share({
			message: yaml,
			title: 'FAQ Banner YAML',
		})
	}

	return (
		<ScrollView
			contentInsetAdjustmentBehavior="automatic"
			keyboardDismissMode="on-drag"
			keyboardShouldPersistTaps="always"
			style={styles.container}
		>
			<View style={styles.previewSection}>
				<Text style={styles.previewLabel}>PREVIEW</Text>
				<BannerPreview applied={applied} faq={currentFaq} />
			</View>

			<TableView>
				<Section header="CONTENT">
					<CellTextField
						label="Title"
						labelWidth={110}
						onChangeText={setBannerTitle}
						placeholder="Banner title"
						value={bannerTitle}
					/>
					<CellTextField
						label="Text"
						labelWidth={110}
						multiline={true}
						onChangeText={setBannerText}
						placeholder="Banner description"
						value={bannerText}
					/>
					<CellTextField
						label="CTA"
						labelWidth={110}
						onChangeText={setBannerCta}
						placeholder="Learn more"
						value={bannerCta}
					/>
					<CellTextField
						label="Question"
						labelWidth={110}
						onChangeText={setQuestion}
						placeholder="FAQ question"
						value={question}
					/>
					<CellTextField
						label="Answer"
						labelWidth={110}
						multiline={true}
						onChangeText={setAnswer}
						placeholder="Full FAQ answer (markdown)"
						value={answer}
					/>
				</Section>

				<Section header="APPEARANCE">
					{SEVERITY_OPTIONS.map((opt) => (
						<Cell
							key={opt}
							accessory={severity === opt ? 'Checkmark' : undefined}
							onPress={() => setSeverity(opt)}
							title={opt.charAt(0).toUpperCase() + opt.slice(1)}
						/>
					))}
				</Section>

				<Section header="COLORS & ICON">
					<CellTextField
						label="Icon"
						labelWidth={110}
						onChangeText={setIcon}
						placeholder="e.g. alert-circle, help-circle"
						value={icon}
					/>
					<CellTextField
						label="BG Color"
						labelWidth={110}
						onChangeText={setBackgroundColor}
						placeholder="#fef2f2"
						value={backgroundColor}
					/>
					<CellTextField
						label="FG Color"
						labelWidth={110}
						onChangeText={setForegroundColor}
						placeholder="#7f1d1d"
						value={foregroundColor}
					/>
				</Section>

				<Section header="BEHAVIOR">
					<CellToggle
						label="Dismissable"
						onChange={setDismissable}
						value={dismissable}
					/>
				</Section>

				<Section header="TARGET SCREENS">
					{TARGET_OPTIONS.map((target) => (
						<Cell
							key={target}
							accessory={
								selectedTargets.includes(target) ? 'Checkmark' : undefined
							}
							onPress={() => toggleTarget(target)}
							title={target}
						/>
					))}
				</Section>

				<Section header="ACTIONS">
					<ButtonCell onPress={applyToApp} title="Apply Banner to App" />
					<PushButtonCell onPress={exportYaml} title="Export as YAML" />
				</Section>
			</TableView>
		</ScrollView>
	)
}

/** Inline preview that renders the banner directly from local form state */
function BannerPreview({
	faq,
	applied,
}: {
	faq: Faq
	applied: boolean
}): React.ReactNode {
	let noop = React.useCallback(() => undefined, [])

	// Temporarily inject the banner into the store for the preview FaqBanner,
	// but clean up on unmount so it doesn't leak to other screens —
	// unless the user explicitly applied it.
	let upsertBanner = useDevBannerStore((state) => state.upsertBanner)
	let removeBanner = useDevBannerStore((state) => state.removeBanner)
	let appliedRef = React.useRef(applied)

	React.useEffect(() => {
		appliedRef.current = applied
	}, [applied])

	React.useEffect(() => {
		upsertBanner(faq)
		return () => {
			if (!appliedRef.current) {
				removeBanner(faq.id)
			}
		}
	}, [faq, upsertBanner, removeBanner])

	return (
		<View style={styles.directPreview}>
			<FaqBanner faqId={faq.id} onPressOverride={noop} />
		</View>
	)
}

export const BannerBuilderNavigationOptions: NativeStackNavigationOptions = {
	title: 'Banner Builder',
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	previewSection: {
		padding: 16,
		gap: 8,
	},
	previewLabel: {
		color: c.secondaryLabel,
		fontSize: 12,
		fontWeight: '600',
		letterSpacing: 0.5,
	},
	directPreview: {
		marginTop: 8,
	},
})
