import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../firebaseConfig';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

interface UserProfile {
  id: string;
  userId: string;
  fullName: string;
  bio: string;
  location: string;
  photoUri: string;
  skills: string[];
  level: string;
}

export default function SearchScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadRandomProfiles();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch();
    } else {
      setSearchResults([]);
      setSearching(false);
    }
  }, [searchQuery]);

  const loadRandomProfiles = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Get random profiles excluding current user
      const profilesRef = collection(db, 'profiles');
      const q = query(
        profilesRef,
        where('userId', '!=', currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      const allProfiles: UserProfile[] = [];

      querySnapshot.forEach((doc) => {
        allProfiles.push({ id: doc.id, ...doc.data() } as UserProfile);
      });

      // Shuffle and take first 10
      const shuffled = allProfiles.sort(() => 0.5 - Math.random());
      setProfiles(shuffled.slice(0, 10));
      setLoading(false);
    } catch (error) {
      console.error('Error loading profiles:', error);
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Search by name (case-insensitive partial match)
      const profilesRef = collection(db, 'profiles');
      const querySnapshot = await getDocs(profilesRef);
      
      const results: UserProfile[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (
          data.userId !== currentUser.uid &&
          data.fullName.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          results.push({ id: doc.id, ...data } as UserProfile);
        }
      });

      setSearchResults(results.slice(0, 10));
      setSearching(false);
    } catch (error) {
      console.error('Error searching profiles:', error);
      setSearching(false);
    }
  };

  const displayedProfiles = searchQuery.trim() ? searchResults : profiles;

  const ProfileCard = ({ profile }: { profile: UserProfile }) => (
    <TouchableOpacity
      className="bg-[#2a2a2a] rounded-2xl p-4 mb-3 flex-row items-center"
      onPress={() => (navigation as any).navigate('UserProfile', { userId: profile.id })}
    >
      {/* User Photo */}
      {profile.photoUri ? (
        <Image
          source={{ uri: profile.photoUri }}
          style={{
            width: 70,
            height: 70,
            borderRadius: 35,
          }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            width: 70,
            height: 70,
            borderRadius: 35,
            backgroundColor: '#3a3a3a',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="person" size={35} color="#666" />
        </View>
      )}

      {/* Profile Info */}
      <View className="flex-1 ml-4">
        <Text className="text-white text-lg font-semibold mb-1">
          {profile.fullName}
        </Text>
        <View className="flex-row items-center">
          <Ionicons name="location-outline" size={14} color="#e04429" />
          <Text className="text-gray-500 text-sm ml-1">{profile.location}</Text>
        </View>
      </View>

      {/* Arrow */}
      <Ionicons name="chevron-forward" size={24} color="#666" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      {/* Header */}
      <View className="px-6 py-4">
        <Text className="text-white text-2xl font-bold mb-4">
          Search
        </Text>

        {/* Search Bar */}
        <View className="flex-row items-center bg-[#2a2a2a] rounded-full px-4 py-3">
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            placeholder="Search by username..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            className="flex-1 text-white ml-2"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results Section */}
      <View className="flex-1 px-6">
        <Text className="text-white text-lg font-bold mb-4">
          {searchQuery.trim() ? 'Search Results' : 'Discover People'}
        </Text>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-400 text-base">Loading...</Text>
          </View>
        ) : searching ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-400 text-base">Searching...</Text>
          </View>
        ) : displayedProfiles.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="people-outline" size={80} color="#3a3a3a" />
            <Text className="text-gray-400 text-base mt-4">
              {searchQuery.trim() ? 'No users found' : 'No profiles available'}
            </Text>
            {searchQuery.trim() && (
              <Text className="text-gray-500 text-sm mt-2">
                Try a different search term
              </Text>
            )}
          </View>
        ) : (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {displayedProfiles.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} />
            ))}
            <View className="h-4" />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
