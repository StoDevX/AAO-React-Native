import * as React from 'react'
import {Modal, Pressable, StyleSheet, Text, View} from 'react-native'

export type WidgetId = 'transport' | 'dining' | 'classes' | 'print' | 'packages' | 'events' | 'news' | 'balances'

const ALL_WIDGETS: { id: WidgetId; title: string; description: string }[] = [
  { id: 'transport', title: 'Shuttle', description: 'Favorite stops with ETAs' },
  { id: 'dining', title: 'Dining', description: 'Favorite halls and status' },
  { id: 'classes', title: 'Classes Today', description: 'Your schedule at a glance' },
  { id: 'print', title: 'Printing', description: 'Quota and recent jobs' },
  { id: 'packages', title: 'Packages', description: 'Ready for pickup + recent' },
  { id: 'events', title: 'Events', description: 'Today and upcoming' },
  { id: 'news', title: 'News', description: 'Top headlines' },
  { id: 'balances', title: 'Balances', description: 'Account balances at a glance' },
]

type Props = {
  visible: boolean
  onClose: () => void
  selected: WidgetId[]
  onToggle: (id: WidgetId) => void
}

const styles = StyleSheet.create({
  modalBg: { flex: 1, backgroundColor: '#0008', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', maxHeight: '70%', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  item: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggle: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#1118270D', borderRadius: 8 },
})

export function WidgetGallerySheet({visible, onClose, selected, onToggle}: Props) {
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalBg} onPress={onClose}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Add widgets</Text>
          {ALL_WIDGETS.map((w) => (
            <View key={w.id} style={styles.item}>
              <View style={styles.row}>
                <Text>{w.title}</Text>
                <Pressable style={styles.toggle} onPress={() => onToggle(w.id)}>
                  <Text>{selected.includes(w.id) ? 'Remove' : 'Add'}</Text>
                </Pressable>
              </View>
              <Text style={{opacity: 0.6, marginTop: 4}}>{w.description}</Text>
            </View>
          ))}
        </View>
      </Pressable>
    </Modal>
  )
}
