import AsyncStorage from '@react-native-async-storage/async-storage'

const KEY = 'home_recent_views_v1'
const MAX = 12

export type RecentItem = { key: string }

export async function recordRecent(key: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY)
    const list: string[] = raw ? JSON.parse(raw) : []
    const next = [key, ...list.filter((k) => k !== key)].slice(0, MAX)
    await AsyncStorage.setItem(KEY, JSON.stringify(next))
  } catch {}
}

export async function getRecents(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}
