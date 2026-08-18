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
        <View style={{ flexDirection: "row", paddingHorizontal: 20 }}>
          {visibleRoutes.map(({ key, title }, position) => {
            const isActive = tabIndex === position;
            return (
              <TouchableOpacity
                key={key}
                style={{
                  paddingVertical: 14,
                  marginRight: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderBottomWidth: 3,
                  borderBottomColor: isActive ? '#316b83' : 'transparent',
                }}
                onPress={() => setTabIndex(position)}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: isActive ? '#316b83' : '#6B7280', textAlign: 'center', letterSpacing: 0.3 }}>
                  {title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    zIndex: 999,
  },
  scrollContainer: {
    flexGrow: 1,
  },
});

export default ProfileTapHeader;
