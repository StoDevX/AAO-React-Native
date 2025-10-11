import * as React from 'react'
import {Pressable, StyleSheet, Text, View} from 'react-native'
import type {ViewType} from '../views'
import {makeCardStyles} from './styles'

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  tile: { width: '48%', marginRight: 12, marginBottom: 12 },
  cardInner: { padding: 12, borderRadius: 12 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: '700', flexShrink: 1 },
  subtitle: { marginTop: 6, opacity: 0.8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, marginTop: 8 },
  headerTitle: { fontWeight: '600', fontSize: 16 },
})

type Pkg = { from: string; when: string }

const FAKE_PKGS: Pkg[] = [
]

function asTiles(pkgs: Pkg[]): {view: ViewType; subtitle: string}[] {
  const header: {view: ViewType; subtitle: string} = {
    view: { type: 'url', url: 'https://packages.example', title: `1 Package • ${pkgs.filter((p)=>p.when.includes('Ready')).length} ready`, icon: 'box', foreground: 'light', tint: '#F97316' } as any,
    subtitle: 'Rolvaag'
  }
  const items = pkgs.map((p) => ({
    view: { type: 'url', url: 'https://packages.example/detail', title: `${p.from}`, icon: 'box', foreground: 'light', tint: '#FB923C' } as any,
    subtitle: p.when,
  }))
  return [header, ...items]
}

type Props = { onPress: (v: ViewType) => void; editMode: boolean }

export function PackagesWidget({onPress}: Props) {
  const isDark = false
  const card = makeCardStyles(isDark).card
  const tiles = asTiles(FAKE_PKGS)

  return (
    <View>
      <View style={styles.row}>
        {tiles.map((t, idx) => {
          const isRightCol = idx % 2 === 1
          return (
            <View key={t.view.title + idx} style={[styles.tile, isRightCol && {marginRight: 0}]}> 
              <Pressable onPress={() => onPress(t.view)} accessibilityRole="button" style={[card, styles.cardInner]}
                android_ripple={{color: '#00000014', borderless: true}}>
                <View style={styles.topRow}>
                  <Text style={styles.title} numberOfLines={1}>{t.view.title.split(' • ')[0]}</Text>
                </View>
                {t.subtitle ? <Text style={styles.subtitle} numberOfLines={2}>{t.subtitle}</Text> : null}
              </Pressable>
            </View>
          )
        })}
      </View>
    </View>
  )
}
