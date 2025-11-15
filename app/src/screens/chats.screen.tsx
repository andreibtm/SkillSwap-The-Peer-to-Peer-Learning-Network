import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs, orderBy, deleteDoc } from 'firebase/firestore';

interface Chat {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

export default function ChatsScreen() {
  const navigation = useNavigation();
  const [currentUserName, setCurrentUserName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
    loadChats();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadChats();
    }, [])
  );

  const loadUserData = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const profileDoc = await getDoc(doc(db, 'profiles', currentUser.uid));
      if (profileDoc.exists()) {
        setCurrentUserName(profileDoc.data().fullName);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadChats = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef,
        where('participants', 'array-contains', currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      const chatList: Chat[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const otherUserId = data.participants.find((id: string) => id !== currentUser.uid);
        
        chatList.push({
          id: doc.id,
          userId: otherUserId,
          userName: data.participantNames[otherUserId] || 'User',
          userPhoto: data.participantPhotos[otherUserId] || '',
          lastMessage: data.lastMessage || 'Start chatting!',
          timestamp: data.lastMessageTime ? new Date(data.lastMessageTime.seconds * 1000).toLocaleDateString() : 'Now',
          unread: false
        });
      });

      setChats(chatList);
      setLoading(false);
    } catch (error) {
      console.error('Error loading chats:', error);
      setLoading(false);
    }
  };

  const handleDeleteChat = async (chatId: string, userName: string, event: any) => {
    event.stopPropagation();
    
    Alert.alert(
      'Delete Chat',
      `Are you sure you want to delete your conversation with ${userName}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'chats', chatId));
              setChats(chats.filter(chat => chat.id !== chatId));
            } catch (error) {
              console.error('Error deleting chat:', error);
              Alert.alert('Error', 'Failed to delete chat. Please try again.');
            }
          }
        }
      ]
    );
  };

  const filteredChats = chats.filter(chat =>
    chat.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      {/* Header */}
      <View className="px-6 py-4">
        <Text className="text-white text-2xl font-bold mb-4">
          {currentUserName || 'Messages'}
        </Text>

        {/* Search Bar */}
        <View className="flex-row items-center bg-[#2a2a2a] rounded-full px-4 py-3">
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            placeholder="Search messages..."
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

      {/* Messages Section */}
      <View className="flex-1 px-6">
        <Text className="text-white text-lg font-bold mb-4">Messages</Text>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-400 text-base">Loading...</Text>
          </View>
        ) : filteredChats.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="chatbubbles-outline" size={80} color="#3a3a3a" />
            <Text className="text-gray-400 text-base mt-4">
              Nothing to see here for now...
            </Text>
          </View>
        ) : (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {filteredChats.map((chat) => (
              <TouchableOpacity
                key={chat.id}
                className="flex-row items-center bg-[#2a2a2a] rounded-2xl p-4 mb-3"
                onPress={() => (navigation as any).navigate('ChatDetail', {
                  chatId: chat.id,
                  otherUserId: chat.userId,
                  otherUserName: chat.userName,
                  otherUserPhoto: chat.userPhoto
                })}
              >
                {/* User Photo */}
                {chat.userPhoto ? (
                  <Image
                    source={{ uri: chat.userPhoto }}
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

                {/* Chat Info */}
                <View className="flex-1 ml-4">
                  <Text className="text-white text-lg font-bold mb-1">
                    {chat.userName}
                  </Text>
                  <Text
                    className="text-gray-300 text-sm"
                    numberOfLines={1}
                    style={{ fontWeight: chat.unread ? '600' : '400' }}
                  >
                    {chat.lastMessage}
                  </Text>
                </View>

                {/* Timestamp & Actions */}
                <View className="items-end ml-2">
                  <Text className="text-gray-500 text-xs mb-2">
                    {chat.timestamp}
                  </Text>
                  <TouchableOpacity 
                    onPress={(e) => handleDeleteChat(chat.id, chat.userName, e)}
                    className="mt-1"
                  >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                  {chat.unread && (
                    <View
                      style={{
                        backgroundColor: '#e04429',
                        borderRadius: 10,
                        width: 20,
                        height: 20,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text className="text-white text-xs font-bold">1</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
