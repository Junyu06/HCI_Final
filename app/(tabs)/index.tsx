import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import React from 'react';
import { ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const App = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  // Generate current week dates
  const getWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - dayOfWeek);

    const week = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(sunday);
      date.setDate(sunday.getDate() + i);
      week.push(date);
    }
    return week;
  };

  // Generate hours (6 AM to 11 PM)
  const hours = Array.from({ length: 18 }, (_, i) => i + 6);
  const weekDates = getWeekDates();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <ThemedText style={styles.title}>Weekly Schedule</ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.lightText }]}>
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </ThemedText>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scheduleContainer} showsVerticalScrollIndicator={false}>
        {/* Week header with dates */}
        <View style={[styles.weekHeader, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
          <View style={styles.timeColumn} />
          {weekDates.map((date, index) => {
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <View key={index} style={styles.dayHeader}>
                <Text style={[
                  styles.dayName,
                  { color: isToday ? colors.accent : colors.lightText }
                ]}>
                  {dayNames[index]}
                </Text>
                <View style={[
                  styles.dateCircle,
                  isToday && { backgroundColor: colors.accent }
                ]}>
                  <Text style={[
                    styles.dateNumber,
                    { color: isToday ? '#FFFFFF' : colors.text }
                  ]}>
                    {date.getDate()}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Hourly grid */}
        <ScrollView style={styles.gridContainer} showsVerticalScrollIndicator={false}>
          {hours.map((hour) => (
            <View key={hour} style={[styles.hourRow, { borderBottomColor: colors.border }]}>
              {/* Time label */}
              <View style={styles.timeColumn}>
                <Text style={[styles.timeText, { color: colors.lightText }]}>
                  {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                </Text>
              </View>

              {/* Day cells */}
              {weekDates.map((_, dayIndex) => (
                <View
                  key={dayIndex}
                  style={[
                    styles.dayCell,
                    {
                      backgroundColor: colors.cellBackground,
                      borderRightColor: colors.border,
                      borderBottomColor: colors.border
                    }
                  ]}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    paddingTop: 8,
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    opacity: 0.7,
  },
  scheduleContainer: {
    flex: 1,
  },
  weekHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  timeColumn: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  dateCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateNumber: {
    fontSize: 17,
    fontWeight: '600',
  },
  gridContainer: {
    flex: 1,
  },
  hourRow: {
    flexDirection: 'row',
    height: 70,
    borderBottomWidth: 1,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  dayCell: {
    flex: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
  },
});

export default App;