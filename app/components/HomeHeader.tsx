import React, { useEffect, useState } from "react";
import { DrawerActions, useIsFocused, useNavigation } from "@react-navigation/native";
import { FONTS, SIZES, IMAGES } from "../constants/Assets";
import { TouchableOpacity, Image, Text, View } from "react-native";
import Vector from "../assets/vectors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { theme } from "app/core/theme";
import styles from "app/styles";
import { Badge } from "react-native-paper";
import { GetNotificationListInfo } from "app/http-services";

interface IProps {
  showDetails?: boolean;
  reward: string;
  currency: string;
  name: string;
  onPress?: () => void;
}


const HomeHeader = ({ showDetails = true, reward, currency, onPress }: IProps) => {
  const navigation = useNavigation();
  const [firstName, setFirstName] = useState("User");
  const [notifications, setNotifications] = useState<any[]>([]);
  const isFocused = useIsFocused();

  useEffect(() => {
    const fetchName = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          const parsed = JSON.parse(userData);
          setFirstName(parsed?.FirstName || "User");
        }
      } catch (error) {
        console.error("Error fetching name:", error);
      }
    };
    fetchName();
  }, []);

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

  return (
    <View style={[styles.homeHeader, { backgroundColor: "#316b83", paddingVertical: 15 }]}>
      <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
        <Image source={IMAGES.MenUser} style={[styles.profileIcon, { borderColor: '#fff', borderWidth: 1 }]} />
      </TouchableOpacity>

      <View style={{ flexDirection: "row", flex: 1, marginLeft: 12, backgroundColor: "transparent" }}>
        <View style={{ flexDirection: "column", alignSelf: "center", justifyContent: "center" }}>
          <Text style={{ color: "#fff", fontSize: SIZES.large, fontFamily: FONTS.semibold }}>
            Hi {firstName}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: SIZES.small, fontFamily: FONTS.regular }}>
            Your referral reward earning:
            <Text style={{ color: "#fff", marginLeft: 5 }}> {currency}</Text>
            <Text style={{ color: "#fff", fontSize: SIZES.medium, fontFamily: FONTS.semibold, marginLeft: 2 }}>{reward}</Text>
          </Text>
        </View>
      </View>

      <View
        style={{
          backgroundColor: "rgba(255,255,255,0.2)",
          padding: 8,
          borderRadius: 12,
          height: 44,
          width: 44,
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <TouchableOpacity onPress={() => navigation.navigate("Notification")}>
          <Vector
            as="ionicons"
            name="notifications-sharp"
            size={24}
            color="#fff"
            style={{ textAlign: "center" }}
          />

          {/* 🔹 Show badge only if there is at least one unread notification */}
          {notifications.some((n) => n.unread) && (
            <Badge
              size={10}
              style={{
                position: "absolute",
                top: -2,
                right: -2,
                backgroundColor: "red",
                borderWidth: 1,
                borderColor: "#316b83"
              }}
            />
          )}
        </TouchableOpacity>
      </View>

    </View>
  );
};

export default HomeHeader;
function setError(arg0: string) {
  throw new Error("Function not implemented.");
}

function setLoading(arg0: boolean) {
  throw new Error("Function not implemented.");
}

