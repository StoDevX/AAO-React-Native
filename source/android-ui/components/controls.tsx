import * as React from 'react'
import type {KeyboardTypeOptions, ReturnKeyTypeOptions} from 'react-native'

import {
	Picker as UniversalPicker,
	Switch as UniversalSwitch,
	TextInput,
	type TextInputRef,
} from '@expo/ui'
import type {
	ContentUnavailableViewProps,
	DatePickerProps,
	PickerProps,
	ProgressViewProps,
	SecureFieldProps,
	SecureFieldRef,
	TextFieldProps,
	TextFieldRef,
	ToggleProps,
} from '@expo/ui/swift-ui'
import {
	BasicAlertDialog,
	CircularProgressIndicator,
	Column,
	DateTimePicker,
	DropdownMenu,
	LinearProgressIndicator,
	Row,
	SegmentedButton,
	SingleChoiceSegmentedButtonRow,
	Surface,
	Text as ComposeText,
	TextButton,
	useNativeState,
	type DisplayedComponents,
} from '@expo/ui/jetpack-compose'
import {
	clip,
	fillMaxSize,
	fillMaxWidth,
	padding,
	Shapes,
	weight,
	wrapContentHeight,
} from '@expo/ui/jetpack-compose/modifiers'

import {usePalette} from '../colors'
import {Claimed, MenuContext} from '../context'
import {
	find,
	identifierOf,
	labelOf,
	stringParam,
	tagOf,
	toCompose,
	useAxis,
	useEnvironment,
	useLifecycle,
	type ModifierList,
} from '../modifiers'
import {Inherit} from './layout'
import {SymbolIcon} from './image'
import {MenuEntry} from './menu-entry'
import {asRow, RowCard, useRowSlot} from './row'
import {Text, textOf} from './text'

/** The label a control shows: its `label` string, else its children as the label view. */
function controlLabel(label: React.ReactNode, children: React.ReactNode): React.ReactNode {
	if (children !== undefined && children !== null) {
		return children
	}
	if (typeof label === 'string') {
		return <Text>{label}</Text>
	}
	return label ?? null
}

/**
 * SwiftUI's `Toggle`. In a list: a list item with a trailing universal
 * `Switch`, the whole row toggling it. In a menu: a menu item with a check
 * when on, which is how the filter menus mark their choices. Elsewhere: the
 * universal `Switch` with its label beside it.
 */
export function Toggle(props: ToggleProps): React.ReactNode {
	let {isOn = false, label, systemImage, onIsOnChange, children, modifiers} = props
	let palette = usePalette()
	let env = useEnvironment(modifiers)
	let axis = useAxis()
	let slot = useRowSlot()
	let menu = React.useContext(MenuContext)
	useLifecycle(modifiers)
	let enabled = env.disabled !== true
	let flip = () => onIsOnChange?.(!isOn)

	if (menu) {
		return <MenuEntry checked={isOn} label={label ?? textOf(children) ?? ''} onPress={flip} />
	}
	let toggle = (
		<UniversalSwitch
			disabled={!enabled}
			onValueChange={(value) => onIsOnChange?.(value)}
			testID={identifierOf(modifiers)}
			value={isOn}
		/>
	)
	let text = env.labelsHidden ? null : controlLabel(label, children)
	if (slot) {
		return (
			<RowCard
				enabled={enabled}
				leading={systemImage ? <SymbolIcon name={systemImage} size={24} /> : undefined}
				modifiers={modifiers}
				onPress={flip}
				slot={slot}
				trailing={toggle}
			>
				<Inherit axis="none" env={env}>
					{text}
				</Inherit>
			</RowCard>
		)
	}
	if (!text) {
		return toggle
	}
	return (
		<Row
			horizontalArrangement={{spacedBy: 16}}
			modifiers={toCompose(modifiers, {palette, axis})}
			verticalAlignment="center"
		>
			<Column modifiers={[weight(1)]}>
				<Inherit axis="column" env={env}>
					{text}
				</Inherit>
			</Column>
			{toggle}
		</Row>
	)
}

