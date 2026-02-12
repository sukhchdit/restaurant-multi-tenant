import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/staff/DashboardScreen';
import OrderListScreen from '../screens/staff/OrderListScreen';
import OrderDetailScreen from '../screens/staff/OrderDetailScreen';
import KitchenScreen from '../screens/staff/KitchenScreen';
import TableMapScreen from '../screens/staff/TableMapScreen';
import NotificationsScreen from '../screens/staff/NotificationsScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();
const OrderStack = createNativeStackNavigator();

function OrderStackNavigator() {
  return (
    <OrderStack.Navigator>
      <OrderStack.Screen name="OrderList" component={OrderListScreen} options={{ title: 'Orders' }} />
      <OrderStack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Order Details' }} />
    </OrderStack.Navigator>
  );
}

export default function StaffNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray[400],
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Orders" component={OrderStackNavigator} options={{ headerShown: false, title: 'Orders' }} />
      <Tab.Screen name="Kitchen" component={KitchenScreen} options={{ title: 'Kitchen' }} />
      <Tab.Screen name="Tables" component={TableMapScreen} options={{ title: 'Tables' }} />
      <Tab.Screen name="Alerts" component={NotificationsScreen} options={{ title: 'Alerts' }} />
    </Tab.Navigator>
  );
}
