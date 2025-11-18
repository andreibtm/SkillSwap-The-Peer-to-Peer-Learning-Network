import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { auth, db } from '../../firebaseConfig';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: any;
}

export default function ChatDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as any;
  
  // Safety checks for required params
  if (!params || !params.chatId || !params.otherUserId) {
    console.error('Missing required params:', params);
    // Navigate back if critical params are missing
    useEffect(() => {
      Alert.alert('Error', 'Unable to load chat. Please try again.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }, []);
  }
  
  const { chatId, otherUserId, otherUserName, otherUserPhoto } = params || {};
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [hasRated, setHasRated] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const checkIfRated = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser || !otherUserId) return;

        const ratingId = `${currentUser.uid}_${otherUserId}`;
        const ratingRef = doc(db, 'ratings', ratingId);
        const ratingDoc = await getDoc(ratingRef);
        
        setHasRated(ratingDoc.exists());
      } catch (error) {
        console.error('Error checking rating:', error);
      }
    };

    checkIfRated();
  }, [otherUserId]);

  useEffect(() => {
    if (!chatId) {
      console.error('No chatId provided');
      return;
    }

    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));

      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const msgs: Message[] = [];
          snapshot.forEach((doc) => {
            msgs.push({ id: doc.id, ...doc.data() } as Message);
          });
          setMessages(msgs);
        },
        (error) => {
          console.error('Error listening to messages:', error);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up messages listener:', error);
    }
  }, [chatId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatId) return;

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to send messages');
        return;
      }

      const messageText = newMessage.trim();
      setNewMessage(''); // Clear input immediately

      const messagesRef = collection(db, 'chats', chatId, 'messages');
      await addDoc(messagesRef, {
        text: messageText,
        senderId: currentUser.uid,
        timestamp: serverTimestamp()
      });

      // Update last message in chat document
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);
      
      if (chatDoc.exists()) {
        const { updateDoc } = await import('firebase/firestore');
        await updateDoc(chatRef, {
          lastMessage: messageText,
          lastMessageTime: serverTimestamp()
        });
      }

      scrollViewRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      // Restore the message if it failed
      setNewMessage(newMessage);
    }
  };

  const handleRatePress = () => {
    if (hasRated) {
      Alert.alert('Already Rated', 'You already rated this person');
      return;
    }
    
    (navigation as any).navigate('Rate', { 
      userId: otherUserId, 
      userName: otherUserName 
    });
  };

  const handleProfilePress = () => {
    (navigation as any).navigate('UserProfile', { 
      userId: otherUserId,
      hideButton: true 
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 bg-[#2a2a2a]">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#e04429" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleProfilePress}
            className="flex-row items-center flex-1"
          >
            {otherUserPhoto ? (
              <Image 
                source={{ uri: otherUserPhoto }}
                style={{ width: 40, height: 40, borderRadius: 20, marginLeft: 12 }}
              />
            ) : (
              <View className="w-10 h-10 rounded-full bg-[#3a3a3a] items-center justify-center ml-3">
                <Ionicons name="person" size={20} color="#666" />
              </View>
            )}
            
            <Text className="text-white text-lg font-bold ml-3">{otherUserName}</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          onPress={handleRatePress}
        >
          <Ionicons 
            name={hasRated ? "star" : "star-outline"} 
            size={24} 
            color={hasRated ? "#666" : "#ffa500"} 
          />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          className="flex-1 px-4 py-4"
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-gray-500 text-center">
                Start your conversation!
              </Text>
            </View>
          ) : (
            messages.map((message) => {
              const isMyMessage = message.senderId === auth.currentUser?.uid;
              return (
                <View
                  key={message.id}
                  className={`mb-3 ${isMyMessage ? 'items-end' : 'items-start'}`}
                >
                  <View
                    className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                      isMyMessage ? 'bg-[#e04429]' : 'bg-[#2a2a2a]'
                    }`}
                  >
                    <Text className="text-white">{message.text}</Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Input */}
        <View className="flex-row items-center px-4 py-3 bg-[#2a2a2a]">
          <TextInput
            placeholder="Type a message..."
            placeholderTextColor="#666"
            value={newMessage}
            onChangeText={setNewMessage}
            className="flex-1 bg-[#1a1a1a] text-white px-4 py-3 rounded-full"
            multiline
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!newMessage.trim()}
            style={{ 
              marginLeft: 12, 
              backgroundColor: !newMessage.trim() ? '#666' : '#e04429', 
              width: 48, 
              height: 48, 
              borderRadius: 24, 
              alignItems: 'center', 
              justifyContent: 'center'
            }}
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
