import { Tabs } from 'expo-router';
import React from 'react';
import { SymbolView } from 'expo-symbols';
import { C } from '@/components/ui';

const iconNames = {
  index: { ios: 'house.fill', android: 'home', web: 'home' },
  detections: { ios: 'list.bullet.rectangle', android: 'view_list', web: 'view_list' },
  map: { ios: 'map.fill', android: 'map', web: 'map' },
  settings: { ios: 'gearshape.fill', android: 'settings', web: 'settings' },
} as const;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.blue,
        tabBarInactiveTintColor: '#627D98',
        tabBarShowLabel: true,
        tabBarStyle: { height: 62, paddingTop: 7, paddingBottom: 8 },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Overview', tabBarIcon: ({ color, size }) => <SymbolView name={iconNames.index} tintColor={color} size={size} /> }} />
      <Tabs.Screen name="detections" options={{ title: 'Detections', tabBarIcon: ({ color, size }) => <SymbolView name={iconNames.detections} tintColor={color} size={size} /> }} />
      <Tabs.Screen name="map" options={{ title: 'Map', tabBarIcon: ({ color, size }) => <SymbolView name={iconNames.map} tintColor={color} size={size} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color, size }) => <SymbolView name={iconNames.settings} tintColor={color} size={size} /> }} />
    </Tabs>
  );
}
