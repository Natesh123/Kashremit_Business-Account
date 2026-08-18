import { FONTS } from "../../constants/Assets";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,   // ✅ Added for search
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useRecoilValue } from "recoil";
import { ProfileState } from "app/atoms";
import { GetReceiverInfoLists } from "app/http-services";
import { Ionicons } from "@expo/vector-icons";
import ModalHeaderBack from "app/components/ModalHeaderBack";
import Container from "app/theme/Container";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AirtimeTopupList: React.FC = () => {
  const currentToken = useRecoilValue(ProfileState);
  const isFocused = useIsFocused();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);
  const [recipientList, setRecipientList] = useState<any[]>([]);
  const [filteredRecipientList, setFilteredRecipientList] = useState<any[]>([]); // ✅
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState(""); // ✅

  const fetchReceiverList = async (tokenId: string) => {
    try {
      setLoading(true);
      const response = await GetReceiverInfoLists(tokenId);

      if (response.status === 200) {
        const _data = response?.data?.ReceiverDetails;

        if (Array.isArray(_data) && _data.length > 0) {
          const grouped: Record<string, any[]> = _data.reduce((acc, curr) => {
            const groupKey = curr.Country || curr.CountryCode || "Others";
            if (!acc[groupKey]) acc[groupKey] = [];
            acc[groupKey].push(curr);
            return acc;
          }, {} as Record<string, any[]>);

          Object.keys(grouped).forEach((key) => {
            grouped[key].sort((a, b) => {
              const nameA = `${a.FirstName || ""} ${a.LastName || ""}`.toLowerCase();
              const nameB = `${b.FirstName || ""} ${b.LastName || ""}`.toLowerCase();
              return nameA.localeCompare(nameB);
            });
          });

          const sortedList = Object.keys(grouped)
            .sort((a, b) => a.localeCompare(b))
            .map((country) => ({
              country,
              recipients: grouped[country],
            }));

          setRecipientList(sortedList);
          setFilteredRecipientList(sortedList); // ✅ Initially set same
        } else {
          setRecipientList([]);
          setFilteredRecipientList([]);
        }
      }
    } catch (err) {
      console.error("Fetch recipients error:", err);
      setRecipientList([]);
      setFilteredRecipientList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceiverList(currentToken.tokenId);
  }, [isFocused]);

  // ✅ Filter logic whenever search text changes
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredRecipientList(recipientList);
      return;
    }

    const lower = searchText.toLowerCase();
    const filtered = recipientList
      .map((group) => {
        const filteredRecipients = group.recipients.filter((item: any) => {
          const fullName = `${item.FirstName || ""} ${item.LastName || ""}`.toLowerCase();
          const mobile = (item.MobileNumber || "").toLowerCase();
          const country = (group.country || "").toLowerCase();
          return (
            fullName.includes(lower) ||
            mobile.includes(lower) ||
            country.includes(lower)
          );
        });

        return {
          ...group,
          recipients: filteredRecipients,
        };
      })
      .filter((group) => group.recipients.length > 0);

    setFilteredRecipientList(filtered);
  }, [searchText, recipientList]);

  const handleProceed = async () => {
    if (!selectedRecipientId) return;

    let selectedRecipient: any = null;

    for (const group of recipientList) {
      const match = group.recipients.find(
        (r: { ReceiverID: string }) => r.ReceiverID === selectedRecipientId
      );
      if (match) {
        selectedRecipient = match;
        break;
      }
    }

    if (!selectedRecipient) return;

    let selectedPackage = null;
    try {
      const storedPackage = await AsyncStorage.getItem("selectedPackage");
      selectedPackage = storedPackage ? JSON.parse(storedPackage) : null;
    } catch (err) {
      console.error("Error fetching selectedPackage:", err);
    }

    try {
      await AsyncStorage.setItem(
        "selectedRecipient",
        JSON.stringify({ ...selectedRecipient, selectedPackage })
      );
    } catch (err) {
      console.error("Error saving recipient:", err);
    }

    navigation.navigate("AirtimeTopupPay");
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#316b83" }}>
      {/* Header */}
      <ModalHeaderBack title="Recipients" />

      <Container style={{ backgroundColor: "#f9f9f9", flex: 1 }}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
            paddingBottom: 10,
            borderBottomWidth: 1,
            borderBottomColor: '#ddd',
            marginTop: 10
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="people-outline" size={24} color="#316b83" style={{ marginRight: 8 }} />
              <Text style={styles.title}>Select Recipient</Text>
            </View>

            <TouchableOpacity
              style={styles.addButtonRound}
              onPress={() => navigation.navigate("AirtimeTopupForm")}
            >
              <Ionicons
                name="add-circle-outline"
                size={20}
                color="#fff"
                style={{ marginRight: 5 }}
              />
              <Text style={styles.addButtonText}>Add New</Text>
            </TouchableOpacity>
          </View>

          {/* ✅ Search Input */}
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, mobile or country"
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
          />

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
            paddingBottom: 10,
            borderBottomWidth: 1,
            borderBottomColor: '#ddd',
            marginTop: 4
          }}>
            <Ionicons name="list-outline" size={24} color="#316b83" style={{ marginRight: 8 }} />
            <Text style={styles.listTitle}>My Recipients List</Text>
          </View>

          {filteredRecipientList.length === 0 && (
            <Text style={{ textAlign: "center", color: "#666", marginTop: 20 }}>
              No recipients found
            </Text>
          )}

          {filteredRecipientList.map((group) => (
            <View key={group.country}>
              {group.recipients.map((item: any) => {
                const fullName = `${item.FirstName || ""} ${item.LastName || ""}`.trim();
                return (
                  <TouchableOpacity
                    key={item.ReceiverID}
                    style={[
                      styles.recipientCard,
                      selectedRecipientId === item.ReceiverID && styles.recipientCardSelected,
                    ]}
                    onPress={() => setSelectedRecipientId(item.ReceiverID)}
                  >
                    <View style={styles.flagBox}>
                      <Image source={{ uri: item.CountryFlag }} style={styles.flag} />
                    </View>

                    <View style={styles.nameBox}>
                      <Text style={styles.nameText}>{fullName}</Text>
                      {item.MobileNumber ? (
                        <Text style={styles.mobileText}>{item.MobileNumber}</Text>
                      ) : null}
                    </View>

                    <View style={styles.radioBox}>
                      <Ionicons
                        name={
                          selectedRecipientId === item.ReceiverID
                            ? "radio-button-on"
                            : "radio-button-off"
                        }
                        size={22}
                        color="#316b83"
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </ScrollView>

        {/* Proceed Button */}
        <View style={{ padding: 16 }}>
          <TouchableOpacity
            disabled={!selectedRecipientId}
            onPress={handleProceed}
            activeOpacity={0.8}
          >
            {selectedRecipientId ? (
              <LinearGradient
                colors={["#104e5b", "#316b83"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.proceedGradient}
              >
                <Text style={styles.proceedText}>Proceed</Text>
              </LinearGradient>
            ) : (
              <View style={[styles.proceedGradient, { backgroundColor: '#d3d3d3' }]}>
                <Text style={[styles.proceedText, { color: '#888' }]}>Proceed</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Container>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: 16, backgroundColor: "#f5f7f9" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: "#316b83",
  },
  backButton: { padding: 4, marginRight: 10 },
  headerTitle: { fontSize: 16, fontWeight: "600", color: "#fff", fontFamily: FONTS.regular },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { fontSize: 15, fontWeight: "700", color: "#316b83" },
  addButtonRound: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#316b83",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    shadowColor: "#316b83",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  searchInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
    fontSize: 15,
    color: "#1F2937",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#316b83",
  },
  recipientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  recipientCardSelected: {
    borderColor: "#316b83",
    backgroundColor: "#F8FAFC",
  },
  flagBox: { width: 40 },
  flag: { width: 32, height: 24, borderRadius: 4 },
  nameBox: { flex: 1, paddingHorizontal: 8 },
  nameText: { fontSize: 15, fontWeight: "700", color: "#1F2937" },
  mobileText: { fontSize: 13, color: "#6B7280", marginTop: 4 },
  radioBox: { width: 30, alignItems: "flex-end" },

  proceedGradient: {
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#104e5b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  proceedText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});

export default AirtimeTopupList;
