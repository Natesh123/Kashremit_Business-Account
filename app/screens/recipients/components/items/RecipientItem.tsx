import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
  Alert,
} from "react-native";
import { useRecoilValue } from "recoil";
import { useNavigation } from "@react-navigation/native";
import CountryFlag from "react-native-country-flag";
import AsyncStorage from "@react-native-async-storage/async-storage"; // ✅ Import
import { ProfileState } from "app/atoms";
import { FONTS, SIZES } from "app/constants/Assets";
import styles from "app/styles";
import { LinearGradient } from "expo-linear-gradient";

interface IProps {
  items: any[];
  title: string;
  onSelect?: (selectedItem: any) => void;
  selectedPurpose?: string;
}

const RecipientItem = ({ items, title, onSelect, selectedPurpose }: IProps) => {
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const getCountryISO2 = require("country-iso-3-to-2");
  const currentToken = useRecoilValue(ProfileState);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [filteredItems, setFilteredItems] = useState<any[]>([]); // ✅ store filtered recipients
  const [currencyCode, setCurrencyCode] = useState<string | null>(null);
  const [transferReason, setTransferReason] = useState("");


  useEffect(() => {
    const fetchCurrency = async () => {
      try {
        const value = await AsyncStorage.getItem("selectedRecipientCurrency");
        if (value) {
          setCurrencyCode(value);
        }
      } catch (error) {
        console.error("Error fetching currency from storage:", error);
      }
    };
    fetchCurrency();
  }, []);

  useEffect(() => {
    if (currencyCode && items.length > 0) {
      // ✅ filter recipients only for matching country code
      const filtered = items.filter(
        (item) => item.CountryCode?.toUpperCase() === currencyCode.toUpperCase()
      );
      setFilteredItems(filtered);
    } else {
      setFilteredItems(items);
    }
  }, [currencyCode, items]);

  const handleSelect = (item: any) => {
    const newSelectedId =
      item.ReceiverID === selectedId ? null : item.ReceiverID;

    setSelectedId(newSelectedId);
    setSelectedRecipient(item.ReceiverID === selectedId ? null : item);

    if (onSelect) onSelect(item);
  };

  const handleEditRecipient = (recipientData: any) => {

    if (!selectedPurpose) {
      Alert.alert("Required", "Please select a transfer reason");
      return;
    }

    if (!recipientData) {
      Alert.alert("Selection Required", "Please select a recipient first");
      console.warn("⚠️ No recipient selected");
      return;
    }

    (navigation as any).navigate("AddRecipient", { editData: recipientData });

  };

  const isProceedEnabled =
    selectedRecipient !== null && selectedPurpose !== "";


  return (
    <View style={{ flexDirection: "column", width: "100%" }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          marginHorizontal: 20,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ marginTop: "5%" }}>
          <Text style={styles.header}>My Recipients List</Text>
        </View>
      </View>

      {/* Recipients List */}
      {filteredItems.map((item) => {
        const isSelected = item.ReceiverID === selectedId;

        return (
          <TouchableOpacity
            key={item.ReceiverID?.toString()}
            onPress={() => handleSelect(item)}
            style={[
              styles.cardMainWrapper,
              {
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 10,
                marginLeft: 20,
                width: "90%",
                padding: SIZES.p10,
                borderRadius: SIZES.p20,
                backgroundColor: isSelected ? "#f0f7f9" : "#ffffff",
                borderWidth: isSelected ? 1.5 : 0,
                borderColor: isSelected ? "#316b83" : "transparent",
              },
            ]}
          >
            {/* Country Flag */}
            <View
              style={{
                width: SIZES.p40,
                height: SIZES.p40,
                borderRadius: 10,
                alignItems: "center",
                overflow: "hidden",
              }}
            >
              <CountryFlag
                style={{ width: SIZES.p40, height: SIZES.p40 }}
                isoCode={getCountryISO2(item.CountryCode) || ""}
                size={35}
              />
            </View>

            {/* Name */}
            <View style={{ marginLeft: SIZES.p15, flex: 1 }}>
              <Text
                style={{
                  fontFamily: FONTS.regular,
                  fontWeight: "500",
                  fontSize: 12,
                  textTransform: "capitalize",
                }}
                numberOfLines={1}
              >
                {item.FirstName} {item.LastName}
              </Text>
            </View>

            {/* Radio Selection Circle */}
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: "#316b83",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 10,
              }}
            >
              {isSelected && (
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: "#316b83",
                  }}
                />
              )}
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Bottom Button */}
      <TouchableOpacity
        style={{
          width: width - 40,
          alignSelf: "center",
          marginTop: 20,
          marginBottom: 40, // Added margin bottom to prevent cutting off
          borderRadius: 12,
          overflow: "hidden",
          opacity: isProceedEnabled ? 1 : 0.5,
        }}
        disabled={!isProceedEnabled}
        onPress={() => handleEditRecipient(selectedRecipient)}
      >
        <LinearGradient
          colors={
            selectedRecipient
              ? ["#316b83", "#8bacb9"]
              : ["#ccc", "#aaa"]
          }
          start={[0, 0]}
          end={[1, 0]}
          style={{
            paddingVertical: 14,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 12,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            Proceed
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

export default RecipientItem;
