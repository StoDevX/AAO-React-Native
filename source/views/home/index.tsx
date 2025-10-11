import * as React from 'react'
import {
  ScrollView,
  View,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  TextInput,
  Text,
  useColorScheme,
  Pressable,
} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'

import {AllViews, ViewType} from '../views'
import {Column} from '@frogpond/layout'
import {partitionByIndex} from '../../lib/partition-by-index'
import {HomeScreenButton, CELL_MARGIN} from './button'
import {openUrl} from '@frogpond/open-url'
import {OpenSettingsButton} from '@frogpond/navigation-buttons'
import {UnofficialAppNotice} from './notice'
import {useNavigation} from '@react-navigation/native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {FeaturedCard} from './featured-card'
import {getRecents, recordRecent} from './recent'
import {ActionChip} from './action-chip'
import {MyDayGrid} from './myday-grid'
import {BalancesWidget} from './balances-widget'
import {WidgetGallerySheet, WidgetId} from './widget-gallery'
import {ShuttleWidget} from './shuttle-widget'
import {DiningWidget} from './dining-widget'
import {ClassesWidget} from './classes-widget'
import {PrintWidget} from './print-widget'
import {PackagesWidget} from './packages-widget'
import {EventsWidget} from './events-widget'
import {NewsWidget} from './news-widget'

import {SwipesWidget} from './swipes-widget'
import {BalanceStrip} from './balance-strip'
import {WidgetRow} from './widget-row'
import {BrowseAllSheet} from './browse-all'
import {loadPrefs, savePrefs} from './prefs'
import {borders, pastel} from './colors'
import {getSectionTitleColor, makeCardStyles} from './styles'
// Safe, guarded requires to avoid loading Reanimated in dev if misconfigured
let DraggableSection: any = ({children}: any) => <>{children}</>
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  DraggableSection = require('./draggable-section').DraggableSection
} catch {}

let DraggableActionRow: any = ({items, onPress}: any) => (
  <>
    {items.map((it: any) => (
      <View key={(it.title || it.view)} style={{ marginRight: 8 }}>
        <ActionChip item={it} onPress={onPress} />
      </View>
    ))}
  </>
)
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  DraggableActionRow = require('./draggable-action-row').DraggableActionRow
} catch {}

const SPACING = CELL_MARGIN
const CONTENT_HPAD = 16

const makeStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#000' : '#F9FAFB',
    },
    headerContainer: {
      paddingHorizontal: CONTENT_HPAD,
      paddingTop: SPACING,
      paddingBottom: SPACING / 2,
      backgroundColor: isDark ? '#0B1220' : '#FCFCFD',
      borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(16,24,40,0.08)',
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    appTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: isDark ? '#fff' : '#111827',
    },
    controlsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    controlBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: isDark ? '#1F2937' : '#F3F4F6' },
    controlText: { color: isDark ? '#E5E7EB' : '#111827', fontWeight: '600' },
    searchContainer: {
      marginTop: SPACING,
      borderRadius: 12,
      backgroundColor: isDark ? '#111827' : '#FFFFFF',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(16,24,40,0.14)',
      paddingHorizontal: 14,
      paddingVertical: 10,
      shadowColor: '#000',
      shadowOpacity: isDark ? 0.18 : 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    searchInput: {
      fontSize: 16,
      color: isDark ? '#EFEFEF' : '#111827',
    },

    section: {
      marginTop: SPACING * 1.5,
    },
    sectionHeader: {
      paddingHorizontal: CONTENT_HPAD,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#E5E7EB' : '#111827',
    },
    sectionTitlePastel: (hex: string) => ({
      fontSize: 18,
      fontWeight: '600',
      color: hex,
    }),
    rowScroller: {
      paddingHorizontal: CONTENT_HPAD,
    },
    rowCard: {
      marginHorizontal: CONTENT_HPAD,
      paddingVertical: 8,
      paddingHorizontal: 8,
      borderRadius: 12,
    },
    rowContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    headerAccentBar: (hex: string) => ({
      height: 2,
      width: 28,
      backgroundColor: hex,
      borderRadius: 2,
      opacity: isDark ? 0.6 : 0.7,
      marginTop: 4,
    }),

    gridWrapper: {
      paddingHorizontal: CONTENT_HPAD - CELL_MARGIN / 2,
    },
    cells: {
      marginHorizontal: CELL_MARGIN / 2,
      paddingTop: CELL_MARGIN,
      flexDirection: 'row',
    },
    column: {
      flex: 1,
    },

    footer: {
      paddingHorizontal: CONTENT_HPAD,
      paddingVertical: SPACING * 2,
    },

    wiggle: { transform: [{ rotate: '-1deg' }], opacity: 0.98 },
    minus: { position: 'absolute', top: 6, right: 6, backgroundColor: '#EF4444', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
    minusText: { color: 'white', fontWeight: '800' },
  })

