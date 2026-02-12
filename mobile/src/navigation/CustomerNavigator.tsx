import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MenuScreen from '../screens/customer/MenuScreen';
import CartScreen from '../screens/customer/CartScreen';
import OrderTrackingScreen from '../screens/customer/OrderTrackingScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();
const MenuStack = createNativeStackNavigator();

function MenuStackNavigator() {
  return (
    <MenuStack.Navigator>
      <MenuStack.Screen name="MenuBrowse" component={MenuScreen} options={{ title: 'Menu' }} />
      <MenuStack.Screen name="Cart" component={CartScreen} options={{ title: 'My Cart' }} />
    </MenuStack.Navigator>
  );
}

export default function CustomerNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray[400],
      }}
    >
      <Tab.Screen name="Menu" component={MenuStackNavigator} options={{ headerShown: false, title: 'Menu' }} />
      <Tab.Screen name="TrackOrder" component={OrderTrackingScreen} options={{ title: 'Track Order' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
