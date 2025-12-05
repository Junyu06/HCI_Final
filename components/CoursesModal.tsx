import csScheduleJson from '@/class_schedule_spring_2026.json';
import engScheduleJson from '@/engineering_schedule_spring_2026.json';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useSchedule } from '@/contexts/ScheduleContext';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Course {
  crn: string;
  subject: string;
  course: string;
  section: string;
  campus: string;
  credits: number;
  title: string;
  days?: string;
  time?: string;
  schedule?: Array<{ days: string; time: string }>;
  capacity: number;
  actual: number;
  remaining: number;
  waitlist_capacity: number;
  waitlist_actual: number;
  waitlist_remaining: number;
  instructor: string;
  status: string;
}

interface ScheduleData {
  semester: string;
  date_range: string;
  department: string;
  courses: Course[];
}

type DepartmentFilter = 'All' | 'CS' | 'Engineering';
type SortOption = 'courseCode' | 'title' | 'instructor' | 'credits' | 'remaining' | 'status';
type SortOrder = 'asc' | 'desc';

interface CoursesModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function CoursesModal({ visible, onClose }: CoursesModalProps) {
  const { scheduledCourses, addCourse } = useSchedule();
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [displayCount, setDisplayCount] = useState(10);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<DepartmentFilter>('All');
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('courseCode');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  useEffect(() => {
    if (visible) {
      fetchCourseData();
    }
  }, [visible]);

  const fetchCourseData = () => {
    try {
      setLoading(true);
      setError(null);

      const csData = csScheduleJson as ScheduleData;
      const engData = engScheduleJson as ScheduleData;

      const allCoursesData = [...csData.courses, ...engData.courses];
      setAllCourses(allCoursesData);
      setLoading(false);
    } catch (err) {
      console.error('Error loading course data:', err);
      setError('Failed to load course schedule');
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'Open') return colors.success;
    return colors.error;
  };

  const formatSchedule = (course: Course) => {
    if (course.schedule) {
      return course.schedule.map((s) => `${s.days} ${s.time}`).join('\n');
    }
    return `${course.days || 'TBA'} ${course.time || ''}`.trim();
  };

  const filterByDepartment = (courses: Course[]) => {
    if (departmentFilter === 'All') return courses;
    if (departmentFilter === 'CS') {
      return courses.filter((c) => c.subject === 'CSC');
    }
    return courses.filter((c) => c.subject === 'ENGG');
  };

  const sortCourses = (courses: Course[]) => {
    const sorted = [...courses].sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case 'courseCode':
          const codeA = `${a.subject}${a.course}${a.section}`;
          const codeB = `${b.subject}${b.course}${b.section}`;
          compareValue = codeA.localeCompare(codeB);
          break;
        case 'title':
          compareValue = a.title.localeCompare(b.title);
          break;
        case 'instructor':
          compareValue = a.instructor.localeCompare(b.instructor);
          break;
        case 'credits':
          compareValue = a.credits - b.credits;
          break;
        case 'remaining':
          compareValue = a.remaining - b.remaining;
          break;
        case 'status':
          compareValue = a.status.localeCompare(b.status);
          break;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return sorted;
  };

  const handleSearch = () => {
    fetchCourseData();
    setDisplayCount(10);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setDisplayCount(10);
  };

  const handleDepartmentSelect = (dept: DepartmentFilter) => {
    setDepartmentFilter(dept);
    setShowDepartmentDropdown(false);
    setDisplayCount(10);
  };

