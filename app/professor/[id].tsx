import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

interface Rating {
  id: string;
  class: string;
  comment: string;
  rating: number;
  difficulty: number;
  wouldTakeAgain: string;
  date: string;
  thumbsUp: number;
  thumbsDown: number;
}

interface ProfessorDetails {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
  avgRating: number;
  avgDifficulty: number;
  numRatings: number;
  wouldTakeAgainPercent: number;
  ratings: Rating[];
}

export default function ProfessorDetailsScreen() {
  const { id, firstName, lastName, department, avgRating, avgDifficulty, numRatings, wouldTakeAgainPercent } =
    useLocalSearchParams();
  const router = useRouter();
  const [professorDetails, setProfessorDetails] = useState<ProfessorDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>('All Classes');
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'difficulty' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  useEffect(() => {
    fetchProfessorDetails();
  }, []);

  const fetchProfessorDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const RATINGS_QUERY = `query TeacherRatingsPageQuery($id: ID!) {
  node(id: $id) {
    __typename
    ... on Teacher {
      id
      firstName
      lastName
      department
      avgRating
      avgDifficulty
      numRatings
      wouldTakeAgainPercent
      ratings(first: 100) {
        edges {
          cursor
          node {
            id
            class
            comment
            helpfulRating
            clarityRating
            difficultyRating
            wouldTakeAgain
            date
            thumbsUpTotal
            thumbsDownTotal
          }
        }
      }
    }
  }
}`;

      const response = await fetch('https://www.ratemyprofessors.com/graphql', {
        method: 'POST',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.5',
          'Content-Type': 'application/json',
          'Authorization': 'Basic dGVzdDp0ZXN0',
        },
        body: JSON.stringify({
          query: RATINGS_QUERY,
          variables: { id: id },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch professor details');
      }

      const data = await response.json();

      if (data.errors) {
        setError('Failed to load professor details');
        setLoading(false);
        return;
      }

      const teacher = data.data?.node;

      if (!teacher) {
        setError('Professor not found');
        setLoading(false);
        return;
      }

      const ratings = teacher.ratings?.edges?.map((edge: any) => ({
        id: edge.node.id,
        class: edge.node.class || 'N/A',
        comment: edge.node.comment || '',
        rating: edge.node.clarityRating || 0,
        difficulty: edge.node.difficultyRating || 0,
        wouldTakeAgain: edge.node.wouldTakeAgain === 1 ? 'Yes' : edge.node.wouldTakeAgain === 0 ? 'No' : 'N/A',
        date: edge.node.date || '',
        thumbsUp: edge.node.thumbsUpTotal || 0,
        thumbsDown: edge.node.thumbsDownTotal || 0,
      })) || [];

      setProfessorDetails({
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        department: teacher.department,
        avgRating: teacher.avgRating,
        avgDifficulty: teacher.avgDifficulty,
        numRatings: teacher.numRatings,
        wouldTakeAgainPercent: teacher.wouldTakeAgainPercent,
        ratings,
      });

      setLoading(false);
    } catch (err) {
      console.error('Error fetching professor details:', err);
      setError('Failed to load professor details');
      setLoading(false);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.0) return colors.success;
    if (rating >= 3.0) return colors.warning;
    return colors.error;
  };

  const getUniqueClasses = () => {
    if (!professorDetails) return ['All Classes'];
    const classes = professorDetails.ratings
      .map((r) => r.class)
      .filter((c) => c !== 'N/A');
    return ['All Classes', ...new Set(classes)];
  };

  const filteredRatings = professorDetails?.ratings.filter((rating) => {
    if (selectedClass === 'All Classes') return true;
    return rating.class === selectedClass;
  }) || [];

  const sortRatings = (ratings: Rating[]) => {
    const sorted = [...ratings].sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case 'rating':
          compareValue = a.rating - b.rating;
          break;
        case 'difficulty':
          compareValue = a.difficulty - b.difficulty;
          break;
        case 'date':
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          compareValue = dateA - dateB;
          break;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return sorted;
  };

  const sortedRatings = sortRatings(filteredRatings);

  const handleSortSelect = (option: 'rating' | 'difficulty' | 'date') => {
    setSortBy(option);
    setShowSortDropdown(false);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const getSortLabel = (option: 'rating' | 'difficulty' | 'date') => {
    switch (option) {
      case 'rating':
        return 'Rating';
      case 'difficulty':
        return 'Difficulty';
      case 'date':
        return 'Date';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';

    try {
      // Remove UTC and timezone info if present
      const cleanDateString = dateString.replace(/\s*\+\d{4}\s*UTC?\s*/gi, '').trim();

      // Parse the date
      const date = new Date(cleanDateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'N/A';
      }

      // Format as "Mon DD, YYYY"
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: `${firstName} ${lastName}`,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.accent} />
          <ThemedText style={styles.loadingText}>Loading professor details...</ThemedText>
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <ThemedText style={[styles.errorText, { color: colors.error }]}>{error}</ThemedText>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.accent }]}>
            <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </View>
      ) : professorDetails ? (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Professor Info Card */}
          <View style={[styles.professorCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.professorName}>
                  {professorDetails.firstName} {professorDetails.lastName}
                </ThemedText>
                <ThemedText style={styles.department}>{professorDetails.department}</ThemedText>
              </View>
              <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(professorDetails.avgRating) }]}>
                <ThemedText style={styles.ratingText}>{professorDetails.avgRating.toFixed(1)}</ThemedText>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <ThemedText style={styles.statLabel}>Difficulty</ThemedText>
                <ThemedText style={styles.statValue}>{professorDetails.avgDifficulty.toFixed(1)}/5</ThemedText>
              </View>
              <View style={styles.statBox}>
                <ThemedText style={styles.statLabel}>Would Take Again</ThemedText>
                <ThemedText style={styles.statValue}>{professorDetails.wouldTakeAgainPercent.toFixed(0)}%</ThemedText>
              </View>
              <View style={styles.statBox}>
                <ThemedText style={styles.statLabel}>Total Ratings</ThemedText>
                <ThemedText style={styles.statValue}>{professorDetails.numRatings}</ThemedText>
              </View>
            </View>
          </View>

          {/* Filters */}
          <View style={styles.filterSection}>
            <ThemedText style={styles.filterTitle}>Student Ratings</ThemedText>
            <View style={styles.filtersRow}>
              {/* Class Filter Dropdown */}
              <View style={styles.filterItem}>
                <TouchableOpacity
                  onPress={() => {
                    setShowClassDropdown(!showClassDropdown);
                    setShowSortDropdown(false);
                  }}
                  style={[styles.filterButton, { backgroundColor: colors.searchBackground, borderColor: colors.border }]}
                >
                  <ThemedText style={styles.filterButtonLabel} numberOfLines={1}>{selectedClass}</ThemedText>
                  <ThemedText style={styles.dropdownArrow}>{showClassDropdown ? '▲' : '▼'}</ThemedText>
                </TouchableOpacity>

                {showClassDropdown && (
                  <View style={[styles.dropdownMenu, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                    <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                      {getUniqueClasses().map((className) => (
                        <TouchableOpacity
                          key={className}
                          onPress={() => {
                            setSelectedClass(className);
                            setShowClassDropdown(false);
                          }}
                          style={[
                            styles.dropdownItem,
                            selectedClass === className && { backgroundColor: colors.searchBackground },
                          ]}
                        >
                          <ThemedText style={styles.dropdownItemText}>{className}</ThemedText>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Sort Dropdown */}
              <View style={styles.filterItem}>
                <TouchableOpacity
                  onPress={() => {
                    setShowSortDropdown(!showSortDropdown);
                    setShowClassDropdown(false);
                  }}
                  style={[styles.filterButton, { backgroundColor: colors.searchBackground, borderColor: colors.border }]}
                >
                  <ThemedText style={styles.filterButtonLabel}>{getSortLabel(sortBy)}</ThemedText>
                  <ThemedText style={styles.dropdownArrow}>{showSortDropdown ? '▲' : '▼'}</ThemedText>
                </TouchableOpacity>

                {showSortDropdown && (
                  <View style={[styles.dropdownMenu, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                    {(['rating', 'difficulty', 'date'] as const).map((option) => (
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
                  </View>
                )}
              </View>

              {/* Sort Order Toggle */}
              <TouchableOpacity
                onPress={toggleSortOrder}
                style={[styles.orderButton, { backgroundColor: colors.accent }]}
              >
                <ThemedText style={styles.orderButtonText}>{sortOrder === 'asc' ? '↑' : '↓'}</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Ratings List */}
          <View style={styles.ratingsContainer}>
            {sortedRatings.length === 0 ? (
              <View style={styles.noRatingsContainer}>
                <ThemedText style={styles.noRatingsText}>No ratings found for this class</ThemedText>
              </View>
            ) : (
              sortedRatings.map((rating) => (
                <View
                  key={rating.id}
                  style={[styles.ratingCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                >
                  <View style={styles.ratingHeader}>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={styles.ratingClass}>{rating.class}</ThemedText>
                      <ThemedText style={[styles.ratingDate, { color: colors.lightText }]}>
                        {formatDate(rating.date)}
                      </ThemedText>
                    </View>
                    <View style={styles.ratingScores}>
                      <View style={styles.scoreItem}>
                        <ThemedText style={[styles.scoreLabel, { color: colors.lightText }]}>Quality</ThemedText>
                        <View style={[styles.scoreBadge, { backgroundColor: getRatingColor(rating.rating) }]}>
                          <ThemedText style={styles.scoreText}>{rating.rating.toFixed(1)}</ThemedText>
                        </View>
                      </View>
                      <View style={styles.scoreItem}>
                        <ThemedText style={[styles.scoreLabel, { color: colors.lightText }]}>Difficulty</ThemedText>
                        <View style={[styles.scoreBadge, { backgroundColor: colors.border }]}>
                          <ThemedText style={styles.scoreText}>{rating.difficulty.toFixed(1)}</ThemedText>
                        </View>
                      </View>
                    </View>
                  </View>

                  {rating.comment && (
                    <ThemedText style={styles.ratingComment}>{rating.comment}</ThemedText>
                  )}

                  <View style={styles.ratingFooter}>
                    <View style={styles.wouldTakeAgainContainer}>
                      <ThemedText style={[styles.wouldTakeAgainLabel, { color: colors.lightText }]}>
                        Would take again:
                      </ThemedText>
                      <ThemedText
                        style={[
                          styles.wouldTakeAgainValue,
                          { color: rating.wouldTakeAgain === 'Yes' ? colors.success : colors.lightText },
                        ]}
                      >
                        {rating.wouldTakeAgain}
                      </ThemedText>
                    </View>
                    <View style={styles.thumbsContainer}>
                      <View style={styles.thumbsItem}>
                        <ThemedText style={styles.thumbsIcon}>👍</ThemedText>
                        <ThemedText style={[styles.thumbsCount, { color: colors.lightText }]}>
                          {rating.thumbsUp}
                        </ThemedText>
                      </View>
                      <View style={styles.thumbsItem}>
                        <ThemedText style={styles.thumbsIcon}>👎</ThemedText>
                        <ThemedText style={[styles.thumbsCount, { color: colors.lightText }]}>
                          {rating.thumbsDown}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
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
  backButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  professorCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  professorName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  department: {
    fontSize: 14,
    opacity: 0.7,
  },
  ratingBadge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  filterSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterItem: {
    flex: 1,
    position: 'relative',
    zIndex: 1000,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterButtonLabel: {
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
    maxHeight: 200,
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
  classDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  classDropdownLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  classDropdownMenu: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  classDropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  classDropdownItemText: {
    fontSize: 15,
  },
  ratingsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  noRatingsContainer: {
    padding: 32,
    alignItems: 'center',
  },
  noRatingsText: {
    fontSize: 16,
    opacity: 0.6,
  },
  ratingCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ratingClass: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  ratingDate: {
    fontSize: 12,
  },
  ratingScores: {
    flexDirection: 'row',
    gap: 12,
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 10,
    marginBottom: 4,
  },
  scoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  scoreText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  ratingComment: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  ratingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  wouldTakeAgainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wouldTakeAgainLabel: {
    fontSize: 12,
  },
  wouldTakeAgainValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  thumbsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  thumbsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  thumbsIcon: {
    fontSize: 14,
  },
  thumbsCount: {
    fontSize: 12,
  },
});
