import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayRemove } from 'firebase/firestore';

interface SavedProfile {
  id: string;
  userId: string;
  fullName: string;
  bio: string;
  location: string;
  photoUri: string;
  skills: string[];
  level: string;
  savedAt: string;
  rating?: number;
  ratingCount?: number;
  matchingSkillsCount?: number;
}

export default function SavedScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedProfiles();
  }, []);

  // Reload profiles when tab becomes active
  useFocusEffect(
    React.useCallback(() => {
      loadSavedProfiles();
    }, [])
  );

  const loadSavedProfiles = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Get current user's saved list and interested skills
      const userDoc = await getDoc(doc(db, 'profiles', currentUser.uid));
      const savedUserIds = userDoc.data()?.savedProfiles || [];
      const userInterestedSkills = userDoc.data()?.interestedSkills || [];

      if (savedUserIds.length === 0) {
        setSavedProfiles([]);
        setLoading(false);
        return;
      }

      // Fetch all saved profiles using document IDs
      const profiles: SavedProfile[] = [];
      
      for (const profileId of savedUserIds) {
        const profileDoc = await getDoc(doc(db, 'profiles', profileId));
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          const profileSkills = data.skills || [];
          
          // Calculate matching skills
          const matchingSkillsCount = profileSkills.filter((skill: string) =>
            userInterestedSkills.some(
              (interestedSkill: string) => interestedSkill.toLowerCase() === skill.toLowerCase()
            )
          ).length;

          profiles.push({
            id: profileDoc.id,
            ...data,
            savedAt: 'Recently',
            rating: data.rating || 0,
            ratingCount: data.ratingCount || 0,
            matchingSkillsCount,
          } as SavedProfile);
        }
      }

      setSavedProfiles(profiles);
      setLoading(false);
    } catch (error) {
      console.error('Error loading saved profiles:', error);
      setLoading(false);
    }
  };

  const handleUnsave = async (profileId: string) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Remove from local state
      setSavedProfiles(savedProfiles.filter(p => p.id !== profileId));

      // Update Firestore to remove from savedProfiles array
      const userDocRef = doc(db, 'profiles', currentUser.uid);
      await updateDoc(userDocRef, {
        savedProfiles: arrayRemove(profileId)
      });

      console.log('Unsaved profile:', profileId);
    } catch (error) {
      console.error('Error unsaving profile:', error);
    }
  };

  const filteredProfiles = savedProfiles.filter(profile =>
    profile.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      {/* Header */}
      <View className="px-6 py-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white text-2xl font-bold">
            Saved
          </Text>
          <TouchableOpacity 
            onPress={loadSavedProfiles}
            className="bg-[#2a2a2a] px-4 py-2 rounded-full"
            disabled={loading}
          >
            <Ionicons 
              name="refresh" 
              size={20} 
              color={loading ? "#666" : "#e04429"} 
            />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-[#2a2a2a] rounded-full px-4 py-3">
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            placeholder="Search saved profiles..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 text-white ml-2"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Saved Profiles Section */}
      <View className="flex-1 px-6">
        <Text className="text-white text-lg font-bold mb-4">Saved Profiles</Text>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-400 text-base">Loading...</Text>
          </View>
        ) : filteredProfiles.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="heart-outline" size={80} color="#3a3a3a" />
            <Text className="text-gray-400 text-base mt-4">
              {searchQuery ? 'No profiles found' : 'Nothing to see here for now...'}
            </Text>
            <Text className="text-gray-500 text-sm mt-2 text-center px-8">
              {!searchQuery && 'Super like profiles to save them here'}
            </Text>
          </View>
        ) : (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {filteredProfiles.map((profile) => {
              if (!profile || !profile.fullName) return null;
              return (
              <TouchableOpacity
                key={profile.id}
                className="bg-[#2a2a2a] rounded-2xl p-4 mb-3"
                onPress={() => (navigation as any).navigate('UserProfile', { userId: profile.userId })}
              >
                <View className="flex-row items-start">
                  {/* User Photo */}
                  {profile.photoUri ? (
                    <Image
                      source={{ uri: profile.photoUri }}
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 30,
                      }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 30,
                        backgroundColor: '#3a3a3a',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="person" size={30} color="#666" />
                    </View>
                  )}

                  {/* Profile Info */}
                  <View className="flex-1 ml-4">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-white text-base font-semibold flex-1">
                        {String(profile.fullName || '')}
                      </Text>
                      {/* Rating */}
                      {typeof profile.rating === 'number' && (
                        <View className="flex-row items-center ml-2">
                          <Ionicons name="star" size={12} color="#ffa500" />
                          <Text className="text-gray-300 text-xs ml-1">
                            {String(profile.rating.toFixed(1))}
                          </Text>
                        </View>
                      )}
                    </View>

                    {profile.location && (
                      <View className="flex-row items-center mb-1">
                        <Ionicons name="location-outline" size={12} color="#e04429" />
                        <Text className="text-gray-500 text-xs ml-1">{String(profile.location)}</Text>
                      </View>
                    )}

                    {/* Skills Preview */}
                    {Array.isArray(profile.skills) && profile.skills.length > 0 && (
                      <View className="flex-row flex-wrap mt-1">
                        {profile.skills.slice(0, 3).map((skill, index) => 
                          skill ? (
                            <View key={index} className="bg-[#3a3a3a] px-2 py-1 rounded-full mr-1 mb-1">
                              <Text className="text-orange-400 text-xs">{String(skill)}</Text>
                            </View>
                          ) : null
                        )}
                        {profile.skills.length > 3 && (
                          <View className="bg-[#3a3a3a] px-2 py-1 rounded-full">
                            <Text className="text-gray-400 text-xs">{String(profile.skills.length - 3)}</Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Matching Skills Indicator */}
                    {typeof profile.matchingSkillsCount === 'number' && profile.matchingSkillsCount > 0 && (
                      <View className="flex-row items-center mt-1">
                        <Ionicons name="checkmark-circle" size={12} color="#22c55e" />
                        <Text className="text-green-400 text-xs ml-1">
                          {String(profile.matchingSkillsCount) + (profile.matchingSkillsCount > 1 ? ' matches' : ' match')}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Unsave Button */}
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleUnsave(profile.id);
                    }}
                    style={{
                      backgroundColor: '#3a3a3a',
                      borderRadius: 20,
                      width: 40,
                      height: 40,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: 8,
                    }}
                  >
                    <Ionicons name="heart" size={20} color="#e04429" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
