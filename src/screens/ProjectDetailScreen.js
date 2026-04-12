import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ref, query, orderByChild, equalTo, onValue } from 'firebase/database';
import { db } from '../api/firebaseConfig';

const ProjectDetailScreen = ({ route, navigation }) => {
  const { project } = route.params;

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Kéo danh sách Expense dựa trên projectId
  useEffect(() => {
    // Tạo truy vấn: TÌM TRONG BẢNG expenses NƠI CÓ projectId BẰNG VỚI id CỦA DỰ ÁN NÀY
    const expensesRef = query(
      ref(db, 'expenses'),
      orderByChild('projectId'),
      equalTo(project.id),
    );

    const unsubscribe = onValue(expensesRef, snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const formattedData = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
        }));
        setExpenses(formattedData.reverse()); // Mới nhất lên đầu
      } else {
        setExpenses([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [project.id]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Icon name="arrow-back" size={28} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Project Details</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* THẺ THÔNG TIN DỰ ÁN */}
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <Text style={styles.projectName}>{project.name}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{project.status}</Text>
            </View>
          </View>
          <Text style={styles.projectCode}>Code: {project.projectCode}</Text>

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.detailText}>
            <Text style={styles.bold}>Manager:</Text> {project.manager}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.bold}>Description:</Text> {project.description}
          </Text>

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Financial</Text>
          <Text style={styles.detailText}>
            <Text style={styles.bold}>Budget:</Text> $
            {project.budget ? project.budget.toLocaleString() : '0'}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.bold}>Timeline:</Text> {project.startDate} to{' '}
            {project.endDate}
          </Text>
        </View>

        {/* DANH SÁCH CHI PHÍ (EXPENSES) */}
        <Text style={styles.listTitle}>Recorded Expenses</Text>

        {loading ? (
          <ActivityIndicator
            size="small"
            color="#0284C7"
            style={{ marginTop: 20 }}
          />
        ) : expenses.length === 0 ? (
          <Text style={styles.emptyText}>No expenses recorded yet.</Text>
        ) : (
          expenses.map(item => (
            <View key={item.id} style={styles.expenseItem}>
              <View style={styles.expenseLeft}>
                <Text style={styles.expenseType}>{item.type}</Text>
                <Text style={styles.expenseDate}>
                  {item.date} • {item.claimant}
                </Text>
              </View>
              <View style={styles.expenseRight}>
                <Text style={styles.expenseAmount}>
                  ${item.amount.toLocaleString()}
                </Text>
                <Text
                  style={[
                    styles.statusText,
                    item.status === 'Paid'
                      ? styles.statusPaid
                      : item.status === 'Reimbursed'
                      ? styles.statusReimbursed
                      : styles.statusPending,
                  ]}
                >
                  {item.status}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.addExpenseBtn}
          onPress={() =>
            navigation.navigate('AddExpense', { project: project })
          }
        >
          <Icon
            name="add-receipt"
            size={20}
            color="#FFFFFF"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.btnText}>ADD EXPENSE</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    paddingTop: Platform.OS === 'android' ? 50 : 30,
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  scrollContent: { padding: 20, paddingBottom: 100 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  projectName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
    flex: 1,
    marginRight: 10,
  },
  badge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#0284C7',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  projectCode: { fontSize: 14, color: '#64748B', marginBottom: 16 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 6,
    lineHeight: 20,
  },
  bold: { fontWeight: 'bold', color: '#0F172A' },

  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#94A3B8',
    marginTop: 10,
    fontStyle: 'italic',
  },

  expenseItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  expenseLeft: { flex: 1 },
  expenseType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  expenseDate: { fontSize: 12, color: '#64748B' },
  expenseRight: { alignItems: 'flex-end' },
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0284C7',
    marginBottom: 4,
  },

  statusText: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  statusPending: { color: '#F59E0B' }, // Màu vàng cam
  statusPaid: { color: '#10B981' }, // Màu xanh lá
  statusReimbursed: { color: '#8B5CF6' }, // Màu tím

  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  addExpenseBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default ProjectDetailScreen;
