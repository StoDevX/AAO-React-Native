import * as React from 'react'
import {Alert, StyleSheet} from 'react-native'
import {Stack} from 'expo-router'
import {
	BottomSheet,
	Button,
	Group,
	Host,
	HStack,
	List,
	Picker,
	Section,
	Spacer,
	Text,
	Toggle,
} from '@expo/ui/swift-ui'
import {
	buttonStyle,
	controlSize,
	disabled,
	pickerStyle,
	presentationBackground,
	presentationDetents,
	presentationDragIndicator,
	tag,
	tint,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {SheetSection} from '@frogpond/sheet-section'
import {sto} from '../../../source/lib/colors'
import {SyncedTextField} from '../../../source/components/synced-text-field'
import {LibraryWrapper} from '../../../source/features/developer/component-library/base/library-wrapper'
import {
	BORDER_SHAPES,
	BUTTON_ROLES,
	BUTTON_STYLES,
	CONTROL_SIZES,
	DEFAULT_BUTTON,
	PLAYGROUND_SYMBOLS,
	TINTS,
	playgroundModifiers,
	type ButtonPlayground,
} from '../../../source/features/developer/component-library/lib/button-playground'

const tapped = (what: string) => () => Alert.alert('Tapped', what)

/** A titled row with the button at its trailing edge, as a settings row sets a control. */
function ExampleRow({
	title,
	children,
}: {
	title: string
	children: React.ReactNode
}): React.ReactNode {
	return (
		<HStack>
			<Text>{title}</Text>
			<Spacer />
			{children}
		</HStack>
	)
}

function StyleExamples(): React.ReactNode {
	return (
		<Section title="Styles">
			{BUTTON_STYLES.map((style) => (
				<ExampleRow key={style} title={style}>
					<Button label="Tap Me" modifiers={[buttonStyle(style)]} onPress={tapped(style)} />
				</ExampleRow>
			))}
		</Section>
	)
}

function RoleExamples(): React.ReactNode {
	return (
		<Section title="Roles">
			{BUTTON_ROLES.map((role) => (
				<ExampleRow key={role} title={role}>
					<Button
						label={role === 'destructive' ? 'Delete' : role === 'cancel' ? 'Cancel' : 'Save'}
						modifiers={[buttonStyle('bordered')]}
						onPress={tapped(role)}
						role={role}
					/>
				</ExampleRow>
			))}
		</Section>
	)
}

function SizeExamples(): React.ReactNode {
	return (
		<Section title="Sizes">
			{CONTROL_SIZES.map((size) => (
				<ExampleRow key={size} title={size}>
					<Button
						label="Tap Me"
						modifiers={[buttonStyle('borderedProminent'), controlSize(size)]}
						onPress={tapped(size)}
					/>
				</ExampleRow>
			))}
		</Section>
	)
}

function StateExamples(): React.ReactNode {
	return (
		<Section title="States">
			<ExampleRow title="Disabled">
				<Button label="Tap Me" modifiers={[buttonStyle('bordered'), disabled(true)]} />
			</ExampleRow>
			<ExampleRow title="Disabled, prominent">
				<Button label="Tap Me" modifiers={[buttonStyle('borderedProminent'), disabled(true)]} />
			</ExampleRow>
			<ExampleRow title="With a symbol">
				<Button
					label="Refresh"
					modifiers={[buttonStyle('bordered')]}
					onPress={tapped('With a symbol')}
					systemImage="arrow.clockwise"
				/>
			</ExampleRow>
			<ExampleRow title="Tinted">
				<Button
					label="Tap Me"
					modifiers={[buttonStyle('borderedProminent'), tint(sto.gold)]}
					onPress={tapped('Tinted')}
				/>
			</ExampleRow>
			<ExampleRow title="Long label">
				<Button
					label="A label long enough to need more than the row has room for"
					modifiers={[buttonStyle('bordered')]}
					onPress={tapped('Long label')}
				/>
			</ExampleRow>
		</Section>
	)
}

function PlaygroundButton({button}: {button: ButtonPlayground}): React.ReactNode {
	return (
		<HStack>
			<Spacer />
			<Button
				label={button.label}
				modifiers={playgroundModifiers(button)}
				onPress={tapped('the playground button')}
				role={button.role}
				systemImage={button.systemImage ?? undefined}
			/>
			<Spacer />
		</HStack>
	)
}

type SheetProps = {
	button: ButtonPlayground
	onChange: (button: ButtonPlayground) => void
	isPresented: boolean
	onIsPresentedChange: (presented: boolean) => void
}

// `presentationBackground` is typed for a string, but its colour goes through
// the same conversion as `tint`'s, which takes a PlatformColor.
const sheetBackground = c.systemGroupedBackground as unknown as string

const SHEET_MODIFIERS = [
	presentationDetents([{fraction: 0.5}, {fraction: 1.0}]),
	presentationDragIndicator('visible'),
	presentationBackground(sheetBackground),
]

/**
 * Every property the playground button has, to change while watching it. The
 * sheet stops at half height so the button above stays in view.
 */
function ButtonControlSheet({
	button,
	onChange,
	isPresented,
	onIsPresentedChange,
}: SheetProps): React.ReactNode {
	let set = <K extends keyof ButtonPlayground>(key: K) => {
		return (value: ButtonPlayground[K]) => onChange({...button, [key]: value})
	}

	return (
		// The sheet is itself a SwiftUI view, so it needs a Host of its own;
		// `pointerEvents` keeps this full-size one from taking taps meant for the
		// list behind it.
		<Host pointerEvents="none" style={StyleSheet.absoluteFill}>
			<BottomSheet isPresented={isPresented} onIsPresentedChange={onIsPresentedChange}>
				<Group modifiers={SHEET_MODIFIERS}>
					<List>
						<SheetSection title="Preview">
							<PlaygroundButton button={button} />
						</SheetSection>
						<SheetSection title="Label">
							<SyncedTextField
								onChangeText={set('label')}
								placeholder="Label"
								value={button.label}
							/>
							<Picker<string>
								label="Symbol"
								modifiers={[pickerStyle('menu')]}
								onSelectionChange={(symbol) =>
									set('systemImage')(
										symbol === 'none' ? null : (symbol as ButtonPlayground['systemImage']),
									)
								}
								selection={button.systemImage ?? 'none'}
							>
								{PLAYGROUND_SYMBOLS.map((symbol) => (
									<Text key={symbol} modifiers={[tag(symbol)]}>
										{symbol}
									</Text>
								))}
							</Picker>
						</SheetSection>
						<SheetSection title="Appearance">
							<Picker<string>
								label="Style"
								modifiers={[pickerStyle('menu')]}
								onSelectionChange={(style) => set('style')(style as ButtonPlayground['style'])}
								selection={button.style}
							>
								{BUTTON_STYLES.map((style) => (
									<Text key={style} modifiers={[tag(style)]}>
										{style}
									</Text>
								))}
							</Picker>
							<Picker<string>
								label="Size"
								modifiers={[pickerStyle('menu')]}
								onSelectionChange={(size) => set('size')(size as ButtonPlayground['size'])}
								selection={button.size}
							>
								{CONTROL_SIZES.map((size) => (
									<Text key={size} modifiers={[tag(size)]}>
										{size}
									</Text>
								))}
							</Picker>
							<Picker<string>
								label="Shape"
								modifiers={[pickerStyle('menu')]}
								onSelectionChange={(shape) => set('shape')(shape as ButtonPlayground['shape'])}
								selection={button.shape}
							>
								{BORDER_SHAPES.map((shape) => (
									<Text key={shape} modifiers={[tag(shape)]}>
										{shape}
									</Text>
								))}
							</Picker>
							<Picker<string>
								label="Tint"
								modifiers={[pickerStyle('menu')]}
								onSelectionChange={(key) => set('tint')(key)}
								selection={button.tint}
							>
								{Object.entries(TINTS).map(([key, {name}]) => (
									<Text key={key} modifiers={[tag(key)]}>
										{name}
									</Text>
								))}
							</Picker>
						</SheetSection>
						<SheetSection title="Behavior">
							<Picker<string>
								label="Role"
								modifiers={[pickerStyle('segmented')]}
								onSelectionChange={(role) => set('role')(role as ButtonPlayground['role'])}
								selection={button.role}
							>
								{BUTTON_ROLES.map((role) => (
									<Text key={role} modifiers={[tag(role)]}>
										{role}
									</Text>
								))}
							</Picker>
							<Toggle isOn={button.disabled} label="Disabled" onIsOnChange={set('disabled')} />
						</SheetSection>
						<SheetSection>
							<Button label="Reset" onPress={() => onChange(DEFAULT_BUTTON)} role="destructive" />
						</SheetSection>
					</List>
				</Group>
			</BottomSheet>
		</Host>
	)
}

export default function ButtonLibraryPage(): React.ReactNode {
	let [button, setButton] = React.useState(DEFAULT_BUTTON)
	let [isAdjusting, setIsAdjusting] = React.useState(false)

	return (
		<>
			<Stack.Title>Buttons</Stack.Title>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					accessibilityLabel="Adjust the Playground Button"
					icon="slider.horizontal.3"
					onPress={() => setIsAdjusting(true)}
				/>
			</Stack.Toolbar>

			<LibraryWrapper>
				<>
					<Section
						footer={<Text>Change it with the sliders button at the top right.</Text>}
						title="Playground"
					>
						<PlaygroundButton button={button} />
					</Section>
					<StyleExamples />
					<RoleExamples />
					<SizeExamples />
					<StateExamples />
				</>
			</LibraryWrapper>

			<ButtonControlSheet
				button={button}
				isPresented={isAdjusting}
				onChange={setButton}
				onIsPresentedChange={setIsAdjusting}
			/>
		</>
	)
}
