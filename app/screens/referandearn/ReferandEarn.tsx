import { FONTS } from "../../constants/Assets";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Image, Alert, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
    <View style={[styles.container, { flex: 1, backgroundColor: '#F2F2F7' }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#316b83' }}>
        <ModalHeaderBack title="Refer & Earn" />
      </SafeAreaView>

      <Container style={{ backgroundColor: '#F2F2F7', flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Illustration */}
          <View style={styles.imageContainer}>
            <Image
              source={require("../../../assets/refer.png")}
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>

          {/* Referral Earnings */}
          <View style={styles.cardBox}>
            <View style={[styles.earningCard, { marginRight: 8 }]}>
              <Text style={styles.earningLabel}>Potential Earning</Text>
              <Text style={styles.earningValue}>{currency}{reward || '0'}</Text>
            </View>

            <View style={[styles.earningCard, { marginLeft: 8 }]}>
              <Text style={styles.earningLabel}>Actual Earning</Text>
              <Text style={styles.earningValue}>{currency}0</Text>
            </View>
          </View>

          {/* Reward Info & Code */}
          <View style={styles.sectionCard}>
            <View style={styles.rewardHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name="gift-outline" size={24} color="#316b83" />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.rewardTitle}>Earn {currency}10 Per Referral!</Text>
                <Text style={styles.rewardSubtitle}>
                  Get rewarded {currency}10 for every friend who signs up through your link.
                </Text>
              </View>
            </View>

            <View style={styles.inputRow}>
              <TextInput
                value={`Join using my code "${referralCode}"`}
                editable={false}
                style={styles.input}
              />
              <TouchableOpacity style={styles.copyBtn} onPress={copyToClipboard}>
                <Ionicons name={copied ? "checkmark" : "copy-outline"} size={20} color={copied ? "#10B981" : "#fff"} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Social Share */}
          <View style={styles.sectionCard}>
            <Text style={styles.shareText}>Share with your friends</Text>
            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialBtn} onPress={handleWhatsappShare}>
                <Ionicons name="logo-whatsapp" size={28} color="#25D366" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn} onPress={handleInstagramShare}>
                <Ionicons name="logo-instagram" size={28} color="#E1306C" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn} onPress={handleFacebookShare}>
                <FontAwesome name="facebook-square" size={28} color="#1877F2" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn} onPress={handleMailShare}>
                <Ionicons name="mail" size={28} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </Container>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  illustration: {
    width: "80%",
    height: 180,
  },
  cardBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  earningCard: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  earningLabel: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: "#6B7280",
    marginBottom: 8,
  },
  earningValue: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: "#111827",
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F0F9FF",
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: "#111827",
    marginBottom: 4,
  },
  rewardSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: "#6B7280",
    lineHeight: 18,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: "#374151",
    paddingVertical: 10,
  },
  copyBtn: {
    backgroundColor: "#316b83",
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareText: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    color: "#111827",
    marginBottom: 16,
  },
  socialRow: {
    flexDirection: "row",
    gap: 16,
  },
  socialBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F3F4F6",
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ReferandEarn;
