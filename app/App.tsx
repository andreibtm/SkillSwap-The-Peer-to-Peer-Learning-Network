import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useEffect, useState } from 'react';
import { View, Text, Image, LogBox } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

// Global suppression of known non-critical warnings
LogBox.ignoreLogs([
  'Text strings must be rendered',
  'VirtualizedLists should never be nested',
]);
import LoginScreen from './src/screens/login.screen';
import SignupScreen from './src/screens/signup.screen';
import NewUserScreen from './src/screens/newuser.screen';
import SwiperScreen from './src/screens/swiper.screen';
import ProfileScreen from './src/screens/profile.screen';
import SettingsScreen from './src/screens/settings.screen';
import ChatsScreen from './src/screens/chats.screen';
import SavedScreen from './src/screens/saved.screen';
import SearchScreen from './src/screens/search.screen';
import NotificationsScreen from './src/screens/notifications.screen';
import ChatDetailScreen from './src/screens/chatdetail.screen';
import RateScreen from './src/screens/rate.screen';
import EditProfileScreen from './src/screens/editprofile.screen';
import AccountScreen from './src/screens/account.screen';
import PrivacyScreen from './src/screens/privacy.screen';
import DataPermsScreen from './src/screens/data.perms.screen';
import UserProfileScreen from './src/screens/userprofile.screen';
import { auth, db } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import './global.css';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
          borderTopColor: '#2a2a2a',
          borderTopWidth: 1,
          height: 85,
          paddingBottom: 15,
          paddingTop: 15,
        },
        tabBarActiveTintColor: '#e04429',
        tabBarInactiveTintColor: '#666',
        tabBarShowLabel: false,
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === 'Swiper') {
            return (
              <Image 
                source={focused ? require('./src/images/logo.png') : require('./src/images/logo-unfocused.png')} 
                style={{ width: focused ? 32 : 28, height: focused ? 32 : 28 }}
                resizeMode="contain"
              />
            );
          }

          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Saved') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Chats') {
            iconName = focused ? 'chatbox' : 'chatbox-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          if (focused) {
            return (
              <MaskedView
                maskElement={<Ionicons name={iconName} size={28} color="white" />}
              >
                <LinearGradient
                  colors={['#f7ba2b', '#eb822d', '#dc2e2e']}
                  style={{ width: 28, height: 28 }}
                />
              </MaskedView>
            );
          }

          return <Ionicons name={iconName} size={28} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Swiper" component={SwiperScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Saved" component={SavedScreen} />
      <Tab.Screen name="Chats" component={ChatsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is logged in, check if they have a profile
        try {
          const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
          if (profileDoc.exists()) {
            setInitialRoute('MainTabs');
          } else {
            setInitialRoute('NewUser');
          }
        } catch (error) {
          setInitialRoute('NewUser');
        }
      } else {
        // No user logged in
        setInitialRoute('Login');
      }
    });

    return unsubscribe;
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'white', fontSize: 18 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="NewUser" component={NewUserScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="Account" component={AccountScreen} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} />
        <Stack.Screen name="DataPerms" component={DataPermsScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
        <Stack.Screen name="Rate" component={RateScreen} />
        <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      </Stack.Navigator>
      <StatusBar style="light" />
    </NavigationContainer>
  );
}
