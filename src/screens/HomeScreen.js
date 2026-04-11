import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ref, onValue } from 'firebase/database';
import { db } from '../api/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const HomeScreen = ({ navigation }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState([]); // State lưu danh sách ID yêu thích

  // Load danh sách thả tim từ bộ nhớ máy mỗi khi màn hình được Focus
  useFocusEffect(
    useCallback(() => {
      const loadFavorites = async () => {
        try {
          const storedFavs = await AsyncStorage.getItem('favorites');
          if (storedFavs) {
            setFavorites(JSON.parse(storedFavs));
          }
        } catch (error) {
          console.error("Error loading favorites", error);
        }
      };
      loadFavorites();
    }, [])
  );

  useEffect(() => {
    const projectsRef = ref(db, 'projects');
    const unsubscribe = onValue(projectsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const formattedData = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setProjects(formattedData.reverse());
      } else {
        setProjects([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const totalBudget = projects.reduce((sum, proj) => sum + (proj.budget || 0), 0);

  const filteredProjects = projects.filter(project => {
    const query = searchQuery.toLowerCase();
    const matchName = project.name && project.name.toLowerCase().includes(query);
    const matchStartDate = project.startDate && project.startDate.includes(query);
    const matchEndDate = project.endDate && project.endDate.includes(query);
    return matchName || matchStartDate || matchEndDate;
  });

  // Hàm xử lý Thả tim / Bỏ tim
  const toggleFavorite = async (projectId) => {
    let newFavorites = [...favorites];
    if (newFavorites.includes(projectId)) {
      newFavorites = newFavorites.filter(id => id !== projectId); // Bỏ tim
    } else {
      newFavorites.push(projectId); // Thả tim
    }
    setFavorites(newFavorites);
    await AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

  const renderProjectCard = ({ item }) => {
    const isFav = favorites.includes(item.id);

    return (
      <TouchableOpacity 
        style={styles.projectCard}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('ProjectDetail', { project: item })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.status}</Text>
          </View>
          {/* NÚT TIM TỰ ĐỘNG ĐỔI MÀU */}
          <TouchableOpacity onPress={() => toggleFavorite(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Icon name={isFav ? "favorite" : "favorite-border"} size={24} color={isFav ? "#EF4444" : "#94A3B8"} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.projectTitle} numberOfLines={1}>{item.name}</Text>
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
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>Architect Ledger</Text>
        <View style={styles.titleGroup}>
          <Text style={styles.welcome}>WELCOME BACK</Text>
          <Text style={styles.title}>Your Portfolio</Text>
        </View>

        <View style={styles.searchContainer}>
          <Icon name="search" size={24} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or date..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.cardLabel}>TOTAL ACTIVE BUDGET</Text>
        <Text style={styles.cardAmount}>${totalBudget.toLocaleString()}</Text>
      </View>

      <Text style={styles.sectionTitle}>Active Projects</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#0284C7" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredProjects}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderProjectCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No matching projects found.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

// ... (GIỮ NGUYÊN TOÀN BỘ PHẦN STYLES Ở ĐÂY BẠN NHÉ)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 50 : 30 },
  header: { marginBottom: 16 },
  appName: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginBottom: 20 },
  titleGroup: { marginBottom: 16 },
  welcome: { fontSize: 12, color: '#64748B', fontWeight: 'bold', letterSpacing: 1 },
  title: { fontSize: 28, color: '#0F172A', fontWeight: 'bold' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 12, height: 50, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A' },
  summaryCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, marginBottom: 24 },
  cardLabel: { fontSize: 12, color: '#64748B', fontWeight: 'bold', marginBottom: 8 },
  cardAmount: { fontSize: 32, color: '#0284C7', fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A', marginBottom: 16 },
  projectCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badge: { backgroundColor: '#E0F2FE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: '#0284C7', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  projectTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A', marginBottom: 4 },
  projectManager: { fontSize: 14, color: '#64748B', marginBottom: 16 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  budgetLabel: { fontSize: 10, color: '#94A3B8', fontWeight: 'bold', marginBottom: 4 },
  budgetAmount: { fontSize: 18, color: '#0F172A', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: 40 }
});

export default HomeScreen;