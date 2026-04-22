import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ref, get } from 'firebase/database';
import { db } from '../api/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const FavoritesScreen = ({ navigation }) => {
  const [favoriteProjects, setFavoriteProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, []),
  );

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const storedFavs = await AsyncStorage.getItem('favorites');
      const favIds = storedFavs ? JSON.parse(storedFavs) : [];

      if (favIds.length === 0) {
        setFavoriteProjects([]);
        setLoading(false);
        return;
      }

      const snapshot = await get(ref(db, 'projects'));
      const data = snapshot.val();

      if (data) {
        const allProjects = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
        }));

        const filtered = allProjects.filter(proj => favIds.includes(proj.id));
        setFavoriteProjects(filtered.reverse());
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const removeFavorite = async projectId => {
    try {
      const storedFavs = await AsyncStorage.getItem('favorites');
      let favIds = storedFavs ? JSON.parse(storedFavs) : [];

      favIds = favIds.filter(id => id !== projectId);
      await AsyncStorage.setItem('favorites', JSON.stringify(favIds));

      fetchFavorites();
    } catch (error) {
      console.error(error);
    }
  };

  const renderProjectCard = ({ item }) => (
    <TouchableOpacity
      style={styles.projectCard}
      activeOpacity={0.7}
      onPress={() =>
        navigation.navigate('Projects', {
          screen: 'ProjectDetail',
          params: { project: item },
        })
      }
    >
      <View style={styles.cardHeader}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
        <TouchableOpacity
          onPress={() => removeFavorite(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="favorite" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <Text style={styles.projectTitle} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.projectManager}>Manager: {item.manager}</Text>

      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.budgetLabel}>CURRENT BUDGET</Text>
          <Text style={styles.budgetAmount}>
            ${item.budget ? item.budget.toLocaleString() : '0'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>Architect Ledger</Text>
        <View style={styles.titleGroup}>
          <Text style={styles.title}>Your Favorites</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#0284C7"
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={favoriteProjects}
          keyExtractor={item => item.id.toString()}
          renderItem={renderProjectCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="favorite-border" size={60} color="#CBD5E1" />
              <Text style={styles.emptyText}>No favorite projects yet.</Text>
              <Text style={styles.emptySubText}>
                Tap the heart icon on any project to add it here.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  header: { marginBottom: 16 },
  appName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 20,
  },
  titleGroup: { marginBottom: 24 },
  title: { fontSize: 28, color: '#0F172A', fontWeight: 'bold' },

  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#0284C7',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  projectManager: { fontSize: 14, color: '#64748B', marginBottom: 16 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  budgetLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  budgetAmount: { fontSize: 18, color: '#0F172A', fontWeight: 'bold' },

  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#64748B',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default FavoritesScreen;
