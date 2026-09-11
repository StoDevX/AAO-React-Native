import * as React from 'react'
import {Alert, Share, StyleSheet} from 'react-native'
import {
	Host,
	LabeledContent,
	List,
	Picker,
	RNHostView,
	Section,
	Text,
	TextField,
	Toggle,
	useNativeState,
} from '@expo/ui/swift-ui'
import {lineLimit, listStyle, pickerStyle, tag} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {ActionRow} from '../../source/components/rows'
import {dump} from 'js-yaml'
import {Stack, useNavigation} from 'expo-router'

import {FaqBannerPresentation} from '../../source/features/faqs/banner'
import {useDevBannerStore} from '../../source/features/faqs/dev-banner-store'
import type {Faq, FaqSeverity, FaqTarget} from '../../source/features/faqs/types'
import {FAQ_TARGET_SCREENS} from '../../source/features/faqs/types'

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
	return dump({faqs: [entry]}, {lineWidth: -1})
}

export default function BannerBuilderPage(): React.ReactNode {
	const navigation = useNavigation()

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
	let [selectedTargets, setSelectedTargets] = React.useState<FaqTarget[]>(['Home'])

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

	let toggleTarget = (target: FaqTarget) => {
		setSelectedTargets((prev) =>
			prev.includes(target) ? prev.filter((t) => t !== target) : [...prev, target],
		)
	}

	let applyToApp = () => {
		upsertBanner(currentFaq)
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
		<>
			<Stack.Title>Banner Builder</Stack.Title>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					accessibilityLabel="Close Screen"
					icon="xmark"
					onPress={() => navigation.goBack()}
				/>
			</Stack.Toolbar>

			<Host style={styles.host}>
				<List modifiers={[listStyle('insetGrouped')]}>
					<Section title="PREVIEW">
						{/* The banner is a React Native component, so SwiftUI hosts it
						    -- and it redraws as the fields below are typed into. */}
						<RNHostView matchContents={true}>
							<FaqBannerPresentation faq={currentFaq} />
						</RNHostView>
					</Section>

					<Section title="CONTENT">
						<FormField label="Title" onChangeText={setBannerTitle} placeholder="Banner title" />
						<FormField
							label="Text"
							multiline={true}
							onChangeText={setBannerText}
							placeholder="Banner description"
						/>
						<FormField label="CTA" onChangeText={setBannerCta} placeholder="Learn more" />
						<FormField label="Question" onChangeText={setQuestion} placeholder="FAQ question" />
						<FormField
							label="Answer"
							multiline={true}
							onChangeText={setAnswer}
							placeholder="Full FAQ answer (markdown)"
						/>
					</Section>

					<Section title="APPEARANCE">
						{/* One of three, so a picker rather than rows carrying their own
						    checkmarks -- the control says it is a single choice. */}
						<Picker
							label="Severity"
							modifiers={[pickerStyle('segmented')]}
							onSelectionChange={(selection) => setSeverity(selection as FaqSeverity)}
							selection={severity}
						>
							{SEVERITY_OPTIONS.map((option) => (
								<Text key={option} modifiers={[tag(option)]}>
									{option.charAt(0).toUpperCase() + option.slice(1)}
								</Text>
							))}
						</Picker>
					</Section>

					<Section title="COLORS & ICON">
						<FormField
							label="Icon"
							onChangeText={setIcon}
							placeholder="e.g. alert-circle, help-circle"
						/>
						<FormField label="BG Color" onChangeText={setBackgroundColor} placeholder="#fef2f2" />
						<FormField label="FG Color" onChangeText={setForegroundColor} placeholder="#7f1d1d" />
					</Section>

					<Section title="BEHAVIOR">
						<Toggle isOn={dismissable} label="Dismissable" onIsOnChange={setDismissable} />
					</Section>

					{/* Toggles rather than rows with checkmarks: any number of these
					    can be on at once, which a checkmark does not say and a switch
					    does. */}
					<Section title="TARGET SCREENS">
						{TARGET_OPTIONS.map((target) => (
							<Toggle
								key={target}
								isOn={selectedTargets.includes(target)}
								label={target}
								onIsOnChange={() => toggleTarget(target)}
							/>
						))}
					</Section>

					<Section title="ACTIONS">
						<ActionRow onPress={applyToApp} title="Apply Banner to App" />
						<ActionRow onPress={exportYaml} title="Export as YAML" />
					</Section>
				</List>
			</Host>
		</>
	)
}

/**
 * One labelled field. `LabeledContent` puts the name leading and the field
 * trailing, which is what the old cell's fixed label width was imitating.
 *
 * The field owns its own native state: `TextField` writes through an
 * `ObservableState` rather than a plain string, so re-rendering the form as
 * each keystroke lands cannot fight what is being typed.
 */
function FormField(props: {
	label: string
	placeholder: string
	multiline?: boolean
	onChangeText: (text: string) => void
}): React.ReactNode {
	let {label, placeholder, multiline = false, onChangeText} = props
	let state = useNativeState('')

	return (
		<LabeledContent label={label}>
			<TextField
				axis={multiline ? 'vertical' : 'horizontal'}
				modifiers={multiline ? [lineLimit(4)] : []}
				onTextChange={onChangeText}
				placeholder={placeholder}
				text={state}
			/>
		</LabeledContent>
	)
}

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})
