import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  useWindowDimensions,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRecoilValue } from "recoil";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ProfileState } from "../../atoms";
import { GetWalletBalance, WalletTransfer, GenerateOTP, ValidateOTP, SetMPIN, CheckTPINStatus, CreateTPIN, VerifyTPIN, ResetTPIN, ChangeTPIN } from "app/http-services";
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
  const [hasTpinApiState, setHasTpinApiState] = useState<boolean>(false);
  const [checkTpinLoading, setCheckTpinLoading] = useState(false);

  // TPIN Setup Form states
  const [setupPin, setSetupPin] = useState("");
  const [setupConfirmPin, setSetupConfirmPin] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);
  const [showSetupPin, setShowSetupPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  // TPIN OTP states
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [otpChannel, setOtpChannel] = useState<string>("MOBILE");
  const [otpValue, setOtpValue] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [verifyOtpLoading, setVerifyOtpLoading] = useState(false);

  // TPIN Verification Form states
  const [enteredPin, setEnteredPin] = useState("");
  const [showEnteredPin, setShowEnteredPin] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  // TPIN Reset Form states
  const [openResetTpin, setOpenResetTpin] = useState(false);
  const [resetPin, setResetPin] = useState("");
  const [resetConfirmPin, setResetConfirmPin] = useState("");
  const [showResetPin, setShowResetPin] = useState(false);
  const [showResetConfirmPin, setShowResetConfirmPin] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // TPIN Change Form states
  const [openChangeTpin, setOpenChangeTpin] = useState(false);
  const [oldTpin, setOldTpin] = useState("");
  const [newTpin, setNewTpin] = useState("");
  const [confirmNewTpin, setConfirmNewTpin] = useState("");
  const [showOldTpin, setShowOldTpin] = useState(false);
  const [showNewTpin, setShowNewTpin] = useState(false);
  const [showConfirmNewTpin, setShowConfirmNewTpin] = useState(false);
  const [changeLoading, setChangeLoading] = useState(false);

  useEffect(() => {
    if (isFocused) {
      const _currency = process.env.CURRENCY_SYMBOL || "£";
      setCurrency(_currency);
      fetchWalletBalance(currentToken.tokenId, currentToken.remitterId);
    }
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
    if (isFocused) {
      fetchUser();
    }
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
      setIsOtpVerified(false);
      setOtpValue("");

      const otpReq = {
        Email: user.Email || user.email,
        MobileNumber: user.MobileNumber || user.mobileNo,
        OTPType: "TP",
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
        type: "TP",
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

      const mpinRes = await CreateTPIN({ TPIN: setupPin });
      if (mpinRes?.data?.StatusCode === "ER0000" || mpinRes?.data?.StatusCode === "0") {
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
        setShowSetupPin(false);
        setShowConfirmPin(false);
        setHasTpinApiState(true);
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

      // Verify TPIN first
      const verifyRes = await VerifyTPIN({ TPIN: enteredPin });
      if (verifyRes?.data?.StatusCode === "ER0000" || verifyRes?.data?.StatusCode === "0") {
        const reqBody = {
          ToRemitterID: tpinValues.ToRemitterID,
          Amount: tpinValues.Amount,
          RemitterEmail: tpinValues.RemitterEmail,
          TPIN: enteredPin,
        };

        const res = await WalletTransfer(reqBody);
        console.log("RES", res);

        const statusCode = res?.data?.StatusCode;
        if (statusCode !== "ER0098") {
          setToastMsg(res?.data?.StatusMsg || "Transfer successful");
          fetchWalletBalance(currentToken.tokenId, currentToken.remitterId);

          setOpenVerifyTpin(false);
          setEnteredPin("");
          setShowEnteredPin(false);
          setReceiverId("");
          setReceiverName("");
          setAmount("");
          setEmail("");
          setShowTransferForm(false);

          setTimeout(() => {
            navigation.navigate("HomeDrawer");
          }, 1500);
        } else {
          setOpenVerifyTpin(false);
          setEnteredPin("");
          setShowEnteredPin(false);
          setToastMsg(res?.data?.StatusMsg || "TPIN Blocked. Please reset your TPIN.");
        }
      } else {
        if (verifyRes?.data?.StatusCode === "ER0098" || verifyRes?.data?.StatusCode === "ER0014") {
          setOpenVerifyTpin(false);
          setEnteredPin("");
          setShowEnteredPin(false);
          setToastMsg(verifyRes?.data?.StatusMsg || "TPIN Blocked. Please reset your TPIN.");
        } else {
          setToastMsg(verifyRes?.data?.StatusMsg || "Invalid TPIN. Please try again.");
        }
      }
    } catch (error) {
      console.error("Wallet Transfer Error: ", error);
      setToastMsg("Something went wrong. Please try again.");
    } finally {
      setShowToast(true);
      setVerifyLoading(false);
    }
  };

  const handleResetTpinSubmit = async () => {
    if (!isOtpVerified) {
      setToastMsg("Please verify OTP first");
      setShowToast(true);
      return;
    }
    if (resetPin.length !== 4 || resetConfirmPin.length !== 4) {
      setToastMsg("TPIN must be exactly 4 digits");
      setShowToast(true);
      return;
    }
    if (resetPin !== resetConfirmPin) {
      setToastMsg("TPIN and Confirm TPIN do not match");
      setShowToast(true);
      return;
    }

    try {
      setResetLoading(true);
      const res = await ResetTPIN({ TPIN: resetPin });
      if (res?.data?.StatusCode === "ER0000" || res?.data?.StatusCode === "0") {
        setResetLoading(false);
        setOpenResetTpin(false);
        setResetPin("");
        setResetConfirmPin("");
        setOtpValue("");
        setIsOtpSent(false);
        setOtpTimer(0);
        setIsOtpVerified(false);
        setShowResetPin(false);
        setShowResetConfirmPin(false);
        setToastMsg("TPIN reset successfully");
        setShowToast(true);
        setOpenVerifyTpin(true);
      } else {
        setResetLoading(false);
        setToastMsg(res?.data?.StatusMsg || "Failed to reset TPIN");
        setShowToast(true);
      }
    } catch (error) {
      console.error("Reset TPIN Error: ", error);
      setResetLoading(false);
      setToastMsg("Something went wrong. Please try again.");
      setShowToast(true);
    }
  };

  const handleChangeTpinSubmit = async () => {
    if (oldTpin.length !== 4) {
      setToastMsg("Old TPIN must be exactly 4 digits");
      setShowToast(true);
      return;
    }
    if (newTpin.length !== 4 || confirmNewTpin.length !== 4) {
      setToastMsg("New TPIN must be exactly 4 digits");
      setShowToast(true);
      return;
    }
    if (newTpin !== confirmNewTpin) {
      setToastMsg("New TPIN and Confirm TPIN do not match");
      setShowToast(true);
      return;
    }
    if (oldTpin === newTpin) {
      setToastMsg("New TPIN cannot be the same as Old TPIN");
      setShowToast(true);
      return;
    }

    try {
      setChangeLoading(true);
      const res = await ChangeTPIN({ OldTPIN: oldTpin, TPIN: newTpin });
      if (res?.data?.StatusCode === "ER0000" || res?.data?.StatusCode === "0") {
        setChangeLoading(false);
        setOpenChangeTpin(false);
        setOldTpin("");
        setNewTpin("");
        setConfirmNewTpin("");
        setShowOldTpin(false);
        setShowNewTpin(false);
        setShowConfirmNewTpin(false);
        setToastMsg("TPIN changed successfully");
        setShowToast(true);
        setOpenVerifyTpin(true);
      } else {
        setChangeLoading(false);
        setToastMsg(res?.data?.StatusMsg || "Failed to change TPIN");
        setShowToast(true);
      }
    } catch (error) {
      console.error("Change TPIN Error: ", error);
      setChangeLoading(false);
      setToastMsg("Something went wrong. Please try again.");
      setShowToast(true);
    }
  };

  const handleConfirmTransfer = async () => {
    if (!receiverId || !amount || !email) {
      setToastMsg("Please fill all fields");
      setShowToast(true);
      return;
    }

    try {
      setTpinValues({
        ToRemitterID: receiverId,
        Amount: amount,
        RemitterEmail: email,
      });

      setCheckTpinLoading(true);
      try {
        const checkRes = await CheckTPINStatus({});
        setCheckTpinLoading(false);
        const hasTpin = checkRes?.data?.HasTPIN === true;
        setHasTpinApiState(hasTpin);
        
        if (hasTpin) {
          setOpenVerifyTpin(true);
        } else {
          setOpenSetTpin(true);
        }
      } catch (err) {
        setCheckTpinLoading(false);
        // Fallback to local storage
        const userStr = await AsyncStorage.getItem("user");
        const user = userStr ? JSON.parse(userStr) : null;
        const hasPin = user?.isMPinGenerated === "Y" || user?.IsmPINgenerated === "Y";
        setHasTpinApiState(hasPin);

        if (hasPin) {
          setOpenVerifyTpin(true);
        } else {
          setOpenSetTpin(true);
        }
      }
    } catch (error) {
      console.error("Error reading user data", error);
      setToastMsg("Error checking TPIN status");
      setShowToast(true);
    }
  };

  const [integerPart, decimalPart = "00"] = accountBalance.toString().split(".");

  return (
    <View style={{ flex: 1, backgroundColor: "#F2F2F7" }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#316b83' }}>
        <HomeHeader name={currentToken.firstName} currency={currency} reward={reward} />
      </SafeAreaView>
      <Container style={{ backgroundColor: '#F2F2F7', flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Wallet Balance Card */}
          <View style={[styles.cardMainWrapper, { 
            marginHorizontal: 16, 
            marginTop: 20, 
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }]}>
            <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <Vector
                as="ionicons"
                name="wallet"
                size={18}
                color="#316b83"
                style={{ marginRight: 6 }}
              />
              <Text
                style={{
                  color: "#316b83",
                  fontSize: 15,
                  fontFamily: FONTS.bold,
                }}
              >
                My Wallet Balance
              </Text>
              <Vector
                as="ionicons"
                name="chevron-forward-outline"
                size={16}
                color="#316b83"
                style={{ marginLeft: 4 }}
              />
            </TouchableOpacity>

            <View style={{ flexDirection: "row", alignItems: "baseline", marginBottom: 6 }}>
              <Text style={{ fontSize: 28, fontFamily: FONTS.bold, color: "#111827" }}>
                {currency}
              </Text>
              <Text style={{ fontSize: 32, fontFamily: FONTS.bold, color: "#111827", marginLeft: 4 }}>
                {integerPart}
              </Text>
              <Text style={{ fontSize: 24, fontFamily: FONTS.bold, color: "#6B7280" }}>
                .{decimalPart}
              </Text>
            </View>
            <Text style={{ fontSize: 13, fontFamily: FONTS.medium, color: "#9CA3AF", marginBottom: 20 }}>
              Available Account Balance
            </Text>

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6, gap: 12 }}>
              <TouchableOpacity 
                style={{
                  flex: 1,
                  backgroundColor: "#F3F4F6",
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: "center",
                }}
                onPress={() => navigation.navigate("withdraw")}
              >
                <Text style={{ color: "#374151", fontFamily: FONTS.bold, fontSize: 15 }}>Withdraw</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={{
                  flex: 1,
                  backgroundColor: "#316b83",
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: "center",
                  shadowColor: "#316b83",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4
                }}
                onPress={() => navigation.navigate("AddFund")}
              >
                <Text style={{ color: "#fff", fontFamily: FONTS.bold, fontSize: 15 }}>Add Fund</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Steps Section */}
          {!showTransferForm && (
            <View
              style={{
                marginHorizontal: 16,
                marginTop: 16,
                padding: 20,
                backgroundColor: "#fff",
                borderRadius: 16,
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <Vector
                  as="ionicons"
                  name="swap-horizontal"
                  size={20}
                  color="#316b83"
                  style={{ marginRight: 6 }}
                />
                <Text style={{ fontFamily: FONTS.bold, fontSize: 16, color: "#316b83" }}>
                  Instant Wallet Transfers
                </Text>
              </View>

              <Text
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: 13,
                  color: "#6B7280",
                  lineHeight: 20,
                  marginBottom: 20,
                }}
              >
                Send money seamlessly from one wallet to another in real-time with just a few steps.
              </Text>

              <View style={{ marginTop: 5 }}>
                {[
                  "Enter Remitter ID of Receiver",
                  "Enter Amount to Send",
                  "Enter Registered Email ID",
                ].map((step, index) => (
                  <View key={index} style={{ flexDirection: "row", alignItems: "flex-start" }}>
                    <View style={{ alignItems: "center", width: 32 }}>
                      <View
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 13,
                          backgroundColor: "#F0F9FF",
                          borderWidth: 1.5,
                          borderColor: "#316b83",
                          justifyContent: "center",
                          alignItems: "center",
                          zIndex: 2,
                        }}
                      >
                        <Text
                          style={{
                            color: "#316b83",
                            fontFamily: FONTS.bold,
                            fontSize: 11,
                          }}
                        >
                          {`0${index + 1}`}
                        </Text>
                      </View>

                      {index < 2 && (
                        <View
                          style={{
                            width: 2,
                            height: 24,
                            backgroundColor: "#E5E7EB",
                            marginVertical: -2,
                            zIndex: 1,
                          }}
                        />
                      )}
                    </View>

                    <Text
                      style={{
                        marginLeft: 12,
                        fontFamily: FONTS.semiBold,
                        fontSize: 14,
                        color: "#374151",
                        marginTop: 4,
                      }}
                    >
                      {step}
                    </Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: "#316b83",
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: "center",
                  marginTop: 24,
                  shadowColor: "#316b83",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4
                }}
                onPress={() => setShowTransferForm(true)}
              >
                <Text style={{ color: "#fff", fontFamily: FONTS.bold, fontSize: 15 }}>Start Transfer</Text>
              </TouchableOpacity>
            </View>
          )}


          {/* Transfer Form */}
          {showTransferForm && (
            <View
              style={{
                marginHorizontal: 16,
                marginTop: 16,
                padding: 20,
                backgroundColor: "#fff",
                borderRadius: 16,
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
                <Vector
                  as="ionicons"
                  name="swap-horizontal"
                  size={20}
                  color="#316b83"
                  style={{ marginRight: 6 }}
                />
                <Text style={{ fontFamily: FONTS.bold, fontSize: 16, color: "#316b83" }}>
                  Instant Wallet Transfers
                </Text>
              </View>

              {/* Receiver ID */}
              <Text style={{ fontFamily: FONTS.semiBold, fontSize: 13, color: "#374151", marginBottom: 6 }}>
                Remitter ID of Receiver
              </Text>
              <View style={style.formInputWrapper}>
                <TextInput
                  style={style.formInput}
                  placeholder="e.g. KM00000001"
                  value={receiverId}
                  onChangeText={(val) => {
                    const alphanumeric = val.replace(/[^a-zA-Z0-9]/g, "");
                    setReceiverId(alphanumeric);
                  }}
                />
              </View>
              {receiverId ? (
                <Text style={{ fontSize: 12, color: "#316b83", fontFamily: FONTS.medium, marginBottom: 12 }}>
                  Receiver Name: {receiverName}
                </Text>
              ) : null}

              {/* Amount */}
              <Text style={{ fontFamily: FONTS.semiBold, fontSize: 13, color: "#374151", marginBottom: 6, marginTop: receiverId ? 0 : 12 }}>
                Amount to Send
              </Text>
              <View style={style.formInputWrapper}>
                <TextInput
                  style={style.formInput}
                  placeholder="Enter Amount"
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
              </View>

              {/* Email */}
              <Text style={{ fontFamily: FONTS.semiBold, fontSize: 13, color: "#374151", marginBottom: 6, marginTop: 12 }}>
                Registered Email ID
              </Text>
              <View style={[
                style.formInputWrapper,
                email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? { borderColor: "#EF4444" } : {}
              ]}>
                <TextInput
                  style={style.formInput}
                  placeholder="Enter E-mail"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={(val) => setEmail(val)}
                />
              </View>

              <View style={{ backgroundColor: "#FEF2F2", padding: 12, borderRadius: 8, marginTop: 16, marginBottom: 24 }}>
                <Text style={{ fontSize: 12, color: "#DC2626", fontFamily: FONTS.medium, lineHeight: 18 }}>
                  Note: You cannot transfer your non-withdrawal account balance.
                </Text>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: "#F3F4F6",
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: "center",
                  }}
                  onPress={() => {
                    setShowTransferForm(false);
                    setReceiverId("");
                    setReceiverName("");
                    setAmount("");
                    setEmail("");
                    setOtp("");
                  }}
                >
                  <Text style={{ color: "#374151", fontFamily: FONTS.bold, fontSize: 15 }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: "#316b83",
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    opacity: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 1 : 0.5,
                    shadowColor: "#316b83",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4
                  }}
                  onPress={handleConfirmTransfer}
                  disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || submitting || checkTpinLoading}
                >
                  {(submitting || checkTpinLoading) && <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />}
                  <Text style={{ color: "#fff", fontFamily: FONTS.bold, fontSize: 15 }}>Confirm</Text>
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
          setShowSetupPin(false);
          setShowConfirmPin(false);
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
                setShowSetupPin(false);
                setShowConfirmPin(false);
              }}
            >
              <Vector as="ionicons" name="close" size={24} color="#94a3b8" />
            </TouchableOpacity>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 8, marginTop: 10 }}>
              <Vector
                  as="ionicons"
                  name="lock-closed"
                  size={22}
                  color="#316b83"
                  style={{ marginRight: 8 }}
              />
              <Text style={{ fontSize: 18, fontFamily: FONTS.bold, color: "#316b83" }}>
                Create Transaction PIN
              </Text>
            </View>
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
                  { display: 'none' }
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
              <View style={style.inputWithIconRow}>
                <TextInput
                  placeholder="Enter 4-digit TPIN"
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry={!showSetupPin}
                  value={setupPin}
                  onChangeText={(val) => setSetupPin(val.replace(/[^0-9]/g, ''))}
                  style={[style.textInputClean, { flex: 1 }]}
                />
                <TouchableOpacity onPress={() => setShowSetupPin(!showSetupPin)}>
                  <Vector
                    as="materialcommunityicons"
                    name={showSetupPin ? "eye" : "eye-off"}
                    size={22}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={style.inputWrapper}>
              <Text style={style.inputLabel}>Confirm 4-Digit TPIN</Text>
              <View style={style.inputWithIconRow}>
                <TextInput
                  placeholder="Confirm 4-digit TPIN"
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry={!showConfirmPin}
                  value={setupConfirmPin}
                  onChangeText={(val) => setSetupConfirmPin(val.replace(/[^0-9]/g, ''))}
                  style={[style.textInputClean, { flex: 1 }]}
                />
                <TouchableOpacity onPress={() => setShowConfirmPin(!showConfirmPin)}>
                  <Vector
                    as="materialcommunityicons"
                    name={showConfirmPin ? "eye" : "eye-off"}
                    size={22}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>
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
                  setShowSetupPin(false);
                  setShowConfirmPin(false);
                }}
                disabled={setupLoading}
                style={style.modalCancelButton}
              >
                <Text style={style.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSetTpinSubmit}
                disabled={setupPin.length !== 4 || setupConfirmPin.length !== 4 || setupLoading}
                style={[
                  style.modalConfirmButton,
                  (setupPin.length !== 4 || setupConfirmPin.length !== 4) && { opacity: 0.5 }
                ]}
              >
                {setupLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={style.modalConfirmButtonText}>Create TPIN</Text>
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
          setShowEnteredPin(false);
        }}
      >
        <View style={style.modalContainer}>
          <View style={style.modalContent}>
            <TouchableOpacity
              style={style.closeButton}
              onPress={() => {
                setOpenVerifyTpin(false);
                setEnteredPin("");
                setShowEnteredPin(false);
              }}
            >
              <Vector as="ionicons" name="close" size={24} color="#94a3b8" />
            </TouchableOpacity>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 20, marginTop: 10 }}>
              <Vector
                  as="ionicons"
                  name="lock-closed"
                  size={22}
                  color="#316b83"
                  style={{ marginRight: 8 }}
              />
              <Text style={{ fontSize: 18, fontFamily: FONTS.bold, color: "#316b83" }}>
                Enter Transaction PIN
              </Text>
            </View>

            {tpinValues && (
              <View style={{ backgroundColor: "#F9FAFB", borderRadius: 12, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: "#E5E7EB" }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text style={{ fontSize: 13, color: "#6B7280", fontFamily: FONTS.medium }}>Transfer To</Text>
                  <Text style={{ fontSize: 13, color: "#111827", fontFamily: FONTS.semiBold }}>{tpinValues.ToRemitterID}</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
                  <Text style={{ fontSize: 13, color: "#6B7280", fontFamily: FONTS.medium }}>Beneficiary Email</Text>
                  <Text style={{ fontSize: 13, color: "#111827", fontFamily: FONTS.semiBold }}>{tpinValues.RemitterEmail}</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 12, borderTopWidth: 1, borderTopColor: "#E5E7EB", alignItems: "center" }}>
                  <Text style={{ fontSize: 14, color: "#374151", fontFamily: FONTS.semiBold }}>Amount</Text>
                  <Text style={{ fontSize: 16, color: "#316b83", fontFamily: FONTS.bold }}>{currency} {tpinValues.Amount}</Text>
                </View>
              </View>
            )}

            <Text style={{ fontSize: 14, color: "#4B5563", textAlign: "center", marginBottom: 20, fontFamily: FONTS.medium }}>
              Enter your secure 4-digit TPIN to complete this transfer.
            </Text>

            <View style={{ alignSelf: "center", position: "relative", marginBottom: 24, width: "70%" }}>
              <TextInput
                placeholder="••••"
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry={!showEnteredPin}
                value={enteredPin}
                onChangeText={(val) => setEnteredPin(val.replace(/[^0-9]/g, ''))}
                style={{
                    backgroundColor: "#F3F4F6",
                    borderRadius: 12,
                    fontSize: 24,
                    letterSpacing: 8,
                    textAlign: "center",
                    paddingVertical: 14,
                    color: "#111827",
                    fontFamily: FONTS.bold,
                    borderWidth: 1,
                    borderColor: "#E5E7EB"
                }}
              />
              <TouchableOpacity
                onPress={() => setShowEnteredPin(!showEnteredPin)}
                style={{
                  position: "absolute",
                  right: 16,
                  top: 0,
                  bottom: 0,
                  justifyContent: "center",
                  alignItems: "center",
                  zIndex: 2,
                }}
              >
                <Vector
                  as="materialcommunityicons"
                  name={showEnteredPin ? "eye" : "eye-off"}
                  size={22}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: "center", marginBottom: 24 }}>
              <TouchableOpacity
                onPress={() => {
                  setOpenVerifyTpin(false);
                  setEnteredPin("");
                  setShowEnteredPin(false);
                  setOpenChangeTpin(true);
                }}
              >
                <Text style={{ fontSize: 14, color: "#316b83", fontFamily: FONTS.bold }}>Change TPIN?</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setOpenVerifyTpin(false);
                  setEnteredPin("");
                  setShowEnteredPin(false);
                }}
                disabled={verifyLoading}
                style={{ flex: 1, backgroundColor: "#F3F4F6", paddingVertical: 14, borderRadius: 12, alignItems: "center" }}
              >
                <Text style={{ color: "#374151", fontFamily: FONTS.bold, fontSize: 15 }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleVerifyTpinSubmit}
                disabled={enteredPin.length !== 4 || verifyLoading}
                style={[
                  { flex: 1, backgroundColor: "#316b83", paddingVertical: 14, borderRadius: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", shadowColor: "#316b83", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
                  (enteredPin.length !== 4) && { opacity: 0.5 }
                ]}
              >
                {verifyLoading && <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />}
                <Text style={{ color: "#fff", fontFamily: FONTS.bold, fontSize: 15 }}>Verify & Transfer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reset TPIN Modal */}
      <Modal
        visible={openResetTpin}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setOpenResetTpin(false);
          setResetPin("");
          setResetConfirmPin("");
          setOtpValue("");
          setIsOtpSent(false);
          setOtpTimer(0);
          setIsOtpVerified(false);
          setShowResetPin(false);
          setShowResetConfirmPin(false);
        }}
      >
        <View style={style.modalContainer}>
          <View style={style.modalContent}>
            <TouchableOpacity
              style={style.closeButton}
              onPress={() => {
                setOpenResetTpin(false);
                setResetPin("");
                setResetConfirmPin("");
                setOtpValue("");
                setIsOtpSent(false);
                setOtpTimer(0);
                setIsOtpVerified(false);
                setShowResetPin(false);
                setShowResetConfirmPin(false);
              }}
            >
              <Vector as="ionicons" name="close" size={24} color="#94a3b8" />
            </TouchableOpacity>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 8, marginTop: 10 }}>
              <Vector
                  as="ionicons"
                  name="lock-closed"
                  size={22}
                  color="#316b83"
                  style={{ marginRight: 8 }}
              />
              <Text style={{ fontSize: 18, fontFamily: FONTS.bold, color: "#316b83" }}>
                Reset Transaction PIN
              </Text>
            </View>
            <Text style={style.modalDescription}>
              Verify your identity to reset your TPIN.
            </Text>

            <Text style={style.sectionLabel}>Verify Identity Via</Text>
            
            <View style={style.channelContainer}>
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
                  { display: 'none' }
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
              <View style={style.inputWithIconRow}>
                <TextInput
                  placeholder="Enter 4-digit TPIN"
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry={!showResetPin}
                  value={resetPin}
                  onChangeText={(val) => setResetPin(val.replace(/[^0-9]/g, ''))}
                  style={[style.textInputClean, { flex: 1 }]}
                />
                <TouchableOpacity onPress={() => setShowResetPin(!showResetPin)}>
                  <Vector
                    as="materialcommunityicons"
                    name={showResetPin ? "eye" : "eye-off"}
                    size={22}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={style.inputWrapper}>
              <Text style={style.inputLabel}>Confirm 4-Digit TPIN</Text>
              <View style={style.inputWithIconRow}>
                <TextInput
                  placeholder="Confirm 4-digit TPIN"
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry={!showResetConfirmPin}
                  value={resetConfirmPin}
                  onChangeText={(val) => setResetConfirmPin(val.replace(/[^0-9]/g, ''))}
                  style={[style.textInputClean, { flex: 1 }]}
                />
                <TouchableOpacity onPress={() => setShowResetConfirmPin(!showResetConfirmPin)}>
                  <Vector
                    as="materialcommunityicons"
                    name={showResetConfirmPin ? "eye" : "eye-off"}
                    size={22}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={style.modalButtonRow}>
              <TouchableOpacity
                onPress={() => {
                  setOpenResetTpin(false);
                  setResetPin("");
                  setResetConfirmPin("");
                  setOtpValue("");
                  setIsOtpSent(false);
                  setOtpTimer(0);
                  setIsOtpVerified(false);
                  setShowResetPin(false);
                  setShowResetConfirmPin(false);
                }}
                disabled={resetLoading}
                style={style.modalCancelButton}
              >
                <Text style={style.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleResetTpinSubmit}
                disabled={resetPin.length !== 4 || resetConfirmPin.length !== 4 || resetLoading}
                style={[
                  style.modalConfirmButton,
                  (resetPin.length !== 4 || resetConfirmPin.length !== 4) && { opacity: 0.5 }
                ]}
              >
                {resetLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={style.modalConfirmButtonText}>Reset TPIN</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change TPIN Modal */}
      <Modal
        visible={openChangeTpin}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setOpenChangeTpin(false);
          setOldTpin("");
          setNewTpin("");
          setConfirmNewTpin("");
          setShowOldTpin(false);
          setShowNewTpin(false);
          setShowConfirmNewTpin(false);
        }}
      >
        <View style={style.modalContainer}>
          <View style={style.modalContent}>
            <TouchableOpacity
              style={style.closeButton}
              onPress={() => {
                setOpenChangeTpin(false);
                setOldTpin("");
                setNewTpin("");
                setConfirmNewTpin("");
                setShowOldTpin(false);
                setShowNewTpin(false);
                setShowConfirmNewTpin(false);
              }}
            >
              <Vector as="ionicons" name="close" size={24} color="#94a3b8" />
            </TouchableOpacity>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 8, marginTop: 10 }}>
              <Vector
                  as="ionicons"
                  name="lock-closed"
                  size={22}
                  color="#316b83"
                  style={{ marginRight: 8 }}
              />
              <Text style={{ fontSize: 18, fontFamily: FONTS.bold, color: "#316b83" }}>
                Change Transaction PIN
              </Text>
            </View>
            <Text style={style.modalDescription}>
              Enter your current TPIN and set a new one.
            </Text>

            <View style={style.inputWrapper}>
              <Text style={style.inputLabel}>Current 4-Digit TPIN</Text>
              <View style={style.inputWithIconRow}>
                <TextInput
                  placeholder="Enter current TPIN"
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry={!showOldTpin}
                  value={oldTpin}
                  onChangeText={(val) => setOldTpin(val.replace(/[^0-9]/g, ''))}
                  style={[style.textInputClean, { flex: 1 }]}
                />
                <TouchableOpacity onPress={() => setShowOldTpin(!showOldTpin)}>
                  <Vector
                    as="materialcommunityicons"
                    name={showOldTpin ? "eye" : "eye-off"}
                    size={22}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={style.inputWrapper}>
              <Text style={style.inputLabel}>New 4-Digit TPIN</Text>
              <View style={style.inputWithIconRow}>
                <TextInput
                  placeholder="Enter new TPIN"
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry={!showNewTpin}
                  value={newTpin}
                  onChangeText={(val) => setNewTpin(val.replace(/[^0-9]/g, ''))}
                  style={[style.textInputClean, { flex: 1 }]}
                />
                <TouchableOpacity onPress={() => setShowNewTpin(!showNewTpin)}>
                  <Vector
                    as="materialcommunityicons"
                    name={showNewTpin ? "eye" : "eye-off"}
                    size={22}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={style.inputWrapper}>
              <Text style={style.inputLabel}>Confirm New TPIN</Text>
              <View style={style.inputWithIconRow}>
                <TextInput
                  placeholder="Confirm new TPIN"
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry={!showConfirmNewTpin}
                  value={confirmNewTpin}
                  onChangeText={(val) => setConfirmNewTpin(val.replace(/[^0-9]/g, ''))}
                  style={[style.textInputClean, { flex: 1 }]}
                />
                <TouchableOpacity onPress={() => setShowConfirmNewTpin(!showConfirmNewTpin)}>
                  <Vector
                    as="materialcommunityicons"
                    name={showConfirmNewTpin ? "eye" : "eye-off"}
                    size={22}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={style.modalButtonRow}>
              <TouchableOpacity
                onPress={() => {
                  setOpenChangeTpin(false);
                  setOldTpin("");
                  setNewTpin("");
                  setConfirmNewTpin("");
                  setShowOldTpin(false);
                  setShowNewTpin(false);
                  setShowConfirmNewTpin(false);
                }}
                disabled={changeLoading}
                style={style.modalCancelButton}
              >
                <Text style={style.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleChangeTpinSubmit}
                disabled={oldTpin.length !== 4 || newTpin.length !== 4 || confirmNewTpin.length !== 4 || changeLoading}
                style={[
                  style.modalConfirmButton,
                  (oldTpin.length !== 4 || newTpin.length !== 4 || confirmNewTpin.length !== 4) && { opacity: 0.5 }
                ]}
              >
                {changeLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={style.modalConfirmButtonText}>Change TPIN</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ToastConfig visible={showToast} message={toastMsg} onClose={() => setShowToast(false)} />
    </View>
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
  formInputWrapper: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 16,
    paddingVertical: 2,
  },
  formInput: {
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: FONTS.medium,
    color: "#111827",
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
    borderRadius: 24,
    padding: 24,
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
    fontFamily: FONTS.bold,
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
    marginTop: 10,
  },
  modalDescription: {
    fontSize: 14,
    color: "#4B5563",
    fontFamily: FONTS.medium,
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 10,
    lineHeight: 20,
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
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: "#374151",
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    fontFamily: FONTS.medium,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },
  textInputClean: {
    padding: 12,
    fontSize: 15,
    fontFamily: FONTS.medium,
    color: "#111827",
    height: "100%",
  },
  inputWithIconRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    height: 50,
    paddingRight: 12,
  },
  modalButtonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCancelButtonText: {
    color: "#374151",
    fontFamily: FONTS.bold,
    fontSize: 15,
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: "#316b83",
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    shadowColor: "#316b83",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  modalConfirmButtonText: {
    color: "#fff",
    fontFamily: FONTS.bold,
    fontSize: 15,
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
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 12,
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
