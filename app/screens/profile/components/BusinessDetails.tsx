import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";


import ModalPicker from "app/components/customComponents/ModalPicker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MetaService } from "app/services/meta.service";
import { TDropDown } from "types";
import Toast from "react-native-toast-message";
import {
  AddBusinesspersonalDetails,
  GetBusinesspersonalDetails,
} from "app/http-services";

export default function BusinessDetails() {
  const [companyNumber, setCompanyNumber] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [businessName, setBusinessName] = useState("");

  const [companyType, setCompanyType] = useState("Finance");
  const companyTypeList = [
    { dataValue: "Banking", displayvalue: "Banking" },
    { dataValue: "Network", displayvalue: "Network" },
    { dataValue: "Finance", displayvalue: "Finance" },
  ];

  const [countryCode, setCountryCode] = useState("IN");
  const [countryName, setCountryName] = useState("India");
  const [countryList, setCountryList] = useState<TDropDown[]>([]);

  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load country list first
  useEffect(() => {
    fetchCountries();
  }, []);

  // Once countries are loaded → load business details
  useEffect(() => {
    if (countryList.length > 0) {
      fetchBusinessDetails();
    }
  }, [countryList]);

  // Fetch Country List
  const fetchCountries = async () => {
    try {
      setLoading(true);
      MetaService.fetchCountryMetas(
        false,
        true,
        false,
        (countries: any[]) => {
          const countryMetas = countries.map((country: any) => ({
            dataValue: country.Alpha_2_Code,
            displayvalue: country.CountryName,
            ISDCode: country.ISDCode,
          }));
          setCountryList(countryMetas);
        },
        (error: Error) => console.error("Error fetching countries:", error),
        () => setLoading(false)
      );
    } catch (error) {
      console.error("Error fetching country list:", error);
      setLoading(false);
    }
  };

  // Fetch Business Details
  const fetchBusinessDetails = async () => {
    try {
      setLoading(true);
      const response = await GetBusinesspersonalDetails({});

      if (response?.data?.StatusCode === "ER0000") {
        const details = response.data?.BusinessDetail?.[0] || {};

        setCompanyName(details.CompanyName || "");
        setRegNumber(details.RegistrationNumber || "");
        setBusinessName(details.RegisteredBusinessName || "");
        setCompanyType(details.CompanyType || "Finance");
        setCountryName(details.Country || "India");

        // Map country name to Alpha_2_Code
        const foundCountry = countryList.find(
          (c) => c.displayvalue === details.Country
        );

        if (foundCountry) setCountryCode(foundCountry.dataValue);

        // Fix date format
        if (details.IncorporateDate) {
          const formatted = new Date(details.IncorporateDate.replace(/\\\//g, "/"));
          if (!isNaN(formatted)) setDate(formatted);
        }
      }
    } catch (error) {
      console.error("Error fetching business details:", error);
    } finally {
      setLoading(false);
    }
  };

  // Clear all fields
  const clearAll = () => {
    setCompanyNumber("");
    setCompanyName("");
    setRegNumber("");
    setBusinessName("");
    setCompanyType("Finance");
    setCountryCode("IN");
    setCountryName("India");
    setDate(new Date());
  };

  // Save (POST API)
  const handleSave = async () => {
    if (!companyName || !regNumber || !businessName || !countryName) {
      Toast.show({
        type: "error",
        text2: "Please fill all required fields.",
      });
      return;
    }

    try {
      setLoading(true);

      const reqBody = {
        CompanyName: companyName,
        CompanyType: companyType,
        Country: countryName,
        IncorporateDate: date.toISOString().split("T")[0],
        RegisteredBusinessName: businessName,
        RegistrationNumber: regNumber,
      };

      const response = await AddBusinesspersonalDetails(reqBody);

      if (response?.data?.StatusCode === "ER0000") {
        Toast.show({
          type: "success",
          text2: "Business Profile updated successfully",
        });

        fetchBusinessDetails();
      } else {
        Toast.show({
          type: "error",
          text2: "Failed to save details",
        });
      }
    } catch (error) {
      console.error("Error saving business details:", error);
      Toast.show({
        type: "error",
        text2: "Something went wrong while saving details.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ padding: 20 }}>
        {/* Company Number */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Company Name or Company Number</Text>
          <View style={styles.inputControls}>
            <TextInput
              style={styles.textInput}
              value={companyNumber}
              onChangeText={setCompanyNumber}
              placeholder="Enter company number"
            />
          </View>
        </View>

        {/* Company Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Company Name</Text>
          <View style={styles.inputControls}>
            <TextInput
              style={styles.textInput}
              value={companyName}
              onChangeText={setCompanyName}
              placeholder="Company Name"
            />
          </View>
        </View>

        {/* Registration Number */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Registration Number</Text>
          <View style={styles.inputControls}>
            <TextInput
              style={styles.textInput}
              value={regNumber}
              onChangeText={setRegNumber}
              placeholder="Registration Number"
            />
          </View>
        </View>

        {/* Registered Business Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Registered Business Name</Text>
          <View style={styles.inputControls}>
            <TextInput
              style={styles.textInput}
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Business Name"
            />
          </View>
        </View>

        {/* Company Type Picker */}
        <ModalPicker
          label="Company Type"
          dataList={companyTypeList}
          selectedValue={companyType}
          onValueChange={(value) => setCompanyType(value)}
          placeholder="Select Company Type"
        />

        {/* Country Picker */}
        <ModalPicker
          label="Country"
          dataList={countryList}
          selectedValue={countryCode}
          onValueChange={(itemValue) => {
            setCountryCode(itemValue);
            const selected = countryList.find(
              (c) => c.dataValue === itemValue
            );
            if (selected) setCountryName(selected.displayvalue);
          }}
          placeholder="Select Country"
          disabled={loading}
        />

        {/* Incorporation Date */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Incorporation Date</Text>
          <TouchableOpacity
            onPress={() => setShowPicker(true)}
            style={styles.inputControls}
          >
            <Text>{date.toLocaleDateString()}</Text>
          </TouchableOpacity>

          {showPicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowPicker(false);
                if (selectedDate) setDate(selectedDate);
              }}
            />
          )}
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.clearBtn} onPress={clearAll}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveBtn, loading && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveText}>Save & Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: 15,
    flexDirection: "column",
  },
  inputLabel: {
    color: "#666",
    fontSize: 14,
    fontFamily: "FONTS.regular",
    marginVertical: 5,
  },
  inputControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "FONTS.regular",
    ...Platform.select({
      web: {
        outlineStyle: "none",
      } as any,
    }),
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
  },
  clearBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#999",
    marginRight: 10,
  },
  saveBtn: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 25,
    backgroundColor: "#0B4C61",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  clearText: {
    color: "#555",
  },
  saveText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
