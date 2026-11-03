import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { C, label } from '@/components/ui';

export type DropdownFilterOption = { label: string; value: string };
export type DropdownFilterSection = { id: string; title: string; value: string; options: DropdownFilterOption[] };

type Props = {
  visible: boolean;
  title: string;
  sections: DropdownFilterSection[];
  onChange: (sectionId: string, value: string) => void;
  onReset: () => void;
  onApply: () => void;
  onClose: () => void;
};

export function FilterDropdownPanel({ visible, title, sections, onChange, onReset, onApply, onClose }: Props) {
  const { height } = useWindowDimensions();
  const [expanded, setExpanded] = useState<string | null>(null);

  return <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
    <View style={styles.root}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close filters" onPress={onClose} style={styles.backdrop} />
      <View style={[styles.sheet, { maxHeight: Math.round(height * 0.86) }]}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close filters" style={styles.close}><Text style={styles.closeText}>×</Text></Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator>
          {sections.map(section => {
            const isExpanded = expanded === section.id;
            const selected = section.options.find(option => option.value === section.value);
            return <View key={section.id} style={styles.section}>
              <Pressable accessibilityRole="button" accessibilityState={{ expanded: isExpanded }} onPress={() => setExpanded(isExpanded ? null : section.id)} style={styles.select}>
                <View style={styles.selectCopy}><Text style={styles.sectionTitle}>{section.title}</Text><Text style={styles.selectedValue}>{selected?.label ?? 'All'}</Text></View>
                <Text style={styles.chevron}>{isExpanded ? '⌃' : '⌄'}</Text>
              </Pressable>
              {isExpanded ? <View style={styles.options}>{section.options.map(option => {
                const active = option.value === section.value;
                return <Pressable key={`${section.id}-${option.value}`} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => { onChange(section.id, option.value); setExpanded(null); }} style={[styles.option, active && styles.optionActive]}>
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>{option.label || label(option.value)}</Text><Text style={[styles.check, active && styles.optionTextActive]}>{active ? '✓' : ''}</Text>
                </Pressable>;
              })}</View> : null}
            </View>;
          })}
        </ScrollView>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" onPress={onReset} style={[styles.action, styles.reset]}><Text style={styles.resetText}>Reset</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={onApply} style={[styles.action, styles.apply]}><Text style={styles.applyText}>Apply filters</Text></Pressable>
        </View>
      </View>
    </View>
  </Modal>;
}

const styles = {
  root: { flex: 1, justifyContent: 'flex-end' as const, backgroundColor: '#00000055' },
  backdrop: { position: 'absolute' as const, top: 0, right: 0, bottom: 0, left: 0 },
  sheet: { backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 10, paddingBottom: 20 },
  handle: { alignSelf: 'center' as const, width: 42, height: 4, borderRadius: 3, backgroundColor: '#AAB8C2', marginBottom: 9 },
  header: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, paddingHorizontal: 20, paddingBottom: 8 },
  title: { color: C.ink, fontSize: 20, fontWeight: '800' as const },
  close: { width: 40, height: 40, borderRadius: 14, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: C.white },
  closeText: { color: C.muted, fontSize: 26, lineHeight: 30 },
  list: { paddingHorizontal: 20, paddingVertical: 8, gap: 10 },
  section: { borderRadius: 14, overflow: 'hidden' as const, backgroundColor: C.white },
  select: { minHeight: 58, paddingHorizontal: 14, paddingVertical: 9, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
  selectCopy: { flex: 1, gap: 3 },
  sectionTitle: { color: C.ink, fontSize: 13, fontWeight: '700' as const },
  selectedValue: { color: C.blue, fontSize: 13, fontWeight: '600' as const },
  chevron: { color: C.muted, fontSize: 21, paddingLeft: 10 },
  options: { borderTopWidth: 1, borderTopColor: C.line, padding: 6, gap: 3 },
  option: { minHeight: 42, borderRadius: 10, paddingHorizontal: 10, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
  optionActive: { backgroundColor: '#E7F2F6' },
  optionText: { color: C.muted, fontSize: 13, fontWeight: '500' as const },
  optionTextActive: { color: C.blue, fontWeight: '700' as const },
  check: { width: 20, color: C.blue, fontSize: 15, textAlign: 'center' as const },
  actions: { flexDirection: 'row' as const, gap: 10, paddingHorizontal: 20, paddingTop: 12 },
  action: { minHeight: 46, flex: 1, borderRadius: 12, alignItems: 'center' as const, justifyContent: 'center' as const, paddingHorizontal: 14 },
  reset: { backgroundColor: C.white, borderWidth: 1, borderColor: C.line },
  resetText: { color: C.blue, fontSize: 14, fontWeight: '700' as const },
  apply: { backgroundColor: C.blue },
  applyText: { color: C.white, fontSize: 14, fontWeight: '700' as const },
};
