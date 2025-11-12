import React from 'react';
import { StyleSheet, View, useColorScheme, ScrollView, Text } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const App = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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

  const borderColor = isDark ? '#2C2C2E' : '#E5E5EA';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const lightTextColor = isDark ? '#8E8E93' : '#6B7280';
  const backgroundColor = isDark ? '#1C1C1E' : '#FFFFFF';
  const cellBackgroundColor = isDark ? '#1C1C1E' : '#F9FAFB';

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <ThemedText style={styles.title}>Weekly Schedule</ThemedText>
      </View>

      <ScrollView style={styles.scheduleContainer}>
        {/* Week header with dates */}
        <View style={[styles.weekHeader, { borderBottomColor: borderColor, backgroundColor }]}>
          <View style={styles.timeColumn} />
          {weekDates.map((date, index) => {
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <View key={index} style={styles.dayHeader}>
                <Text style={[
                  styles.dayName,
                  { color: isToday ? '#007AFF' : lightTextColor }
                ]}>
                  {dayNames[index]}
                </Text>
                <View style={[
                  styles.dateCircle,
                  isToday && styles.todayCircle
                ]}>
                  <Text style={[
                    styles.dateNumber,
                    { color: isToday ? '#FFFFFF' : textColor }
                  ]}>
                    {date.getDate()}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Hourly grid */}
        <ScrollView style={styles.gridContainer}>
          {hours.map((hour) => (
            <View key={hour} style={[styles.hourRow, { borderBottomColor: borderColor }]}>
              {/* Time label */}
              <View style={styles.timeColumn}>
                <Text style={[styles.timeText, { color: lightTextColor }]}>
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
                      backgroundColor: cellBackgroundColor,
                      borderRightColor: borderColor,
                      borderBottomColor: borderColor
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
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  scheduleContainer: {
    flex: 1,
  },
  weekHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    paddingVertical: 12,
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
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  dateCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCircle: {
    backgroundColor: '#007AFF',
  },
  dateNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  gridContainer: {
    flex: 1,
  },
  hourRow: {
    flexDirection: 'row',
    height: 60,
    borderBottomWidth: 1,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  dayCell: {
    flex: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
  },
});

export default App;