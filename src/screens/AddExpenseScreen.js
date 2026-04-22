import React, { useState, useEffect } from 'react';
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
import { ref, set, update, remove } from 'firebase/database';
import { db } from '../api/firebaseConfig';
import GetLocation from 'react-native-get-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AddExpenseScreen = ({ route, navigation }) => {
  const { project, expenseToEdit } = route.params;

  const isProjectCompleted = project.status.toLowerCase() === 'completed';
  const isEditMode = !!expenseToEdit;
  const expenseStatus = expenseToEdit?.status
    ? expenseToEdit.status.trim().toLowerCase()
    : '';

  const isEditable = (!isEditMode || expenseStatus === 'pending') && !isProjectCompleted;

  const [amount, setAmount] = useState(
    isEditMode ? expenseToEdit.amount.toString() : '',
  );
  const [currency, setCurrency] = useState(
    isEditMode ? expenseToEdit.currency : 'USD',
  );
  const [claimant, setClaimant] = useState(
    isEditMode ? expenseToEdit.claimant : '',
  );
  const [description, setDescription] = useState(
    isEditMode ? expenseToEdit.description || '' : '',
  );
  const [location, setLocation] = useState(
    isEditMode ? expenseToEdit.location || '' : '',
  );
  const [type, setType] = useState(isEditMode ? expenseToEdit.type : 'Travel');
  const [paymentMethod, setPaymentMethod] = useState(
    isEditMode ? expenseToEdit.paymentMethod : 'Cash',
  );

  let initialDate = new Date();
  if (isEditMode && expenseToEdit.date) {
    const parts = expenseToEdit.date.split('-');
    if (parts.length === 3)
      initialDate = new Date(parts[0], parts[1] - 1, parts[2]);
  }
  const [dateObj, setDateObj] = useState(initialDate);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [loading, setLoading] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // AUTO-FILL CLAIMANT NAME
  useEffect(() => {
    if (!isEditMode) {
      AsyncStorage.getItem('currentUser').then(userStr => {
        if (userStr) {
          const user = JSON.parse(userStr);
          setClaimant(user.fullName);
        }
      }).catch(err => console.error(err));
    }
  }, [isEditMode]);

  const formatNumber = num => (num < 10 ? `0${num}` : num);
  const formattedDate = `${dateObj.getFullYear()}-${formatNumber(
    dateObj.getMonth() + 1,
  )}-${formatNumber(dateObj.getDate())}`;

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setDateObj(selectedDate);
  };

  const handleDetectLocation = async () => {
    if (!isEditable) return;
    setIsDetectingLocation(true);
    try {
      const position = await GetLocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
      });
      const { latitude, longitude } = position;
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        );
        const data = await response.json();
        setLocation(
          data && data.display_name
            ? data.display_name
            : `${latitude}, ${longitude}`,
        );
      } catch (apiError) {
        setLocation(`${latitude}, ${longitude}`);
      }
    } catch (error) {
      Alert.alert(
        'GPS Error',
        'Please ensure Location Services are enabled on your device.',
      );
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleSaveExpense = async () => {
    if (!amount || !claimant) {
      Alert.alert('Missing Fields', 'Please fill in Amount(*) and Claimant(*)');
      return;
    }

    setLoading(true);
    try {
      const expenseKey = isEditMode
        ? expenseToEdit.firebaseKey || expenseToEdit.id
        : new Date().getTime().toString();

      const expenseData = {
        id: isEditMode ? expenseToEdit.id : expenseKey, 
        projectId: project.id,
        projectName: project.name,
        amount: parseFloat(amount),
        currency: currency,
        date: formattedDate,
        type: type,
        paymentMethod: paymentMethod,
        status: isEditMode ? expenseToEdit.status : 'Pending',
        claimant: claimant,
        description: description,
        location: location,
        isSynced: 1,
      };

      if (isEditMode) {
        await update(ref(db, `expenses/${expenseKey}`), expenseData);
        setLoading(false); 
        Alert.alert('Success', 'Expense updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await set(ref(db, `expenses/${expenseKey}`), expenseData);
        setLoading(false); 
        Alert.alert('Success', 'Expense saved to Cloud!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Could not save expense: ' + error.message);
    }
  };

  const executeDelete = async () => {
    setLoading(true);
    try {
      const expenseKey = expenseToEdit.firebaseKey || expenseToEdit.id;
      await remove(ref(db, `expenses/${expenseKey}`));

      setLoading(false);
      Alert.alert('Deleted', 'Expense has been removed.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Could not delete: ' + error.message);
    }
  };

  const handleDeleteExpense = () => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this pending expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: executeDelete },
      ],
    );
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

        <Text style={styles.headerTitle}>
          {!isEditMode
            ? 'New Expense'
            : isEditable
            ? 'Edit Expense'
            : 'Expense Details'}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.projectContext}>
          Project: <Text style={styles.bold}>{project.name}</Text>
        </Text>

        {!isEditable && isEditMode && (
          <View style={styles.lockedWarning}>
            <Icon
              name="lock"
              size={16}
              color="#B45309"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.lockedText}>
              {isProjectCompleted ? `This project is Completed. Access denied.` : `This expense is ${expenseToEdit.status} and cannot be modified.`}
            </Text>
          </View>
        )}

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 2, marginRight: 10 }]}>
            <Text style={styles.label}>Amount *</Text>
            <TextInput
              style={[styles.input, !isEditable && styles.inputDisabled]}
              placeholder="0.00"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              editable={isEditable}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Currency</Text>
            {isEditable ? (
              <View style={styles.pickerContainer}>
                <Picker
                  mode="dropdown"
                  selectedValue={currency}
                  onValueChange={setCurrency}
                  style={styles.picker}
                >
                  <Picker.Item label="USD" value="USD" />
                  <Picker.Item label="VND" value="VND" />
                  <Picker.Item label="EUR" value="EUR" />
                </Picker>
              </View>
            ) : (
              <View style={[styles.pickerContainer, styles.inputDisabled]}>
                <Text style={styles.disabledText}>{currency}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date of Expense *</Text>
          {isEditable ? (
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>{formattedDate}</Text>
              <Icon name="calendar-today" size={20} color="#64748B" />
            </TouchableOpacity>
          ) : (
            <View style={[styles.dateBtn, styles.inputDisabled]}>
              <Text style={styles.disabledText}>{formattedDate}</Text>
              <Icon name="calendar-today" size={20} color="#64748B" />
            </View>
          )}
          {showDatePicker && isEditable && (
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
          {isEditable ? (
            <View style={styles.pickerContainer}>
              <Picker
                mode="dropdown"
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
          ) : (
            <View style={[styles.pickerContainer, styles.inputDisabled]}>
              <Text style={styles.disabledText}>{type}</Text>
            </View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Payment Method *</Text>
          {isEditable ? (
            <View style={styles.pickerContainer}>
              <Picker
                mode="dropdown"
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
          ) : (
            <View style={[styles.pickerContainer, styles.inputDisabled]}>
              <Text style={styles.disabledText}>{paymentMethod}</Text>
            </View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Claimant Name *</Text>
          <TextInput
            style={[styles.input, !isEditable && styles.inputDisabled]}
            placeholder="Who is claiming this?"
            value={claimant}
            onChangeText={setClaimant}
            editable={isEditable}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location (Optional)</Text>
          <View
            style={[
              styles.locationInputContainer,
              !isEditable && styles.inputDisabled,
            ]}
          >
            <TextInput
              style={[
                styles.locationInput,
                !isEditable && styles.inputDisabled,
              ]}
              placeholder="e.g. Hanoi Office"
              value={location}
              onChangeText={setLocation}
              editable={isEditable}
            />
            <TouchableOpacity
              onPress={handleDetectLocation}
              style={styles.locationIconBtn}
              disabled={!isEditable}
            >
              {isDetectingLocation ? (
                <ActivityIndicator size="small" color="#0284C7" />
              ) : (
                <Icon
                  name="my-location"
                  size={24}
                  color={isEditable ? '#0284C7' : '#94A3B8'}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              !isEditable && styles.inputDisabled,
            ]}
            placeholder="Additional notes..."
            multiline={true}
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
            editable={isEditable}
          />
        </View>
      </ScrollView>

      {isEditable && (
        <View style={styles.bottomContainer}>
          {isEditMode && (
            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: '#EF4444', marginBottom: 12 },
              ]}
              onPress={handleDeleteExpense}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.btnText}>DELETE EXPENSE</Text>
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSaveExpense}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.btnText}>
                {isEditMode ? 'UPDATE EXPENSE' : 'SAVE TO CLOUD'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
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
  scrollContent: { padding: 20, paddingBottom: 180 },
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
  inputDisabled: { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' },
  disabledText: { fontSize: 16, color: '#64748B', paddingHorizontal: 16 },
  lockedWarning: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  lockedText: { color: '#B45309', fontSize: 12, fontWeight: 'bold', flex: 1 },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 50,
  },
  locationInput: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#0F172A',
  },
  locationIconBtn: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
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
    paddingHorizontal: 0,
    height: 50,
  },
  dateText: { fontSize: 16, color: '#0F172A', paddingHorizontal: 16 },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#F8FAFC',
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