/** One choice of a `Picker`: the value its `tag(…)` carries, and its view. */
type PickerOption = {value: string | number; label: string; node: React.ReactNode}

/** A picker's options, from the tagged views among its children. */
function pickerOptions(children: React.ReactNode): PickerOption[] {
	let out: PickerOption[] = []
	React.Children.forEach(children, (child) => {
		if (!React.isValidElement<{modifiers?: ModifierList; children?: React.ReactNode}>(child)) {
			return
		}
		if (child.type === React.Fragment) {
			out.push(...pickerOptions(child.props.children))
			return
		}
		let value = tagOf(child.props.modifiers)
		if (value === undefined) {
			return
		}
		out.push({value, label: textOf(child) ?? String(value), node: child})
	})
	return out
}

/**
 * SwiftUI's `Picker`.
 *
 * - `segmented`: a Material `SingleChoiceSegmentedButtonRow`.
 * - In a menu: its options as checkable menu items.
 * - In a list: a list item showing the choice under its label, opening a
 *   dropdown of the options, as a Material settings row does.
 * - Elsewhere: the universal `Picker`, an exposed dropdown menu.
 */
export function Picker<T extends string | number | null>(props: PickerProps<T>): React.ReactNode {
	let {label, systemImage, selection, onSelectionChange, children, modifiers} = props
	let palette = usePalette()
	let env = useEnvironment(modifiers)
	let axis = useAxis()
	let slot = useRowSlot()
	let menu = React.useContext(MenuContext)
	let [expanded, setExpanded] = React.useState(false)
	let menuScope = React.useMemo(() => ({close: () => setExpanded(false), index: 0}), [])
	useLifecycle(modifiers)
	let options = pickerOptions(children)
	let choose = (value: string | number) => onSelectionChange?.(value as T)
	let enabled = env.disabled !== true
	let style = env.pickerStyle ?? 'menu'
	let title = typeof label === 'string' ? label : textOf(label)

	if (menu) {
		return (
			<>
				{title ? <MenuEntry label={title} systemImage={systemImage} /> : null}
				{options.map((option) => (
					<MenuEntry
						checked={option.value === selection}
						key={String(option.value)}
						label={option.label}
						onPress={() => choose(option.value)}
					/>
				))}
			</>
		)
	}

	if (style === 'segmented' || style === 'palette') {
		let row = (
			<SingleChoiceSegmentedButtonRow
				modifiers={[...toCompose(modifiers, {palette, axis}), fillMaxWidth()]}
			>
				{options.map((option) => (
					<SegmentedButton
						enabled={enabled}
						key={String(option.value)}
						onClick={() => choose(option.value)}
						selected={option.value === selection}
					>
						<SegmentedButton.Label>
							<Claimed>{option.node}</Claimed>
						</SegmentedButton.Label>
					</SegmentedButton>
				))}
			</SingleChoiceSegmentedButtonRow>
		)
		return asRow(slot, row, modifiers)
	}

	let chosen = options.find((option) => option.value === selection)
	if (slot) {
		return (
			<DropdownMenu expanded={expanded} onDismissRequest={() => setExpanded(false)}>
				<DropdownMenu.Trigger>
					<RowCard
						enabled={enabled}
						leading={systemImage ? <SymbolIcon name={systemImage} size={24} /> : undefined}
						modifiers={modifiers}
						onPress={() => setExpanded(true)}
						slot={slot}
						supporting={chosen ? <ComposeText>{chosen.label}</ComposeText> : undefined}
						trailing={<SymbolIcon name="chevron.down" size={24} />}
					>
						<Inherit axis="none" env={env}>
							{env.labelsHidden ? null : controlLabel(label, null)}
						</Inherit>
					</RowCard>
				</DropdownMenu.Trigger>
				<DropdownMenu.Items>
					<MenuContext.Provider value={menuScope}>
						{options.map((option) => (
							<MenuEntry
								checked={option.value === selection}
								key={String(option.value)}
								label={option.label}
								onPress={() => choose(option.value)}
							/>
						))}
					</MenuContext.Provider>
				</DropdownMenu.Items>
			</DropdownMenu>
		)
	}

	return (
		<Column modifiers={toCompose(modifiers, {palette, axis})}>
			<UniversalPicker
				enabled={enabled}
				onValueChange={(value) => choose(value)}
				selectedValue={chosen?.value ?? ''}
			>
				{options.map((option) => (
					<UniversalPicker.Item
						key={String(option.value)}
						label={option.label}
						value={option.value}
					/>
				))}
			</UniversalPicker>
		</Column>
	)
}

