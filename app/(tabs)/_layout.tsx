import { Stack } from 'expo-router';
import React from 'react';

import { ScheduleProvider } from '@/contexts/ScheduleContext';

export default function TabLayout() {
  return (
    <ScheduleProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen name="index" />
      </Stack>
    </ScheduleProvider>
  );
}
