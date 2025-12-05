import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useSchedule } from '@/contexts/ScheduleContext';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import course data for modal
import csScheduleJson from '@/class_schedule_spring_2026.json';
import engScheduleJson from '@/engineering_schedule_spring_2026.json';
import { TextInput } from 'react-native';

// Import modal components
import CoursesModal from '@/components/CoursesModal';
import RatingsModal from '@/components/RatingsModal';

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

const HomePage = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const { scheduledCourses, removeCourse } = useSchedule();

  // Modal states
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCoursesModal, setShowCoursesModal] = useState(false);
  const [showRatingsModal, setShowRatingsModal] = useState(false);

  // Generate hours for preview (simplified)
  const hours = Array.from({ length: 18 }, (_, i) => i + 6);
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  const parseDays = (daysStr: string): string[] => {
    const dayMap: { [key: string]: string } = {
      M: 'Mon',
      T: 'Tue',
      W: 'Wed',
      R: 'Thu',
      F: 'Fri',
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

  const parseTime = (
    timeStr: string
  ): { startHour: number; endHour: number; startMinute: number; endMinute: number } | null => {
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

  const renderCourseBlock = (course: ScheduledCourse, day: string, isPreview = false) => {
    const schedules = course.schedule || [{ days: course.days || '', time: course.time || '' }];

    return schedules.map((sched, idx) => {
      const days = parseDays(sched.days);
      if (!days.includes(day)) return null;

      const timeInfo = parseTime(sched.time);
      if (!timeInfo) return null;

      const { startHour, endHour, startMinute, endMinute } = timeInfo;
      const startIndex = startHour - 6;
      const duration = endHour - startHour + (endMinute - startMinute) / 60;

      const cellHeight = isPreview ? 40 : 70;
      const top = startIndex * cellHeight + (startMinute / 60) * cellHeight;
      const height = duration * cellHeight;

      const dayIndex = dayNames.indexOf(day);
      const timeColumnWidth = isPreview ? 40 : 60;
      const dayCellWidth = isPreview ? 60 : 120;

      return (
        <TouchableOpacity
          key={`${course.crn}-${day}-${idx}`}
          style={[
            styles.courseBlock,
            {
              backgroundColor: course.color,
              top,
              height: Math.max(height, isPreview ? 20 : 30),
              left: timeColumnWidth + dayIndex * dayCellWidth,
              width: dayCellWidth - 2,
            },
          ]}
          onPress={() => {
            if (!isPreview) {
              Alert.alert(
                'Remove Course',
                `Remove ${course.subject} ${course.course} from your schedule?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Remove', style: 'destructive', onPress: () => removeCourse(course.crn) },
                ]
              );
            }
          }}
          disabled={isPreview}
        >
          <Text style={[styles.courseBlockTitle, isPreview && { fontSize: 9 }]} numberOfLines={1}>
            {course.subject} {course.course}
          </Text>
          {!isPreview && (
            <Text style={styles.courseBlockTime} numberOfLines={1}>
              {sched.time}
            </Text>
          )}
        </TouchableOpacity>
      );
    });
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Hofstra Course Planner</ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.lightText }]}>
            Your personalized schedule assistant
          </ThemedText>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Schedule Card */}
        <TouchableOpacity
          style={[styles.mainCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
          onPress={() => setShowScheduleModal(true)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View>
              <ThemedText style={styles.cardTitle}>My Weekly Schedule</ThemedText>
              <ThemedText style={[styles.cardSubtitle, { color: colors.lightText }]}>
                {scheduledCourses.length} course{scheduledCourses.length !== 1 ? 's' : ''} scheduled
              </ThemedText>
            </View>
            <View style={[styles.expandIcon, { backgroundColor: colors.accent }]}>
              <Text style={styles.expandIconText}>→</Text>
            </View>
          </View>

          {/* Schedule Preview */}
          {scheduledCourses.length > 0 ? (
            <View style={styles.schedulePreview}>
              <View style={styles.previewHeader}>
                <View style={styles.previewTimeColumn} />
                {dayNames.map((day) => (
                  <View key={day} style={styles.previewDayHeader}>
                    <Text style={[styles.previewDayName, { color: colors.text }]}>{day}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.previewGrid}>
                <View style={styles.previewTimeColumnContainer}>
                  {hours.filter((h) => h >= 8 && h <= 18).map((hour) => (
                    <View key={hour} style={styles.previewTimeSlot}>
                      <Text style={[styles.previewTimeText, { color: colors.lightText }]}>
                        {hour > 12 ? `${hour - 12}p` : hour === 12 ? '12p' : `${hour}a`}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.previewGridWrapper}>
                  {hours
                    .filter((h) => h >= 8 && h <= 18)
                    .map((hour) => (
                      <View key={hour} style={[styles.previewHourRow, { borderBottomColor: colors.border }]}>
                        {dayNames.map((day) => (
                          <View
                            key={day}
                            style={[
                              styles.previewDayCell,
                              {
                                backgroundColor: colors.cellBackground,
                                borderRightColor: colors.border,
                              },
                            ]}
                          />
                        ))}
                      </View>
                    ))}

                  {scheduledCourses.map((course) => dayNames.map((day) => renderCourseBlock(course, day, true)))}
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: colors.lightText }]}>
                No courses scheduled yet
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: colors.lightText }]}>
                Tap "Browse Courses" below to add classes
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Text style={[styles.statNumber, { color: colors.accent }]}>{scheduledCourses.length}</Text>
            <Text style={[styles.statLabel, { color: colors.lightText }]}>Courses</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Text style={[styles.statNumber, { color: colors.success }]}>
              {scheduledCourses.reduce((sum, c) => sum + c.credits, 0)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.lightText }]}>Credits</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Text style={[styles.statNumber, { color: colors.warning }]}>
              {new Set(scheduledCourses.map((c) => c.instructor)).size}
            </Text>
            <Text style={[styles.statLabel, { color: colors.lightText }]}>Professors</Text>
          </View>
        </View>

        {/* Course List */}
        {scheduledCourses.length > 0 && (
          <View style={styles.courseListSection}>
            <ThemedText style={styles.sectionTitle}>Enrolled Courses</ThemedText>
            {scheduledCourses.map((course) => (
              <View
                key={course.crn}
                style={[
                  styles.courseListItem,
                  { backgroundColor: colors.cardBackground, borderColor: colors.border, borderLeftColor: course.color },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.courseListCode}>
                    {course.subject} {course.course}-{course.section}
                  </ThemedText>
                  <ThemedText style={[styles.courseListTitle, { color: colors.lightText }]} numberOfLines={1}>
                    {course.title}
                  </ThemedText>
                  <ThemedText style={[styles.courseListInfo, { color: colors.lightText }]}>
                    {course.instructor} • {course.credits} credits
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[styles.fab, styles.fabSecondary, { backgroundColor: colors.accent }]}
          onPress={() => setShowRatingsModal(true)}
        >
          <Text style={styles.fabIcon}>⭐</Text>
          <Text style={styles.fabLabel}>Ratings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fab, styles.fabPrimary, { backgroundColor: colors.accent }]}
          onPress={() => setShowCoursesModal(true)}
        >
          <Text style={styles.fabIcon}>📚</Text>
          <Text style={styles.fabLabel}>Browse Courses</Text>
        </TouchableOpacity>
      </View>

      {/* Full Schedule Modal */}
      <Modal visible={showScheduleModal} animationType="slide" presentationStyle="pageSheet">
        <FullScheduleView onClose={() => setShowScheduleModal(false)} />
      </Modal>

      {/* Courses Modal */}
      <CoursesModal visible={showCoursesModal} onClose={() => setShowCoursesModal(false)} />

      {/* Ratings Modal */}
      <RatingsModal visible={showRatingsModal} onClose={() => setShowRatingsModal(false)} />
    </ThemedView>
  );
};

// Full Schedule Modal Component
const FullScheduleView = ({ onClose }: { onClose: () => void }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const { scheduledCourses, addCourse, removeCourse } = useSchedule();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const headerScrollRef = React.useRef<ScrollView>(null);
  const gridScrollRef = React.useRef<ScrollView>(null);

  const handleScroll = (event: any, source: 'header' | 'grid') => {
    const scrollX = event.nativeEvent.contentOffset.x;
    if (source === 'grid' && headerScrollRef.current) {
      headerScrollRef.current.scrollTo({ x: scrollX, animated: false });
    } else if (source === 'header' && gridScrollRef.current) {
      gridScrollRef.current.scrollTo({ x: scrollX, animated: false });
    }
  };

  const allCourses: Course[] = [
    ...(csScheduleJson as any).courses,
    ...(engScheduleJson as any).courses,
  ];

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
      if (dayMap[char]) days.push(dayMap[char]);
    }
    return days;
  };

  const parseTime = (
    timeStr: string
  ): { startHour: number; endHour: number; startMinute: number; endMinute: number } | null => {
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
      const spacing = -60;
      const dayCellWidth = 120;

      return (
        <TouchableOpacity
          key={`${course.crn}-${day}-${idx}`}
          style={[
            styles.courseBlock,
            {
              backgroundColor: course.color,
              top,
              height: Math.max(height, 30),
              left: timeColumnWidth + spacing + dayIndex * dayCellWidth,
              width: dayCellWidth - 2,
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
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <View>
            <ThemedText style={styles.modalTitle}>Weekly Schedule</ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.lightText }]}>
              {scheduledCourses.length} course{scheduledCourses.length !== 1 ? 's' : ''} added
            </ThemedText>
          </View>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.modalClose, { color: colors.text }]}>✕</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scheduleContainer} showsVerticalScrollIndicator={false}>
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
            <View
              style={[
                styles.weekHeader,
                { borderBottomColor: colors.border, backgroundColor: colors.background },
              ]}
            >
              {dayNames.map((day) => (
                <View key={day} style={styles.dayHeader}>
                  <Text style={[styles.dayName, { color: colors.text }]}>{day}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.gridRow}>
          <View style={styles.timeColumnContainer}>
            {hours.map((hour) => (
              <View key={hour} style={styles.timeSlot}>
                <Text style={[styles.timeText, { color: colors.lightText }]}>
                  {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                </Text>
              </View>
            ))}
          </View>

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

                {scheduledCourses.map((course) => dayNames.map((day) => renderCourseBlock(course, day)))}
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
                      {isAdded && <Text style={[styles.addedBadge, { color: colors.success }]}>✓ Added</Text>}
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
        style={[styles.fab, styles.fabPrimary, { backgroundColor: colors.accent, bottom: 24, right: 24 }]}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    opacity: 0.7,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  mainCard: {
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  expandIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandIconText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  schedulePreview: {
    marginTop: 8,
  },
  previewHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  previewTimeColumn: {
    width: 40,
  },
  previewDayHeader: {
    width: 60,
    alignItems: 'center',
  },
  previewDayName: {
    fontSize: 11,
    fontWeight: '600',
  },
  previewGrid: {
    flexDirection: 'row',
    height: 440,
  },
  previewTimeColumnContainer: {
    width: 40,
  },
  previewTimeSlot: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewTimeText: {
    fontSize: 9,
    fontWeight: '500',
  },
  previewGridWrapper: {
    position: 'relative',
    flex: 1,
  },
  previewHourRow: {
    flexDirection: 'row',
    height: 40,
    borderBottomWidth: 1,
  },
  previewDayCell: {
    width: 60,
    borderRightWidth: 1,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  courseListSection: {
    marginTop: 24,
    marginBottom: 120,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  courseListItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    marginBottom: 8,
  },
  courseListCode: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  courseListTitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  courseListInfo: {
    fontSize: 12,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    gap: 12,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    gap: 8,
  },
  fabPrimary: {},
  fabSecondary: {},
  fabIcon: {
    fontSize: 20,
  },
  fabLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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
});

export default HomePage;