/** SwiftUI's displayed components, as the Compose picker's. */
function displayedComponents(
	components: DatePickerProps['displayedComponents'],
): DisplayedComponents {
	let date = components?.includes('date') ?? true
	let time = components?.includes('hourAndMinute') ?? false
	if (date && time) {
		return 'dateAndTime'
	}
	return time ? 'hourAndMinute' : 'date'
}

/** A date as a compact picker's chip shows it. */
function formatChoice(date: Date, components: DisplayedComponents): string {
	let day = date.toLocaleDateString(undefined, {dateStyle: 'medium'})
	let time = date.toLocaleTimeString(undefined, {hour: 'numeric', minute: '2-digit'})
	if (components === 'hourAndMinute') {
		return time
	}
	return components === 'dateAndTime' ? `${day}, ${time}` : day
}

/**
 * SwiftUI's `DatePicker`. A `graphical` (or wheel) picker is Compose's inline
 * date/time picker. A compact one -- SwiftUI's default -- is its value as a
 * text button, which opens the picker in a Material dialog; in a list it is
 * the trailing part of a row titled with the picker's title.
 */
export function DatePicker(props: DatePickerProps): React.ReactNode {
	let {title, selection, range, displayedComponents: components, onDateChange, modifiers} = props
	let palette = usePalette()
	let env = useEnvironment(modifiers)
	let axis = useAxis()
	let slot = useRowSlot()
	let [open, setOpen] = React.useState(false)
	useLifecycle(modifiers)
	let shown = displayedComponents(components)
	let [openedAt] = React.useState(() => new Date())
	let value = selection ?? openedAt
	let pickerStyle = stringParam(modifiers, 'datePickerStyle', 'style') ?? 'compact'
	let selectable = range ? {start: range.start, end: range.end} : undefined

	let picker = (
		<DateTimePicker
			displayedComponents={shown}
			initialDate={value.toISOString()}
			onDateSelected={(date) => onDateChange?.(date)}
			selectableDates={selectable}
			showVariantToggle={false}
		/>
	)
	if (pickerStyle === 'graphical' || pickerStyle === 'wheel') {
		return asRow(
			slot,
			<Column modifiers={toCompose(modifiers, {palette, axis})}>{picker}</Column>,
			modifiers,
		)
	}

	let chip = (
		<TextButton enabled={env.disabled !== true} onClick={() => setOpen(true)}>
			<ComposeText>{formatChoice(value, shown)}</ComposeText>
		</TextButton>
	)
	let dialog = open ? (
		<BasicAlertDialog onDismissRequest={() => setOpen(false)}>
			<Surface
				color={palette.colors.surfaceContainerHigh}
				modifiers={[clip(Shapes.RoundedCorner(28)), wrapContentHeight()]}
			>
				<Column horizontalAlignment="end" modifiers={[padding(0, 0, 0, 8)]}>
					{picker}
					<TextButton modifiers={[padding(0, 0, 12, 0)]} onClick={() => setOpen(false)}>
						<ComposeText>Done</ComposeText>
					</TextButton>
				</Column>
			</Surface>
		</BasicAlertDialog>
	) : null

	if (slot) {
		return (
			<RowCard modifiers={modifiers} slot={slot} trailing={chip}>
				<Text>{env.labelsHidden ? '' : (title ?? '')}</Text>
				{dialog}
			</RowCard>
		)
	}
	return (
		<Row modifiers={toCompose(modifiers, {palette, axis})} verticalAlignment="center">
			{title && !env.labelsHidden ? (
				<ComposeText modifiers={[weight(1)]} style={{typography: 'bodyLarge'}}>
					{title}
				</ComposeText>
			) : null}
			{chip}
			{dialog}
		</Row>
	)
}

