import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { searchProfessorsAtSchoolId, searchSchool } from 'ratemyprofessor-api/index';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Professor {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
  avgRating: number;
  avgDifficulty: number;
  numRatings: number;
  wouldTakeAgainPercent: number;
}

type SortOption = 'rating' | 'wouldTakeAgain' | 'difficulty';
type SortOrder = 'asc' | 'desc';

interface RatingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function RatingsModal({ visible, onClose }: RatingsModalProps) {
  const router = useRouter();
  const [allProfessors, setAllProfessors] = useState<Professor[]>([]);
  const [displayCount, setDisplayCount] = useState(10);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hofstraId, setHofstraId] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('rating');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  useEffect(() => {
    if (visible) {
      fetchHofstraProfessors();
    }
  }, [visible]);

  const fetchHofstraProfessors = async (query: string = '') => {
    try {
      setLoading(true);
      setError(null);
      setDisplayCount(10);

      let schoolId = hofstraId;
      if (!schoolId) {
        const schools = await searchSchool('Hofstra University');

        if (!schools || schools.length === 0) {
          setError('Hofstra University not found');
          setLoading(false);
          return;
        }

        schoolId = schools[0].node.id;
        setHofstraId(schoolId);
      }

      const results = await searchProfessorsAtSchoolId(query, schoolId);

      if (!results || results.length === 0) {
        setError(query ? 'No professors found matching your search' : 'No professors found');
        setLoading(false);
        return;
      }

      const professorDetails = results.map((prof: any) => {
        const node = prof.node;
        return {
          id: node.id || '',
          firstName: node.firstName || '',
          lastName: node.lastName || '',
          department: node.department || 'N/A',
          avgRating: node.avgRating || 0,
          avgDifficulty: node.avgDifficulty || 0,
          numRatings: node.numRatings || 0,
          wouldTakeAgainPercent: node.wouldTakeAgainPercent || 0,
        };
      });

      setAllProfessors(professorDetails);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching professors:', err);
      setError('Failed to load professors');
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchHofstraProfessors(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    fetchHofstraProfessors('');
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.0) return colors.success;
    if (rating >= 3.0) return colors.warning;
    return colors.error;
  };

  const sortProfessors = (profs: Professor[]) => {
    const sorted = [...profs].sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case 'rating':
          compareValue = a.avgRating - b.avgRating;
          break;
        case 'wouldTakeAgain':
          compareValue = a.wouldTakeAgainPercent - b.wouldTakeAgainPercent;
          break;
        case 'difficulty':
          compareValue = a.avgDifficulty - b.avgDifficulty;
          break;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return sorted;
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
      case 'rating':
        return 'Rating';
      case 'wouldTakeAgain':
        return 'Would Take Again';
      case 'difficulty':
        return 'Difficulty';
    }
  };

  const loadMore = () => {
    if (displayCount < sortedProfessors.length && !loadingMore) {
      setLoadingMore(true);
      setTimeout(() => {
        setDisplayCount((prev) => prev + 10);
        setLoadingMore(false);
      }, 300);
    }
  };

  const sortedProfessors = sortProfessors(allProfessors);
  const displayedProfessors = sortedProfessors.slice(0, displayCount);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ThemedView style={styles.container}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerTop}>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.title}>Professor Ratings</ThemedText>
                <ThemedText style={[styles.subtitle, { color: colors.lightText }]}>
                  Hofstra University
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
                placeholder="Search professors by name..."
                placeholderTextColor={colors.placeholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
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

            {/* Sort Controls */}
            <View style={styles.sortContainer}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <TouchableOpacity
                  onPress={() => setShowSortDropdown(!showSortDropdown)}
                  style={[
                    styles.sortDropdownButton,
                    { backgroundColor: colors.searchBackground, borderColor: colors.border },
                  ]}
                >
                  <ThemedText style={styles.sortDropdownLabel}>Sort by: {getSortLabel(sortBy)}</ThemedText>
                  <ThemedText style={styles.sortDropdownArrow}>
                    {showSortDropdown ? '▲' : '▼'}
                  </ThemedText>
                </TouchableOpacity>

                {showSortDropdown && (
                  <View
                    style={[
                      styles.dropdownMenu,
                      { backgroundColor: colors.cardBackground, borderColor: colors.border },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => handleSortSelect('rating')}
                      style={[
                        styles.dropdownItem,
                        sortBy === 'rating' && { backgroundColor: colors.searchBackground },
                      ]}
                    >
                      <ThemedText style={styles.dropdownItemText}>Rating</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleSortSelect('wouldTakeAgain')}
                      style={[
                        styles.dropdownItem,
                        sortBy === 'wouldTakeAgain' && { backgroundColor: colors.searchBackground },
                      ]}
                    >
                      <ThemedText style={styles.dropdownItemText}>Would Take Again</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleSortSelect('difficulty')}
                      style={[
                        styles.dropdownItem,
                        sortBy === 'difficulty' && { backgroundColor: colors.searchBackground },
                      ]}
                    >
                      <ThemedText style={styles.dropdownItemText}>Difficulty</ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={toggleSortOrder}
                style={[styles.sortOrderButton, { backgroundColor: colors.accent }]}
              >
                <ThemedText style={styles.sortOrderButtonText}>
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={colors.accent} />
              <ThemedText style={styles.loadingText}>Loading professors...</ThemedText>
            </View>
          ) : error ? (
            <View style={styles.centerContent}>
              <ThemedText style={[styles.errorText, { color: colors.error }]}>{error}</ThemedText>
              <TouchableOpacity
                onPress={handleClearSearch}
                style={[styles.retryButton, { backgroundColor: colors.accent }]}
              >
                <ThemedText style={styles.retryButtonText}>Show Random Professors</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={displayedProfessors}
              keyExtractor={(item) => item.id}
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
                if (displayedProfessors.length < sortedProfessors.length) {
                  return (
                    <View style={styles.loadingMoreContainer}>
                      <ThemedText style={[styles.loadingMoreText, { opacity: 0.5 }]}>
                        Scroll down for more
                      </ThemedText>
                    </View>
                  );
                }
                if (displayedProfessors.length > 0) {
                  return (
                    <View style={styles.loadingMoreContainer}>
                      <ThemedText style={[styles.loadingMoreText, { opacity: 0.5 }]}>
                        No more professors
                      </ThemedText>
                    </View>
                  );
                }
                return null;
              }}
              renderItem={({ item: prof }) => (
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    router.push({
                      pathname: '/professor/[id]',
                      params: {
                        id: prof.id,
                        firstName: prof.firstName,
                        lastName: prof.lastName,
                        department: prof.department,
                        avgRating: prof.avgRating,
                        avgDifficulty: prof.avgDifficulty,
                        numRatings: prof.numRatings,
                        wouldTakeAgainPercent: prof.wouldTakeAgainPercent,
                      },
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.professorCard,
                      { backgroundColor: colors.cardBackground, borderColor: colors.border },
                    ]}
                  >
                    <View style={styles.cardHeader}>
                      <ThemedText style={styles.professorName}>
                        {prof.firstName} {prof.lastName}
                      </ThemedText>
                      <View
                        style={[styles.ratingBadge, { backgroundColor: getRatingColor(prof.avgRating) }]}
                      >
                        <ThemedText style={styles.ratingText}>{prof.avgRating.toFixed(1)}</ThemedText>
                      </View>
                    </View>

                    <ThemedText style={styles.department}>{prof.department}</ThemedText>

                    <View style={styles.statsContainer}>
                      <View style={styles.statItem}>
                        <ThemedText style={styles.statLabel}>Difficulty</ThemedText>
                        <ThemedText style={styles.statValue}>{prof.avgDifficulty.toFixed(1)}/5</ThemedText>
                      </View>

                      <View style={styles.statItem}>
                        <ThemedText style={styles.statLabel}>Would Take Again</ThemedText>
                        <ThemedText style={styles.statValue}>
                          {prof.wouldTakeAgainPercent.toFixed(0)}%
                        </ThemedText>
                      </View>

                      <View style={styles.statItem}>
                        <ThemedText style={styles.statLabel}>Ratings</ThemedText>
                        <ThemedText style={styles.statValue}>{prof.numRatings}</ThemedText>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
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
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 6,
  },
  clearButton: {
    padding: 4,
    marginRight: 8,
  },
  clearButtonText: {
    fontSize: 18,
    opacity: 0.5,
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
  retryButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  professorCard: {
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  professorName: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
    letterSpacing: 0.3,
  },
  ratingBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  department: {
    fontSize: 14,
    marginBottom: 12,
    opacity: 0.7,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  sortDropdownLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  sortDropdownArrow: {
    fontSize: 12,
    marginLeft: 8,
    opacity: 0.6,
  },
  dropdownMenu: {
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
    zIndex: 1000,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
  },
  dropdownItemText: {
    fontSize: 15,
  },
  sortOrderButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  sortOrderButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
