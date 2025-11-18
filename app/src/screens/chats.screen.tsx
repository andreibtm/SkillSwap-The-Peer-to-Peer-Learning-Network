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
  lastMessageTime?: any;
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
        const data = profileDoc.data();
        setCurrentUserName(data?.fullName || 'Messages');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Now';
    
    const now = new Date();
    const chatDate = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - chatDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  const loadChats = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setLoading(false);
        return;
      }

      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef,
        where('participants', 'array-contains', currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      const chatList: Chat[] = [];

      querySnapshot.forEach((doc) => {
        try {
          const data = doc.data();
          
          // Safety checks for required fields
          if (!data || !data.participants || !Array.isArray(data.participants)) {
            console.warn('Invalid chat data:', doc.id);
            return;
          }

          const otherUserId = data.participants.find((id: string) => id !== currentUser.uid);
          
          if (!otherUserId) {
            console.warn('No other user found in chat:', doc.id);
            return;
          }

          // Safe access to nested objects
          const participantNames = data.participantNames || {};
          const participantPhotos = data.participantPhotos || {};
          
          chatList.push({
            id: doc.id,
            userId: otherUserId,
            userName: participantNames[otherUserId] || 'User',
            userPhoto: participantPhotos[otherUserId] || '',
            lastMessage: data.lastMessage || 'Start chatting!',
            timestamp: getTimeAgo(data.lastMessageTime),
            unread: false,
            lastMessageTime: data.lastMessageTime
          });
        } catch (docError) {
          console.error('Error processing chat document:', doc.id, docError);
        }
      });

      // Sort chats by most recent first
      chatList.sort((a, b) => {
        const timeA = a.lastMessageTime?.seconds || 0;
        const timeB = b.lastMessageTime?.seconds || 0;
        return timeB - timeA;
      });

      setChats(chatList);
      setLoading(false);
    } catch (error) {
      console.error('Error loading chats:', error);
      setLoading(false);
    }
  };

  const handleDeleteChat = async (chatId: string, userName: string, event: any) => {
    if (event && event.stopPropagation) {
      event.stopPropagation();
    }
    
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
              // Delete all messages in the chat subcollection
              const messagesRef = collection(db, 'chats', chatId, 'messages');
              const messagesSnapshot = await getDocs(messagesRef);
              
              const deletePromises = messagesSnapshot.docs.map(messageDoc => 
                deleteDoc(doc(db, 'chats', chatId, 'messages', messageDoc.id))
              );
              
              await Promise.all(deletePromises);
              
              // Delete the chat document
              await deleteDoc(doc(db, 'chats', chatId));
              setChats(chats.filter(chat => chat.id !== chatId));
            } catch (error) {
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
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white text-2xl font-bold">
            {currentUserName || 'Messages'}
          </Text>
          <TouchableOpacity 
            onPress={loadChats}
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
                onPress={() => {
                  try {
                    (navigation as any).navigate('ChatDetail', {
                      chatId: chat.id,
                      otherUserId: chat.userId,
                      otherUserName: chat.userName,
                      otherUserPhoto: chat.userPhoto
                    });
                  } catch (error) {
                    console.error('Navigation error:', error);
                    Alert.alert('Error', 'Unable to open chat. Please try again.');
                  }
                }}
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
                    numberOfLines={1}
                    style={{ color: '#ffffff', fontSize: 14, fontWeight: chat.unread ? '600' : '400' }}
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
