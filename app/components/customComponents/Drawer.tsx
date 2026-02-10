import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ImageBackground,
  Image,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from "react-native";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import Vector from "app/assets/vectors";
import { theme } from "app/core/theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { FONTS, IMAGES, SHADOWS } from "app/constants/Assets";
import { useRecoilState, useRecoilValue } from "recoil";
import { ProfileState } from "app/atoms";
import styles from "app/styles";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

const CustomDrawer = (props: any) => {
  const navigation = useNavigation();
  const currentToken = useRecoilValue(ProfileState);
  const [ProfileItems, setProfileItems] = useRecoilState(ProfileState);

  const [loading, setLoading] = useState(false);
  const _onSignOutPressed = async () => {
    setLoading(true);
    await AsyncStorage.clear();
    setProfileItems({
      remitterId: currentToken.remitterId,
      firstName: currentToken.firstName,
      lastName: currentToken.lastName,
      email: currentToken.email,
      mobileNo: currentToken.mobileNo,
      tokenId: ''
    });
    await AsyncStorage.removeItem("isLoggedIn");
    navigation.navigate('Login');
    setLoading(false)
  }
  return (
    <SafeAreaView style={{ flex: 1, ...SHADOWS.shadow }}>

      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{
          zIndex: 10,
        }}
      >
        <View
          style={{ padding: 20 }}
        >
          <Image source={IMAGES.MenUser} style={styles.profileIcon} />
          <View>
            <Text
              style={{
                color: "#000",
                fontSize: 15,
                lineHeight: 22,
                fontFamily: FONTS.semibold,
              }}
            >
              {currentToken.firstName} {currentToken.lastName}
            </Text>
            <Text
              style={{
                color: "#316b83", // 👈 different color for remitterId
                fontSize: 13,
                lineHeight: 18,
                marginTop: 10,
                fontFamily: FONTS.semibold,
              }}
            >
              {currentToken.remitterId}
            </Text>
          </View>

        </View>
        <View style={{ flex: 1, paddingTop: 10 }}>
          <DrawerItemList  {...props} />
        </View>
      </DrawerContentScrollView>
      {/* <View
        style={{
          borderTopWidth: 1,
          borderTopColor: "#ccc",
          // backgroundColor: colors.cardbackground,
        }}
      >
        <Text style={stylesLocal.preferences}>Preferences</Text>
        <View style={stylesLocal.switchTextContainer}>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor="#f4f3f4"
            style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
          />
          <Text
            style={{
              fontSize: 15,
            }}
          >
            Dark Theme
          </Text>
        </View>
      </View> */}
      <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: "#ccc" }}>
        <TouchableOpacity
          onPress={() => navigation.navigate("ReferandEarn" as never)}
          style={{
            paddingVertical: 15,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <MaterialCommunityIcons
              name="hand-coin"
              size={22}
              color="#0A4E5A"
            />

            <Text
              style={{
                fontSize: 14,
                fontFamily: "SF Pro Display",
                fontWeight: 550,
                marginLeft: 10,
                color: "#000",

              }}
            >
              Invite & Earn
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={_onSignOutPressed} style={{ paddingVertical: 15 }}>
  <View style={{ flexDirection: "row", alignItems: "center" }}>

    {/* BLUE CIRCLE WITH ICON */}
    <View
      style={{
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: "#0A4E5A",     // blue background
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <MaterialCommunityIcons
        name="logout-variant"          // EXACT icon in your screenshot
        size={18}
        color="#FFFFFF"                // white icon
      />
    </View>

    <Text
      style={{
        fontSize: 14,
                fontFamily: "SF Pro Display",
                fontWeight: 550,
                marginLeft: 10,
                color: "#000",
      }}
    >
      Log out
    </Text>
  </View>
</TouchableOpacity>

      </View>
    </SafeAreaView>
  );
};

export default CustomDrawer;

const stylesLocal = StyleSheet.create({
  userAvatar: {
    height: 67.5,
    width: 67.5,
    borderRadius: 40,
    marginBottom: 10,
    marginTop: 30,
  },
  switchTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 7,
    paddingVertical: 5,
  },
  preferences: {
    fontSize: 16,
    color: "#ccc",
    paddingTop: 10,
    fontWeight: "500",
    paddingLeft: 20,
  },
  switchText: {
    fontSize: 17,
    color: "",
    paddingTop: 10,
    fontWeight: "bold",
  },
});