import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, db } from '../api/firebaseConfig';
import Icon from 'react-native-vector-icons/MaterialIcons';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Kiểm tra Role và isActive
      const userSnap = await get(ref(db, `users/${uid}`));
      if (userSnap.exists()) {
        const userData = userSnap.val();
        
        if (userData.role !== 'staff') {
          await signOut(auth);
          Alert.alert('Access Denied', 'This app is for Staff only.');
        } else if (!userData.isActive) {
          await signOut(auth);
          Alert.alert('Account Disabled', 'Your account has been deactivated by the Administrator.');
        }
        // Nếu hợp lệ, AppNavigator sẽ tự động chuyển trang
      } else {
        await signOut(auth);
        Alert.alert('Error', 'User profile not found in database.');
      }
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Login to Staff Workspace</Text>

        <View style={styles.inputContainer}>
          <Icon name="email" size={20} color="#94A3B8" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#94A3B8"
          />
        </View>

        <View style={styles.inputContainer}>
          <Icon name="lock" size={20} color="#94A3B8" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#94A3B8"
          />
        </View>

        <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>LOGIN</Text>}
        </TouchableOpacity>

        <View style={styles.linkContainer}>
          <Text style={{ color: '#64748B' }}>New Staff? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>Register here</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#0F172A', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#64748B', marginBottom: 40 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 16, height: 55, marginBottom: 16 },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#0F172A' },
  btn: { backgroundColor: '#0284C7', height: 55, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, elevation: 3 },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  linkContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  link: { color: '#0284C7', fontWeight: 'bold' }
});

export default LoginScreen;