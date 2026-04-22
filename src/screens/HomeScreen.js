import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Platform, ScrollView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ref, onValue } from 'firebase/database';
import { auth, db } from '../api/firebaseConfig';
import { signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const HomeScreen = ({ navigation }) => {
  const [projects, setProjects] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0); 
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState([]); 
  const [selectedStatus, setSelectedStatus] = useState('All'); 
  const [currentUser, setCurrentUser] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          // Load user từ AsyncStorage
          const userStr = await AsyncStorage.getItem('currentUser');
          if (userStr) setCurrentUser(JSON.parse(userStr));

          // Load favorites
          const storedFavs = await AsyncStorage.getItem('favorites');
          if (storedFavs) setFavorites(JSON.parse(storedFavs));
        } catch (error) {
          console.error(error);
        }
      };
      loadData();
    }, [])
  );

  useEffect(() => {
    if (!currentUser) return; // Chỉ load khi đã có UID

    const projectsRef = ref(db, 'projects');
    const unsubscribeProjects = onValue(projectsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // UPDATE BẢO MẬT: Chỉ lấy những Project được assign cho user hiện tại
        const formattedData = Object.keys(data)
          .map(key => ({ id: key, ...data[key] }))
          .filter(project => project.assignedTo === currentUser.uid);

        setProjects(formattedData.reverse());
      } else {
        setProjects([]);
      }
      setLoading(false);
    });

    const expensesRef = ref(db, 'expenses');
    const unsubscribeExpenses = onValue(expensesRef, (snapshot) => {
      let sum = 0;
      const data = snapshot.val();
      if (data) {
        // Tương tự, chỉ tính tổng chi phí của những dự án user đang nắm
        const userProjectIds = projects.map(p => p.id);
        Object.values(data).forEach(exp => {
          if (userProjectIds.includes(exp.projectId) && (exp.status === 'Paid' || exp.status === 'Pending' || exp.status === 'Reimbursed')) {
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
  }, [currentUser, projects.length]); // Load lại expense khi projects có thay đổi

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => await signOut(auth) }
    ]);
  };

  const totalBudget = projects.reduce((sum, proj) => sum + (proj.budget || 0), 0);

  const filteredProjects = projects.filter(project => {
    const query = searchQuery.toLowerCase();
    const matchSearch = (project.name && project.name.toLowerCase().includes(query)) ||
                        (project.projectCode && project.projectCode.toLowerCase().includes(query));

    const matchStatus = selectedStatus === 'All' || project.status === selectedStatus;
    return matchSearch && matchStatus;
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
        <View style={styles.headerTop}>
          <Text style={styles.appName}>Architect Ledger</Text>
          <TouchableOpacity onPress={handleLogout} hitSlop={{top:10, bottom:10, left:10, right:10}}>
             <Icon name="logout" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.titleGroup}>
          <Text style={styles.welcome}>WELCOME BACK, {currentUser?.fullName?.toUpperCase() || 'STAFF'}</Text>
          <Text style={styles.title}>Your Tasks</Text>
        </View>

        <View style={styles.searchContainer}>
          <Icon name="search" size={24} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or code..."
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
        <View style={styles.summaryColumn}>
          <Text style={styles.cardLabel}>TOTAL BUDGET</Text>
          <Text style={styles.cardAmount}>${totalBudget.toLocaleString()}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryColumn}>
          <Text style={styles.cardLabel}>TOTAL SPENT</Text>
          <Text style={[styles.cardAmount, { color: '#F59E0B' }]}>${totalSpent.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
          {['All', 'Active', 'On Hold', 'Completed'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[ styles.filterChip, selectedStatus === status && styles.filterChipActive ]}
              onPress={() => setSelectedStatus(status)}
            >
              <Text style={[ styles.filterChipText, selectedStatus === status && styles.filterChipTextActive ]}>
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Text style={styles.sectionTitle}>{selectedStatus} Projects</Text>

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
            <Text style={styles.emptyText}>No assigned projects found.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 50 : 30 },
  header: { marginBottom: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  appName: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  titleGroup: { marginBottom: 16 },
  welcome: { fontSize: 12, color: '#64748B', fontWeight: 'bold', letterSpacing: 1 },
  title: { fontSize: 28, color: '#0F172A', fontWeight: 'bold' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 12, height: 50, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A' },
  summaryCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, marginBottom: 24 },
  summaryColumn: { flex: 1 },
  summaryDivider: { width: 1, backgroundColor: '#E2E8F0', marginHorizontal: 15 },
  cardLabel: { fontSize: 10, color: '#64748B', fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase' },
  cardAmount: { fontSize: 22, color: '#0284C7', fontWeight: 'bold' }, 
  filterWrapper: { marginBottom: 16, marginHorizontal: -20 }, 
  filterContainer: { paddingHorizontal: 20 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9', marginRight: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  filterChipActive: { backgroundColor: '#0284C7', borderColor: '#0284C7' },
  filterChipText: { color: '#64748B', fontWeight: 'bold', fontSize: 12 },
  filterChipTextActive: { color: '#FFFFFF' },
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