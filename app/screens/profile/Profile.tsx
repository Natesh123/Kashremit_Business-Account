import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  Dimensions
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { ProfileState, ProfileTabState } from "../../atoms";
import Container from "app/theme/Container";
import HomeHeader from "app/components/HomeHeader";
import ProfileTapHeader from "app/components/ProfileTapHeader";
import { Navigation } from "types";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";
import { GetReferDetails, GetRemitterProfile } from "app/http-services";
import Spinner from "react-native-loading-spinner-overlay";
import PersonalDetails from "./components/personalDetails";
import BusinessDetails from "./components/BusinessDetails";
import AdditionalDetails from "./components/AdditionalDetails";
import ChangePassword from "./components/ChangePassword";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "../../styles";

type Props = {
  navigation: Navigation;
};

const Profile = ({ navigation }: Props) => {
  const { width } = useWindowDimensions();
  const screenHeight = Dimensions.get("window").height;
  const scrollRef = useRef<ScrollView>(null);

  const isFocused = useIsFocused();
  const currentToken = useRecoilValue(ProfileState);
  const [tabIndex, setTabIndex] = useRecoilState(ProfileTabState);

  const [currency, setCurrency] = useState("£");
  const [profile, setProfile] = useState<any>("");
  const [loading, setLoading] = useState(false);
  const [reward, setReward] = useState("");
  const [accountType, setAccountType] = useState<string | null>(null);

  // 🔥 Fetch AsyncStorage user
  const getAsyncUser = async () => {
    try {
      const stored = await AsyncStorage.getItem("user");

      if (stored) {
        const user = JSON.parse(stored);
        console.log("Async User:", user);
        setAccountType(user?.Is_BusinessType);
      }
    } catch (err) {
      console.log("AsyncStorage error:", err);
    }
  };

  useEffect(() => {
    getAsyncUser();
  }, []);

  useEffect(() => {
    fetchReferDetails(currentToken.tokenId, currentToken.remitterId);
    fetchRemitterProfile(currentToken.tokenId, currentToken.remitterId);
  }, [isFocused]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      x: tabIndex * width,
      animated: true,
    });
  }, [tabIndex]);

  const fetchReferDetails = async (tokenId: string, remitterId: string) => {
    try {
      setLoading(true);
      const response = GetReferDetails(tokenId);
      response
        .then((res: any) => {
          if (res.status === 200) {
            setReward(res?.data?.Refer?.PotentialEarning);
          }
        })
        .catch((err) => {
          console.error("Fetch refer details", err.response?.data?.message);
        })
        .finally(() => setLoading(false));
    } catch (error) {
      console.error("Error refer details:", error);
    }
  };

  const fetchRemitterProfile = async (tokenId: string, remitterId: string) => {
    try {
      setLoading(true);
      const response = GetRemitterProfile(tokenId);
      response
        .then((res: any) => {
          if (res.status === 200) {
            setProfile(res?.data?.Sender);
          }
        })
        .catch((err) => {
          console.error("Fetch Remitter profile", err.response?.data?.message);
        })
        .finally(() => setLoading(false));
    } catch (error) {
      console.error("Error Remitter profile:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <HomeHeader
        name={currentToken.firstName}
        currency={currency}
        reward={reward}
      />

      <ProfileTapHeader width={(width * 0.5) - 25} accountType={accountType} />

      <Container>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          style={{ height: screenHeight - 200 }}
          contentContainerStyle={{ flexDirection: "row" }}
        >
          {/* PERSONAL ALWAYS */}
          <View style={{ width }}>
            <PersonalDetails profile={profile} />
          </View>

          {/* BUSINESS ONLY IF accountType === "Y" */}
          {accountType === "Y" && (
            <View style={{ width }}>
              <BusinessDetails />
            </View>
          )}

          {/* EXTRA PAGES ALWAYS */}
          <View style={{ width }}>
            <AdditionalDetails profile={profile} />
          </View>

          <View style={{ width }}>
            <ChangePassword profile={profile} />
          </View>
        </ScrollView>

        {loading && <Spinner visible={true} size="large" animation="slide" />}
      </Container>
    </SafeAreaView>
  );
};

export default Profile;

const localStyles = StyleSheet.create({});
