import React, { useState, useEffect } from "react";
import {
  Image,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from 'expo-web-browser';
import { theme } from "../../core/theme";
import Button from "../../components/Button";
import Container from "../../theme/Container";
import styles from "../../styles";
import Vector from "../../assets/vectors";
import { emailValidator, passwordValidator } from "../../core/utils";
import { SafeAreaView } from "react-native-safe-area-context";
import { ValidatePreRegistration } from "app/http-services";
import { useRecoilState } from "recoil";
import { useNavigation } from "@react-navigation/native";
import { ProfileState } from "app/atoms";
import Toast from "react-native-toast-message";
import Spinner from "react-native-loading-spinner-overlay";
import Checkbox from "app/components/Checkbox";
import { FONTS } from "app/constants/Assets";
import AsyncStorage from "@react-native-async-storage/async-storage"; // ✅ Added

const Signup = () => {
  const navigation = useNavigation();
  const [ProfileItems, setProfileItems] = useRecoilState(ProfileState);
  const [loading, setLoading] = useState(false);

  // ✅ Account Type (default = personal)
  const [accountType, setAccountType] = useState("personal");

  // ✅ Personal form states
  const [email, setEmail] = useState({ value: "", error: "" });
  const [password, setPassword] = useState({ value: "", error: "" });
  const [mobileNo, setMobileNo] = useState({ value: "", error: "" });
  const [countryCode, setCountryCode] = useState({ value: "91", error: "" });
  const [referralId, setReferralId] = useState({ value: "", error: "" });

  // ✅ Business form states
  const [businessName, setBusinessName] = useState({ value: "", error: "" });
  const [gstNumber, setGstNumber] = useState({ value: "", error: "" });

  const [checkedTerms, setCheckedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const toggleShowPassword = () => setShowPassword(!showPassword);

  // ✅ Save selected account type
  const handleAccountTypeChange = async (type) => {
    setAccountType(type);
    try {
      const value = type === "personal" ? "Personal" : "Business";
      await AsyncStorage.setItem("accountType", value);
      console.log("Account type stored:", value);
    } catch (error) {
      console.log("Error saving account type:", error);
    }
  };

  // ✅ Load stored account type (set default = Personal if empty)
  useEffect(() => {
    const loadAccountType = async () => {
      try {
        const savedType = await AsyncStorage.getItem("accountType");
        if (savedType) {
          setAccountType(savedType.toLowerCase());
          console.log("Loaded account type:", savedType);
        } else {
          // Default to Personal
          await AsyncStorage.setItem("accountType", "Personal");
          setAccountType("personal");
          console.log("Defaulted to Personal");
        }
      } catch (error) {
        console.log("Error loading account type:", error);
      }
    };
    loadAccountType();
  }, []);

  // =========================
  // SIGNUP FUNCTION
  // =========================
  const _onLoginPressed = async () => {
    setLoading(true);

    const emailError = emailValidator(email.value);
    const passwordError = passwordValidator(password.value);
    const mobileError =
      mobileNo.value.length < 10 ? "Enter a valid mobile number" : "";

    setEmail({ ...email, error: emailError });
    setPassword({ ...password, error: passwordError });
    setMobileNo({ ...mobileNo, error: mobileError });

    if (emailError || passwordError || mobileError) {
      Toast.show({
        type: "info",
        text1: "Sign up",
        text2: "Please enter valid details.",
      });
      setLoading(false);
      return;
    }

    if (!checkedTerms) {
      Toast.show({
        type: "info",
        text1: "Sign up",
        text2: "Please agree to the Terms & Conditions.",
      });
      setLoading(false);
      return;
    }

    const postData = {
      email: email.value,
      mobileNumber: countryCode.value + "-" + mobileNo.value,
      password: password.value,
      referralId: referralId.value,
      accountType: accountType === "personal" ? "Personal" : "Business",
      businessName: businessName.value,
      gstNumber: gstNumber.value,
    };

    try {
      const res = await ValidatePreRegistration(postData);
      if (res.status === 200) {
        if (res.data.StatusCode === "ER0000") {
          Toast.show({
            type: "success",
            text1: "Registration",
            text2: "OTP has been sent to your registered mobile number",
          });

          let param = {
            email: email.value,
            mobile: countryCode.value + "-" + mobileNo.value,
            password: password.value,
            referralId: referralId.value,
          };

          navigation.navigate("ValidateRegistration", param);
        } else {
          Toast.show({
            type: "error",
            text1: "Registration",
            text2: res.data.StatusMsg,
          });
        }
      }
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Registration",
        text2: err.toString(),
      });
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // UI PART
  // =========================
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: "#fff" }]}>
      <Container>
        {/* HEADER */}
        <View style={{ width: "100%", padding: 20, paddingBottom: 0 }}>
          <LinearGradient
            colors={[theme.colors.buttonPrimary, theme.colors.buttonSecondary]}
            start={{ x: -0.1, y: 0.0 }}
            end={{ x: 1.1, y: 0.4 }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 50,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TouchableOpacity onPress={() => navigation.navigate("Onboarding")}>
              <Vector
                as="ionicons"
                name="arrow-back"
                style={{ color: theme.colors.inSideColor }}
                size={22}
              />
            </TouchableOpacity>
          </LinearGradient>

          <Text
            style={{
              fontSize: 18,
              fontFamily: FONTS.bold,
              marginVertical: 10,
            }}
          >
            Sign up
          </Text>
        </View>


           <View style={{ alignItems: "center", marginBottom: 20 }}>
              <Image
                source={require("../../assets/icons/LoginBanner.png")}
                style={{
                  width: 200,
                  height: 200,
                  borderRadius: 20, // optional
                }}
                resizeMode="cover"
              />
            </View>


        {/* ACCOUNT TYPE SWITCH */}
        <View
          style={{
            flexDirection: "row",
            marginTop: 15,
            marginHorizontal: 20,
            backgroundColor: "#F2F2F7",
            borderRadius: 14,
            padding: 3,
          }}
        >
          {/* Personal */}
          <TouchableOpacity
            onPress={() => handleAccountTypeChange("personal")}
            style={{ flex: 1 }}
            activeOpacity={0.8}
          >
            <View
              style={[
                {
                  paddingVertical: 10,
                  alignItems: "center",
                  borderRadius: 11,
                },
                accountType === "personal"
                  ? { 
                      backgroundColor: "#FFFFFF",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.15,
                      shadowRadius: 3,
                      elevation: 2,
                    }
                  : {},
              ]}
            >
              <Text
                style={{
                  color: accountType === "personal" ? "#316b83" : "#8E8E93",
                  fontFamily: FONTS.semiBold,
                  fontSize: 14,
                }}
              >
                Personal Account
              </Text>
            </View>
          </TouchableOpacity>

          {/* Business */}
          <TouchableOpacity
            onPress={() => handleAccountTypeChange("business")}
            style={{ flex: 1 }}
            activeOpacity={0.8}
          >
            <View
              style={[
                {
                  paddingVertical: 10,
                  alignItems: "center",
                  borderRadius: 11,
                },
                accountType === "business"
                  ? { 
                      backgroundColor: "#FFFFFF",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.15,
                      shadowRadius: 3,
                      elevation: 2,
                    }
                  : {},
              ]}
            >
              <Text
                style={{
                  color: accountType === "business" ? "#316b83" : "#8E8E93",
                  fontFamily: FONTS.semiBold,
                  fontSize: 14,
                }}
              >
                Business Account
              </Text>
            </View>
          </TouchableOpacity>
        </View>
             {/* FORM */}
      <ScrollView
          style={{ width: "100%", paddingHorizontal: 20, paddingTop: 15, backgroundColor: "#fff"}}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
        >
          {/* PERSONAL FORM */}
          {accountType === "personal" && (
            <View style={{ gap: 16 }}>
              {/* Email */}
              <View>
                <Text style={localStyles.inputLabel}>Email Address</Text>
                <View style={localStyles.inputWrapper}>
                  <TextInput
                    style={localStyles.input}
                    value={email.value}
                    onChangeText={(text) => setEmail({ value: text, error: "" })}
                    placeholder="Enter your email"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                {email.error ? <Text style={localStyles.errorText}>{email.error}</Text> : null}
              </View>

              {/* Mobile */}
              <View>
                <Text style={localStyles.inputLabel}>Mobile Number</Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={[localStyles.inputWrapper, { width: 70, justifyContent: "center", alignItems: "center" }]}>
                    <Text style={{ fontSize: 16, fontFamily: FONTS.medium, color: "#111827" }}>
                      +{countryCode.value}
                    </Text>
                  </View>
                  <View style={[localStyles.inputWrapper, { flex: 1 }]}>
                    <TextInput
                      style={localStyles.input}
                      value={mobileNo.value}
                      placeholder="Enter mobile number"
                      placeholderTextColor="#9CA3AF"
                      onChangeText={(text) => setMobileNo({ value: text, error: "" })}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                {mobileNo.error ? <Text style={localStyles.errorText}>{mobileNo.error}</Text> : null}
              </View>

              {/* Password */}
              <View>
                <Text style={localStyles.inputLabel}>Password</Text>
                <View style={localStyles.inputWrapper}>
                  <TextInput
                    style={localStyles.input}
                    placeholder="Create a password"
                    placeholderTextColor="#9CA3AF"
                    value={password.value}
                    secureTextEntry={!showPassword}
                    onChangeText={(text) => setPassword({ value: text, error: "" })}
                  />
                  <TouchableOpacity onPress={toggleShowPassword} style={{ padding: 10, marginRight: -10 }}>
                    <Vector
                      as="materialcommunityicons"
                      name={showPassword ? "eye" : "eye-off"}
                      size={22}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                </View>
                {password.error ? <Text style={localStyles.errorText}>{password.error}</Text> : null}
              </View>
            </View>
          )}

          {/* BUSINESS FORM */}
          {accountType === "business" && (
            <View style={{ gap: 16 }}>
              {/* Email */}
              <View>
                <Text style={localStyles.inputLabel}>Business Email</Text>
                <View style={localStyles.inputWrapper}>
                  <TextInput
                    style={localStyles.input}
                    value={email.value}
                    onChangeText={(text) => setEmail({ value: text, error: "" })}
                    placeholder="Enter business email"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                {email.error ? <Text style={localStyles.errorText}>{email.error}</Text> : null}
              </View>

              {/* Mobile */}
              <View>
                <Text style={localStyles.inputLabel}>Business Phone</Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={[localStyles.inputWrapper, { width: 70, justifyContent: "center", alignItems: "center" }]}>
                    <Text style={{ fontSize: 16, fontFamily: FONTS.medium, color: "#111827" }}>
                      +{countryCode.value}
                    </Text>
                  </View>
                  <View style={[localStyles.inputWrapper, { flex: 1 }]}>
                    <TextInput
                      style={localStyles.input}
                      value={mobileNo.value}
                      placeholder="Enter mobile number"
                      placeholderTextColor="#9CA3AF"
                      onChangeText={(text) => setMobileNo({ value: text, error: "" })}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                {mobileNo.error ? <Text style={localStyles.errorText}>{mobileNo.error}</Text> : null}
              </View>

              {/* Password */}
              <View>
                <Text style={localStyles.inputLabel}>Password</Text>
                <View style={localStyles.inputWrapper}>
                  <TextInput
                    style={localStyles.input}
                    placeholder="Create a password"
                    placeholderTextColor="#9CA3AF"
                    value={password.value}
                    secureTextEntry={!showPassword}
                    onChangeText={(text) => setPassword({ value: text, error: "" })}
                  />
                  <TouchableOpacity onPress={toggleShowPassword} style={{ padding: 10, marginRight: -10 }}>
                    <Vector
                      as="materialcommunityicons"
                      name={showPassword ? "eye" : "eye-off"}
                      size={22}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                </View>
                {password.error ? <Text style={localStyles.errorText}>{password.error}</Text> : null}
              </View>
            </View>
          )}

          {/* TERMS & CONDITIONS */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 25,
              marginBottom: 20,
              flexWrap: "wrap",
            }}
          >
            <Checkbox
              status={checkedTerms ? "checked" : "unchecked"}
              onPress={() => setCheckedTerms(!checkedTerms)}
              label="I agree to the"
            />
            <TouchableOpacity onPress={() => WebBrowser.openBrowserAsync('https://kashminds.com/terms-and-conditions')}>
              <Text style={{ color: "#316b83", fontFamily: FONTS.bold, marginLeft: 5, fontSize: 13 }}>
                Terms & Conditions
              </Text>
            </TouchableOpacity>
            <Text style={{ marginHorizontal: 4, fontSize: 13, color: '#666' }}>and</Text>
            <TouchableOpacity onPress={() => WebBrowser.openBrowserAsync('https://kashminds.com/privacy-policy')}>
              <Text style={{ color: "#316b83", fontFamily: FONTS.bold, fontSize: 13 }}>
                Privacy Policy
              </Text>
            </TouchableOpacity>
          </View>

          {/* SIGN UP BUTTON */}
          <TouchableOpacity 
            style={[localStyles.primaryButton, (!checkedTerms || !email.value || !password.value || !mobileNo.value) && localStyles.primaryButtonDisabled]} 
            onPress={_onLoginPressed}
            activeOpacity={0.8}
            disabled={!checkedTerms || !email.value || !password.value || !mobileNo.value}
          >
            <Text style={localStyles.primaryButtonText}>Sign Up</Text>
          </TouchableOpacity>

          <View style={localStyles.loginContainer}>
            <Text style={localStyles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={localStyles.loginLink}>Login now</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>

        {loading && (
          <Spinner visible={true} size="large" animation="slide" />
        )}
      </Container>
    </SafeAreaView>
  );
};

const localStyles = {
  inputLabel: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: "#374151",
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: "#111827",
  },
  errorText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: "#EF4444",
    marginTop: 6,
    marginLeft: 4,
  },
  primaryButton: {
    backgroundColor: "#316b83",
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#316b83",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
    marginTop: 10,
  },
  primaryButtonDisabled: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: "#ffffff",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: "#6B7280",
  },
  loginLink: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: "#316b83",
  },
};

export default Signup;
