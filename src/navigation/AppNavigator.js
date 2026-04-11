import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import HomeScreen from '../screens/HomeScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import ProjectDetailScreen from '../screens/ProjectDetailScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Cụm màn hình Home -> Detail
const HomeStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
      {/* KHAI BÁO THÊM DÒNG NÀY */}
      <Stack.Screen name="AddExpense" component={AddExpenseScreen} /> 
    </Stack.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <NavigationContainer>
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
        {/* Đưa Stack vào Tab Projects */}
        <Tab.Screen name="Projects" component={HomeStackNavigator} />
        <Tab.Screen name="Favorites" component={FavoritesScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;