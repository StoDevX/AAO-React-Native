import {StyleSheet} from 'react-native'
import {borders, pastel} from './colors'

export const sectionTitleColors = {
  balances: { light: '#0E7490', dark: '#67E8F9' },
  transport: { light: '#1D4ED8', dark: '#93C5FD' },
  dining: { light: '#047857', dark: '#6EE7B7' },
  events: { light: '#6D28D9', dark: '#C4B5FD' },
  news: { light: '#334155', dark: '#CBD5E1' },
  myday: { light: '#000000', dark: '#7DD3FC' },
  swipes: { light: '#059669', dark: '#86EFAC' },
  packages: { light: '#B45309', dark: '#FCD34D' },
  classes: { light: '#4338CA', dark: '#A5B4FC' },
  default: { light: '#475467', dark: '#E5E7EB' },
}

export function getSectionTitleColor(
  key: keyof typeof sectionTitleColors | 'default',
  isDark: boolean,
) {
  const palette = (sectionTitleColors as any)[key] ?? sectionTitleColors.default
  return isDark ? palette.dark : palette.light
}


export const domainColors = {
  balances: '#64748B', // slate
  transport: '#0EA5E9', // sky
  dining: '#10B981', // emerald
  diningBusy: '#F59E0B', // amber
  events: '#6366F1', // indigo
  news: '#111827', // neutral
}

export const makeCardStyles = (isDark: boolean) =>
  StyleSheet.create({
    card: {
      backgroundColor: isDark ? '#111827' : pastel.gray25,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? 'rgba(255,255,255,0.06)' : borders.subtle,
      shadowColor: '#000',
      shadowOpacity: isDark ? 0.12 : 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
    },
  })

export function makeTintCard(isDark: boolean, hex: string) {
  const tint = `${hex}1A` // ~10% alpha overlay
  return {
    backgroundColor: isDark ? '#111827' : tint,
    borderColor: isDark ? 'rgba(255,255,255,0.06)' : borders.subtle,
  }
}

export function leftBorder(hex: string) {
  return { borderLeftWidth: 3, borderLeftColor: hex }
}

export function headerAccent(hex: string) {
  return { height: 3, backgroundColor: hex, borderRadius: 2, marginTop: 4 }
}

export const badgeColors = {
  neutral: { bg: '#11182714', fg: '#111827' },
  success: { bg: '#10B9811A', fg: '#065F46' },
  warning: { bg: '#F59E0B1A', fg: '#7C2D12' },
  info: { bg: '#3B82F61A', fg: '#1E3A8A' },
}

export const badgeBase = {
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 999,
  fontSize: 12 as const,
  fontWeight: '600' as const,
}