// Simple categorization mapping by title
const CATEGORY_MAP: Record<string, 'Academics' | 'Campus' | 'Tools' | 'Info'> = {
  'SIS': 'Academics',
  'Course Catalog': 'Academics',
  'Calendar': 'Academics',
  'Building Hours': 'Campus',
  'Campus Map': 'Campus',
  'Transportation': 'Campus',
  'Menus': 'Campus',
  'Directory': 'Info',
  'Important Contacts': 'Info',
  'News': 'Info',
  'Streaming Media': 'Tools',
  'stoPrint': 'Tools',
  'Student Orgs': 'Campus',
  'Oleville': 'Info',
  'More': 'Tools',
}

const FEATURED_TITLES = [
  'SIS',
  'Menus',
  'Calendar',
  'Campus Map',
  'Important Contacts',
]

function groupByCategory(views: ViewType[]): Record<string, ViewType[]> {
  return views.reduce((acc, v) => {
    const cat = CATEGORY_MAP[v.title] ?? 'Tools'
    acc[cat] = acc[cat] ? [...acc[cat], v] : [v]
    return acc
  }, {} as Record<string, ViewType[]>)
}

function HomePage(): JSX.Element {
  const navigation = useNavigation()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const styles = React.useMemo(() => makeStyles(isDark), [isDark])

  const [query, setQuery] = React.useState('')
  const [refreshing, setRefreshing] = React.useState(false)
  const [recents, setRecents] = React.useState<string[]>([])
  const [prefs, setPrefs] = React.useState<{widgets: string[]; actions: string[]}>({widgets: [], actions: []})
  const [editMode, setEditMode] = React.useState(false)
  const [browseAllOpen, setBrowseAllOpen] = React.useState(false)
  const [widgetGalleryOpen, setWidgetGalleryOpen] = React.useState(false)
  const enableSearch = true

  const allViews = React.useMemo(
    () => AllViews().filter((view) => !view.disabled),
    [],
  )

  React.useEffect(() => {
    getRecents().then(setRecents)
    loadPrefs().then(setPrefs)
  }, [])

  const filtered = React.useMemo(() => {
    if (!enableSearch || !query.trim()) return allViews
    const q = query.trim().toLowerCase()
    return allViews.filter((v) => {
      const title = v.title ?? (v.type === 'view' ? String(v.view) : v.url)
      return title?.toLowerCase().includes(q)
    })
  }, [allViews, enableSearch, query])

  const onPressView = async (view: ViewType) => {
    if (editMode) return // disable navigation during edit
    if (view.type === 'url') {
      openUrl(view.url)
    } else if (view.type === 'view') {
      // @ts-expect-error nav typing handled upstream
      navigation.navigate(view.view)
    } else {
      throw new Error(`unexpected view type ${view.type}`)
    }
    const key = view.type === 'view' ? String(view.view) : view.title
    if (key) await recordRecent(key)
    const next = await getRecents()
    setRecents(next)
  }

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true)
    try {
      await new Promise((r) => setTimeout(r, 500))
      const next = await getRecents()
      setRecents(next)
    } finally {
      setRefreshing(false)
    }
  }, [])

  const featured = React.useMemo(
    () => filtered.filter((v) => FEATURED_TITLES.includes(v.title)).slice(0, 6),
    [filtered],
  )

  const byCat = React.useMemo(() => groupByCategory(filtered), [filtered])

  // Smart actions from prefs + recents
  const actionViews = React.useMemo(() => {
    const map = new Map(allViews.map((v) => [v.title, v]))
    const pinned = prefs.actions.map((t) => map.get(t)).filter(Boolean) as ViewType[]
    const recentViews = recents
      .map((key) => allViews.find((v) => (v.type === 'view' ? String(v.view) : v.title) === key))
      .filter(Boolean) as ViewType[]
    const merged = [...pinned]
    for (const r of recentViews) {
      if (!merged.find((m) => m.title === r.title)) merged.push(r)
    }
    return merged.slice(0, 8)
  }, [allViews, prefs.actions, recents])


  // Fake data for My Day cards
  const myDayCards = React.useMemo(
    () => [
      { title: 'Next • 9:40 AM', subtitle: 'CS 251 • Regents 115', emphasis: 'Starts in 15m' },
      { title: 'Stav Hall', subtitle: 'Today • Lunch', emphasis: 'Busy • ~65% capacity' },
      { title: 'Shuttle to Buntrock', subtitle: 'Stop: Skoglund', emphasis: 'ETA 4 min' },
      { title: 'Tonight', subtitle: 'Org Fair • 7:00 PM', emphasis: 'Buntrock Commons' },
    ],
    [],
  )

  // Edit helpers
  const removeAction = (title: string) => {
    const next = {...prefs, actions: prefs.actions.filter((t) => t !== title)}
    setPrefs(next)
    savePrefs(next)
  }
  const addAction = (title: string) => {
    if (prefs.actions.includes(title)) return
    const next = {...prefs, actions: [...prefs.actions, title]}
    setPrefs(next)
    savePrefs(next)
  }

  const keyFor = (v: ViewType) => (v.type === 'view' ? String(v.view) : v.title)

  // Fallback for full grid when searching
  const showFullGrid = query.trim().length > 0
  const columns = React.useMemo(() => partitionByIndex(filtered), [filtered])

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        alwaysBounceHorizontal={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        testID="screen-homescreen"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.appTitle}>Good afternoon 👋</Text>
            <View style={styles.controlsRow}>
              {/* <Pressable style={styles.controlBtn} onPress={() => setEditMode((e) => !e)}>
                <Text style={styles.controlText}>{editMode ? 'Done' : 'Edit'}</Text>
              </Pressable>
              <Pressable style={styles.controlBtn} onPress={() => setWidgetGalleryOpen(true)}>
                <Text style={styles.controlText}>Edit</Text>
              </Pressable>  */}
            </View>
          </View>

          {enableSearch && (
            <View style={[styles.searchContainer, {flexDirection: 'row', alignItems: 'center'}]}>
              <Icon name="search" size={18} color={isDark ? '#9CA3AF' : '#98A2B3'} style={{marginRight: 8}} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search people, places, courses, events…"
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                style={[styles.searchInput, {flex: 1, paddingVertical: 0}]}
                returnKeyType="search"
                clearButtonMode="while-editing"
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>
          )}
        </View>

        {/* My Day */}
        {!showFullGrid && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitlePastel(getSectionTitleColor('myday', isDark))}>My Day</Text>
            </View>
            <MyDayGrid
              items={myDayCards.map((c) => ({ title: c.title, subtitle: c.subtitle, emphasis: c.emphasis }))}
            />
          </View>
        )}

     {/* Smart Actions */}
        {!showFullGrid && (
          <View style={styles.section}>
            {/* Quick Actions */}
            <View style={[styles.rowCard]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowContent}>
                {actionViews.map((item) => (
                  <View key={keyFor(item)} style={{ marginRight: 8 }}>
                    <ActionChip item={item} onPress={onPressView} />
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        )}
        {/* Balances */}
        {!showFullGrid && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitlePastel(getSectionTitleColor('balances', isDark))}>Balances</Text>
            </View>


            {/* Row 1: Meal Swipes (two cards) */}
            <View style={{ paddingHorizontal: 0 }}>
              <View style={{ flexDirection: 'row', gap: 8, marginHorizontal: CONTENT_HPAD }}>
                <View style={[{ flex: 1 }, styles.rowCard, makeCardStyles(isDark).card, { marginHorizontal: 0 }]}>
                  <SwipesWidget editMode={editMode} mode="daily" />
                </View>
                <View style={[{ flex: 1 }, styles.rowCard, makeCardStyles(isDark).card, { marginHorizontal: 0 }]}>
                  <SwipesWidget editMode={editMode} mode="weekly" />
                </View>
              </View>
            </View>

            {/* Row 2: Accounts (one card) */}
            <View style={{ paddingHorizontal: 0, marginTop: 8 }}>
              <View style={[styles.rowCard, {paddingHorizontal: 0}, makeCardStyles(isDark).card, { marginHorizontal: CONTENT_HPAD }]}>
                <BalancesWidget editMode={editMode} />
              </View>
            </View>
          </View>
        )}

        {/* Classes (from misc) */}
        {!showFullGrid && prefs.widgets.includes('classes') && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitlePastel(getSectionTitleColor('classes', isDark))}>Classes Today</Text>
            </View>


            <View style={[{paddingHorizontal: CONTENT_HPAD}]}>
              <ClassesWidget editMode={editMode} onPress={onPressView} />
            </View>

        {/* Dining */}
        {!showFullGrid && prefs.widgets.includes('dining') && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitlePastel(getSectionTitleColor('dining', isDark))}>Dining</Text>
            </View>

            <View style={styles.rowScroller}>
              <DiningWidget editMode={editMode} onPress={onPressView} />
            </View>
          </View>
        )}

        {/* Events */}
        {!showFullGrid && prefs.widgets.includes('events') && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitlePastel(getSectionTitleColor('events', isDark))}>Events</Text>
            </View>

            <View style={styles.rowScroller}>
              <EventsWidget editMode={editMode} onPress={onPressView} />
            </View>
          </View>
        )}

        {/* News */}
        {!showFullGrid && prefs.widgets.includes('news') && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitlePastel(getSectionTitleColor('news', isDark))}>News</Text>
            </View>

            <View style={styles.rowScroller}>
              <NewsWidget editMode={editMode} onPress={onPressView} />
            </View>
          </View>
        )}


          </View>
        )}

        {/* Mail */}
        {!showFullGrid && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitlePastel(getSectionTitleColor('packages', isDark))}>Mail</Text>
            </View>

            <View style={styles.rowScroller}>
              <PackagesWidget editMode={editMode} onPress={onPressView} />
            </View>
          </View>
        )}

        {/* Transportation */}
        {!showFullGrid && prefs.widgets.includes('transport') && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitlePastel(getSectionTitleColor('transport', isDark))}>Transportation</Text>
            </View>

            <View style={styles.rowScroller}>
              <ShuttleWidget editMode={editMode} onPress={onPressView} />
            </View>
          </View>
        )}

    </ScrollView>

      <WidgetGallerySheet
        visible={widgetGalleryOpen}
        selected={prefs.widgets as any}
        onClose={() => setWidgetGalleryOpen(false)}
        onToggle={(id) => {
          const exists = (prefs.widgets as any).includes(id)
          const nextOrder = exists
            ? prefs.widgets.filter((w) => w !== id)
            : [...prefs.widgets, id]
          const next = {...prefs, widgets: nextOrder}
          setPrefs(next)
          savePrefs(next)
        }}
      />

      <BrowseAllSheet
        visible={browseAllOpen}
        onClose={() => setBrowseAllOpen(false)}
        onSelect={(v) => {
          addAction(v.title)
          setBrowseAllOpen(false)
        }}
      />
    </SafeAreaView>
  )
}

export {HomePage as View}

export const NavigationKey = 'Home'

export const NavigationOptions: NativeStackNavigationOptions = {
  title: 'All About Olaf',
  headerBackTitle: 'Home',
  headerRight: (props) => <OpenSettingsButton {...props} />,
}

export type NavigationParams = undefined
