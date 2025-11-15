import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
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
  const { chatId, otherUserId, otherUserName, otherUserPhoto } = route.params as any;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(msgs);
    });

    return unsubscribe;
  }, [chatId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const messagesRef = collection(db, 'chats', chatId, 'messages');
      await addDoc(messagesRef, {
        text: newMessage.trim(),
        senderId: currentUser.uid,
        timestamp: serverTimestamp()
      });

      // Update last message in chat document
      const chatRef = doc(db, 'chats', chatId);
      await getDoc(chatRef).then(async (chatDoc) => {
        if (chatDoc.exists()) {
          const { updateDoc } = await import('firebase/firestore');
          await updateDoc(chatRef, {
            lastMessage: newMessage.trim(),
            lastMessageTime: serverTimestamp()
          });
        }
      });

      setNewMessage('');
      scrollViewRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 bg-[#2a2a2a]">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#e04429" />
        </TouchableOpacity>
        
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
      </View>

      {/* Messages */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
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
            className="ml-3 bg-[#e04429] w-12 h-12 rounded-full items-center justify-center"
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
