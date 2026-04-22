import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, db } from '../api/firebaseConfig';

import HomeScreen from '../screens/HomeScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import ProjectDetailScreen from '../screens/ProjectDetailScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack dành cho người chưa đăng nhập
const AuthStackNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

// Stack chính sau khi đã đăng nhập
const HomeStackNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain" component={HomeScreen} />
    <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
    <Stack.Screen name="AddExpense" component={AddExpenseScreen} /> 
  </Stack.Navigator>
);

const AppNavigator = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Lấy thông tin user từ DB
        const userSnap = await get(ref(db, `users/${firebaseUser.uid}`));
        if (userSnap.exists() && userSnap.val().role === 'staff' && userSnap.val().isActive) {
          const userData = { uid: firebaseUser.uid, ...userSnap.val() };
          await AsyncStorage.setItem('currentUser', JSON.stringify(userData));
          setUser(userData);
        } else {
          // Bị vô hiệu hóa hoặc không phải staff thì ép logout
          auth.signOut();
          await AsyncStorage.removeItem('currentUser');
          setUser(null);
        }
      } else {
        await AsyncStorage.removeItem('currentUser');
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#0284C7" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ color, size }) => {
              let iconName = route.name === 'Projects' ? 'folder' : 'favorite';
              return <Icon name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#0284C7',
            tabBarInactiveTintColor: '#94A3B8',
            tabBarStyle: {
              backgroundColor: '#FFFFFF',
              borderTopWidth: 0,
              elevation: 10,
              height: 65,
              paddingBottom: 10,
              paddingTop: 10,
            },
          })}
        >
          <Tab.Screen name="Projects" component={HomeStackNavigator} />
          <Tab.Screen name="Favorites" component={FavoritesScreen} />
        </Tab.Navigator>
      ) : (
        <AuthStackNavigator />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;