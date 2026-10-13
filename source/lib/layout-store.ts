import AsyncStorage from '@react-native-async-storage/async-storage'
import {create, type Mutate, type StoreApi, type UseBoundStore} from 'zustand'
import {createJSONStorage, persist} from 'zustand/middleware'

/** How a screen with a layout menu draws its items: as tiles or as rows. */
export type Layout = 'grid' | 'list'

type LayoutStore<L extends string> = {
	layout: L
	setLayout: (layout: L) => void
	/**
	 * Whether the saved layout has loaded. Storage answers after the first
	 * render, so until then `layout` is only the default, and a screen that
	 * draws it would draw the default and then jump to the choice.
	 */
	hydrated: boolean
}

type PersistedLayoutStore<L extends string> = UseBoundStore<
	Mutate<StoreApi<LayoutStore<L>>, [['zustand/persist', unknown]]>
>

/**
 * A screen's choice from its layout menu, kept across launches under `name`.
 * Each screen gets its own, so picking a list on one leaves another's grid
 * alone. The layouts are `grid` and `list` unless the screen names its own.
 *
 * The default is saved on first launch like any choice, so a screen that
 * changes its default raises `version`: a layout saved under an earlier one
 * is dropped for the default.
 */
export function createLayoutStore<L extends string = Layout>(
	name: string,
	initial: NoInfer<L>,
	{version = 1}: {version?: number} = {},
): PersistedLayoutStore<L> {
	let useStore: PersistedLayoutStore<L> = create<LayoutStore<L>>()(
		persist(
			(set) => ({
				layout: initial,
				setLayout: (layout) => set({layout}),
				hydrated: false,
			}),
			{
				name,
				storage: createJSONStorage(() => AsyncStorage),
				version,
				migrate: () => ({layout: initial}),
				// `hydrated` describes this launch, not the person's choice.
				partialize: (state) => ({layout: state.layout}),
				onRehydrateStorage: () => () => useStore.setState({hydrated: true}),
			},
		),
	)

	return useStore
}
