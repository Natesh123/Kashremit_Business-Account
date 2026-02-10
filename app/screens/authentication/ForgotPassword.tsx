import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { theme } from "../../core/theme";
import Button from "../../components/Button";
import Container from "../../theme/Container";
import styles from "../../styles";
import Vector from "../../assets/vectors";
import Toast from "react-native-toast-message";
import { emailValidator } from "../../core/utils";

const ForgotPassword = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSendResetLink = () => {
    const emailError = emailValidator(email); // 👈 validate email
    if (emailError) {
      setErrorMessage(emailError); // 👈 show error below field
      return;
    }

    setErrorMessage(""); // 👈 clear error
    Toast.show({
      type: "success",
      text1: "Forgot Password",
      text2: "If this email is registered, a reset link has been sent!",
    });
  };

  return (
    <SafeAreaView style={[styles.container]}>
      <Container>
        <ScrollView
          style={{ width: "100%", backgroundColor: "#f5f7f9", padding: 10, marginBottom: 70 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            <TouchableOpacity
              style={{
                backgroundColor: theme.colors.primary,
                width: 35,
                height: 35,
                borderRadius: 50,
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={() => navigation.goBack()}
            >
              <Vector
                as="ionicons"
                name="arrow-back"
                style={{ color: theme.colors.inSideColor }}
                size={30}
              />
            </TouchableOpacity>
          </View>

          <View>
            <Text style={styles.header}>Forgot Password</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email address</Text>
            <View style={styles.inputControls}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Enter your email"
                keyboardType="email-address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errorMessage) setErrorMessage(""); // 👈 clear error on typing
                }}
                autoCapitalize="none"
              />
            </View>
            {errorMessage ? (
              <Text style={{ color: "red", fontSize: 12, marginTop: 5 }}>
                {errorMessage}
              </Text>
            ) : null}
          </View>

          <Button onPress={handleSendResetLink}>
            Send Reset Link
          </Button>

          <View style={styles.row}>
            <Text style={styles.label}>Remember your password? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.link}>Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Container>
    </SafeAreaView>
  );
};

export default ForgotPassword;
