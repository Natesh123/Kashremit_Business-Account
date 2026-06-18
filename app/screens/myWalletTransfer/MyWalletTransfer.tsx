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
  Modal,
} from "react-native";
import { useRecoilValue } from "recoil";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ProfileState } from "../../atoms";
import { GetWalletBalance, WalletTransfer, GenerateOTP, ValidateOTP, SetMPIN } from "app/http-services";
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

  // TPIN state variables
  const [openVerifyTpin, setOpenVerifyTpin] = useState(false);
  const [openSetTpin, setOpenSetTpin] = useState(false);
  const [tpinValues, setTpinValues] = useState<any>(null);

  // TPIN Setup Form states
  const [setupPin, setSetupPin] = useState("");
  const [setupConfirmPin, setSetupConfirmPin] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);

  // TPIN OTP states
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [otpChannel, setOtpChannel] = useState<string>("EMAIL");
  const [otpValue, setOtpValue] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [verifyOtpLoading, setVerifyOtpLoading] = useState(false);

  // TPIN Verification Form states
  const [enteredPin, setEnteredPin] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);

  useEffect(() => {
    const _currency = process.env.CURRENCY_SYMBOL || "£";
    setCurrency(_currency);
    fetchWalletBalance(currentToken.tokenId, currentToken.remitterId);
  }, [isFocused]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userStr = await AsyncStorage.getItem("user");
        if (userStr) {
          setCurrentUser(JSON.parse(userStr));
        }
      } catch (error) {
        console.error("Error fetching user data from storage", error);
      }
    };
    fetchUser();
  }, [isFocused]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

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

  const maskEmail = (emailStr: string) => {
    if (!emailStr) return "";
    const [name, domain] = emailStr.split("@");
    if (name.length <= 3) return `***@${domain}`;
    return `${name.substring(0, 3)}***@${domain}`;
  };

  const maskMobile = (mobileStr: string) => {
    if (!mobileStr) return "";
    const clean = mobileStr.replace(/[^0-9]/g, "");
    if (clean.length <= 4) return clean;
    return `*******${clean.substring(clean.length - 4)}`;
  };

  const handleSendOtp = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user) {
        setToastMsg("User session not found.");
        setShowToast(true);
        return;
      }

      setOtpTimer(60);

      const otpReq = {
        Email: user.Email || user.email,
        MobileNumber: user.MobileNumber || user.mobileNo,
        OTPType: otpChannel === "EMAIL" ? "E" : "R",
      };

      const res = await GenerateOTP(otpReq);
      if (res?.data?.StatusCode === "ER0000") {
        setIsOtpSent(true);
        setToastMsg(`OTP successfully sent to your ${otpChannel === "EMAIL" ? "email address" : "mobile number"}.`);
      } else {
        setOtpTimer(0);
        setToastMsg(res?.data?.StatusMsg || "Failed to generate OTP");
      }
    } catch (error) {
      console.error("Generate OTP Error: ", error);
      setOtpTimer(0);
      setToastMsg("Something went wrong. Please try again.");
    } finally {
      setShowToast(true);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpValue || otpValue.length < 6) {
      setToastMsg("Please enter a valid 6-digit OTP");
      setShowToast(true);
      return;
    }

    try {
      setVerifyOtpLoading(true);
      const userStr = await AsyncStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user) {
        setToastMsg("User session not found.");
        setShowToast(true);
        setVerifyOtpLoading(false);
        return;
      }

      const otpPayload = {
        email: user.Email || user.email,
        mobile: user.MobileNumber || user.mobileNo,
        type: otpChannel === "EMAIL" ? "E" : "R",
        emailOTP: otpChannel === "EMAIL" ? otpValue : "",
        mobileOTP: otpChannel === "MOBILE" ? otpValue : ""
      };

      const otpRes = await ValidateOTP(otpPayload);
      if (otpRes?.data?.StatusCode === "ER0000") {
        setIsOtpVerified(true);
        setToastMsg("OTP verified successfully");
        setShowToast(true);
      } else {
        setToastMsg(otpRes?.data?.StatusMsg || "OTP verification failed");
        setShowToast(true);
      }
    } catch (error) {
      console.error("Verify OTP Error: ", error);
      setToastMsg("Something went wrong. Please try again.");
      setShowToast(true);
    } finally {
      setVerifyOtpLoading(false);
    }
  };

  const handleSetTpinSubmit = async () => {
    if (!isOtpVerified) {
      setToastMsg("Please verify OTP first");
      setShowToast(true);
      return;
    }
    if (setupPin.length !== 4 || setupConfirmPin.length !== 4) {
      setToastMsg("TPIN must be exactly 4 digits");
      setShowToast(true);
      return;
    }
    if (setupPin !== setupConfirmPin) {
      setToastMsg("TPIN and Confirm TPIN do not match");
      setShowToast(true);
      return;
    }

    try {
      setSetupLoading(true);
      const userStr = await AsyncStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user) {
        setToastMsg("User session not found.");
        setShowToast(true);
        setSetupLoading(false);
        return;
      }

      const setMpinPayload = {
        Password: "",
        MPIN: setupPin,
      };

      const mpinRes = await SetMPIN(setMpinPayload);
      if (mpinRes?.data?.StatusCode === "ER0000") {
        user.isMPinGenerated = "Y";
        await AsyncStorage.setItem("user", JSON.stringify(user));

        setSetupLoading(false);
        setOpenSetTpin(false);
        setSetupPin("");
        setSetupConfirmPin("");
        setOtpValue("");
        setIsOtpSent(false);
        setOtpTimer(0);
        setIsOtpVerified(false);
        setToastMsg("TPIN created successfully");
        setShowToast(true);

        setOpenVerifyTpin(true);
      } else {
        setSetupLoading(false);
        setToastMsg(mpinRes?.data?.StatusMsg || "Failed to set TPIN");
        setShowToast(true);
      }
    } catch (error) {
      console.error("Set TPIN Error: ", error);
      setSetupLoading(false);
      setToastMsg("Something went wrong. Please try again.");
      setShowToast(true);
    }
  };

  const handleVerifyTpinSubmit = async () => {
    if (enteredPin.length !== 4) {
      setToastMsg("Please enter a 4-digit TPIN");
      setShowToast(true);
      return;
    }

    try {
      setVerifyLoading(true);

      const reqBody = {
        ToRemitterID: tpinValues.ToRemitterID,
        Amount: tpinValues.Amount,
        RemitterEmail: tpinValues.RemitterEmail,
        MPIN: enteredPin,
      };

      const res = await WalletTransfer(reqBody);
      console.log("RES", res)

      const statusCode = res?.data?.StatusCode;
      if (statusCode === "ER0000" || statusCode === "ER0073" || !statusCode) {
        setToastMsg(res?.data?.StatusMsg || "Transfer successful");
        fetchWalletBalance(currentToken.tokenId, currentToken.remitterId);

        setOpenVerifyTpin(false);
        setEnteredPin("");
        setReceiverId("");
        setReceiverName("");
        setAmount("");
        setEmail("");
        setShowTransferForm(false);

        setTimeout(() => {
          navigation.navigate("HomeDrawer");
        }, 1500);
      } else {
        setToastMsg(res?.data?.StatusMsg || "Transfer failed. Please try again.");
      }
    } catch (error) {
      console.error("Wallet Transfer Error: ", error);
      setToastMsg("Something went wrong. Please try again.");
    } finally {
      setShowToast(true);
      setVerifyLoading(false);
    }
  };

  const handleConfirmTransfer = async () => {
    if (!receiverId || !amount || !email) {
      setToastMsg("Please fill all fields");
      setShowToast(true);
      return;
    }

    try {
      const userStr = await AsyncStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      const hasPin = user?.isMPinGenerated === "Y" || user?.IsmPINgenerated === "Y";

      setTpinValues({
        ToRemitterID: receiverId,
        Amount: amount,
        RemitterEmail: email,
      });

      if (hasPin) {
        setOpenVerifyTpin(true);
      } else {
        setOpenSetTpin(true);
      }
    } catch (error) {
      console.error("Error reading user data", error);
      setToastMsg("Error checking TPIN status");
      setShowToast(true);
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

      {/* Set TPIN Modal */}
      <Modal
        visible={openSetTpin}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setOpenSetTpin(false);
          setSetupPin("");
          setSetupConfirmPin("");
          setOtpValue("");
          setIsOtpSent(false);
          setOtpTimer(0);
          setIsOtpVerified(false);
        }}
      >
        <View style={style.modalContainer}>
          <View style={style.modalContent}>
            <TouchableOpacity
              style={style.closeButton}
              onPress={() => {
                setOpenSetTpin(false);
                setSetupPin("");
                setSetupConfirmPin("");
                setOtpValue("");
                setIsOtpSent(false);
                setOtpTimer(0);
                setIsOtpVerified(false);
              }}
            >
              <Vector as="ionicons" name="close" size={24} color="#94a3b8" />
            </TouchableOpacity>

            <Text style={style.modalTitle}>Set up Transaction PIN (TPIN)</Text>
            <Text style={style.modalDescription}>
              You need to set up a 4-digit TPIN to secure your transactions.
            </Text>

            <Text style={style.sectionLabel}>Verify Identity Via</Text>
            
            <View style={style.channelContainer}>
              {/* Email Card */}
              <TouchableOpacity
                onPress={() => {
                  setOtpChannel("EMAIL");
                  setOtpValue("");
                  setIsOtpSent(false);
                  setOtpTimer(0);
                }}
                style={[
                  style.channelCard,
                  otpChannel === "EMAIL" && style.channelCardSelected,
                ]}
              >
                <Vector
                  as="ionicons"
                  name="mail"
                  size={24}
                  color={otpChannel === "EMAIL" ? theme.colors.buttonPrimary : "#94a3b8"}
                  style={{ marginBottom: 6 }}
                />
                <Text style={style.channelTitle}>Email OTP</Text>
                <Text style={style.channelValue}>
                  {currentUser?.Email || currentUser?.email ? maskEmail(currentUser.Email || currentUser.email) : "N/A"}
                </Text>
              </TouchableOpacity>

              {/* SMS Card */}
              <TouchableOpacity
                onPress={() => {
                  setOtpChannel("MOBILE");
                  setOtpValue("");
                  setIsOtpSent(false);
                  setOtpTimer(0);
                }}
                style={[
                  style.channelCard,
                  otpChannel === "MOBILE" && style.channelCardSelected,
                ]}
              >
                <Vector
                  as="ionicons"
                  name="phone-portrait"
                  size={24}
                  color={otpChannel === "MOBILE" ? theme.colors.buttonPrimary : "#94a3b8"}
                  style={{ marginBottom: 6 }}
                />
                <Text style={style.channelTitle}>SMS OTP</Text>
                <Text style={style.channelValue}>
                  {currentUser?.MobileNumber || currentUser?.mobileNo ? maskMobile(currentUser.MobileNumber || currentUser.mobileNo) : "N/A"}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleSendOtp}
              disabled={otpTimer > 0}
              style={[
                style.otpButton,
                otpTimer > 0 && { backgroundColor: "#cbd5e1" }
              ]}
            >
              <Text style={[style.otpButtonText, otpTimer > 0 && { color: "#64748b" }]}>
                {otpTimer > 0 ? `Resend OTP in ${otpTimer}s` : isOtpSent ? "Resend OTP Code" : "Send OTP Verification"}
              </Text>
            </TouchableOpacity>

            {isOtpSent && (
              <View style={style.successAlert}>
                <Text style={style.successAlertText}>
                  ✓ OTP successfully sent to your registered {otpChannel === "EMAIL" ? "email address" : "mobile number"}.
                </Text>
              </View>
            )}

            {isOtpSent && (
              <View style={style.inputWrapper}>
                <Text style={style.inputLabel}>Enter OTP Code</Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TextInput
                    placeholder="Enter 6-digit OTP"
                    keyboardType="numeric"
                    maxLength={6}
                    editable={!isOtpVerified}
                    value={otpValue}
                    onChangeText={(val) => setOtpValue(val.replace(/[^0-9]/g, ''))}
                    style={[style.textInput, { flex: 1 }]}
                  />
                  <TouchableOpacity
                    onPress={handleVerifyOtp}
                    disabled={otpValue.length < 6 || verifyOtpLoading || isOtpVerified}
                    style={[
                      style.otpVerifyBtn,
                      isOtpVerified && { backgroundColor: "#166534" },
                      (otpValue.length < 6 && !isOtpVerified) && { opacity: 0.5 }
                    ]}
                  >
                    {verifyOtpLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={style.otpVerifyBtnText}>
                        {isOtpVerified ? "Verified" : "Verify"}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={style.inputWrapper}>
              <Text style={style.inputLabel}>New 4-Digit TPIN</Text>
              <TextInput
                placeholder="Enter 4-digit TPIN"
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry={true}
                value={setupPin}
                onChangeText={(val) => setSetupPin(val.replace(/[^0-9]/g, ''))}
                style={style.textInput}
              />
            </View>

            <View style={style.inputWrapper}>
              <Text style={style.inputLabel}>Confirm 4-Digit TPIN</Text>
              <TextInput
                placeholder="Confirm 4-digit TPIN"
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry={true}
                value={setupConfirmPin}
                onChangeText={(val) => setSetupConfirmPin(val.replace(/[^0-9]/g, ''))}
                style={style.textInput}
              />
            </View>

            <View style={style.modalButtonRow}>
              <TouchableOpacity
                onPress={() => {
                  setOpenSetTpin(false);
                  setSetupPin("");
                  setSetupConfirmPin("");
                  setOtpValue("");
                  setIsOtpSent(false);
                  setOtpTimer(0);
                  setIsOtpVerified(false);
                }}
                disabled={setupLoading}
                style={style.modalCancelButton}
              >
                <Text style={style.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSetTpinSubmit}
                disabled={!isOtpVerified || setupPin.length !== 4 || setupConfirmPin.length !== 4 || setupLoading}
                style={[
                  style.modalConfirmButton,
                  (!isOtpVerified || setupPin.length !== 4 || setupConfirmPin.length !== 4) && { opacity: 0.5 }
                ]}
              >
                {setupLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={style.modalConfirmButtonText}>Set TPIN</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Verify TPIN Modal */}
      <Modal
        visible={openVerifyTpin}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setOpenVerifyTpin(false);
          setEnteredPin("");
        }}
      >
        <View style={style.modalContainer}>
          <View style={style.modalContent}>
            <TouchableOpacity
              style={style.closeButton}
              onPress={() => {
                setOpenVerifyTpin(false);
                setEnteredPin("");
              }}
            >
              <Vector as="ionicons" name="close" size={24} color="#94a3b8" />
            </TouchableOpacity>

            <Text style={style.modalTitle}>Enter Transaction PIN (TPIN)</Text>

            {tpinValues && (
              <View style={style.summaryCard}>
                <View style={style.summaryRow}>
                  <Text style={style.summaryLabel}>Transfer To:</Text>
                  <Text style={style.summaryValue}>{tpinValues.ToRemitterID}</Text>
                </View>
                <View style={style.summaryRow}>
                  <Text style={style.summaryLabel}>Beneficiary Email:</Text>
                  <Text style={style.summaryValue}>{tpinValues.RemitterEmail}</Text>
                </View>
                <View style={style.summaryRow}>
                  <Text style={style.summaryLabel}>Amount:</Text>
                  <Text style={style.summaryAmount}>{currency} {tpinValues.Amount}</Text>
                </View>
              </View>
            )}

            <Text style={style.modalDescription}>
              Enter your secure 4-digit TPIN to complete this transfer.
            </Text>

            <TextInput
              placeholder="••••"
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry={true}
              value={enteredPin}
              onChangeText={(val) => setEnteredPin(val.replace(/[^0-9]/g, ''))}
              style={style.pinCodeInput}
            />

            <View style={style.modalButtonRow}>
              <TouchableOpacity
                onPress={() => {
                  setOpenVerifyTpin(false);
                  setEnteredPin("");
                }}
                disabled={verifyLoading}
                style={style.modalCancelButton}
              >
                <Text style={style.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleVerifyTpinSubmit}
                disabled={enteredPin.length !== 4 || verifyLoading}
                style={[
                  style.modalConfirmButton,
                  (enteredPin.length !== 4) && { opacity: 0.5 }
                ]}
              >
                {verifyLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={style.modalConfirmButtonText}>Verify & Transfer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    width: "90%",
    maxWidth: 400,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: "absolute",
    right: 15,
    top: 15,
    zIndex: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FONTS.semibold,
    color: "#1c1a40",
    textAlign: "center",
    marginBottom: 10,
    marginTop: 10,
  },
  modalDescription: {
    fontSize: 13,
    color: "#7e7e7e",
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 10,
    lineHeight: 18,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: FONTS.semibold,
    color: "#1c1a40",
    marginBottom: 10,
  },
  channelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 15,
  },
  channelCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  channelCardSelected: {
    borderColor: theme.colors.buttonPrimary,
    backgroundColor: "#f0f9ff",
    borderWidth: 2,
  },
  channelTitle: {
    fontSize: 13,
    fontFamily: FONTS.semibold,
    color: "#1c1a40",
    marginBottom: 2,
  },
  channelValue: {
    fontSize: 11,
    color: "#64748b",
    textAlign: "center",
  },
  otpButton: {
    backgroundColor: theme.colors.buttonPrimary,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  otpButtonText: {
    color: "#fff",
    fontFamily: FONTS.semibold,
    fontSize: 14,
  },
  otpVerifyBtn: {
    backgroundColor: theme.colors.buttonPrimary,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  otpVerifyBtnText: {
    color: "#fff",
    fontFamily: FONTS.semibold,
    fontSize: 14,
  },
  successAlert: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  successAlertText: {
    color: "#166534",
    fontSize: 12,
  },
  inputWrapper: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
    color: "#1c1a40",
    marginBottom: 5,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: "#1c1a40",
    backgroundColor: "#fff",
  },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 10,
  },
  modalCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#94a3b8",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCancelButtonText: {
    color: "#475569",
    fontFamily: FONTS.semibold,
    fontSize: 14,
  },
  modalConfirmButton: {
    backgroundColor: theme.colors.buttonPrimary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 100,
  },
  modalConfirmButtonText: {
    color: "#fff",
    fontFamily: FONTS.semibold,
    fontSize: 14,
  },
  summaryCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#7e7e7e",
  },
  summaryValue: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
    color: "#1c1a40",
  },
  summaryAmount: {
    fontSize: 14,
    fontFamily: FONTS.semibold,
    color: "#2B657BFF",
  },
  pinCodeInput: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingVertical: 12,
    fontSize: 24,
    textAlign: "center",
    letterSpacing: 10,
    fontFamily: FONTS.bold,
    color: "#1c1a40",
    backgroundColor: "#fff",
    width: "60%",
    alignSelf: "center",
    marginBottom: 20,
  },
});

export default MyWalletTransfer;
