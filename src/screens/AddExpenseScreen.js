import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { ref, set } from 'firebase/database';
import { db } from '../api/firebaseConfig';

const AddExpenseScreen = ({ route, navigation }) => {
  const { project } = route.params;

  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [claimant, setClaimant] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('Travel');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const [dateObj, setDateObj] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const formattedDate = dateObj.toISOString().split('T')[0];

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setDateObj(selectedDate);
  };

  const handleSaveExpense = async () => {
    if (!amount || !claimant) {
      Alert.alert('Missing Fields', 'Please fill in Amount and Claimant (*)');
      return;
    }

    setLoading(true);
    try {
      const expenseId = new Date().getTime();
      const newExpense = {
        id: expenseId,
        projectId: project.id,
        projectName: project.name,
        amount: parseFloat(amount),
        currency: currency,
        date: formattedDate,
        type: type,
        paymentMethod: paymentMethod,
        paymentStatus: 'Pending', // Luôn gán mặc định là Pending
        claimant: claimant,
        description: description,
        location: location,
        isSynced: 1,
      };

      await set(ref(db, 'expenses/' + expenseId), newExpense);

      setLoading(false);
      Alert.alert('Success', 'Expense saved to Cloud!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Could not save expense: ' + error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Icon name="close" size={28} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Expense</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.projectContext}>
          Project: <Text style={styles.bold}>{project.name}</Text>
        </Text>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 2, marginRight: 10 }]}>
            <Text style={styles.label}>Amount *</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Currency</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={currency}
                onValueChange={setCurrency}
                style={styles.picker}
              >
                <Picker.Item label="USD" value="USD" />
                <Picker.Item label="VND" value="VND" />
                <Picker.Item label="EUR" value="EUR" />
              </Picker>
            </View>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date of Expense *</Text>
          <TouchableOpacity
            style={styles.dateBtn}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>{formattedDate}</Text>
            <Icon name="calendar-today" size={20} color="#64748B" />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={dateObj}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Type of Expense *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={type}
              onValueChange={setType}
              style={styles.picker}
            >
              <Picker.Item label="Travel" value="Travel" />
              <Picker.Item label="Equipment" value="Equipment" />
              <Picker.Item label="Materials" value="Materials" />
              <Picker.Item label="Services" value="Services" />
              <Picker.Item
                label="Software/Licenses"
                value="Software/Licenses"
              />
              <Picker.Item label="Labour costs" value="Labour costs" />
              <Picker.Item label="Utilities" value="Utilities" />
              <Picker.Item label="Miscellaneous" value="Miscellaneous" />
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Payment Method *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={paymentMethod}
              onValueChange={setPaymentMethod}
              style={styles.picker}
            >
              <Picker.Item label="Cash" value="Cash" />
              <Picker.Item label="Credit Card" value="Credit Card" />
              <Picker.Item label="Bank Transfer" value="Bank Transfer" />
              <Picker.Item label="Cheque" value="Cheque" />
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Claimant Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Who is claiming this?"
            value={claimant}
            onChangeText={setClaimant}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Hanoi Office"
            value={location}
            onChangeText={setLocation}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Additional notes..."
            multiline={true}
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
          />
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSaveExpense}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.btnText}>SAVE TO CLOUD</Text>
          )}
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
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  projectContext: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 24,
    textAlign: 'center',
  },
  bold: { fontWeight: 'bold', color: '#0284C7' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  inputGroup: { marginBottom: 20 },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 16,
    color: '#0F172A',
  },
  textArea: { height: 100, textAlignVertical: 'top', paddingTop: 12 },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
  },
  picker: { height: 50, width: '100%', color: '#0F172A' },
  dateBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
  },
  dateText: { fontSize: 16, color: '#0F172A' },

  // Style cho ô input bị khóa
  disabledInput: {
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
  },
  disabledText: { color: '#64748B', fontWeight: 'bold' },

  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
  },
  saveBtn: {
    backgroundColor: '#0284C7',
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

export default AddExpenseScreen;