  const handleSortSelect = (option: SortOption) => {
    setSortBy(option);
    setShowSortDropdown(false);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case 'courseCode':
        return 'Course Code';
      case 'title':
        return 'Title';
      case 'instructor':
        return 'Instructor';
      case 'credits':
        return 'Credits';
      case 'remaining':
        return 'Seats Available';
      case 'status':
        return 'Status';
    }
  };

  const loadMore = () => {
    if (displayCount < filteredAndSortedCourses.length && !loadingMore) {
      setLoadingMore(true);
      setTimeout(() => {
        setDisplayCount((prev) => prev + 10);
        setLoadingMore(false);
      }, 300);
    }
  };

  const searchFilteredCourses = allCourses.filter((course) => {
    if (!searchQuery.trim()) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      course.title.toLowerCase().includes(searchLower) ||
      course.instructor.toLowerCase().includes(searchLower) ||
      `${course.subject}${course.course}`.toLowerCase().includes(searchLower) ||
      course.crn.includes(searchQuery)
    );
  });

  const filteredAndSortedCourses = sortCourses(filterByDepartment(searchFilteredCourses));
  const displayedCourses = filteredAndSortedCourses.slice(0, displayCount);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ThemedView style={styles.container}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerTop}>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.title}>Browse Courses</ThemedText>
                <ThemedText style={[styles.subtitle, { color: colors.lightText }]}>
                  Spring Semester 2026
                </ThemedText>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <ThemedText style={[styles.closeButtonText, { color: colors.text }]}>✕</ThemedText>
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchContainer, { backgroundColor: colors.searchBackground }]}>
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search courses, instructor, or CRN..."
                placeholderTextColor={colors.lightText}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
                  <ThemedText style={styles.clearButtonText}>✕</ThemedText>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                onPress={handleSearch}
                style={[styles.searchButton, { backgroundColor: colors.accent }]}
              >
                <ThemedText style={styles.searchButtonText}>Search</ThemedText>
              </TouchableOpacity>
            </View>

            {/* Filter and Sort Controls */}
            <View style={styles.controlsRow}>
              <View style={styles.controlItem}>
                <TouchableOpacity
                  onPress={() => {
                    setShowDepartmentDropdown(!showDepartmentDropdown);
                    setShowSortDropdown(false);
                  }}
                  style={[
                    styles.controlButton,
                    { backgroundColor: colors.searchBackground, borderColor: colors.border },
                  ]}
                >
                  <ThemedText style={styles.controlButtonLabel}>{departmentFilter}</ThemedText>
                  <ThemedText style={styles.dropdownArrow}>
                    {showDepartmentDropdown ? '▲' : '▼'}
                  </ThemedText>
                </TouchableOpacity>

                {showDepartmentDropdown && (
                  <View
                    style={[
                      styles.dropdownMenu,
                      { backgroundColor: colors.cardBackground, borderColor: colors.border },
                    ]}
                  >
                    <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled>
                      {(['All', 'CS', 'Engineering'] as DepartmentFilter[]).map((dept) => (
                        <TouchableOpacity
                          key={dept}
                          onPress={() => handleDepartmentSelect(dept)}
                          style={[
                            styles.dropdownItem,
                            departmentFilter === dept && { backgroundColor: colors.searchBackground },
                          ]}
                        >
                          <ThemedText style={styles.dropdownItemText}>{dept}</ThemedText>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View style={styles.controlItem}>
                <TouchableOpacity
                  onPress={() => {
                    setShowSortDropdown(!showSortDropdown);
                    setShowDepartmentDropdown(false);
                  }}
                  style={[
                    styles.controlButton,
                    { backgroundColor: colors.searchBackground, borderColor: colors.border },
                  ]}
                >
                  <ThemedText style={styles.controlButtonLabel} numberOfLines={1}>
                    {getSortLabel(sortBy)}
                  </ThemedText>
                  <ThemedText style={styles.dropdownArrow}>{showSortDropdown ? '▲' : '▼'}</ThemedText>
                </TouchableOpacity>

                {showSortDropdown && (
                  <View
                    style={[
                      styles.dropdownMenu,
                      { backgroundColor: colors.cardBackground, borderColor: colors.border },
                    ]}
                  >
                    <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                      {(
                        ['courseCode', 'title', 'instructor', 'credits', 'remaining', 'status'] as SortOption[]
                      ).map((option) => (
                        <TouchableOpacity
                          key={option}
                          onPress={() => handleSortSelect(option)}
                          style={[
                            styles.dropdownItem,
                            sortBy === option && { backgroundColor: colors.searchBackground },
                          ]}
                        >
                          <ThemedText style={styles.dropdownItemText}>{getSortLabel(option)}</ThemedText>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={toggleSortOrder}
                style={[styles.orderButton, { backgroundColor: colors.accent }]}
              >
                <ThemedText style={styles.orderButtonText}>{sortOrder === 'asc' ? '↑' : '↓'}</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={colors.accent} />
              <ThemedText style={styles.loadingText}>Loading course schedule...</ThemedText>
            </View>
          ) : error ? (
            <View style={styles.centerContent}>
              <ThemedText style={[styles.errorText, { color: colors.error }]}>{error}</ThemedText>
            </View>
          ) : (
            <FlatList
              data={displayedCourses}
              keyExtractor={(item) => item.crn}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              onEndReached={loadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={() => {
                if (loadingMore) {
                  return (
                    <View style={styles.loadingMoreContainer}>
                      <ActivityIndicator size="small" color={colors.accent} />
                      <ThemedText style={styles.loadingMoreText}>Loading more...</ThemedText>
                    </View>
                  );
                }
                if (displayedCourses.length < filteredAndSortedCourses.length) {
                  return (
                    <View style={styles.loadingMoreContainer}>
                      <ThemedText style={[styles.loadingMoreText, { opacity: 0.5 }]}>
                        Scroll down for more
                      </ThemedText>
                    </View>
                  );
                }
                if (displayedCourses.length > 0) {
                  return (
                    <View style={styles.loadingMoreContainer}>
                      <ThemedText style={[styles.loadingMoreText, { opacity: 0.5 }]}>
                        No more courses
                      </ThemedText>
                    </View>
                  );
                }
                return null;
              }}
              renderItem={({ item: course }) => {
                const isAdded = scheduledCourses.some((c) => c.crn === course.crn);

                return (
                  <View
                    style={[
                      styles.courseCard,
                      { backgroundColor: colors.cardBackground, borderColor: colors.border },
                    ]}
                  >
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <View style={styles.courseCodeRow}>
                          <ThemedText style={styles.courseCode}>
                            {course.subject} {course.course}-{course.section}
                          </ThemedText>
                          <View style={styles.headerActions}>
                            <View
                              style={[
                                styles.statusBadge,
                                { backgroundColor: getStatusColor(course.status) },
                              ]}
                            >
                              <ThemedText style={styles.statusText}>{course.status}</ThemedText>
                            </View>
                            <TouchableOpacity
                              onPress={() => !isAdded && addCourse(course)}
                              style={[
                                styles.addButton,
                                {
                                  backgroundColor: isAdded ? colors.border : colors.accent,
                                  opacity: isAdded ? 0.5 : 1,
                                },
                              ]}
                              disabled={isAdded}
                            >
                              <ThemedText style={styles.addButtonText}>{isAdded ? '✓' : '+'}</ThemedText>
                            </TouchableOpacity>
                          </View>
                        </View>
                        <ThemedText style={styles.courseTitle}>{course.title}</ThemedText>
                      </View>
                    </View>

                    <View style={styles.infoSection}>
                      <View style={styles.infoRow}>
                        <ThemedText style={[styles.infoLabel, { color: colors.lightText }]}>
                          Instructor:
                        </ThemedText>
                        <ThemedText style={styles.infoValue} numberOfLines={1}>
                          {course.instructor}
                        </ThemedText>
                      </View>

                      <View style={styles.infoRow}>
                        <ThemedText style={[styles.infoLabel, { color: colors.lightText }]}>
                          Schedule:
                        </ThemedText>
                        <ThemedText style={styles.infoValue}>{formatSchedule(course)}</ThemedText>
                      </View>

                      <View style={styles.infoRow}>
                        <ThemedText style={[styles.infoLabel, { color: colors.lightText }]}>CRN:</ThemedText>
                        <ThemedText style={styles.infoValue}>{course.crn}</ThemedText>
                      </View>
                    </View>

                    <View style={styles.statsRow}>
                      <View style={styles.statBox}>
                        <ThemedText style={[styles.statLabel, { color: colors.lightText }]}>
                          Credits
                        </ThemedText>
                        <ThemedText style={styles.statValue}>{course.credits}</ThemedText>
                      </View>
                      <View style={styles.statBox}>
                        <ThemedText style={[styles.statLabel, { color: colors.lightText }]}>
                          Enrolled
                        </ThemedText>
                        <ThemedText style={styles.statValue}>
                          {course.actual}/{course.capacity}
                        </ThemedText>
                      </View>
                      <View style={styles.statBox}>
                        <ThemedText style={[styles.statLabel, { color: colors.lightText }]}>
                          Remaining
                        </ThemedText>
                        <ThemedText
                          style={[
                            styles.statValue,
                            { color: course.remaining > 0 ? colors.success : colors.error },
                          ]}
                        >
                          {course.remaining}
                        </ThemedText>
                      </View>
                      {course.waitlist_actual > 0 && (
                        <View style={styles.statBox}>
                          <ThemedText style={[styles.statLabel, { color: colors.lightText }]}>
                            Waitlist
                          </ThemedText>
                          <ThemedText style={[styles.statValue, { color: colors.warning }]}>
                            {course.waitlist_actual}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  </View>
                );
              }}
            />
          )}
        </ThemedView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 28,
    fontWeight: '300',
    opacity: 0.6,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    fontSize: 18,
    opacity: 0.6,
  },
  searchButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlItem: {
    flex: 1,
    position: 'relative',
    zIndex: 1000,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  controlButtonLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    marginLeft: 4,
    opacity: 0.6,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 46,
    left: 0,
    right: 0,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1001,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownItemText: {
    fontSize: 14,
  },
  orderButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  loadingMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMoreText: {
    marginTop: 8,
    fontSize: 14,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  courseCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  courseCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  courseCode: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  infoSection: {
    gap: 8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '500',
    minWidth: 80,
  },
  infoValue: {
    fontSize: 13,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
    gap: 8,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
  },
});
