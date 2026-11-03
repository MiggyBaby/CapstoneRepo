import { Redirect, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { ActivityIndicator, View } from 'react-native';

export default function RootLayout() {
  return <AuthProvider><StatusBar style="dark" /><RootNavigator /></AuthProvider>;
}

function RootNavigator() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  if (loading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator /></View>;
  const isLogin = segments[0] === 'login';
  const isDiagnostic = segments[0] === 'diagnostics';
  if (!session && !isLogin && !isDiagnostic) return <Redirect href="/login" />;
  if (session && isLogin) return <Redirect href="/(tabs)" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
