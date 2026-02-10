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
            marginTop: 10,
            marginHorizontal: 20,
            backgroundColor: "#f2f2f2",
            borderRadius: 25,
            padding: 4,
          }}
        >
          {/* Personal */}
          <TouchableOpacity
            onPress={() => handleAccountTypeChange("personal")}
            style={{ flex: 1 }}
          >
            <View
              style={[
                {
                  paddingVertical: 10,
                  alignItems: "center",
                  borderRadius: 25,
                },
                accountType === "personal"
                  ? { backgroundColor: theme.colors.buttonPrimary }
                  : {},
              ]}
            >
              <Text
                style={{
                  color: accountType === "personal" ? "#fff" : "#000",
                  fontWeight: "600",
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
          >
            <View
              style={[
                {
                  paddingVertical: 10,
                  alignItems: "center",
                  borderRadius: 25,
                },
                accountType === "business"
                  ? { backgroundColor: theme.colors.buttonPrimary }
                  : {},
              ]}
            >
              <Text
                style={{
                  color: accountType === "business" ? "#fff" : "#000",
                  fontWeight: "600",
                }}
              >
                Business Account
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* FORM */}
      <ScrollView
          style={{ width: "100%", padding: 20,paddingTop: 0,backgroundColor: "#fff"}}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ justifyContent: "center", flexGrow: 1 }}
        >
          {/* PERSONAL FORM */}
          {accountType === "personal" && (
            <>
              {/* Email */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email id</Text>
                <View style={styles.inputControls}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={email.value}
                    onChangeText={(text) =>
                      setEmail({ value: text, error: "" })
                    }
                    placeholder="Email Id"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                {email.error ? (
                  <Text style={styles.error}>{email.error}</Text>
                ) : null}
              </View>

              {/* Mobile */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Mobile Number</Text>
                <View style={{ flexDirection: "row" }}>
                  <View style={[styles.inputControls, { width: 70 }]}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={countryCode.value}
                      editable={false}
                    />
                  </View>
                  <View
                    style={[styles.inputControls, { flex: 1, marginLeft: 5 }]}
                  >
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={mobileNo.value}
                      onChangeText={(text) =>
                        setMobileNo({ value: text, error: "" })
                      }
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                {mobileNo.error ? (
                  <Text style={styles.error}>{mobileNo.error}</Text>
                ) : null}
              </View>

              {/* Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputControls}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Password"
                    value={password.value}
                    secureTextEntry={!showPassword}
                    onChangeText={(text) =>
                      setPassword({ value: text, error: "" })
                    }
                  />
                  <Vector
                    as="materialcommunityicons"
                    name={showPassword ? "eye" : "eye-off"}
                    size={28}
                    color="#666"
                    onPress={toggleShowPassword}
                  />
                </View>
                {password.error ? (
                  <Text style={styles.error}>{password.error}</Text>
                ) : null}
              </View>
            </>
          )}

          {/* BUSINESS FORM */}
          {accountType === "business" && (
            <>
              {/* Email */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email id</Text>
                <View style={styles.inputControls}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={email.value}
                    onChangeText={(text) =>
                      setEmail({ value: text, error: "" })
                    }
                    placeholder="Email Id"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                {email.error ? (
                  <Text style={styles.error}>{email.error}</Text>
                ) : null}
              </View>

              {/* Mobile */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Mobile Number</Text>
                <View style={{ flexDirection: "row" }}>
                  <View style={[styles.inputControls, { width: 70 }]}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={countryCode.value}
                      editable={false}
                    />
                  </View>
                  <View
                    style={[styles.inputControls, { flex: 1, marginLeft: 5 }]}
                  >
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={mobileNo.value}
                      onChangeText={(text) =>
                        setMobileNo({ value: text, error: "" })
                      }
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                {mobileNo.error ? (
                  <Text style={styles.error}>{mobileNo.error}</Text>
                ) : null}
              </View>

              {/* Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputControls}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Password"
                    value={password.value}
                    secureTextEntry={!showPassword}
                    onChangeText={(text) =>
                      setPassword({ value: text, error: "" })
                    }
                  />
                  <Vector
                    as="materialcommunityicons"
                    name={showPassword ? "eye" : "eye-off"}
                    size={28}
                    color="#666"
                    onPress={toggleShowPassword}
                  />
                </View>
                {password.error ? (
                  <Text style={styles.error}>{password.error}</Text>
                ) : null}
              </View>
            </>
          )}

          {/* TERMS & CONDITIONS */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <Checkbox
              status={checkedTerms ? "checked" : "unchecked"}
              onPress={() => setCheckedTerms(!checkedTerms)}
              label="I have agreed to the"
            />
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={[styles.link, { marginLeft: 5 }]}>
                Terms & Condition
              </Text>
            </TouchableOpacity>
          </View>

          {/* SIGN UP BUTTON */}
          <Button style={{ marginBottom: 10 }} onPress={_onLoginPressed}>
            Sign up
          </Button>

          {/* ALREADY HAVE ACCOUNT */}
          <View style={[styles.row]}>
            <Text style={styles.label}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={[styles.link, { marginLeft: 5 }]}>Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {loading && <Spinner visible={true} size="large" animation="slide" />}
      </Container>
    </SafeAreaView>
  );
};

export default Signup;
