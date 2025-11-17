import csScheduleJson from '@/class_schedule_spring_2026.json';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useSchedule } from '@/contexts/ScheduleContext';
import engScheduleJson from '@/engineering_schedule_spring_2026.json';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Course {
  crn: string;
  subject: string;
  course: string;
  section: string;
  title: string;
  days?: string;
  time?: string;
  schedule?: Array<{ days: string; time: string }>;
  instructor: string;
  credits: number;
}

interface ScheduledCourse extends Course {
  color: string;
}

const App = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const { scheduledCourses, addCourse, removeCourse } = useSchedule();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const headerScrollRef = useRef<ScrollView>(null);
  const gridScrollRef = useRef<ScrollView>(null);

  const handleScroll = (event: any, source: 'header' | 'grid') => {
    const scrollX = event.nativeEvent.contentOffset.x;
    if (source === 'grid' && headerScrollRef.current) {
      headerScrollRef.current.scrollTo({ x: scrollX, animated: false });
    } else if (source === 'header' && gridScrollRef.current) {
      gridScrollRef.current.scrollTo({ x: scrollX, animated: false });
    }
  };

  // Combine all courses from both JSON files
  const allCourses: Course[] = [
    ...(csScheduleJson as any).courses,
    ...(engScheduleJson as any).courses,
  ];

  // Generate hours (6 AM to 11 PM)
  const hours = Array.from({ length: 18 }, (_, i) => i + 6);
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const parseDays = (daysStr: string): string[] => {
    const dayMap: { [key: string]: string } = {
      M: 'Mon',
      T: 'Tue',
      W: 'Wed',
      R: 'Thu',
      F: 'Fri',
      S: 'Sat',
    };

    const days: string[] = [];
    for (let i = 0; i < daysStr.length; i++) {
      const char = daysStr[i];
      if (dayMap[char]) {
        days.push(dayMap[char]);
      }
    }
    return days;
  };

  const parseTime = (timeStr: string): { startHour: number; endHour: number; startMinute: number; endMinute: number } | null => {
    if (!timeStr || timeStr === 'TBA (To Be Announced)') return null;

    const match = timeStr.match(/(\d+):(\d+)\s*(am|pm)\s*-\s*(\d+):(\d+)\s*(am|pm)/i);
    if (!match) return null;

    let startHour = parseInt(match[1]);
    const startMinute = parseInt(match[2]);
    const startPeriod = match[3].toLowerCase();
    let endHour = parseInt(match[4]);
    const endMinute = parseInt(match[5]);
    const endPeriod = match[6].toLowerCase();

    if (startPeriod === 'pm' && startHour !== 12) startHour += 12;
    if (startPeriod === 'am' && startHour === 12) startHour = 0;
    if (endPeriod === 'pm' && endHour !== 12) endHour += 12;
    if (endPeriod === 'am' && endHour === 12) endHour = 0;

    return { startHour, endHour, startMinute, endMinute };
  };

  const handleAddCourse = (course: Course) => {
    addCourse(course);
    setShowAddModal(false);
    setSearchQuery('');
  };

  const filteredCourses = allCourses.filter((course) => {
    if (!searchQuery.trim()) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      course.title.toLowerCase().includes(searchLower) ||
      course.instructor.toLowerCase().includes(searchLower) ||
      `${course.subject}${course.course}`.toLowerCase().includes(searchLower) ||
      course.crn.includes(searchQuery)
    );
  });

  const renderCourseBlock = (course: ScheduledCourse, day: string) => {
    const schedules = course.schedule || [{ days: course.days || '', time: course.time || '' }];

    return schedules.map((sched, idx) => {
      const days = parseDays(sched.days);
      if (!days.includes(day)) return null;

      const timeInfo = parseTime(sched.time);
      if (!timeInfo) return null;

      const { startHour, endHour, startMinute, endMinute } = timeInfo;
      const startIndex = startHour - 6;
      const duration = endHour - startHour + (endMinute - startMinute) / 60;

      const top = startIndex * 70 + (startMinute / 60) * 70;
      const height = duration * 70;

      const dayIndex = dayNames.indexOf(day);
      const timeColumnWidth = 60;
      const spacing = -60; // Spacing between time column and grid
      const dayCellWidth = 120; // Fixed width for each day column

      return (
        <TouchableOpacity
          key={`${course.crn}-${day}-${idx}`}
          style={[
            styles.courseBlock,
            {
              backgroundColor: course.color,
              top,
              height: Math.max(height, 30), // Minimum height for visibility
              left: timeColumnWidth + spacing + (dayIndex * dayCellWidth),
              width: dayCellWidth - 2, // Slightly narrower to show borders
            },
          ]}
          onPress={() => {
            Alert.alert(
              'Remove Course',
              `Remove ${course.subject} ${course.course} from your schedule?`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => removeCourse(course.crn) },
              ]
            );
          }}
        >
          <Text style={styles.courseBlockTitle} numberOfLines={1}>
            {course.subject} {course.course}
          </Text>
          <Text style={styles.courseBlockTime} numberOfLines={1}>
            {sched.time}
          </Text>
        </TouchableOpacity>
      );
    });
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <ThemedText style={styles.title}>Weekly Schedule</ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.lightText }]}>
            {scheduledCourses.length} course{scheduledCourses.length !== 1 ? 's' : ''} added
          </ThemedText>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scheduleContainer} showsVerticalScrollIndicator={false}>
        {/* Week header - just day names */}
        <View style={styles.headerContainer}>
          <View style={styles.timeColumn} />
          <ScrollView
            ref={headerScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={(e) => handleScroll(e, 'header')}
            style={styles.headerScrollView}
          >
            <View style={[styles.weekHeader, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
              {dayNames.map((day) => (
                <View key={day} style={styles.dayHeader}>
                  <Text style={[styles.dayName, { color: colors.text }]}>{day}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Hourly grid */}
        <View style={styles.gridRow}>
          {/* Fixed time column */}
          <View style={styles.timeColumnContainer}>
            {hours.map((hour) => (
              <View key={hour} style={styles.timeSlot}>
                <Text style={[styles.timeText, { color: colors.lightText }]}>
                  {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                </Text>
              </View>
            ))}
          </View>

          {/* Scrollable grid */}
          <ScrollView
            ref={gridScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={(e) => handleScroll(e, 'grid')}
            style={styles.gridScrollView}
          >
            <View style={styles.gridContainer}>
              <View style={styles.gridWrapper}>
                {hours.map((hour) => (
                  <View key={hour} style={[styles.hourRow, { borderBottomColor: colors.border }]}>
                    {/* Day cells */}
                    {dayNames.map((day) => (
                      <View
                        key={day}
                        style={[
                          styles.dayCell,
                          {
                            backgroundColor: colors.cellBackground,
                            borderRightColor: colors.border,
                            borderBottomColor: colors.border,
                          },
                        ]}
                      />
                    ))}
                  </View>
                ))}

                {/* Course blocks */}
                {scheduledCourses.map((course) =>
                  dayNames.map((day) => renderCourseBlock(course, day))
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Add Course Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <ThemedText style={styles.modalTitle}>Add Course</ThemedText>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={[styles.modalClose, { color: colors.text }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.searchContainer, { backgroundColor: colors.searchBackground }]}>
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search by course, instructor, or CRN..."
                placeholderTextColor={colors.lightText}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <ScrollView style={styles.courseList}>
              {filteredCourses.slice(0, 50).map((course) => {
                const isAdded = scheduledCourses.some((c) => c.crn === course.crn);
                return (
                  <TouchableOpacity
                    key={course.crn}
                    style={[
                      styles.courseItem,
                      { backgroundColor: colors.cardBackground, borderColor: colors.border },
                      isAdded && { opacity: 0.5 },
                    ]}
                    onPress={() => !isAdded && handleAddCourse(course)}
                    disabled={isAdded}
                  >
                    <View style={styles.courseItemHeader}>
                      <Text style={[styles.courseItemCode, { color: colors.text }]}>
                        {course.subject} {course.course}-{course.section}
                      </Text>
                      {isAdded && (
                        <Text style={[styles.addedBadge, { color: colors.success }]}>✓ Added</Text>
                      )}
                    </View>
                    <Text style={[styles.courseItemTitle, { color: colors.text }]} numberOfLines={1}>
                      {course.title}
                    </Text>
                    <Text style={[styles.courseItemInfo, { color: colors.lightText }]} numberOfLines={1}>
                      {course.instructor}
                    </Text>
                    <Text style={[styles.courseItemInfo, { color: colors.lightText }]}>
                      {course.schedule
                        ? course.schedule.map((s) => `${s.days} ${s.time}`).join(', ')
                        : `${course.days || 'TBA'} ${course.time || ''}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => setShowAddModal(true)}
        style={[styles.fab, { backgroundColor: colors.accent }]}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
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
  headerContainer: {
    flexDirection: 'row',
    borderBottomWidth: 2,
  },
  headerScrollView: {
    flex: 1,
  },
  timeColumn: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayHeader: {
    width: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    flex: 1,
  },
  timeColumnContainer: {
    width: 60,
    marginRight: 4,
  },
  timeSlot: {
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  gridScrollView: {
    flex: 1,
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
    width: 120,
    borderRightWidth: 1,
    borderBottomWidth: 1,
  },
  gridWrapper: {
    position: 'relative',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '300',
    lineHeight: 32,
  },
  courseBlock: {
    position: 'absolute',
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  courseBlockTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  courseBlockTime: {
    color: '#FFFFFF',
    fontSize: 10,
    opacity: 0.9,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '85%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalClose: {
    fontSize: 28,
    fontWeight: '300',
    opacity: 0.6,
  },
  searchContainer: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    fontSize: 16,
    height: 24,
  },
  courseList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  courseItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  courseItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  courseItemCode: {
    fontSize: 16,
    fontWeight: '700',
  },
  courseItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  courseItemInfo: {
    fontSize: 13,
    marginBottom: 2,
  },
  addedBadge: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default App;