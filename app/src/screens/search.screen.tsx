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
  rating?: number;
  ratingCount?: number;
  matchingSkillsCount?: number;
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

      // Get current user's interested skills
      const currentUserProfileRef = collection(db, 'profiles');
      const currentUserQuery = query(currentUserProfileRef, where('userId', '==', currentUser.uid));
      const currentUserSnapshot = await getDocs(currentUserQuery);
      let userInterestedSkills: string[] = [];
      if (!currentUserSnapshot.empty) {
        const userData = currentUserSnapshot.docs[0].data();
        userInterestedSkills = userData.interestedSkills || [];
      }

      // Get random profiles excluding current user
      const profilesRef = collection(db, 'profiles');
      const q = query(
        profilesRef,
        where('userId', '!=', currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      const allProfiles: UserProfile[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const profileSkills = data.skills || [];
        
        // Calculate matching skills
        const matchingSkillsCount = profileSkills.filter((skill: string) =>
          userInterestedSkills.some(
            (interestedSkill) => interestedSkill.toLowerCase() === skill.toLowerCase()
          )
        ).length;

        allProfiles.push({
          id: doc.id,
          ...data,
          rating: data.rating || 0,
          ratingCount: data.ratingCount || 0,
          matchingSkillsCount,
        } as UserProfile);
      });

      // Sort by matching skills count, then rating, then rating count
      allProfiles.sort((a, b) => {
        // Primary: matching skills count (descending)
        if (b.matchingSkillsCount !== a.matchingSkillsCount) {
          return b.matchingSkillsCount! - a.matchingSkillsCount!;
        }
        // Secondary: rating (descending)
        if (b.rating !== a.rating) {
          return b.rating! - a.rating!;
        }
        // Tertiary: rating count (descending)
        return b.ratingCount! - a.ratingCount!;
      });

      setProfiles(allProfiles.slice(0, 10));
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

      // Get current user's interested skills
      const currentUserProfileRef = collection(db, 'profiles');
      const currentUserQuery = query(currentUserProfileRef, where('userId', '==', currentUser.uid));
      const currentUserSnapshot = await getDocs(currentUserQuery);
      let userInterestedSkills: string[] = [];
      if (!currentUserSnapshot.empty) {
        const userData = currentUserSnapshot.docs[0].data();
        userInterestedSkills = userData.interestedSkills || [];
      }

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
          const profileSkills = data.skills || [];
          
          // Calculate matching skills
          const matchingSkillsCount = profileSkills.filter((skill: string) =>
            userInterestedSkills.some(
              (interestedSkill) => interestedSkill.toLowerCase() === skill.toLowerCase()
            )
          ).length;

          results.push({
            id: doc.id,
            ...data,
            rating: data.rating || 0,
            ratingCount: data.ratingCount || 0,
            matchingSkillsCount,
          } as UserProfile);
        }
      });

      // Sort by matching skills count, then rating, then rating count
      results.sort((a, b) => {
        // Primary: matching skills count (descending)
        if (b.matchingSkillsCount !== a.matchingSkillsCount) {
          return b.matchingSkillsCount! - a.matchingSkillsCount!;
        }
        // Secondary: rating (descending)
        if (b.rating !== a.rating) {
          return b.rating! - a.rating!;
        }
        // Tertiary: rating count (descending)
        return b.ratingCount! - a.ratingCount!;
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
      className="bg-[#2a2a2a] rounded-2xl p-4 mb-3"
      onPress={() => (navigation as any).navigate('UserProfile', { userId: profile.userId || profile.id })}
    >
      <View className="flex-row items-center">
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
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-white text-lg font-semibold flex-1">
              {profile.fullName || 'Unknown'}
            </Text>
            {/* Rating */}
            <View className="flex-row items-center ml-2">
              <Ionicons name="star" size={14} color="#ffa500" />
              <Text className="text-gray-300 text-xs ml-1">
                {profile.rating ? profile.rating.toFixed(1) : '0.0'}
              </Text>
            </View>
          </View>
          
          <View className="flex-row items-center mb-1">
            <Ionicons name="location-outline" size={14} color="#e04429" />
            <Text className="text-gray-500 text-sm ml-1">{profile.location || 'Unknown'}</Text>
          </View>

          {/* Skills Preview */}
          {profile.skills && profile.skills.length > 0 && (
            <View className="flex-row flex-wrap mt-1">
              {profile.skills.slice(0, 3).map((skill, index) => (
                <View key={index} className="bg-[#3a3a3a] px-2 py-1 rounded-full mr-1 mb-1">
                  <Text className="text-orange-400 text-xs">{skill}</Text>
                </View>
              ))}
              {profile.skills.length > 3 && (
                <View className="bg-[#3a3a3a] px-2 py-1 rounded-full">
                  <Text className="text-gray-400 text-xs">{`+${profile.skills.length - 3}`}</Text>
                </View>
              )}
            </View>
          )}

          {/* Matching Skills Indicator */}
          {(profile.matchingSkillsCount !== undefined && profile.matchingSkillsCount > 0) && (
            <View className="flex-row items-center mt-1">
              <Ionicons name="checkmark-circle" size={12} color="#22c55e" />
              <Text className="text-green-400 text-xs ml-1">
                {`${profile.matchingSkillsCount} match${profile.matchingSkillsCount > 1 ? 'es' : ''}`}
              </Text>
            </View>
          )}
        </View>

        {/* Arrow */}
        <Ionicons name="chevron-forward" size={24} color="#666" />
      </View>
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
            {displayedProfiles.filter(p => p && p.id && p.fullName).map((profile, index) => (
              <ProfileCard key={profile.id || `profile-${index}`} profile={profile} />
            ))}
            <View className="h-4" />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
