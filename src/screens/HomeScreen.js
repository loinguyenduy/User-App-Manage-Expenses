import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ref, onValue } from 'firebase/database';
import { db } from '../api/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const HomeScreen = ({ navigation }) => {
  const [projects, setProjects] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0); // STATE MỚI ĐỂ LƯU TỔNG CHI TIÊU
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState([]); 

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
    // 1. KÉO DỮ LIỆU PROJECTS
    const projectsRef = ref(db, 'projects');
    const unsubscribeProjects = onValue(projectsRef, (snapshot) => {
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

    // 2. KÉO DỮ LIỆU EXPENSES ĐỂ TÍNH TỔNG CHI TIÊU
    const expensesRef = ref(db, 'expenses');
    const unsubscribeExpenses = onValue(expensesRef, (snapshot) => {
      let sum = 0;
      const data = snapshot.val();
      if (data) {
        Object.values(data).forEach(exp => {
          // Chỉ cộng những khoản hợp lệ (giống logic Admin)
          if (exp.status === 'Paid' || exp.status === 'Pending' || exp.status === 'Reimbursed') {
            sum += (exp.amount || 0);
          }
        });
      }
      setTotalSpent(sum);
    });

    return () => {
      unsubscribeProjects();
      unsubscribeExpenses();
    };
  }, []);

  const totalBudget = projects.reduce((sum, proj) => sum + (proj.budget || 0), 0);

  const filteredProjects = projects.filter(project => {
    const query = searchQuery.toLowerCase();
    const matchName = project.name && project.name.toLowerCase().includes(query);
    const matchStartDate = project.startDate && project.startDate.includes(query);
    const matchEndDate = project.endDate && project.endDate.includes(query);
    return matchName || matchStartDate || matchEndDate;
  });

  const toggleFavorite = async (projectId) => {
    let newFavorites = [...favorites];
    if (newFavorites.includes(projectId)) {
      newFavorites = newFavorites.filter(id => id !== projectId); 
    } else {
      newFavorites.push(projectId); 
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

      {/* THẺ TỔNG KẾT ĐƯỢC CHIA LÀM 2 CỘT */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryColumn}>
          <Text style={styles.cardLabel}>TOTAL BUDGET</Text>
          <Text style={styles.cardAmount}>${totalBudget.toLocaleString()}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryColumn}>
          <Text style={styles.cardLabel}>TOTAL SPENT</Text>
          {/* Dùng màu Cam/Đỏ cho số tiền đã tiêu */}
          <Text style={[styles.cardAmount, { color: '#F59E0B' }]}>${totalSpent.toLocaleString()}</Text>
        </View>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 50 : 30 },
  header: { marginBottom: 16 },
  appName: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginBottom: 30 },
  titleGroup: { marginBottom: 16 },
  welcome: { fontSize: 12, color: '#64748B', fontWeight: 'bold', letterSpacing: 1 },
  title: { fontSize: 28, color: '#0F172A', fontWeight: 'bold' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 12, height: 50, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A' },
  
  // CẬP NHẬT STYLE CHO SUMMARY CARD
  summaryCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, marginBottom: 24 },
  summaryColumn: { flex: 1 },
  summaryDivider: { width: 1, backgroundColor: '#E2E8F0', marginHorizontal: 15 },
  
  cardLabel: { fontSize: 10, color: '#64748B', fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase' },
  cardAmount: { fontSize: 22, color: '#0284C7', fontWeight: 'bold' }, // Chữ nhỏ lại một chút để vừa 2 cột
  
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