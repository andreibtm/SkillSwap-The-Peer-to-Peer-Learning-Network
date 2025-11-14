import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LogInScreen } from './src/screens/login.screen';
import { SignUpScreen } from './src/screens/signup.screen';
import { ProfileScreen } from './src/screens/profile.screen';

export default function App() {

  const Tabs = createBottomTabNavigator();
  const Stack = createNativeStackNavigator();



  return (
    <NavigationContainer>
      <Tabs.Navigator>
        <Tabs.Screen name='LogIn' component={LogInScreen}/>
        <Tabs.Screen name='SignUp' component={SignUpScreen}/>
        <Tabs.Screen name='Profile' component={ProfileScreen}/>
      </Tabs.Navigator>
    </NavigationContainer>
  );
}


