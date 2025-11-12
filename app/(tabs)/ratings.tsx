import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, ScrollView, useColorScheme, TextInput, TouchableOpacity } from 'react-native';
import { searchSchool, searchProfessorsAtSchoolId } from 'ratemyprofessor-api/index';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

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

export default function RatingsScreen() {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hofstraId, setHofstraId] = useState<string>('');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    fetchHofstraProfessors();
  }, []);

  const fetchHofstraProfessors = async (query: string = '') => {
    try {
      setLoading(true);
      setError(null);

      // Search for Hofstra University if we don't have the ID yet
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

      // Search for professors at Hofstra
      const results = await searchProfessorsAtSchoolId(query, schoolId);

      if (!results || results.length === 0) {
        setError(query ? 'No professors found matching your search' : 'No professors found');
        setLoading(false);
        return;
      }

      // If no query, get 5 random professors, otherwise show all results
      const selectedProfessors = query ? results : results.sort(() => 0.5 - Math.random()).slice(0, 5);

      // Map to our Professor interface
      const professorDetails = selectedProfessors.map((prof: any) => {
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

      setProfessors(professorDetails);
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
    if (rating >= 4.0) return '#4CAF50'; // Green
    if (rating >= 3.0) return '#FFA726'; // Orange
    return '#EF5350'; // Red
  };

  const borderColor = isDark ? '#2C2C2E' : '#E5E5EA';
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <ThemedText style={styles.title}>Professor Ratings</ThemedText>
        <ThemedText style={styles.subtitle}>Hofstra University</ThemedText>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
          <TextInput
            style={[
              styles.searchInput,
              { color: isDark ? '#FFFFFF' : '#000000' }
            ]}
            placeholder="Search professors by name..."
            placeholderTextColor={isDark ? '#8E8E93' : '#8E8E93'}
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
          <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
            <ThemedText style={styles.searchButtonText}>Search</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#007AFF" />
          <ThemedText style={styles.loadingText}>Loading professors...</ThemedText>
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity onPress={handleClearSearch} style={styles.retryButton}>
            <ThemedText style={styles.retryButtonText}>Show Random Professors</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {professors.map((prof) => (
            <View
              key={prof.id}
              style={[
                styles.professorCard,
                { backgroundColor: cardBg, borderColor: borderColor }
              ]}
            >
              <View style={styles.cardHeader}>
                <ThemedText style={styles.professorName}>
                  {prof.firstName} {prof.lastName}
                </ThemedText>
                <View
                  style={[
                    styles.ratingBadge,
                    { backgroundColor: getRatingColor(prof.avgRating) }
                  ]}
                >
                  <ThemedText style={styles.ratingText}>
                    {prof.avgRating.toFixed(1)}
                  </ThemedText>
                </View>
              </View>

              <ThemedText style={styles.department}>{prof.department}</ThemedText>

              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <ThemedText style={styles.statLabel}>Difficulty</ThemedText>
                  <ThemedText style={styles.statValue}>
                    {prof.avgDifficulty.toFixed(1)}/5
                  </ThemedText>
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
          ))}
        </ScrollView>
      )}
    </ThemedView>
  );
}

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
  subtitle: {
    fontSize: 16,
    marginTop: 4,
    marginBottom: 12,
    opacity: 0.7,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
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
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    padding: 16,
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
    color: '#EF5350',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  professorCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  professorName: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  ratingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
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
});
