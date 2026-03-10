import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FAQ</Text>
      </View>

      <Container>
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#316b83"
            style={{ marginTop: 30 }}
          />
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {faqData.map((item, index) => {
              const isExpanded = expandedIndex === index;

              return (
                <TouchableOpacity
                  key={index}
                  style={styles.card}
                  activeOpacity={0.8}
                  onPress={() => toggleExpand(index)}
                >
                  <View style={styles.row}>
                    <Text style={styles.title}>{item.question}</Text>
                    <Ionicons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={18}
                      color="#316b83"
                    />
                  </View>

                  {isExpanded && (
                    <Text style={styles.description}>
                      {item.answer}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </Container>
    </SafeAreaView>
  );
};

export default Faq;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
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
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: FONTS.semibold,
    color: "#fff",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    marginTop: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 14,
    fontFamily: FONTS.semibold,
    color: "#000",
    flex: 1,
    paddingRight: 10,
  },
  description: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: "#555",
    marginTop: 10,
    lineHeight: 20,
  },
});