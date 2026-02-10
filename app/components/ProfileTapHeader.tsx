import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import React from "react";
import { useRecoilState } from "recoil";
import { LinearGradient } from "expo-linear-gradient";
import { ProfileTabState } from "../atoms";
import { theme } from "../core/theme";
import { FONTS, SIZES } from "../constants/Assets";

const ROUTES = [
  { title: "Personal Details", key: "PersonalDetails" },
  { title: "Business Details", key: "BusinessDetails", businessOnly: true },
  { title: "Additional details", key: "AdditionalDetails" },
  { title: "Change password", key: "ChangePassword" },
];

type Props = {
  width: number;
  accountType: string | null;
};

const ProfileTapHeader = ({ width, accountType }: Props) => {
  const [tabIndex, setTabIndex] = useRecoilState(ProfileTabState);

  // 🔥 Filter Routes based on accountType
  const visibleRoutes = ROUTES.filter(
    (item) => !(item.businessOnly && accountType !== "Y")
  );

  // Ensure width is at least something sensible to avoid 0/-ve width issues
  const safeWidth = Math.max(width, 140);

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        {visibleRoutes.map(({ key, title }, position) => (
          <TouchableOpacity
            key={key}
            style={styles.buttonWrapper}
            onPress={() => setTabIndex(position)}
          >
            <LinearGradient
              colors={
                tabIndex === position
                  ? [theme.colors.buttonPrimary, theme.colors.buttonSecondary]
                  : [theme.colors.secondary, theme.colors.secondary]
              }
              start={{ x: -0.1, y: 0.0 }}
              end={{ x: 1.1, y: 0.4 }}
              style={[styles.gradient, { width: safeWidth }]}
            >
              <Text
                style={[
                  styles.text,
                  {
                    color:
                      tabIndex === position
                        ? theme.colors.buttonColor
                        : theme.colors.text,
                  },
                ]}
              >
                {title}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 70,
    width: '100%',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    zIndex: 999,
  },
  scrollContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  buttonWrapper: {
    marginHorizontal: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
    borderRadius: 18,
    minHeight: 45,
    justifyContent: "center",
  },
  text: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.medium,
    textAlign: "center",
  },
});

export default ProfileTapHeader;
