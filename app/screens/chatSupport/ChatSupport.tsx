import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  Animated,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { FONTS } from "app/constants/Assets";

import { getBotResponse } from "app/constants/KnowledgeBase";

interface Message {
  id: string;
  text: string;
  sender: "bot" | "user";
  time: string;
}

const QUICK_REPLIES = [
  "What is Kashremit?",
  "How to send money?",
  "Exchange Rates",
  "Transfer Fees",
  "Transfer Time",
  "Sending Limits",
  "Receiver Information",
  "Account Opening",
  "Create Account",
  "Security",
  "Failed Transfer Refund",
  "Transaction Processing",
  "Refund Policy",
  "Add Beneficiary",
  "Wire Transfer",
  "Airtime Top-Up",
  "Referral Code",
  "Social Media Sharing",
  "Speak to Agent",
  "Wallet Balance"
];

const TypingDots = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 400, useNativeDriver: true })
        ])
      ).start();
    };
    animateDot(dot1, 0);
    animateDot(dot2, 200);
    animateDot(dot3, 400);
  }, []);

  const dotStyle = (dot: Animated.Value) => ({
    opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
    transform: [{
      translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -3] })
    }]
  });

  return (
    <View style={styles.typingContainer}>
      <Animated.View style={[styles.typingDot, dotStyle(dot1)]} />
      <Animated.View style={[styles.typingDot, dotStyle(dot2)]} />
      <Animated.View style={[styles.typingDot, dotStyle(dot3)]} />
    </View>
  );
};

const ChatSupport = () => {
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! I'm Penny, your remittance assistant. I'm here 24/7 to help with transfers, rates, account queries, and anything else you need. What can I help you with today?",
      sender: "bot",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isAgentHandoff, setIsAgentHandoff] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, isTyping]);

  const handleSend = (text: string) => {
    if (!text.trim() || isAgentHandoff) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: "user",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    if (text.toLowerCase().includes("speak to agent") || text.toLowerCase().includes("live agent") || text.toLowerCase().includes("human")) {
      setTimeout(() => {
        setIsTyping(false);
        const botReply: Message = {
          id: (Date.now() + 1).toString(),
          text: "This one needs a closer look from our team. I'm passing you to a human agent now and sharing all the details of our conversation so you won't need to repeat yourself. One moment please.",
          sender: "bot",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botReply]);
        setIsAgentHandoff(true);
      }, 1500);
      return;
    }

    setTimeout(() => {
      setIsTyping(false);
      const botResponseText = getBotResponse(text);
      
      const botReply: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponseText,
        sender: "bot",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botReply]);
    }, 1500);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top || 40 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.avatarContainer}>
            <MaterialCommunityIcons name="robot-outline" size={24} color="#316b83" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Penny - Support</Text>
            <Text style={styles.headerSubtitle}>Typically replies instantly</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.chatContainer} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => (
            <View 
              key={msg.id} 
              style={[
                styles.messageBubble, 
                msg.sender === "user" ? styles.userBubble : styles.botBubble
              ]}
            >
              <Text style={[styles.messageText, msg.sender === "user" && styles.userMessageText]}>
                {msg.text}
              </Text>
              <Text style={[styles.timeText, msg.sender === "user" && styles.userTimeText]}>
                {msg.time}
              </Text>
            </View>
          ))}
          {isTyping && <TypingDots />}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Powered by Penny · Secure & FCA regulated</Text>
          </View>
        </ScrollView>

        <View style={styles.quickRepliesWrapper}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickRepliesContainerHorizontal}
          >
            {QUICK_REPLIES.map((reply, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.quickReplyChip}
                onPress={() => handleSend(reply)}
              >
                <Text style={styles.quickReplyText}>{reply}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={[styles.inputContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }]}>
          {isAgentHandoff ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 }}>
              <Text style={{ fontFamily: FONTS.semiBold, color: '#316b83', fontSize: 15 }}>Connecting you to an agent...</Text>
            </View>
          ) : (
            <View style={styles.inputInnerWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Type a message..."
                placeholderTextColor="#9CA3AF"
                value={inputText}
                onChangeText={setInputText}
                multiline
              />
              <TouchableOpacity 
                style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                onPress={() => handleSend(inputText)}
                disabled={!inputText.trim()}
              >
                <Ionicons name="send" size={20} color={!inputText.trim() ? "#9CA3AF" : "#fff"} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7", // iOS group background color
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#316b83",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: FONTS.bold,
    color: "#fff",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: "rgba(255,255,255,0.8)",
  },
  chatContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 12,
  },
  botBubble: {
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  userBubble: {
    backgroundColor: "#316b83",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
    shadowColor: "#316b83",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  messageText: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    color: "#1F2937",
    lineHeight: 22,
  },
  userMessageText: {
    color: "#fff",
  },
  timeText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: "#9CA3AF",
    marginTop: 6,
    alignSelf: "flex-end",
  },
  userTimeText: {
    color: "rgba(255,255,255,0.7)",
  },
  quickRepliesWrapper: {
    backgroundColor: "transparent",
    paddingVertical: 12,
  },
  quickRepliesContainerHorizontal: {
    paddingHorizontal: 16,
  },
  quickReplyChip: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginRight: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickReplyText: {
    color: "#316b83",
    fontFamily: FONTS.semiBold,
    fontSize: 14,
  },
  inputContainer: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  inputInnerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.medium,
    maxHeight: 100,
    minHeight: 36,
    color: "#111827",
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#316b83",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
    shadowColor: "#316b83",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  sendButtonDisabled: {
    backgroundColor: "#E5E7EB",
    shadowOpacity: 0,
    elevation: 0,
  },
  typingContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    marginBottom: 12,
    height: 48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#316b83",
    marginHorizontal: 3,
  },
  footerContainer: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 8,
  },
  footerText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: "#9CA3AF",
  },
});

export default ChatSupport;
