import React, { useEffect, useState } from "react";
import {
  Image,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
  LogBox,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../../core/theme";
import Button from "../../components/Button";
import Container from "../../theme/Container";
import styles from "../../styles";
import Vector from "../../assets/vectors";
import { emailValidator, passwordValidator } from "../../core/utils";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRecoilState } from "recoil";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { ProfileState } from "app/atoms";
import Toast from "react-native-toast-message";
import Spinner from "react-native-loading-spinner-overlay";
import { loginService } from "app/services/auth.service";
import { FONTS } from "app/constants/Assets";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Ignore warning in development if needed
LogBox.ignoreLogs(["[DOM] Password field is not contained in a form"]);

const Login = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { width } = useWindowDimensions();
  const [ProfileItems, setProfileItems] = useRecoilState(ProfileState);

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState({ value: "", error: "" });
  const [password, setPassword] = useState({ value: "", error: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    setEmail({ value: "", error: "" });
    setPassword({ value: "", error: "" });
    setShowPassword(false);
  }, [isFocused]);

  useEffect(() => {
    const emailError = emailValidator(email.value);
    const passwordError = passwordValidator(password.value);

    if (!emailError && !passwordError) {
      setIsFormValid(true);
    } else {
      setIsFormValid(false);
    }
  }, [email.value, password.value]);

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const _onLoginPressed = async () => {
    setLoading(true);
    const emailError = emailValidator(email.value);
    const passwordError = passwordValidator(password.value);

    if (emailError || passwordError) {
      setEmail({ ...email, error: emailError });
      setPassword({ ...password, error: passwordError });
      setLoading(false);
      Toast.show({
        type: "error",
        text1: "Login",
        text2: "We need a valid email address and password",
      });
      return;
    }

    const postData = {
      Email: email.value,
      Password: password.value,
    };

    loginService(
      postData,
      async (user) => {
        setProfileItems({
          remitterId: user.RemitterID,
          firstName: user.FirstName,
          lastName: user.LastName,
          email: user.Email,
          mobileNo: user.MobileNumber,
          tokenId: user.TokenID,
        });

        if (user.Is_Doc_Upload === "Y") {
          Toast.show({
            type: "error",
            text1: "Login",
            text2: "Your KYC document has been rejected. Please re-upload.",
          });
        }

        if (user.StatusCode === "ER0000") {
          await AsyncStorage.setItem("isLoggedIn", "true");
          navigation.navigate("App");
        } else if (user.StatusCode === "ER0053") {
          navigation.navigate("PostRegistration");
        }
      },
      (error) => {
        if (error.statusCode) {
          Toast.show({
            type: "error",
            text1: "Login",
            text2: error.statusMsg,
          });
        } else {
          Toast.show({
            type: "error",
            text1: "Login failed",
            text2: "Something went wrong. Please try again.",
          });
        }
      },
      () => {
        setLoading(false);
      }
    );
  };

  const renderLoginFields = () => (
    <>
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Email id</Text>
        <View style={styles.inputControls}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={email.value}
            onChangeText={(text) => setEmail({ value: text, error: "" })}
            autoCapitalize="none"
            placeholderTextColor={theme.colors.black50}
            placeholder="Email Id"
            textContentType="emailAddress"
            keyboardType="email-address"
          />
        </View>
        {email.error ? <Text style={styles.error}>{email.error}</Text> : null}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Password</Text>
        <View style={styles.inputControls}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Password"
            placeholderTextColor={theme.colors.black50}
            returnKeyType="done"
            value={password.value}
            onChangeText={(text) => setPassword({ value: text, error: "" })}
            secureTextEntry={!showPassword}
          />
          <Vector
            as="materialcommunityicons"
            name={showPassword ? "eye" : "eye-off"}
            size={30}
            color={theme.colors.black50}
            onPress={toggleShowPassword}
            style={{ marginLeft: 10 }}
          />
        </View>
        {password.error ? <Text style={styles.error}>{password.error}</Text> : null}
      </View>

      <View style={styles.forgotPassword}>
        <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
          <Text style={styles.link}>Forgot password?</Text>
        </TouchableOpacity>
      </View>

      <Button style={{ marginBottom: 10 }} onPress={_onLoginPressed}>
        Login
      </Button>

      <View style={styles.row}>
        <Text style={styles.label}>Don’t have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
          <Text style={[styles.link, { marginLeft: 5, fontSize: 14 }]}>
            Sign up now
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: "#fff" }]}>
      <Container>
        <View
          style={{
            width: "100%",
            backgroundColor: "#fff",
            padding: 20,
            paddingBottom: 0,
          }}
        >
          <LinearGradient
            colors={[theme.colors.buttonPrimary, theme.colors.buttonSecondary]}
            start={{ x: -0.1, y: 0.0 }}
            end={{ x: 1.1, y: 0.4 }}
            style={{
              backgroundColor: theme.colors.primary,
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

          <View>
            <Text
              style={{
                fontSize: 18,
                fontFamily: FONTS.bold,
                marginVertical: 10,
              }}
            >
              Login
            </Text>
          </View>
        </View>

        <ScrollView
          style={{
            width: "100%",
            backgroundColor: "#fff",
            padding: 20,
            paddingTop: 0,
          }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ justifyContent: "center", flexGrow: 1 }}
        >

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


          {Platform.OS === "web" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                _onLoginPressed();
              }}
              style={{ width: "100%" }}
            >
              {renderLoginFields()}
            </form>
          ) : (
            renderLoginFields()
          )}
        </ScrollView>

        {loading && (
          <Spinner visible={true} size="large" animation="slide" />
        )}

        {/* Social login UI below */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginVertical: 15,
            marginHorizontal: 20,
          }}
        >
          <View style={{ flex: 1, height: 1, backgroundColor: "#ccc" }} />
          <Text style={{ marginHorizontal: 10, color: "#666" }}>
            Or login with
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: "#ccc" }} />
        </View>

        <View style={{ paddingBottom: 10, paddingHorizontal: 20 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              marginBottom: 10,
            }}
          >
            <View style={{ flex: 1, marginRight: 5 }}>
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  backgroundColor: "#fff",
                  padding: 11,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "#ae9efb",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.05,
                  shadowRadius: 24,
                }}
              >
                <Image
                  source={require("../../assets/icons/google.png")}
                  style={{ width: 24, height: 24 }}
                />
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1, marginRight: 5 }}>
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  backgroundColor: "#fff",
                  padding: 11,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "#ae9efb",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.05,
                  shadowRadius: 24,
                }}
              >
                <Image
                  source={require("../../assets/icons/facebook.png")}
                  style={{ width: 24, height: 24 }}
                />
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1, marginLeft: 5 }}>
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  backgroundColor: "#fff",
                  padding: 11,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "#ae9efb",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.05,
                  shadowRadius: 24,
                }}
              >
                <Image
                  source={require("../../assets/icons/apple.png")}
                  style={{ width: 24, height: 24 }}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Container>
    </SafeAreaView>
  );
};

export default Login;
