import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion, addDoc, serverTimestamp } from 'firebase/firestore';

const { width } = Dimensions.get('window');

interface Profile {
  id: string;
  fullName: string;
  bio: string;
  location: string;
  photoUri: string | null;
  skills: string[];
  level: string;
  availability: string;
}

export default function SwiperScreen() {
  const navigation = useNavigation();
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRandomProfile();
  }, []);

  const fetchRandomProfile = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      console.log('Current user:', currentUser?.uid);
      
      if (!currentUser) {
        console.log('No current user found');
        setLoading(false);
        return;
      }
      const profilesRef = collection(db, 'profiles');
      const q = query(
        profilesRef,
        where('userId', '!=', currentUser.uid)
      );

      console.log('Fetching profiles...');
      const querySnapshot = await getDocs(q);
      console.log('Query completed, found', querySnapshot.size, 'profiles');
      
      const profiles: Profile[] = [];

      querySnapshot.forEach((doc) => {
        console.log('Profile found:', doc.id, doc.data());
        profiles.push({ id: doc.id, ...doc.data() } as Profile);
      });

      if (profiles.length > 0) {
        // Get random profile
        const randomIndex = Math.floor(Math.random() * profiles.length);
        setCurrentProfile(profiles[randomIndex]);
        console.log('Set current profile to:', profiles[randomIndex].fullName);
      } else {
        console.log('No other profiles found');
        setCurrentProfile(null);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
    }
  };

  const handlePass = () => {
    // Move to next profile
    fetchRandomProfile();
  };

  const handleSuperLike = async () => {
    if (!currentProfile) return;

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      console.log('Super liked:', currentProfile.fullName);

      // Add to saved profiles array in Firestore
      const userDocRef = doc(db, 'profiles', currentUser.uid);
      await updateDoc(userDocRef, {
        savedProfiles: arrayUnion(currentProfile.id)
      });

      Alert.alert('Saved!', `${currentProfile.fullName} has been saved to your list`);
      fetchRandomProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    }
  };

  const handleLike = async () => {
    if (!currentProfile) return;

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Get current user's profile data
      const currentUserDoc = await getDoc(doc(db, 'profiles', currentUser.uid));
      const currentUserData = currentUserDoc.data();

      // Create notification for the liked user
      await addDoc(collection(db, 'notifications'), {
        recipientId: currentProfile.id,
        senderId: currentUser.uid,
        senderName: currentUserData?.fullName || 'Someone',
        senderPhoto: currentUserData?.photoUri || null,
        type: 'like',
        status: 'pending',
        createdAt: serverTimestamp()
      });

      console.log('Sent like to:', currentProfile.fullName);
      Alert.alert('Sent!', `You sent a connection request to ${currentProfile.fullName}`);
      fetchRandomProfile();
    } catch (error) {
      console.error('Error sending like:', error);
      Alert.alert('Error', 'Failed to send connection request');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-white text-lg">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentProfile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="people-outline" size={80} color="#666" />
          <Text className="text-white text-xl font-bold mt-4 mb-2">No Profiles Yet</Text>
          <Text className="text-gray-400 text-center">
            There are no other users to show right now. Check back later!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <View style={{ width: 40 }} />
        <Text className="text-orange-500 text-2xl font-bold">SkillSwap</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications' as never)}>
          <Ionicons name="notifications-outline" size={28} color="#e04429" />
        </TouchableOpacity>
      </View>

      {/* Profile Card */}
      <View className="flex-1 px-4 pb-6">
        <View 
          style={{ 
            flex: 1,
            backgroundColor: '#2a2a2a',
            borderRadius: 24,
            overflow: 'hidden'
          }}
        >
          {/* Profile Image */}
          <View className="items-center pt-6 pb-4 bg-[#2a2a2a]">
            {currentProfile.photoUri ? (
              <Image 
                source={{ uri: currentProfile.photoUri }} 
                style={{ 
                  width: 320, 
                  height: 320, 
                  borderRadius: 20 
                }}
                resizeMode="cover"
              />
            ) : (
              <View 
                style={{ 
                  width: 320, 
                  height: 320, 
                  borderRadius: 20,
                  backgroundColor: '#3a3a3a',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Ionicons name="person" size={100} color="#666" />
              </View>
            )}
          </View>

          {/* Profile Info */}
          <View className="flex-1 px-6 pb-6 bg-[#2a2a2a]">
            <Text className="text-white text-2xl font-bold mb-1">
              {currentProfile.fullName}
            </Text>
            <Text className="text-orange-500 text-base mb-4">
              {currentProfile.skills?.[0] || 'Skill Exchange'}
            </Text>

            {/* Tags */}
            <View className="flex-row mb-4">
              <View className="bg-[#5a3825] px-3 py-1 rounded-full mr-2">
                <Text className="text-orange-200 text-sm">{currentProfile.level || 'Beginner'}</Text>
              </View>
              <View className="bg-[#5a3825] px-3 py-1 rounded-full">
                <Text className="text-orange-200 text-sm">{currentProfile.availability || 'Weekends'}</Text>
              </View>
            </View>

            {/* Bio */}
            <Text className="text-orange-300 text-sm italic">
              "{currentProfile.bio || 'Ready to share knowledge and learn new skills!'}"
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row justify-center items-center mt-6 gap-6">
          {/* Pass Button */}
          <TouchableOpacity 
            onPress={handlePass}
            className="w-16 h-16 rounded-full bg-[#3a3a3a] items-center justify-center"
          >
            <Ionicons name="close" size={32} color="#e04429" />
          </TouchableOpacity>

          {/* Super Like Button */}
          <TouchableOpacity 
            onPress={handleSuperLike}
            className="w-20 h-20 rounded-full bg-[#3a3a3a] items-center justify-center"
          >
            <Ionicons name="star" size={36} color="#ffa500" />
          </TouchableOpacity>

          {/* Like Button */}
          <TouchableOpacity 
            onPress={handleLike}
            className="w-16 h-16 rounded-full bg-[#3a3a3a] items-center justify-center"
          >
            <Ionicons name="checkmark" size={32} color="#4caf50" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}