/** SwiftUI's capitalisation modes, as React Native's. */
const CAPITALIZATION: Readonly<Record<string, 'none' | 'sentences' | 'words' | 'characters'>> = {
	never: 'none',
	sentences: 'sentences',
	words: 'words',
	characters: 'characters',
}

/** SwiftUI's submit labels, as React Native's return keys. */
function returnKeyOf(label: string | undefined): ReturnKeyTypeOptions | undefined {
	switch (label) {
		case 'go':
		case 'next':
		case 'search':
		case 'send':
		case 'done':
			return label
		case undefined:
			return undefined
		default:
			return 'done'
	}
}

/** The props `TextField` and `SecureField` share. */
type FieldProps = (TextFieldProps | SecureFieldProps) & {secure?: boolean}

/**
 * A text field, on the universal `TextInput`: in a list it is the row's
 * content, as an inline field in a Form row is; elsewhere it sits on a filled
 * `surfaceContainerHighest` field shape. Modifiers for the keyboard
 * (`keyboardType`, `textInputAutocapitalization`, `submitLabel`, `onSubmit`…)
 * become its props, and its ref answers the SwiftUI field's methods.
 */
function Field(props: FieldProps & {ref?: React.Ref<TextFieldRef>}): React.ReactNode {
	let {
		text,
		placeholder,
		onTextChange,
		onFocusChange,
		autoFocus,
		maxLength,
		modifiers,
		ref,
		secure,
	} = props
	let axisProp = 'axis' in props ? props.axis : undefined
	let palette = usePalette()
	let env = useEnvironment(modifiers)
	let axis = useAxis()
	let slot = useRowSlot()
	let input = React.useRef<TextInputRef>(null)
	let fallback = useNativeState('')
	let state = text ?? fallback
	useLifecycle(modifiers)

	React.useImperativeHandle(
		ref,
		() => ({
			setText: (value: string) => {
				state.set(value)
				onTextChange?.(value)
				return Promise.resolve()
			},
			clear: () => {
				input.current?.clear()
				return Promise.resolve()
			},
			focus: () => {
				input.current?.focus()
				return Promise.resolve()
			},
			blur: () => {
				input.current?.blur()
				return Promise.resolve()
			},
			setSelection: (start: number, end: number) =>
				input.current?.setSelection(start, end) ?? Promise.resolve(),
		}),
		[state, onTextChange],
	)

	let submit = find(modifiers, 'onSubmit')
	let multiline = axisProp === 'vertical'
	let lines = env.lineLimit?.min ?? (multiline ? env.lineLimit?.max : undefined)
	let field = (
		<TextInput
			autoCapitalize={
				CAPITALIZATION[
					stringParam(modifiers, 'textInputAutocapitalization', 'autocapitalization') ?? ''
				]
			}
			autoCorrect={find(modifiers, 'autocorrectionDisabled') ? false : undefined}
			autoFocus={autoFocus}
			cursorColor={palette.colors.primary}
			editable={env.disabled !== true}
			keyboardType={
				stringParam(modifiers, 'keyboardType', 'keyboardType') as KeyboardTypeOptions | undefined
			}
			maxLength={maxLength}
			modifiers={[fillMaxWidth()]}
			multiline={multiline}
			numberOfLines={lines}
			onBlur={() => onFocusChange?.(false)}
			onChangeText={onTextChange}
			onFocus={() => onFocusChange?.(true)}
			onSubmitEditing={
				submit
					? () => (submit.eventListener as ((args: unknown) => void) | undefined)?.({})
					: undefined
			}
			placeholder={placeholder}
			placeholderTextColor={palette.colors.onSurfaceVariant}
			ref={input}
			returnKeyType={returnKeyOf(stringParam(modifiers, 'submitLabel', 'submitLabel'))}
			secureTextEntry={secure}
			testID={identifierOf(modifiers) ?? labelOf(modifiers)}
			textStyle={{color: palette.colors.onSurface, fontSize: 16}}
			value={state}
		/>
	)
	if (slot) {
		return (
			<RowCard modifiers={modifiers} slot={slot}>
				{field}
			</RowCard>
		)
	}
	return (
		<Surface
			color={palette.colors.surfaceContainerHighest}
			modifiers={[...toCompose(modifiers, {palette, axis}), clip(Shapes.RoundedCorner(12))]}
		>
			<Column modifiers={[padding(16, 14, 16, 14)]}>{field}</Column>
		</Surface>
	)
}

