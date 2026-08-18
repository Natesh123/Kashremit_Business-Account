import { FONTS } from "../../constants/Assets";
import React, { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  Switch,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import Container from "app/theme/Container";
import styles from "app/styles";
import { GetQuickWatchList, AddWatchList, UpdateWatchList } from "app/http-services";
import { MetaService } from "app/services/meta.service";

const QuickAddWatchlistForm = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const editItem = route.params?.editItem;

  const [searchText, setSearchText] = useState("");
  const [rateAlertEnabled, setRateAlertEnabled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState("1 GBP goes Above");
  const [alertAmount, setAlertAmount] = useState("100.87");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countryList, setCountryList] = useState<any[]>([]);
  const [countryLists, setCountryLists] = useState<any[]>([]);
  const [topRates, setTopRates] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const dropdownOptions = ["1 GBP goes Above", "1 GBP goes Below"];

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        // 1️⃣ Fetch Quick Watchlist
        const quickResponse = await GetQuickWatchList({});
        const quickData = quickResponse?.data?.Quickwatchdetail || [];
        setTopRates(quickData.length ? quickData.slice(0, 4) : [
          { CountryFlag: "https://service.kashremit.com/CountryFlags/IND.png", ToCountryName: "India", ToCurrency: "INR", ExchangeCheckRate: 99.87 }
        ]);

        // 2️⃣ Fetch Countries
        MetaService.fetchCountryMetas(
          false,
          true,
          false,
          (countries: any[]) => {
            let list = countries.map((c: any) => ({
              CountryFlag: `https://flagcdn.com/w40/${c.Alpha_2_Code.toLowerCase()}.png`,
              ToCountryName: c.CountryName,
              ToCurrency: c.CurrencyCode,
              ToCountryCode: c.Alpha_3_Code,
              ExchangeCheckRate: 0,
              ISDCode: c.ISDCode,
            }));


            let data = list;
            console.log("DATA", data);
            setCountryList(data);
            // 3️⃣ Exclude countries already in Quick Watchlist
            let filteredList = list.filter(
              (c) => !quickData.some((top: { ToCountryCode: any; }) => top.ToCountryCode === c.ToCountryCode)
            );

            // ✅ Include editItem country if editing
            if (editItem) {
              const match = list.find(c => c.ToCountryCode === editItem.ToCountryCode);
              if (match && !filteredList.some(c => c.ToCountryCode === match.ToCountryCode)) {
                filteredList = [match, ...filteredList];
                setSelectedCountry(match);
              }
            }

            setCountryLists(filteredList);

            // Pre-fill editItem rate alert
            if (editItem) {
              setRateAlertEnabled(editItem.AlertFlag === "1");

              if (editItem.ExchangeCheckRate && Number(editItem.AmountAbove) > 0) {
                setSelectedOption("1 GBP goes Above");
                setAlertAmount(editItem.ExchangeCheckRate.toString());
              } else if (editItem.ExchangeCheckRate && Number(editItem.ExchangeCheckRate) > 0) {
                setSelectedOption("1 GBP goes Below");
                setAlertAmount(editItem.ExchangeCheckRate.toString());
              }

              setSearchText(editItem.ToCountryName || "");
            }

            setLoading(false);
          },
          () => { },
          () => setLoading(false)
        );
      } catch (error) {
        console.error("Error fetching QuickWatchlist or countries:", error);
        setLoading(false);
      }
    };

    init();
  }, []);

  // ✅ Handle Add / Update Watchlist
  const handleAddWatchlist = async () => {
    if (!selectedCountry) {
      Alert.alert("Select Country", "Please select a country first.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        AlertFlag: rateAlertEnabled ? "1" : "0",
        AmountAbove: selectedOption === "1 GBP goes Above" ? alertAmount : "0",
        AmountBelow: selectedOption === "1 GBP goes Below" ? alertAmount : "0",
        ToCountryCode: selectedCountry.ToCountryCode,
        ToCountryName: selectedCountry.ToCountryName,
        ToCurrency: selectedCountry.ToCurrency,
        RemitterID: editItem?.RemitterID || "",
        QuickWatchID: editItem?.QuickWatchID || "",
      };

      let response;
      if (editItem) {
        response = await UpdateWatchList(payload);
      } else {
        response = await AddWatchList(payload);
      }

      if (response?.data?.StatusMsg === "Success") {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: response?.data?.StatusMsg,
          position: 'top',
        });
        navigation.goBack();
      } else {
        Alert.alert("Failed", response?.data?.StatusDesc || "Something went wrong.");
      }
    } catch (error) {
      console.log("Watchlist API Error:", error);
      Alert.alert("Error", "Unable to add/update Quick Watchlist.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#316b83' }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 15, backgroundColor: "#316b83" }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: "700", marginLeft: 12, color: "#fff" }}>
              {editItem ? "Edit Watchlist" : "Quick Add Watchlist"}
            </Text>
          </View>
        {/* Country Dropdown */}
        <View style={{ marginTop: 0 }}>
          <TouchableOpacity
            onPress={() => setCountryDropdownOpen(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.3)",
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
              backgroundColor: "rgba(255,255,255,0.15)",
            }}
          >
            <Text style={{ fontSize: 14 }}>🇬🇧</Text>
            <Text style={{ marginLeft: 8, fontWeight: "700", color: "#fff", fontSize: 14 }}>
              GBP
            </Text>
          </TouchableOpacity>

          {/* Country Modal */}
          <Modal
            visible={countryDropdownOpen}
            transparent={true}
            animationType="slide"
          >
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.3)",
                justifyContent: "center",
                paddingHorizontal: 20,
              }}
              activeOpacity={1}
              onPressOut={() => setCountryDropdownOpen(false)}
            >
              <View
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 10,
                  maxHeight: "60%",
                  paddingVertical: 10,
                }}
              >
                <FlatList
                  data={countryList}   // 🔥 FIXED → full country list always
                  keyExtractor={(item) => item.ToCountryCode}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        padding: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: "#eee",
                      }}
                      onPress={() => {
                        setSelectedCountry(item);
                        setCountryDropdownOpen(false);
                      }}
                    >
                      <Image
                        source={{ uri: item.CountryFlag }}
                        style={{ width: 30, height: 20, resizeMode: "cover" }}
                      />
                      <Text style={{ marginLeft: 10 }}>
                        {item.ToCountryName} ({item.ToCurrency})
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableOpacity>
          </Modal>

        </View>

      </View>
      </SafeAreaView>

      <Container style={{ backgroundColor: '#F3F4F6', flex: 1 }}>
        <View style={{ flex: 1, justifyContent: "space-between" }}>
          <ScrollView style={{ padding: 15 }} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
            {/* Top Cards */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {loading ? (
                <ActivityIndicator size="small" color="#316b83" />
              ) : (
                topRates.map((item, index) => (
                  <View key={index} style={{ backgroundColor: "#fff", borderRadius: 12, padding: 12, marginRight: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, alignItems: "center", flexDirection: "row" }}>
                    <Image source={{ uri: item.CountryFlag }} style={{ width: 30, height: 20, marginRight: 10, borderRadius: 4 }} resizeMode="cover" />
                    <View>
                      <Text style={{ fontSize: 13, color: "#6B7280", fontWeight: '500' }}>{item.ToCountryName} - {item.ToCurrency}</Text>
                      <Text style={{ fontWeight: "700", fontSize: 15, color: '#111827', marginTop: 2 }}>{item.ExchangeCheckRate}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>


            {/* Search */}
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginTop: 20, borderWidth: 1, borderColor: "#E5E7EB", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 }}>
              <Ionicons name="search" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
              <TextInput
                style={{ flex: 1, fontSize: 15, color: "#1F2937", fontWeight: '500', outlineStyle: "none" } as any}
                placeholder="Search Country to add"
                placeholderTextColor="#9CA3AF"
                value={searchText}
                onChangeText={setSearchText}
                editable={!editItem}
                onFocus={() => setIsSearchFocused(true)}
              />
            </View>

            {/* Country List */}
            {!editItem && isSearchFocused && (    // ✅ show only if NOT editItem and focused
              <View style={{ marginTop: 20 }}>
                {loading ? (
                  <ActivityIndicator size="small" color="#316b83" />
                ) : (
                  countryLists
                    .filter(item => item.ToCountryName.toLowerCase().includes(searchText.toLowerCase()))
                    .map((item, index) => {
                      const isSelected = selectedCountry?.ToCountryCode === item.ToCountryCode;
                      return (
                        <View
                          key={index}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            backgroundColor: "#fff",
                            borderRadius: 10,
                            padding: 12,
                            marginBottom: 10,
                            borderWidth: 1,
                            borderColor: "#eee",
                          }}
                        >
                          <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Image
                              source={{ uri: item.CountryFlag }}
                              style={{ width: 32, height: 32, marginRight: 12, borderRadius: 16 }}
                              resizeMode="cover"
                            />
                            <Text style={{ fontSize: 14, color: '#1F2937', fontWeight: "600" }}>
                              {item.ToCountryName} - {item.ToCurrency}
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => setSelectedCountry(item)}
                            disabled={!!editItem}
                            style={{
                              backgroundColor: isSelected ? "#fff" : "#316b83",
                              borderWidth: isSelected ? 1 : 0,
                              borderColor: "#316b83",
                              paddingVertical: 6,
                              paddingHorizontal: 16,
                              borderRadius: 8,
                              flexDirection: "row",
                              alignItems: "center",
                              opacity: editItem ? 0.6 : 1,
                            }}
                          >
                            <Text style={{ color: isSelected ? "#316b83" : "#fff", fontWeight: "700", fontSize: 14 }}>
                              {isSelected ? "✓" : "Add"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })
                )}
              </View>
            )}

            {/* For editItem mode: just show the selected country */}
            {editItem && selectedCountry && (
              <View style={{ marginTop: 20 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "#fff",
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: "#eee",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Image
                      source={{ uri: selectedCountry.CountryFlag }}
                      style={{ width: 32, height: 32, marginRight: 12, borderRadius: 16 }}
                      resizeMode="cover"
                    />
                    <Text style={{ fontSize: 14, color: '#1F2937', fontWeight: "600" }}>
                      {selectedCountry.ToCountryName} - {selectedCountry.ToCurrency}
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: "#fff",
                      borderWidth: 1,
                      borderColor: "#316b83",
                      paddingVertical: 6,
                      paddingHorizontal: 16,
                      borderRadius: 8,
                      flexDirection: "row",
                      alignItems: "center",
                      opacity: 0.6,
                    }}
                  >
                    <Text style={{ color: "#316b83", fontWeight: "700", fontSize: 14 }}>✓</Text>
                  </View>
                </View>
              </View>
            )}


            {/* Rate Alert */}
            <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, marginTop: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: 15, color: '#111827', fontWeight: "600" }}>Set a rate alert and get notified</Text>
                <Switch value={rateAlertEnabled} onValueChange={setRateAlertEnabled} thumbColor={"#fff"} trackColor={{ false: "#E5E7EB", true: "#316b83" }} />
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 15 }}>
                <View style={{ flex: 1 }}>
                  <TouchableOpacity onPress={() => setDropdownOpen(!dropdownOpen)} style={{ borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, backgroundColor: "#fff", flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, color: '#1F2937', fontWeight: '500' }}>{selectedOption}</Text>
                    <Ionicons name="chevron-down" size={16} color="#6B7280" />
                  </TouchableOpacity>

                  {dropdownOpen && (
                    <View style={{ borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, marginTop: 6, backgroundColor: "#fff", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 }}>
                      {dropdownOptions.map((option, index) => (
                        <TouchableOpacity
                          key={index}
                          onPress={() => {
                            setSelectedOption(option);
                            setDropdownOpen(false);
                          }}
                          style={{ paddingVertical: 14, paddingHorizontal: 14, borderBottomWidth: index === dropdownOptions.length - 1 ? 0 : 1, borderColor: "#F3F4F6" }}
                        >
                          <Text style={{ fontSize: 14, color: '#4B5563', fontWeight: '500' }}>{option}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <TextInput
                  value={alertAmount}
                  onChangeText={setAlertAmount}
                  editable={rateAlertEnabled}
                  style={{
                    flex: 1,
                    backgroundColor: rateAlertEnabled ? "#F9FAFB" : "#F3F4F6",
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: rateAlertEnabled ? "#E5E7EB" : "transparent",
                    paddingHorizontal: 14,
                    paddingVertical: 14,
                    color: rateAlertEnabled ? "#111827" : "#9CA3AF",
                    marginLeft: 12,
                    fontSize: 15,
                    fontWeight: '600'
                  }}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', padding: 16, paddingBottom: 30, backgroundColor: 'transparent' }}>
            <TouchableOpacity onPress={handleAddWatchlist} style={{ backgroundColor: "#316b83", paddingVertical: 16, borderRadius: 28, alignItems: "center", shadowColor: "#104e5b", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }}>
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                {editItem ? "Update Watchlist" : "Add to Quick Watchlist"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Container>
    </View>
  );
};

export default QuickAddWatchlistForm;
