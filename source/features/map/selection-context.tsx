import * as React from 'react'

type MapSelection = {
	selectedBuildingId: string | null
	selectBuilding: (id: string) => void
	clearSelection: () => void
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

	let clearSelection = React.useCallback(() => {
		setSelectedBuildingId(null)
	}, [])

	let value = React.useMemo<MapSelection>(
		() => ({selectedBuildingId, selectBuilding, clearSelection}),
		[selectedBuildingId, selectBuilding, clearSelection],
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