/** SwiftUI's `TextField`. */
export function TextField(props: TextFieldProps): React.ReactNode {
	return <Field {...props} />
}
TextField.Placeholder = function Placeholder({
	children,
}: {
	children: React.ReactNode
}): React.ReactNode {
	return children
}

/** SwiftUI's `SecureField`: a `TextField` whose text is masked. */
export function SecureField(props: SecureFieldProps): React.ReactNode {
	let {ref, ...rest} = props
	return <Field {...rest} ref={ref as React.Ref<TextFieldRef> | undefined} secure={true} />
}
SecureField.Placeholder = TextField.Placeholder

/** Re-exported so the ref types exist on Android too. */
export type {SecureFieldRef, TextFieldRef}

/**
 * SwiftUI's `ProgressView`: an indeterminate Material circular indicator, or
 * with a `value`, a linear one; its label, if any, beneath.
 */
export function ProgressView({value, children, modifiers}: ProgressViewProps): React.ReactNode {
	let palette = usePalette()
	let env = useEnvironment(modifiers)
	let axis = useAxis()
	let slot = useRowSlot()
	let indicator =
		typeof value === 'number' ? (
			<LinearProgressIndicator modifiers={[fillMaxWidth()]} progress={value} />
		) : (
			<CircularProgressIndicator />
		)
	let element = (
		<Column
			horizontalAlignment="center"
			modifiers={toCompose(modifiers, {palette, axis})}
			verticalArrangement={{spacedBy: 12}}
		>
			{indicator}
			{children ? (
				<Inherit
					axis="column"
					env={{...env, foreground: env.foreground ?? palette.colors.onSurfaceVariant}}
				>
					{children}
				</Inherit>
			) : null}
		</Column>
	)
	return asRow(slot, element, modifiers)
}

/**
 * SwiftUI's `ContentUnavailableView`, as a Material empty state: a large icon,
 * a `titleLarge` title and a `bodyMedium` description, centred, with its
 * actions beneath. In a list it stands on the list's surface, not on a card.
 */
export function ContentUnavailableView({
	title,
	systemImage,
	description,
	actions,
	modifiers,
}: ContentUnavailableViewProps): React.ReactNode {
	let palette = usePalette()
	let env = useEnvironment(modifiers)
	let axis = useAxis()
	let fill = axis === 'column' ? [weight(1), fillMaxWidth()] : [fillMaxSize()]
	return (
		<Column
			horizontalAlignment="center"
			modifiers={[...toCompose(modifiers, {palette, axis}), ...fill, padding(24, 32, 24, 32)]}
			verticalArrangement="center"
		>
			<Claimed>
				{systemImage ? (
					<SymbolIcon color={palette.colors.onSurfaceVariant} name={systemImage} size={48} />
				) : null}
				{title ? (
					<ComposeText
						color={palette.colors.onSurface}
						modifiers={[padding(0, 16, 0, 0)]}
						style={{typography: 'titleLarge', textAlign: 'center'}}
					>
						{title}
					</ComposeText>
				) : null}
				{description ? (
					<ComposeText
						color={palette.colors.onSurfaceVariant}
						modifiers={[padding(0, 8, 0, 0)]}
						style={{typography: 'bodyMedium', textAlign: 'center'}}
					>
						{description}
					</ComposeText>
				) : null}
				{actions ? (
					<Column horizontalAlignment="center" modifiers={[padding(0, 16, 0, 0)]}>
						<Inherit axis="column" env={env}>
							{actions}
						</Inherit>
					</Column>
				) : null}
			</Claimed>
		</Column>
	)
}
