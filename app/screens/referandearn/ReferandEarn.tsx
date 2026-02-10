import { View, Text, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, TextInput, Image, Alert, Linking } from "react-native";
import React, { useEffect, useState } from "react";
import { useRecoilValue } from "recoil";
import { ProfileState } from "../../atoms";
import HomeHeader from "app/components/HomeHeader";
import Container from "app/theme/Container";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { GetReferDetails, GetReferralCode } from "app/http-services";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import Clipboard from '@react-native-clipboard/clipboard';
import ModalHeaderBack from "app/components/ModalHeaderBack";
const ReferandEarn = () => {
  const currentToken = useRecoilValue(ProfileState);
  const [currency, setCurrency] = useState("£");
  const [reward, setReward] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const isFocused = useIsFocused();
  const navigation = useNavigation();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (currentToken.tokenId && currentToken.remitterId) {
      console.log('tokenId:', currentToken.tokenId);
      console.log('remitterId:', currentToken.remitterId);
      fetchReferDetails(currentToken.tokenId, currentToken.remitterId);
      fetchReferalCode(currentToken.tokenId, currentToken.remitterId);
    } else {
      console.log('tokenId or remitterId is missing');
    }
  }, [isFocused, currentToken]);

  const fetchReferDetails = async (tokenId: string, remitterId: string) => {
    try {
      setLoading(true);
      const response = await GetReferDetails(tokenId);
      if (response.status === 200) {
        setReward(response?.data?.Refer?.PotentialEarning);
      }
    } catch (error) {
      console.error("Error refer details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferalCode = async (tokenId: string, remitterId: string) => {
    try {
      setLoading(true);
      const response = await GetReferralCode(tokenId);
      console.log(response);
      if (response.status === 200) {
        setReferralCode(response?.data?.Code);
      }
    } catch (error) {
      console.error("Error referral code:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    const text = `Join by using my referral code "${referralCode}" and earn`;
    await Clipboard.setString(text);

    setCopied(true);   // show green text
    setTimeout(() => setCopied(false), 2000); // hide after 2 sec
  };



  const handleInstagramShare = async () => {
    const message = `Join using my referral code "${referralCode}" and earn rewards!`;

    try {
      // Copy text
      Clipboard.setString(message);
      // Alert.alert("Copied!", "Referral message copied. Paste it in Instagram DM.");

      // Try to open Instagram DM screen
      const dmURL = "instagram://direct";
      const canOpen = await Linking.canOpenURL(dmURL);

      if (canOpen) {
        await Linking.openURL(dmURL);
      } else {
        // Fallback → Instagram website
        await Linking.openURL("https://www.instagram.com/direct/inbox/");
      }

    } catch (error) {
      console.log("Instagram DM Error:", error);
      Alert.alert("Error", "Unable to open Instagram DM.");
    }
  };


  const handleMailShare = async () => {
    const subject = `Join KashRemit and Earn Rewards!`;
    const body = `Join using my referral code "${referralCode}" and earn rewards!`;

    // Gmail Android
    const gmailURL = `googlegmail://co?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Fallback → Default Mail App
    const mailtoURL = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      const canOpenGmail = await Linking.canOpenURL(gmailURL);

      if (canOpenGmail) {
        await Linking.openURL(gmailURL);
      } else {
        await Linking.openURL(mailtoURL);
      }
    } catch (error) {
      console.log("Mail share error:", error);
      Alert.alert("Error", "Unable to open email app.");
    }
  };

  const handleWhatsappShare = async () => {
    const message = `Join using my referral code "${referralCode}" and earn rewards!`;

    try {
      const whatsappURL = `whatsapp://send?text=${encodeURIComponent(message)}`;
      const isInstalled = await Linking.canOpenURL(whatsappURL);

      if (isInstalled) {
        await Linking.openURL(whatsappURL);
      } else {
        Alert.alert(
          "WhatsApp Not Installed",
          "Please install WhatsApp to share the referral code."
        );
      }
    } catch (error) {
      console.log("WhatsApp share error:", error);
      Alert.alert("Error", "Unable to share via WhatsApp.");
    }
  };

  const handleFacebookShare = async () => {
    const message = `Join using my referral code "${referralCode}" and earn rewards!`;

    try {
      // Copy to clipboard
      Clipboard.setString(message);

      // Messenger deep link with text
      const messengerURL = `fb-messenger://share?text=${encodeURIComponent(
        message
      )}`;

      const canOpen = await Linking.canOpenURL(messengerURL);

      if (canOpen) {
        await Linking.openURL(messengerURL);
      } else {
        // Messenger not installed → open FB website
        await Linking.openURL("https://www.facebook.com/messages/t/");
      }
    } catch (error) {
      console.log("Messenger share error:", error);
      Alert.alert("Error", "Unable to open Messenger.");
    }
  };






  return (
    <SafeAreaView style={[styles.container, { flex: 1, backgroundColor: '#316b83' }]}>
      <ModalHeaderBack title="Refer & Earn" />

      <Container style={{ backgroundColor: '#f9f9f9', flex: 1 }}>
        {/* <Text style={styles.header}>Refer & Earn</Text> */}

        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Full Card Container */}
          <View style={styles.mainCard}>

            {/* Referral Earnings */}
            <View style={styles.cardBox}>
              <View style={[styles.earningCard, { backgroundColor: "#e8f9ef" }]}>
                <Text style={styles.earningValue}>60</Text>
                <Text style={styles.earningLabel}>
                  Potential Earning <Ionicons name="information-circle-outline" size={14} color="#555" />
                </Text>
              </View>

              <View style={[styles.earningCard, { backgroundColor: "#f0f4ff" }]}>
                <Text style={styles.earningValue}>30</Text>
                <Text style={styles.earningLabel}>
                  Actual Earning <Ionicons name="information-circle-outline" size={14} color="#555" />
                </Text>
              </View>
            </View>

            {/* Reward Info */}
            <View style={styles.rewardBox}>
              <Text style={styles.rewardTitle}>Earn £10 Every Time You Refer!</Text>
              <Text style={styles.rewardSubtitle}>
                Get rewarded £10 for every friend who signs up through your referral.
              </Text>

              <View style={styles.inputRow}>
                <TextInput
                  value={`Join by using my referral code "${referralCode}" and earn`}
                  editable={false}
                  style={styles.input}
                />

                <TouchableOpacity style={styles.copyBtn} onPress={copyToClipboard}>
                  <Ionicons name="copy-outline" size={20} color="#000" />
                </TouchableOpacity>
              </View>

              {copied && (
                <Text style={styles.copiedText}>Copied!</Text>
              )}
            </View>


            {/* Social Share */}
            <View style={styles.socialRow}>
              <TouchableOpacity onPress={handleWhatsappShare}>
                <Ionicons name="logo-whatsapp" size={28} color="#1c1a40" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleInstagramShare}>
                <Ionicons name="logo-instagram" size={28} color="#1c1a40" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleFacebookShare}>
                <FontAwesome name="facebook-square" size={28} color="#1c1a40" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleMailShare}>
                <Ionicons name="mail-outline" size={28} color="#1c1a40" />
              </TouchableOpacity>
            </View>
            <Text style={styles.shareText}>Share with your friends:</Text>

            {/* Illustration */}
            <Image
              source={require("../../../assets/refer.png")}
              style={styles.illustration}
              resizeMode="contain"
            />

          </View>

        </ScrollView>
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
  header: {
    fontSize: 14,
    fontFamily: "FONTS.regular",
    fontWeight: "600",
    marginTop: 6,
    paddingLeft: 16,
    color: "#000",
  },
  mainCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },

  copiedText: {
    marginTop: 6,
    color: "green",
    fontSize: 14,
    fontFamily: "FONTS.regular",
    fontWeight: "600",
  },


  cardBox: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  backButton: {
    padding: 4,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 14,
    fontFamily: "FONTS.regular",
    fontWeight: "600",
    color: "#000",
  },
  earningCard: {
    flex: 1,
    marginHorizontal: 8,
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
  },
  earningValue: {
    fontSize: 14,
    fontFamily: "FONTS.regular",
    fontWeight: "700",
    color: "#000",
  },
  earningLabel: {
    fontSize: 13,
    fontFamily: "FONTS.regular",
    color: "#555",
    marginTop: 4,
    textAlign: "center",
  },
  rewardBox: {
    marginTop: 20,
    marginHorizontal: 16,
  },
  rewardTitle: {
    fontSize: 12,
    fontFamily: "FONTS.regular",
    fontWeight: "600",
    color: "#000",
  },
  rewardSubtitle: {
    fontSize: 12,
    fontFamily: "FONTS.regular",
    color: "#666",
    marginTop: 6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 10,
    fontFamily: "FONTS.regular",
    color: "#333",
  },
  copyBtn: {
    padding: 6,
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    gap: 18,
  },
  shareText: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "FONTS.regular",
    color: "#666",
    marginTop: 8,
  },
  illustration: {
    width: "100%",
    height: 220,
    marginTop: 20,
  },
});

export default ReferandEarn;
function setLoading(arg0: boolean) {
  throw new Error("Function not implemented.");
}

