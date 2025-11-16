import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

interface Profile {
  id: string;
  userId: string;
  fullName: string;
  bio: string;
  location: string;
  photoUri: string;
  skills: string[];
  interestedSkills: string[];
  level: string;
  rating: number;
  ratingCount: number;
}

export default function UserProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId } = route.params as any;
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const profileRef = doc(db, 'profiles', userId);
      const profileDoc = await getDoc(profileRef);
      
      if (profileDoc.exists()) {
        setProfile({ id: profileDoc.id, ...profileDoc.data() } as Profile);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading profile:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-400 text-base">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-400 text-base">Profile not found</Text>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="mt-4 bg-[#e04429] px-6 py-3 rounded-full"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#e04429" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Profile Content */}
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Profile Image */}
        <View className="items-center py-6">
          {profile.photoUri ? (
            <Image 
              source={{ uri: profile.photoUri }} 
              style={{ 
                width: 280, 
                height: 280, 
                borderRadius: 20 
              }}
              resizeMode="cover"
            />
          ) : (
            <View 
              style={{ 
                width: 280, 
                height: 280, 
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

        {/* Name and Rating */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-white text-2xl font-bold">
            {profile.fullName}
          </Text>
          
          <View className="flex-row items-center">
            <Ionicons name="star" size={16} color="#ffa500" />
            <Text className="text-gray-300 text-sm ml-1">
              {profile.rating ? profile.rating.toFixed(1) : '0.0'} ({profile.ratingCount || 0})
            </Text>
          </View>
        </View>
        
        {/* Location */}
        {profile.location && (
          <View className="flex-row items-center mb-4">
            <Ionicons name="location-outline" size={16} color="#e04429" />
            <Text className="text-gray-400 text-sm ml-1">
              {profile.location}
            </Text>
          </View>
        )}

        {/* Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <View className="mb-4">
            <Text className="text-white text-base font-semibold mb-2">Skills</Text>
            <View className="flex-row flex-wrap gap-2">
              {profile.skills.map((skill: string, index: number) => (
                <View key={index} className="bg-[#3a3a3a] px-3 py-2 rounded-full">
                  <Text className="text-orange-400 text-sm">{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Interested Skills */}
        {profile.interestedSkills && profile.interestedSkills.length > 0 && (
          <View className="mb-4">
            <Text className="text-white text-base font-semibold mb-2">Interested In Learning</Text>
            <View className="flex-row flex-wrap gap-2">
              {profile.interestedSkills.map((skill: string, index: number) => (
                <View key={index} className="bg-[#1e3a5f] px-3 py-2 rounded-full">
                  <Text className="text-blue-300 text-sm">{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Bio */}
        <View style={{ marginBottom: 24 }}>
          <View className="flex-row items-start mb-2">
            <Ionicons name="chatbox-ellipses-outline" size={24} color="#e04429" style={{ marginRight: 8 }} />
            <Text className="text-white text-base font-semibold">About</Text>
          </View>
          <Text className="text-gray-300 text-sm leading-5 italic">
            "{profile.bio || 'Ready to share knowledge and learn new skills!'}"
          </Text>
        </View>

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
