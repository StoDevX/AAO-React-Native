import * as React from 'react'
import {Button, HStack, Image, ProgressView, Section, Spacer, Text} from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	buttonStyle,
	contentShape,
	foregroundStyle,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import type {DepartmentListing} from './types'

type Props = {
	/** The sorted roster, or `undefined` before the first successful fetch. */
	departments: DepartmentListing[] | undefined
	isLoading: boolean
	/** Runs a `department` search for the given name. */
	onSelectDepartment: (name: string) => void
}

/**
 * The "Departments" section of the Directory landing: a row per department,
 * or a progress / unavailable / empty notice in its place.
 *
 * A failed refresh over a cached roster shows the cached rows -- searching,
 * which is this screen's real job, does not depend on this list.
 */
export function DepartmentsList({
	departments,
	isLoading,
	onSelectDepartment,
}: Props): React.ReactNode {
	return (
		<Section title="Departments">
			{departments ? (
				departments.length ? (
					// Rendered directly, not wrapped in `List.ForEach`: that component
					// attaches `.onDelete`/`.onMove` unconditionally, which would put
					// swipe-to-delete and drag-to-reorder on a read-only roster.
					departments.map((department) => (
						<DepartmentRow
							key={department.name}
							name={department.name}
							onPress={() => onSelectDepartment(department.name)}
						/>
					))
				) : (
					<Text modifiers={[foregroundStyle(c.secondaryLabel)]}>No departments to show.</Text>
				)
			) : isLoading ? (
				<ProgressView />
			) : (
				<Text modifiers={[foregroundStyle(c.secondaryLabel)]}>
					Departments are unavailable. Pull to try again.
				</Text>
			)}
		</Section>
	)
}

function DepartmentRow({name, onPress}: {name: string; onPress: () => void}): React.ReactNode {
	return (
		<Button
			// Without `plain`, SwiftUI tints the whole label and the name reads as
			// a link.
			modifiers={[buttonStyle('plain'), accessibilityLabel(name)]}
			onPress={onPress}
		>
			{/* contentShape belongs on the label, not the Button: SwiftUI derives
			    a button's tappable region from its label, so the Spacer's width --
			    most of the row -- would be dead to taps. building-picker's
			    BuildingRow carries the same note. */}
			<HStack modifiers={[contentShape(shapes.rectangle())]} spacing={8}>
				<Text modifiers={[foregroundStyle({type: 'hierarchical', style: 'primary'})]}>{name}</Text>
				<Spacer />
				{/* A Button is not a NavigationLink, so the disclosure chevron the
				    rest of the app's rows get from the platform has to be drawn. */}
				<Image
					modifiers={[foregroundStyle({type: 'hierarchical', style: 'tertiary'})]}
					size={13}
					systemName="chevron.right"
				/>
			</HStack>
		</Button>
	)
}
