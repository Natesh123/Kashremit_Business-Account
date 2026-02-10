import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import React, { useEffect } from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { FONTS, SIZES } from "../constants/Assets";
import { SendMoneyTabState } from "../atoms";
import { theme } from '../core/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { TransferTypeListState } from "app/atoms/TransferTypeListState";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { transparent } from "react-native-paper/lib/typescript/styles/themes/v2/colors";

type Props = {
  width: number,
};

// Tab route + match identifiers
const ROUTES = [
  { title: "Cash Collection", key: "cashPickup", match: "CGMONEY" },
  { title: "Bank Transfer", key: "bankTransfer", match: "Banks" },
  { title: "Mobile Wallet", key: "mobileWallet", match: "M-PESA" },
];

const SendMoneyTapHeader = ({ width }: Props) => {

  const [tabIndex, setTabIndex] = useRecoilState(SendMoneyTabState);

  // 🔥 Get allowed TransferTypes from Recoil (NOT AsyncStorage)
  const allowedTypes = useRecoilValue(TransferTypeListState);
  const setTransferTypeList = useSetRecoilState(TransferTypeListState);

  useEffect(() => {
    const loadAllowedTypes = async () => {
      if (allowedTypes.length === 0) {
        const stored = await AsyncStorage.getItem("TransferTypeList");
        if (stored) {
          setTransferTypeList(JSON.parse(stored));
        }
      }
    };
    loadAllowedTypes();
  }, [allowedTypes.length]);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {(allowedTypes.length === 0 ? ROUTES : ROUTES.filter(route =>
          allowedTypes.some(t => t && t.toLowerCase() === route.match.toLowerCase())
        ))
          .map((route) => {
            const originalIndex = ROUTES.findIndex(r => r.key === route.key);
            return (
              <TouchableOpacity
                key={route.key}
                style={styles.buttonWrapper}
                onPress={() => setTabIndex(originalIndex)}
              >
                <LinearGradient
                  colors={tabIndex === originalIndex
                    ? [theme.colors.buttonPrimary, theme.colors.buttonSecondary]
                    : [theme.colors.secondary, theme.colors.secondary]}
                  start={{ x: -0.1, y: 0.0 }}
                  end={{ x: 1.1, y: 0.4 }}
                  style={[
                    styles.gradient,
                    {
                      width: width,
                      height: 35,
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: '#316b83', // your required color
                      borderRadius: 10,        // optional
                    }
                  ]}

                >
                  <Text style={[
                    styles.text,
                    { color: tabIndex === originalIndex ? theme.colors.buttonColor : theme.colors.text }
                  ]}>
                    {route.title}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    width: '100%',
  },
  scrollContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  buttonWrapper: {
    marginHorizontal: 5,
    borderRadius: 12,
    shadowColor: theme.colors.color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
  },
  gradient: {
    alignItems: 'center',
    borderRadius: 18,
  },
  text: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.medium,
    textAlign: 'center',
  },
});

export default SendMoneyTapHeader;
