import AsyncStorage from '@react-native-async-storage/async-storage'

const KEY = 'home_prefs_v2'

export type HomePrefs = {
  widgets: string[] // ordered widget ids
  actions: string[] // ordered action keys (map to views)
  widgetsConfig?: Record<string, any>
}

const DEFAULT_PREFS: HomePrefs = {
  widgets: ['swipes', 'print', 'packages', 'events', 'news'],
  actions: ['SIS', 'Menus', 'Calendar', 'Campus Map', 'Important Contacts', 'stoPrint'],
}

export async function loadPrefs(): Promise<HomePrefs> {
  try {
    const raw = await AsyncStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : DEFAULT_PREFS
  } catch {
    return DEFAULT_PREFS
  }
}

export async function savePrefs(prefs: HomePrefs): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(prefs))
  } catch {}
}
