import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, RefreshControl, TextInput, useWindowDimensions, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "app/styles";
import HomeHeader from "app/components/HomeHeader";
import Container from "app/theme/Container";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useRecoilValue } from "recoil";
import { ProfileState } from "app/atoms";
import Vector from "app/assets/vectors";
import { theme } from "app/core/theme";
import Button from "app/components/controls/Button";
import { GetReceiverInfoList, GetReferDetails } from "app/http-services";
import RecipientsItem from "./components/items/RecipientsItem";
import { Ionicons } from "@expo/vector-icons";

const Recipients = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { width } = useWindowDimensions();
  const currentToken = useRecoilValue(ProfileState);

  const [currency, setCurrency] = useState("£");
  const [search, setSearch] = useState({ value: "", error: "" });
  const [loading, setLoading] = useState(false);
  const [reward, setReward] = useState("");
  const [recipientList, setRecipientList] = useState<any[]>([]); // array of { country, recipients }
  const [filteredRecipients, setFilteredRecipients] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const _currency = process.env.CURRENCY_SYMBOL || "£";
    setCurrency(_currency);
    fetchReceiverList(currentToken.tokenId, currentToken.remitterId);
    fetchReferDetails(currentToken.tokenId, currentToken.remitterId);
  }, [isFocused]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReceiverList(currentToken.tokenId, currentToken.remitterId).finally(() =>
      setRefreshing(false)
    );
  };

  const fetchReceiverList = async (tokenId: string, remitterId: string) => {
    try {
      setLoading(true);
      const response = await GetReceiverInfoList(tokenId);
      if (response.status === 200) {
        const _data = response?.data?.ReceiverDetails;

        if (Array.isArray(_data) && _data.length > 0) {
          // Group by country
          const grouped: Record<string, any[]> = _data.reduce((acc: any, curr: any) => {
            if (curr.Country) {
              const { Country } = curr;
              const currentItems = acc[Country] || [];
              acc[Country] = [...currentItems, curr];
            }
            return acc;
          }, {});

          // Sort recipients inside each country
          Object.keys(grouped).forEach((country) => {
            grouped[country].sort((a, b) => {
              const nameA = `${a.FirstName || ""} ${a.LastName || ""} ${a.ReceiverName || ""}`.toLowerCase();
              const nameB = `${b.FirstName || ""} ${b.LastName || ""} ${b.ReceiverName || ""}`.toLowerCase();
              return nameA.localeCompare(nameB);
            });
          });

          // Convert to array and sort countries alphabetically
          const sortedList = Object.keys(grouped)
            .sort((a, b) => a.localeCompare(b))
            .map((country) => ({
              country,
              recipients: grouped[country],
            }));

          setRecipientList(sortedList);
          setFilteredRecipients(sortedList);
        } else {
          setRecipientList([]);
          setFilteredRecipients([]);
        }
      }
    } catch (err) {
      console.error("Fetch recipients details:", err);
      setRecipientList([]);
      setFilteredRecipients([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferDetails = async (tokenId: string, remitterId: string) => {
    try {
      setLoading(true);
      const response = await GetReferDetails(tokenId);
      if (response.status === 200) {
        setReward(response?.data?.Refer?.PotentialEarning);
      }
    } catch (err) {
      console.error("Error refer details:", err);
    } finally {
      setLoading(false);
    }
  };

  const onSearchRecipients = (text: string) => {
    setSearch({ value: text, error: "" });
    if (!text.trim()) {
      setFilteredRecipients(recipientList);
      return;
    }
    const searchTerm = text.toLowerCase();

    // filter inside each country
    const filtered = recipientList
      .map(({ country, recipients }) => {
        const filteredRecipients = recipients.filter((recipient: any) =>
          `${recipient.FirstName || ""} ${recipient.LastName || ""} ${recipient.ReceiverName || ""}`
            .toLowerCase()
            .includes(searchTerm)
        );
        return filteredRecipients.length > 0 ? { country, recipients: filteredRecipients } : null;
      })
      .filter(Boolean) as any[];

    setFilteredRecipients(filtered);
  };

  const onAddRecipient = () => {
    navigation.navigate("AddRecipients");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#316b83' }}>
        <HomeHeader name={currentToken.firstName} currency={currency} reward={reward} />
      </SafeAreaView>
      <Container style={{ backgroundColor: '#F3F4F6', flex: 1 }}>
        <ScrollView
          style={styles.scrollview}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View>
            {/* Search + Add New */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                paddingHorizontal: 20,
                marginTop: 20,
              }}
            >
              <View style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#fff",
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  height: 48,
                  flex: 1,
                  marginRight: 12,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 5,
                  elevation: 2,
                  borderWidth: 1,
                  borderColor: "#E5E7EB"
              }}>
                <Vector
                  as="ionicons"
                  name="search-outline"
                  size={20}
                  color="#9CA3AF"
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  style={{ flex: 1, fontSize: 14, color: "#111827", height: "100%" }}
                  placeholder="Search Recipients"
                  placeholderTextColor="#9CA3AF"
                  returnKeyType="done"
                  value={search.value}
                  onChangeText={(text) => onSearchRecipients(text)}
                />
              </View>
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#316b83",
                  height: 48,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  shadowColor: "#316b83",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 6,
                  elevation: 4
                }}
                onPress={onAddRecipient}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={20}
                  color="#fff"
                  style={{ marginRight: 6 }}
                />
                <Text style={{ color: "#fff", fontSize: 14, fontWeight: "500" }}>Add New</Text>
              </TouchableOpacity>
            </View>

            {/* Render Countries & Recipients */}
            {filteredRecipients.map(({ country, recipients }) => (
              <RecipientsItem
                key={country}
                title={country}
                items={recipients}
                onDeleteSuccess={(deletedRecipient) => {
                  console.log("Deleted recipient:", deletedRecipient.ReceiverID);

                  // remove deleted recipient
                  const updated = recipientList.map(({ country: c, recipients }) => {
                    const newList = recipients.filter((r: any) => r.ReceiverID !== deletedRecipient.ReceiverID);
                    return newList.length ? { country: c, recipients: newList } : null;
                  }).filter(Boolean) as any[];

                  setRecipientList(updated);
                  setFilteredRecipients(updated);
                }}
              />
            ))}
          </View>
        </ScrollView>
      </Container>
    </View>
  );
};

export default Recipients;
