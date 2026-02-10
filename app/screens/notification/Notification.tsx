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
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {notifications.length === 0 ? (
              <Text style={styles.noNotifications}>
                No notifications available
              </Text>
            ) : (
              notifications.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleNotificationPress(item)}
                >
                  <View
                    style={[styles.card, item.unread && styles.unreadCard]}
                  >
                    <View style={styles.row}>
                      <Text style={styles.title}>{item.type}</Text>
                      <View style={styles.rightRow}>
                        <Text style={styles.time}>{item.time}</Text>
                        {item.unread && <View style={styles.dot} />}
                      </View>
                    </View>
                    <Text style={styles.description}>{item.description}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}
      </Container>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    // marginTop: "8%",
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
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: FONTS.semibold,
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
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginHorizontal: 12,
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  unreadCard: {
    backgroundColor: "#fdf6f6",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: FONTS.regular,
    color: "#000",
    flexShrink: 1,
  },
  description: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: "#555",
    marginTop: 6,
    lineHeight: 20,
  },
  rightRow: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  time: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: "#666",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "red",
    marginLeft: 6,
  },
});

export default Notification;
