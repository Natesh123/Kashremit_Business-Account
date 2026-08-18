import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useRecoilValue } from "recoil";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

import { ProfileState } from "../../atoms";
import Container from "app/theme/Container";
import { GetNotificationListInfo, UpdateNotification } from "app/http-services";
import { FONTS } from "app/constants/Assets";

const Notification = () => {
  const currentToken = useRecoilValue(ProfileState);
  const [currency, setCurrency] = useState("£");
  const [reward, setReward] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const isFocused = useIsFocused();
  const navigation = useNavigation();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await GetNotificationListInfo({});
        const data = response?.data?.Notifications || [];

        const notificationTypes: Record<number, string> = {
          1: "Registration",
          2: "Wallet Update",
          4: "Transaction",
        };

        // 🔹 Load stored read statuses
        const keys = await AsyncStorage.getAllKeys();
        const storedValues = await AsyncStorage.multiGet(keys);
        const localStatus: Record<string, any> = {};
        storedValues.forEach(([key, value]) => {
          if (key.startsWith("notification_") && value) {
            localStatus[key] = JSON.parse(value);
          }
        });

        const mappedNotifications = data.map((item: any) => {
          const storageKey = `notification_${item.NotificationLogId}`;
          const localItem = localStatus[storageKey];
          return {
            id: item.NotificationLogId,
            masterId: item.NotificationMasterId,
            type: notificationTypes[item.NotificationMasterId] || "Other",
            description: item.NotificationMessage,
            time: item.NotificationCreatedDate || "",
            unread:
              localItem?.unread !== undefined
                ? localItem.unread
                : item.NotificationIsread === "False",
          };
        });

        setNotifications(mappedNotifications);
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setError("Failed to load notifications.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [isFocused]);

  const handleNotificationPress = async (item: any) => {
    try {
      // 1️⃣ Call UpdateNotification API
      await UpdateNotification({
        NotificationlogId: item.id,
        NotificationMasterId: item.masterId,
      });

      // 2️⃣ Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === item.id ? { ...n, unread: false } : n
        )
      );

      // 3️⃣ Save in AsyncStorage
      await AsyncStorage.setItem(
        `notification_${item.id}`,
        JSON.stringify({ ...item, unread: false })
      );
    } catch (err) {
      console.error("Failed to update or refresh notifications:", err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      <View style={styles.contentBackground}>
        <Container>
          {loading ? (
          <ActivityIndicator
            size="large"
            color="#0000ff"
            style={{ marginTop: 20 }}
          />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {notifications.length === 0 ? (
              <Text style={styles.noNotifications}>
                No notifications available
              </Text>
            ) : (
              notifications.map((item) => (
                <TouchableOpacity
                  activeOpacity={0.8}
                  key={item.id}
                  onPress={() => handleNotificationPress(item)}
                >
                  <View style={[styles.card, item.unread && styles.unreadCard]}>
                    <View style={styles.iconContainer}>
                      <Ionicons
                        name={
                          item.type === "Transaction" ? "swap-horizontal" :
                          item.type === "Wallet Update" ? "wallet-outline" :
                          "notifications-outline"
                        }
                        size={20}
                        color="#316b83"
                      />
                    </View>
                    <View style={styles.cardContent}>
                      <View style={styles.row}>
                        <Text style={styles.title} numberOfLines={1}>{item.type}</Text>
                        <View style={styles.rightRow}>
                          <Text style={styles.time}>{item.time}</Text>
                          {item.unread && <View style={styles.dot} />}
                        </View>
                      </View>
                      <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}
        </Container>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#316b83", // matches header so the iOS notch is blue
  },
  contentBackground: {
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
    fontFamily: FONTS.semiBold,
    color: "#fff",
  },
  errorText: {
    color: "red",
    marginTop: 20,
    textAlign: "center",
  },
  noNotifications: {
    textAlign: "center",
    marginTop: 20,
    color: "#666",
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "transparent",
  },
  unreadCard: {
    backgroundColor: "#F7FAFC",
    borderColor: "#E5E7EB",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: FONTS.semiBold,
    color: "#1C1C1E",
    flex: 1,
    paddingRight: 10,
  },
  rightRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  time: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: "#8E8E93",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E02424",
    marginLeft: 6,
  },
  description: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: "#4B5563",
    lineHeight: 18,
  },
});

export default Notification;
