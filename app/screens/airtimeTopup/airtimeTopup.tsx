import { FONTS } from "../../constants/Assets";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useRecoilValue } from "recoil";
import AsyncStorage from "@react-native-async-storage/async-storage"; // ✅ Added
import { ProfileState } from "app/atoms";
import HomeHeader from "app/components/HomeHeader";
import Container from "app/theme/Container";
import { TDropDown } from "types";
import { MetaService } from "app/services/meta.service";
import { GetOperators, GetProducts } from "app/http-services";

const AirtimeTopup: React.FC = () => {
  const currentToken = useRecoilValue(ProfileState);
  const isFocused = useIsFocused();
  const navigation = useNavigation();

  // Country states
  const [countryList, setCountryList] = useState<TDropDown[]>([]);
  const [filteredCountries, setFilteredCountries] = useState<TDropDown[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<TDropDown | null>(null);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countrySearchText, setCountrySearchText] = useState("");

  // Operator states
  const [operatorList, setOperatorList] = useState<TDropDown[]>([]);
  const [filteredOperators, setFilteredOperators] = useState<TDropDown[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<TDropDown | null>(null);
  const [operatorDropdownOpen, setOperatorDropdownOpen] = useState(false);
  const [operatorSearchText, setOperatorSearchText] = useState("");

  // Package states
  const [packages, setPackages] = useState<TDropDown[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<TDropDown[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<TDropDown | null>(null);
  const [packageDropdownOpen, setPackageDropdownOpen] = useState(false);
  const [packageSearchText, setPackageSearchText] = useState("");

  const [loading, setLoading] = useState(false);

  // ✅ New state for enabling button
  const [isFormValid, setIsFormValid] = useState(false);

  // ✅ Validate form whenever selections change
  useEffect(() => {
    const valid = selectedCountry !== null && selectedOperator !== null && selectedPackage !== null;
    setIsFormValid(valid);
  }, [selectedCountry, selectedOperator, selectedPackage]);

  // ✅ Save selections to AsyncStorage
  const saveToLocalStorage = async (key: string, value: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("AsyncStorage error:", error);
    }
  };

  // Effects for search filters
  useEffect(() => {
    if (countrySearchText.trim() === "") setFilteredCountries(countryList);
    else
      setFilteredCountries(
        countryList.filter((c) =>
          c.displayvalue.toLowerCase().includes(countrySearchText.toLowerCase())
        )
      );
  }, [countrySearchText, countryList]);

  useEffect(() => {
    if (operatorSearchText.trim() === "") setFilteredOperators(operatorList);
    else
      setFilteredOperators(
        operatorList.filter((o) =>
          o.displayvalue.toLowerCase().includes(operatorSearchText.toLowerCase())
        )
      );
  }, [operatorSearchText, operatorList]);

  useEffect(() => {
    if (packageSearchText.trim() === "") setFilteredPackages(packages);
    else
      setFilteredPackages(
        packages.filter((p) =>
          p.displayvalue.toLowerCase().includes(packageSearchText.toLowerCase())
        )
      );
  }, [packageSearchText, packages]);

  // Fetch Countries
  const fetchCountries = async () => {
    try {
      setLoading(true);
      MetaService.fetchCountryMetas(
        false,
        true,
        false,
        async (countries: any[]) => {
          const list: TDropDown[] = countries.map((c: any) => ({
            dataValue: c.Alpha_3_Code,
            displayvalue: c.CountryName,
            flag: `https://flagcdn.com/w40/${c.Alpha_2_Code.toLowerCase()}.png`,
            ISDCode: c.ISDCode,
            name: c.CountryName,
            Alpha_2_Code: c.Alpha_2_Code,
            price: "",
            description: "",
          }));
          setCountryList(list);
          setFilteredCountries(list);
        },
        () => { },
        () => setLoading(false)
      );
    } catch (error) {
      console.error("fetchCountries error:", error);
      setLoading(false);
    }
  };

  // Fetch Operators
  const fetchOperators = async (countryCode: string) => {
    try {
      setLoading(true);
      const response: any = await GetOperators({ country_iso_code: countryCode });
      const list: TDropDown[] = (response?.data?.Operators || []).map((op: any) => ({
        dataValue: op.id,
        displayvalue: op.name,
        flag: "",
        ISDCode: "",
      }));
      setOperatorList(list);
      setFilteredOperators(list);
    } catch (error) {
      console.error("fetchOperators error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Products / Packages
  const fetchProducts = async (countryCode: string, operatorId: string) => {
    try {
      setLoading(true);
      const response: any = await GetProducts({
        country_iso_code: countryCode,
        operator_id: operatorId,
      });

      const list: TDropDown[] = (response?.data?.Products || []).map((p: any) => {
        let price = "";
        if (p.prices?.retail?.amount) {
          price = `${p.prices.retail.amount} ${p.prices.retail.unit}`;
        } else if (p.topupamount?.amount) {
          price = `${p.topupamount.amount} ${p.topupamount.currency}`;
        } else if (p.destination?.amount) {
          price = `${p.destination.amount} ${p.destination.unit}`;
        }

        return {
          dataValue: p.id,
          displayvalue: p.name,
          description: p.description || "",
          price: price,
          flag: "",
          ISDCode: "",
        };
      });

      setPackages(list);
      setFilteredPackages(list);
    } catch (error) {
      console.error("fetchProducts error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCountries();
  }, [isFocused]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#316b83" }}>
      <HomeHeader name={currentToken.firstName} currency="£" reward="" />
      <Container style={{ backgroundColor: "#f5f7f9", flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
            paddingBottom: 10,
            borderBottomWidth: 1,
            borderBottomColor: '#ddd',
            marginTop: 10
          }}>
            <Ionicons name="phone-portrait-outline" size={24} color="#316b83" style={{ marginRight: 8 }} />
            <Text style={{
                fontSize: 15,
                fontWeight: '700',
                color: '#316b83',
            }}>Airtime Topup</Text>
          </View>

          <View style={styles.card}>
            {/* Country Selector */}
            <Text style={styles.label}>Select Country</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setCountryDropdownOpen(!countryDropdownOpen)}
            >
              <Text style={styles.dropdownText}>
                {selectedCountry?.displayvalue || "Select Country"}
              </Text>
            </TouchableOpacity>
            {countryDropdownOpen && (
              <View style={styles.dropdownList}>
                <TextInput
                  placeholder="Search country..."
                  value={countrySearchText}
                  onChangeText={setCountrySearchText}
                  style={styles.searchInput}
                />
                <ScrollView style={{ maxHeight: 200 }} keyboardShouldPersistTaps="always">
                  {filteredCountries.map((item) => (
                    <TouchableOpacity
                      key={item.dataValue}
                      style={styles.option}
                      onPress={() => {
                        setSelectedCountry(item);
                        saveToLocalStorage("selectedCountry", item); // ✅ Save to storage
                        setCountryDropdownOpen(false);
                        setCountrySearchText("");
                        fetchOperators(item.dataValue);
                        setSelectedOperator(null);
                        setSelectedPackage(null);
                      }}
                    >
                      <Image source={{ uri: item.flag }} style={styles.flag} />
                      <Text style={styles.optionText}>{item.displayvalue}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Operator Selector */}
            <Text style={styles.label}>Select Mobile Operator</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setOperatorDropdownOpen(!operatorDropdownOpen)}
            >
              <Text style={styles.dropdownText}>
                {selectedOperator?.displayvalue || "Select Operator"}
              </Text>
            </TouchableOpacity>
            {operatorDropdownOpen && (
              <View style={styles.dropdownList}>
                <TextInput
                  placeholder="Search operator..."
                  value={operatorSearchText}
                  onChangeText={setOperatorSearchText}
                  style={styles.searchInput}
                />
                <ScrollView style={{ maxHeight: 200 }} keyboardShouldPersistTaps="always">
                  {filteredOperators.map((item) => (
                    <TouchableOpacity
                      key={item.dataValue.toString()}
                      style={styles.option}
                      onPress={() => {
                        setSelectedOperator(item);
                        saveToLocalStorage("selectedOperator", item); // ✅ Save to storage
                        setOperatorDropdownOpen(false);
                        setOperatorSearchText("");
                        fetchProducts(selectedCountry?.dataValue || "", item.dataValue);
                        setSelectedPackage(null);
                      }}
                    >
                      <Text style={styles.optionText}>{item.displayvalue}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Package Selector */}
            <Text style={styles.label}>Select Package</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setPackageDropdownOpen(!packageDropdownOpen)}
            >
              <Text style={styles.dropdownText}>
                {selectedPackage?.displayvalue || "Select Package"}
              </Text>
            </TouchableOpacity>
            {packageDropdownOpen && (
              <View style={styles.dropdownList}>
                <TextInput
                  placeholder="Search package..."
                  value={packageSearchText}
                  onChangeText={setPackageSearchText}
                  style={styles.searchInput}
                />
                <ScrollView style={{ maxHeight: 200 }} keyboardShouldPersistTaps="always">
                  {filteredPackages.map((item) => (
                    <TouchableOpacity
                      key={item.dataValue.toString()}
                      style={styles.option}
                      onPress={() => {
                        setSelectedPackage(item);
                        saveToLocalStorage("selectedPackage", item); // ✅ Save to storage
                        setPackageDropdownOpen(false);
                        setPackageSearchText("");
                      }}
                    >
                      <View style={{ flexDirection: "column" }}>
                        <Text style={styles.optionText}>{item.displayvalue}</Text>
                        {item.description ? (
                          <Text style={styles.optionSubText}>{item.description}</Text>
                        ) : null}
                        {item.price ? (
                          <Text style={styles.optionPrice}>{item.price}</Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Plan Details */}
            {selectedPackage && (
              <View style={styles.detailsBox}>
                <Text style={styles.details}>
                  Plan Name - {selectedPackage.displayvalue}
                </Text>
                {selectedPackage.description ? (
                  <Text style={styles.detailsDesc}>Plan Validity - {selectedPackage.description}</Text>
                ) : null}
                {selectedPackage.price ? (
                  <Text style={styles.detailsPrice}>Plan Benefits - {selectedPackage.price}</Text>
                ) : null}
              </View>
            )}

            {/* ✅ Send Money Button - Enabled only when all fields selected */}
            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: isFormValid ? "#316b83" : "#ccc" },
              ]}
              disabled={!isFormValid}
              onPress={() => navigation.navigate("AirtimeTopupList")}
            >
              <Text style={styles.sendButtonText}>Send Money</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Container>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: 16, backgroundColor: "#f5f7f9" },
  title: { fontSize: 15, fontWeight: '700', color: '#316b83', marginBottom: 20 },
  card: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
  },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 8, color: "#4B5563" },
  dropdown: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    marginBottom: 20,
    height: 48,
    paddingHorizontal: 16,
    justifyContent: "center",
    backgroundColor: "#F9FAFB"
  },
  dropdownText: { fontSize: 14, color: "#1F2937", fontWeight: "500" },
  flag: { width: 24, height: 18, marginRight: 10, borderRadius: 2 },
  dropdownList: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    maxHeight: 250,
    marginBottom: 20,
    backgroundColor: "#fff",
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 10,
    fontSize: 13,
    backgroundColor: "#F9FAFB"
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  optionText: { fontSize: 14, color: "#1F2937", fontWeight: "600" },
  optionSubText: { fontSize: 12, color: "#6B7280", marginTop: 4 },
  optionPrice: { fontSize: 13, color: "#059669", marginTop: 4, fontWeight: "600" },
  detailsBox: {
    marginTop: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
  },
  details: { fontSize: 13, marginBottom: 8, color: "#374151", fontWeight: "600" },
  detailsDesc: { fontSize: 13, color: "#6B7280", marginTop: 4 },
  detailsPrice: { fontSize: 14, fontWeight: "700", color: "#0F172A", marginTop: 8 },
  sendButton: {
    borderRadius: 25,
    marginTop: 20,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#316b83",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  sendButtonText: { color: "white", fontWeight: "700", fontSize: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});

export default AirtimeTopup;
