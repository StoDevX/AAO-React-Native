import * as React from 'react'

type MapSelection = {
	selectedBuildingId: string | null
	selectBuilding: (id: string) => void
	/// Clears the selection only if it is still `id`.
	///
	/// The info sheet clears on unmount, and tapping a second building unmounts
	/// the first sheet *after* the second has already selected its building --
	/// so an unconditional clear wiped a selection that belonged to the screen
	/// replacing it, and the new building drew unhighlighted.
	clearSelectionOf: (id: string) => void
}

const MapSelectionContext = React.createContext<MapSelection | null>(null)

type ProviderProps = {
	children: React.ReactNode
}

/// The map, the building picker and the building info card are three separate
/// routes, but the picker and the card are sheets presented over the map -- so
/// the map has to know what the sheet above it selected. The provider lives in
/// the Map layout, which is the closest common ancestor of all three.
export function MapSelectionProvider({
	children,
}: ProviderProps): React.ReactNode {
	let [selectedBuildingId, setSelectedBuildingId] = React.useState<
		string | null
	>(null)

	let selectBuilding = React.useCallback((id: string) => {
		setSelectedBuildingId(id)
	}, [])

	let clearSelectionOf = React.useCallback((id: string) => {
		setSelectedBuildingId((current) => (current === id ? null : current))
	}, [])

	let value = React.useMemo<MapSelection>(
		() => ({selectedBuildingId, selectBuilding, clearSelectionOf}),
		[selectedBuildingId, selectBuilding, clearSelectionOf],
	)

	return (
		<MapSelectionContext.Provider value={value}>
			{children}
		</MapSelectionContext.Provider>
	)
}

export function useMapSelection(): MapSelection {
	let value = React.useContext(MapSelectionContext)
	if (!value) {
		throw new Error(
			'useMapSelection must be used inside a <MapSelectionProvider>',
		)
	}
	return value
}
