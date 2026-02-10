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
import { FONTS, SIZES } from "app/constants/Assets";
import { GetPurposeOfTransaction, GetReceiverInfoList, GetReferDetails } from "app/http-services";
import RecipientItem from "app/screens/recipients/components/items/RecipientItem";
import SendMoneyHeader from "app/components/SendMoneyHeader";
import RecipientHeader from "app/components/RecipientHeader";
import { Ionicons } from "@expo/vector-icons";
import ModalPicker from "app/components/customComponents/ModalPicker";

const Recipients = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { width } = useWindowDimensions();
  const currentToken = useRecoilValue(ProfileState);

  const [currency, setCurrency] = useState("£");
  const [search, setSearch] = useState({ value: "", error: "" });
  const [loading, setLoading] = useState(false);
  const [reward, setReward] = useState("");
  const [recipientList, setRecipientList] = useState<any>({});
  const [filteredRecipients, setFilteredRecipients] = useState<any>({});
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPurpose, setSelectedPurpose] = useState("");
  const [purposeList, setPurposeList] = useState<any[]>([]);

  useEffect(() => {
    const _currency = process.env.CURRENCY_SYMBOL || "£";
    setCurrency(_currency);
    fetchPurposeOfTransaction(currentToken.tokenId, currentToken.remitterId);
    fetchReceiverList(currentToken.tokenId, currentToken.remitterId);
    fetchReferDetails(currentToken.tokenId, currentToken.remitterId);
  }, [isFocused]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReceiverList(currentToken.tokenId, currentToken.remitterId).finally(() =>
      setRefreshing(false)
    );
  };

  const fetchPurposeOfTransaction = async (tokenId: string, remitterId: string) => {
    try {
      setLoading(true);
      const response = await GetPurposeOfTransaction(tokenId);
      console.log("Response :", response);

      if (response.status === 200 && response.data.POT) {
        const formattedList = response.data.POT
          .filter((item: any) => item.Value_POT !== "0")
          .map((item: any) => ({
            dataValue: item.Value_POT,
            displayvalue: item.Text_POT,
          }));

        setPurposeList(formattedList);
      }
    } catch (err) {
      console.error("Error fetching Purposeoftransaction list:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReceiverList = async (tokenId: string, remitterId: string) => {
    try {
      setLoading(true);
      const response = await GetReceiverInfoList(tokenId);
      if (response.status === 200) {
        const _data = response?.data?.ReceiverDetails;

        // ✅ Ensure _data is an array
        if (Array.isArray(_data) && _data.length > 0) {
          const _recipients = _data.reduce((acc: any, curr: any) => {
            if (curr.Country) {
              const { Country } = curr;
              const currentItems = acc[Country];
              return {
                ...acc,
                [Country]: currentItems ? [...currentItems, curr] : [curr],
              };
            }
            return acc;
          }, {});

          setRecipientList(_recipients);
          setFilteredRecipients(_recipients);
        } else {
          // No data or invalid data
          setRecipientList({});
          setFilteredRecipients({});
        }
      }
    } catch (err) {
      console.error("Fetch recipients details:", err);
      setRecipientList({});
      setFilteredRecipients({});
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

  const flattenRecipients = (list: any) => {
    return Object.values(list).flat();
  };

  const onSearchRecipients = (text: string) => {
    setSearch({ value: text, error: "" });
    if (!text.trim()) {
      setFilteredRecipients(recipientList);
      return;
    }
    const searchTerm = text.toLowerCase();
    const filtered = Object.keys(recipientList).reduce((acc: any, country) => {
      const filteredCountryRecipients = recipientList[country]?.filter((recipient: any) =>
        `${recipient.FirstName || ""} ${recipient.LastName || ""} ${recipient.ReceiverName || ""}`.toLowerCase().includes(searchTerm)
      );
      if (filteredCountryRecipients.length > 0) {
        acc[country] = filteredCountryRecipients;
      }
      return acc;
    }, {});
    setFilteredRecipients(filtered);
  };

  const onAddRecipient = () => {
    navigation.navigate("AddRecipient");
  };

  const dropdownStyles = {
    label: {
      fontSize: 12,
      color: "#6b6b6b",
      marginBottom: 6,
      marginLeft: 4,
      flex: 0.4
    },
    pickerContainer: {
      borderWidth: 1,
      borderColor: "#e2e6eb",
      borderRadius: 10,
      backgroundColor: "#fff",
      paddingHorizontal: 10,
      height: 50,
      justifyContent: "center",
      marginHorizontal: 20,
      marginTop: 10,
    },
    picker: {
      width: "100%",
      color: "#000",
    },
  };



  return (
    <SafeAreaView style={styles.container}>
      <RecipientHeader title="Select / Add Recipient"></RecipientHeader>
      <View style={{ flexDirection: "row", marginVertical: 20, marginBottom: 10, alignItems: "center", justifyContent: "space-between" }}>
        <View>
          <Text style={styles.recipient}>Who are you sending money to ?</Text>
        </View>
      </View>
      <View
        style={{
          flexDirection: "row",
          marginVertical: 20,
          marginBottom: 10,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ paddingHorizontal: 20, flex: 1 }}>
          <Text style={styles.recipients}>
            Select the existing recipients from the list below or add new
          </Text>
        </View>
        <View />


      </View>


      {/* Transfer Reason Dropdown */}
      <View style={{ marginTop: 10, paddingHorizontal: 20, marginLeft: 2 }}>
        <ModalPicker
          label="Purpose of transaction"
          required={true}
          dataList={purposeList}
          selectedValue={selectedPurpose}
          onValueChange={(value) => setSelectedPurpose(value)}
          placeholder="Select Purpose"
          style={{ width: '100%' }}
        />
      </View>






      <Container>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                flex: 1,
                alignSelf: "flex-start",
                padding: 20,
                paddingBottom: 0,
              }}
            >
              <View style={[styles.inputControls, { width: width - 165, borderRadius: 50, marginRight: 10 }]}>
                <Vector
                  as="ionicons"
                  name="search-outline"
                  size={20}
                  color={theme.colors.black50}
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  style={[
                    styles.input,
                    {
                      flex: 1,
                      paddingHorizontal: 5,
                      paddingVertical: 10,
                      height: "auto",
                    },
                  ]}
                  placeholder="Search Recipients"
                  placeholderTextColor={theme.colors.black50}
                  returnKeyType="done"
                  value={search.value}
                  onChangeText={(text) => onSearchRecipients(text)}
                />
              </View>
              {/* <Button onPress={onAddRecipient} style={{ borderRadius: 50 }}>
                  <Vector as="ionicons" name="add-circle-outline" size={20} style={{ marginRight: 5, verticalAlign: "middle" }} />
                  Add New
                </Button> */}
              <TouchableOpacity
                style={styles.addButtonRound}
                onPress={onAddRecipient}
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



            <RecipientItem
              title="India"
              items={flattenRecipients(filteredRecipients)}
              selectedPurpose={selectedPurpose}

            />
          </View>
        </ScrollView>
      </Container>
    </SafeAreaView>
  );
};

export default Recipients;

