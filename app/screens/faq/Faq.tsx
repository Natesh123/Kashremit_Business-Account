import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Container from "app/theme/Container";
import { FONTS } from "app/constants/Assets";

const Faq = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Enable LayoutAnimation for Android
  useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }

    setLoading(false);
  }, []);

  const faqData = [
    {
      question: "What is money remittance?",
      answer:
        "Money remittance is the process of sending money from one place to another, typically across borders.",
    },
    {
      question: "How do I send money using this platform?",
      answer:
        "You can send money by signing up, verifying your identity, and selecting your recipient and amount.",
    },
    {
      question: "Which countries can I send money to?",
      answer:
        "We support over 50 countries. The list is available during the send money process.",
    },
    {
      question: "What documents are required for verification?",
      answer:
        "You’ll need to provide a valid government-issued ID and sometimes proof of address. Accepted formats: JPG, JPEG, PNG, or PDF, with a max file size of 2MB.",
    },
    {
      question: "How long does the transfer take?",
      answer:
        "Transfers usually complete within minutes to 2 business days depending on the country and method.",
    },
    {
      question: "Are there any fees?",
      answer:
        "Fees depend on the country, currency, and transfer method. You’ll see the fee before confirming.",
    },
    {
      question: "Is my money safe?",
      answer:
        "Yes. We use encrypted secure transactions and comply with financial regulations.",
    },
    {
      question: "Can I track my transfer?",
      answer:
        "Yes. You can view real-time status from your dashboard after sending money.",
    },
    {
      question: "What currencies are supported?",
      answer:
        "We support major global currencies including USD, GBP, EUR, INR, and more.",
    },
  ];

  const toggleExpand = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#316b83' }}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>FAQ</Text>
        </View>
      </SafeAreaView>

      <Container style={{ backgroundColor: '#F2F2F7', flex: 1 }}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#316b83"
            style={{ marginTop: 30 }}
          />
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingBottom: 40, paddingTop: 20, paddingHorizontal: 16 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ marginBottom: 20, paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 20, fontFamily: FONTS.regular, color: '#1C1C1E', fontWeight: '700' }}>Have questions?</Text>
              <Text style={{ fontSize: 14, fontFamily: FONTS.regular, color: '#8E8E93', marginTop: 4 }}>Find answers to our most common questions below.</Text>
            </View>

            {faqData.map((item, index) => {
              const isExpanded = expandedIndex === index;

              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.card, isExpanded && styles.cardExpanded]}
                  activeOpacity={0.8}
                  onPress={() => toggleExpand(index)}
                >
                  <View style={styles.row}>
                    <Text style={[styles.title, isExpanded && { color: '#316b83' }]}>{item.question}</Text>
                    <View style={[styles.iconContainer, isExpanded && { backgroundColor: '#316b83' }]}>
                      <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={18}
                        color={isExpanded ? "#fff" : "#316b83"}
                      />
                    </View>
                  </View>

                  {isExpanded && (
                    <View style={styles.answerContainer}>
                      <Text style={styles.description}>
                        {item.answer}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </Container>
    </View>
  );
};

export default Faq;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: "#316b83",
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    fontFamily: FONTS.regular,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "transparent",
  },
  cardExpanded: {
    borderColor: "#E5E7EB",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: FONTS.regular,
    color: "#1C1C1E",
    flex: 1,
    paddingRight: 12,
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
  },
  answerContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F2F2F7",
  },
  description: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 22,
    fontFamily: FONTS.regular,
  },
});