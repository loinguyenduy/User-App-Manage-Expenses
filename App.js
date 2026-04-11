import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { enableScreens } from 'react-native-screens';

enableScreens();

const App = () => {
  return <AppNavigator />;
};

export default App;