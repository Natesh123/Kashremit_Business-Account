import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  useWindowDimensions,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRecoilValue } from "recoil";
import { useIsFocused, useNavigation } from "@react-navigation/native";

import { ProfileState } from "../../atoms";
import { GetWalletBalance, WalletTransfer } from "app/http-services";
import { FONTS, SIZES } from "../../constants/Assets";
import { theme } from "../../core/theme";

import HomeHeader from "app/components/HomeHeader";
import Button from "app/components/controls/Button";
import Container from "app/theme/Container";
import Vector from "app/assets/vectors";
import ToastConfig from "app/components/ToastConfig";
import styles from "app/styles";

const MyWalletTransfer = () => {
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const currentToken = useRecoilValue(ProfileState);

  const isFocused = useIsFocused();

  const [currency, setCurrency] = useState("£");
  const [reward, setReward] = useState("");
  const [accountBalance, setAccountBalance] = useState("0.00");
  const [withdrawAccountBalance, setWithdrawAccountBalance] = useState("");

  const [receiverId, setReceiverId] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [amount, setAmount] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [showTransferForm, setShowTransferForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    const _currency = process.env.CURRENCY_SYMBOL || "£";
    setCurrency(_currency);
    fetchWalletBalance(currentToken.tokenId, currentToken.remitterId);
  }, [isFocused]);

  const fetchWalletBalance = async (tokenId: string, remitterId: string) => {
    try {
      setLoading(true);
      const res = await GetWalletBalance(tokenId);
      if (res?.status === 200) {
        setAccountBalance(res?.data?.BalanceAmount || "0.00");
        setWithdrawAccountBalance(res?.data?.WD_BalanceAmount || "0.00");
      }
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmTransfer = async () => {
    if (!receiverId || !amount || !email) {
      setToastMsg("Please fill all fields");
      setShowToast(true);
      return;
    }

    try {
      setSubmitting(true);

      const reqBody = {
        ToRemitterID: receiverId,
        Amount: amount,
        RemitterEmail: email,
        OTP: otp,
      };

      const res = await WalletTransfer(reqBody);
      console.log("RES", res)

      if (res?.data?.StatusCode === "ER0073") {
        setToastMsg(res.data.StatusMsg);
        fetchWalletBalance(currentToken.tokenId, currentToken.remitterId);
      } else {
        setToastMsg(res?.data?.StatusMsg || "Transaction failed. Please try again.");
      }

      // 🔥 Common reset code — runs for both IF & ELSE
      setReceiverId("");
      setReceiverName("");
      setAmount("");
      setEmail("");
      setOtp("");
      setShowTransferForm(false);

      setTimeout(() => {
        navigation.navigate("HomeDrawer");
      }, 500);

    } catch (error) {
      console.error("Wallet Transfer Error: ", error);
      setToastMsg("Something went wrong. Please try again.");
    } finally {
      setShowToast(true);
      setSubmitting(false);
    }
  };

  const [integerPart, decimalPart = "00"] = accountBalance.toString().split(".");

  return (
    <SafeAreaView style={style.container}>
      <HomeHeader name={currentToken.firstName} currency={currency} reward={reward} />
      <Container>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Wallet Balance Card */}
          <View style={[styles.cardMainWrapper, { margin: 20, marginBottom: 0 }]}>
            <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <Text
                style={{
                  color: theme.colors.color,
                  fontSize: 12,
                  fontFamily: FONTS.regular,
                  fontWeight: "bold"
                }}
              >
                My Wallet Balance
              </Text>
              <Vector
                as="ionicons"
                name="chevron-forward-outline"
                size={18}
                color={theme.colors.buttonPrimary}
                style={{ marginLeft: 5 }}
              />
            </TouchableOpacity>

            <Text
              style={{
                color: theme.colors.black50,
                fontSize: 12,
                fontFamily: FONTS.regular,
                marginVertical: 10,
              }}
            >
              <Text>{currency}</Text> &nbsp;
              <Text
                style={{
                  color: "#1c1a40",
                  fontFamily: FONTS.semibold,
                  fontSize: 12,
                  marginHorizontal: 5,
                }}
              >
                {integerPart}
                <Text style={{ color: theme.colors.black50 }}>.{decimalPart}</Text>
              </Text>
              &nbsp; Your Account balance
            </Text>

            <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 10 }}>
              <View style={{ flex: 1, marginRight: 5 }}>
                <Button onPress={() => navigation.navigate("withdraw")} outerLine>
                  Withdraw
                </Button>
              </View>
              <View style={{ flex: 1, marginLeft: 5 }}>
                <Button onPress={() => navigation.navigate("AddFund")}>Add Fund</Button>
              </View>
            </View>
          </View>

          {/* Steps Section */}
          {!showTransferForm && (
            <View
              style={{
                margin: 20,
                padding: 15,
                backgroundColor: "#fff",
                borderRadius: 10,
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 4,
              }}
            >
              <Text style={{ fontFamily: FONTS.semibold, fontSize: 14, marginBottom: 4 }}>
                Instant Wallet-to-Wallet Transfers
              </Text>

              <Text
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: 12,
                  color: theme.colors.black50,
                  marginTop: 10,
                }}
              >
                Send money seamlessly from one wallet to another in real-time with just a few steps
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginTop: 15,
                }}
              >
                <View style={{ flex: 1 }}>
                  {[
                    "Enter remitter id of receiver",
                    "Enter amount to send",
                    "Enter registered email Id",
                  ].map((step, index) => (
                    <View key={index} style={{ flexDirection: "row", alignItems: "flex-start" }}>
                      <View style={{ alignItems: "center" }}>
                        <View
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            backgroundColor: "#fff",
                            borderWidth: 1,
                            borderColor: theme.colors.buttonPrimary,
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Text
                            style={{
                              color: theme.colors.buttonPrimary,
                              fontFamily: FONTS.semibold,
                            }}
                          >
                            {`0${index + 1}`}
                          </Text>
                        </View>

                        {index < 2 && (
                          <View
                            style={{
                              width: 1,
                              height: 30,
                              borderStyle: "dashed",
                              borderWidth: 1,
                              borderColor: "#ccc",
                            }}
                          />
                        )}
                      </View>

                      <Text
                        style={{
                          marginLeft: 10,
                          fontFamily: FONTS.regular,
                          fontSize: 12,
                          color: theme.colors.black50,
                          marginTop: 4,
                        }}
                      >
                        {step}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: theme.colors.buttonPrimary,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 20,
                  alignSelf: "flex-end",
                  marginTop: 20,
                }}
                onPress={() => setShowTransferForm(true)}
              >
                <Text style={{ color: "#fff", fontFamily: FONTS.semibold }}>Start Transfer</Text>
              </TouchableOpacity>
            </View>
          )}


          {/* Transfer Form */}
          {showTransferForm && (
            <View
              style={{
                margin: 20,
                padding: 15,
                backgroundColor: "#fff",
                borderRadius: 10,
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 4,
              }}
            >
              <Text style={{ fontFamily: FONTS.semibold, fontSize: 14 }}>
                Instant Wallet-to-Wallet Transfers
              </Text>

              {/* Receiver ID */}
              <Text style={{ fontFamily: FONTS.regular, fontSize: SIZES.small, marginTop: 20, padding: 5 }}>
                01 Enter remitter id of receiver
              </Text>
              <TextInput
                style={style.input}
                placeholder="KM00000001"
                value={receiverId}
                onChangeText={(val) => {
                  const alphanumeric = val.replace(/[^a-zA-Z0-9]/g, "");
                  setReceiverId(alphanumeric);
                }}
              />
              {receiverId ? (
                <Text style={{ fontSize: 12, color: theme.colors.black50 }}>
                  Receiver Name : {receiverName}
                </Text>
              ) : null}

              {/* Amount */}
              <Text style={{ fontFamily: FONTS.regular, fontSize: 12, marginTop: 20, padding: 5 }}>
                02 Enter amount to send
              </Text>
              <TextInput
                style={style.input}
                placeholder="Enter amount"
                keyboardType="numeric"
                value={amount}
                onChangeText={(val) => {
                  const onlyNums = val.replace(/[^0-9.]/g, "");
                  const parts = onlyNums.split(".");
                  let finalVal = parts[0];
                  if (parts.length > 1) {
                    finalVal += "." + parts[1].slice(0, 2);
                  }
                  setAmount(finalVal);
                }}
              />

              {/* Email */}
              <Text style={{ fontFamily: FONTS.regular, fontSize: 12, marginTop: 20, padding: 5 }}>
                03 Enter registered email Id
              </Text>
              <TextInput
                style={[
                  style.input,
                  {
                    borderColor:
                      email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
                        ? "red"
                        : "#ccc",
                  },
                ]}
                placeholder="Enter E-mail"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(val) => setEmail(val)}
              />

              <Text style={{ fontSize: 11, color: "red", marginTop: 10, marginBottom: 20 }}>
                Please note: you cannot transfer your non withdrawal account balance
              </Text>

              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <TouchableOpacity
                  style={[style.button, { borderColor: "#999", backgroundColor: "#fff" }]}
                  onPress={() => {
                    // Close the form
                    setShowTransferForm(false);

                    // Clear all fields
                    setReceiverId("");
                    setReceiverName("");
                    setAmount("");
                    setEmail("");
                    setOtp("");
                  }}
                >
                  <Text style={{ color: "#333", fontFamily: FONTS.semibold }}>Cancel</Text>
                </TouchableOpacity>


                <TouchableOpacity
                  style={[
                    style.button,
                    {
                      backgroundColor: theme.colors.buttonPrimary,
                      opacity: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 1 : 0.5,
                      flexDirection: "row",
                      justifyContent: "center",
                    },
                  ]}
                  onPress={handleConfirmTransfer}
                  disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || submitting}
                >
                  {submitting && <ActivityIndicator color="#fff" style={{ marginRight: 6 }} />}
                  <Text style={{ color: "#fff", fontFamily: FONTS.semibold }}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </Container>
      <ToastConfig visible={showToast} message={toastMsg} onClose={() => setShowToast(false)} />
    </SafeAreaView>
  );
};

const style = StyleSheet.create({
  container: {
    // marginTop: "8%",
    flex: 1,
    backgroundColor: "#f5f7f9",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
    marginBottom: 4,
  },
  button: {
    flex: 1,
    borderRadius: 20,
    alignItems: "center",
    padding: 12,
    marginHorizontal: 5,
  },
});

export default MyWalletTransfer;
