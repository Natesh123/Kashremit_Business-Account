import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ImageBackground,
  Image,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
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
import * as WebBrowser from 'expo-web-browser';
import DeactivateAccountModal from "./DeactivateAccountModal";
import { CreateDeactivationRequest } from "app/http-services";
import Toast from 'react-native-toast-message';

const CustomDrawer = (props: any) => {
  const navigation = useNavigation();
  const currentToken = useRecoilValue(ProfileState);
  const [ProfileItems, setProfileItems] = useRecoilState(ProfileState);
  const [isDeactivateModalVisible, setIsDeactivateModalVisible] = useState(false);

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
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: '#fff', ...SHADOWS.shadow }}>

      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{
          zIndex: 10,
          paddingTop: 0,
        }}
      >
        <View
          style={{ 
            paddingHorizontal: 20, 
            paddingTop: 50, 
            paddingBottom: 20, 
            borderBottomWidth: 1, 
            borderBottomColor: "#E5E7EB", 
            marginBottom: 10,
            flexDirection: 'row',
            alignItems: 'center'
          }}
        >
          <Image source={IMAGES.MenUser} style={{ width: 50, height: 50, borderRadius: 25, marginRight: 15 }} />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "#111827",
                fontSize: 16,
                fontWeight: '600',
                fontFamily: FONTS.semiBold,
                marginBottom: 4,
              }}
              numberOfLines={1}
            >
              {currentToken.firstName} {currentToken.lastName}
            </Text>
            <Text
              style={{
                color: "#6B7280", 
                fontSize: 13,
                fontWeight: '500',
                fontFamily: FONTS.regular,
              }}
            >
              ID: {currentToken.remitterId}
            </Text>
          </View>
        </View>
        <View style={{ flex: 1, paddingTop: 10 }}>
          <DrawerItemList  {...props} />
        </View>
        
        <View style={{ paddingHorizontal: 20, paddingBottom: 20, paddingTop: 5 }}>
          <TouchableOpacity
            onPress={() => navigation.navigate("Faq" as never)}
            style={{
              paddingVertical: 15,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialCommunityIcons
                name="help-circle"
                size={22}
                color="#0A4E5A"
              />

              <Text
                style={{
                  fontSize: 14,
                  fontFamily: FONTS.regular,
                  fontWeight: '500',
                  marginLeft: 12,
                  color: "#111827",
                }}
              >
                FAQ
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => WebBrowser.openBrowserAsync('https://kashminds.com/privacy-policy')}
            style={{
              paddingVertical: 15,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialCommunityIcons name="shield-check" size={22} color="#0A4E5A" />
              <Text style={{ fontSize: 14, fontFamily: FONTS.regular, fontWeight: '500', marginLeft: 12, color: "#111827" }}>Privacy Policy</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => WebBrowser.openBrowserAsync('https://kashminds.com/terms-and-conditions')}
            style={{
              paddingVertical: 15,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialCommunityIcons name="file-document-outline" size={22} color="#0A4E5A" />
              <Text style={{ fontSize: 14, fontFamily: FONTS.regular, fontWeight: '500', marginLeft: 12, color: "#111827" }}>Terms & Conditions</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => {
              setIsDeactivateModalVisible(true);
              props.navigation.closeDrawer();
            }}
            style={{ paddingVertical: 15 }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: "#EF4444", // Red background for destructive action
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <MaterialCommunityIcons name="account-remove" size={18} color="#FFFFFF" />
              </View>
              <Text style={{ fontSize: 14, fontFamily: FONTS.regular, fontWeight: '500', marginLeft: 12, color: "#EF4444" }}>
                Deactivate Account
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={_onSignOutPressed} style={{ paddingVertical: 15 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: "#0A4E5A",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <MaterialCommunityIcons name="logout-variant" size={18} color="#FFFFFF" />
              </View>
              <Text style={{ fontSize: 14, fontFamily: FONTS.regular, fontWeight: '500', marginLeft: 12, color: "#111827" }}>
                Log out
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </DrawerContentScrollView>
      <DeactivateAccountModal 
        isVisible={isDeactivateModalVisible} 
        onClose={() => setIsDeactivateModalVisible(false)} 
        onSubmit={async (reason) => {
          setIsDeactivateModalVisible(false);
          try {
            const response = await CreateDeactivationRequest({ Reason: reason });
            if (response?.data?.StatusCode === "SUCCESS" || response?.data?.StatusCode === "ER0000" || response?.data?.StatusCode === "000000") {
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: response?.data?.StatusMsg || 'Deactivation request submitted successfully.'
              });
            } else {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: response?.data?.StatusMsg || 'Failed to submit request.'
              });
            }
          } catch (error) {
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: 'An unexpected error occurred. Please try again.'
            });
          }
        }} 
      />
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