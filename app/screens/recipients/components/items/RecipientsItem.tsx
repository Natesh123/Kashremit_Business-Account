import React, { useState } from "react";
import {
  Text,
  View,
  Button,
  Modal,
  useWindowDimensions,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import CountryFlag from "react-native-country-flag";
import { Menu, MenuOption, MenuOptions, MenuTrigger } from "react-native-popup-menu";
import { DeleteBeneficiary } from "app/http-services";
import Toast from "react-native-toast-message";
import { useRecoilValue } from "recoil";
import { ProfileState } from "app/atoms";
import Vector from "app/assets/vectors";
import { FONTS, SIZES } from "app/constants/Assets";
import { theme } from "app/core/theme";
import styles from "app/styles";
import AsyncStorage from "@react-native-async-storage/async-storage";



interface IProps {
  items: any[];
  title: string;
  onDeleteSuccess?: (deletedItem: any) => void;
}

const RecipientsItem = ({ items, title, onDeleteSuccess }: IProps) => {
  const { width } = useWindowDimensions();
  const getCountryISO2 = require("country-iso-3-to-2");
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const currentToken = useRecoilValue(ProfileState);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);

  const handleDeleteRecipient = (recipientData: any) => {
    setSelectedRecipient(recipientData);
    setShowConfirm(true);
  };
  
  const executeDelete = async (recipientData: any) => {
    setLoading(true);
    const postData: any = {
      ReceiverID: recipientData.ReceiverID,
      remitterId: currentToken.remitterId,
      tokenId: currentToken.tokenId || "",
    };
    try {
      const response = await DeleteBeneficiary(postData);
      if (response && response.status === 200 && response.data) {
        const { StatusCode, StatusMsg } = response.data;

        if (StatusCode === "ER0086" || StatusCode === "ER0000") {
          Toast.show({
            type: "success",
            text1: "Deleted Recipient",
            text2: StatusMsg || "Recipient deleted successfully.",
          });
          
          // ✅ Call parent callback
          if (onDeleteSuccess) {
            onDeleteSuccess(recipientData);
          }
        } else {
          Toast.show({
            type: "error",
            text1: "Deleted Recipient",
            text2: StatusMsg || "Failed to delete recipient.",
          });
        }
      } else {
        throw new Error("Invalid response or missing data.");
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.message || "An error occurred while deleting the recipient.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditRecipient = (recipientData: any) => {
    // navigation.navigate("AddRecipients", { editData: recipientData });
    (navigation as any).navigate("AddRecipients", { editData: recipientData });

  };

  const handleSendMoney = async (recipientData: any) => {
  console.log("Recipient Data:", recipientData);

  await AsyncStorage.setItem('selectedRecipientCurrency', recipientData?.CountryCode || '');
  (navigation as any).navigate("SendMoney", { editData: recipientData });
};

  
  const confirmDelete = () => {
    setShowConfirm(false);
    if (selectedRecipient) {
      executeDelete(selectedRecipient);
    }
  };
  
  return (
    <View style={{ flexDirection: "column", width: "100%" }}>
      <View style={{ flexDirection: "row", marginBottom: 12, marginTop: 24, marginHorizontal: 20, alignItems: "center", justifyContent: "space-between", paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: '#316b83', fontSize: 13, fontWeight: "600", letterSpacing: 0.2 }}>{title} Recipients</Text>
        </View>
      </View>
      {items.map((item) => (
        <View
          key={item.ReceiverID?.toString()}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
            marginHorizontal: 20,
            backgroundColor: "#fff",
            padding: 16,
            borderRadius: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
            borderWidth: 1,
            borderColor: "#E5E7EB"
          }}
        >
          <View style={{ width: SIZES.p40, height: SIZES.p40, borderRadius: 10, alignItems: "center", overflow: "hidden" }}>
            <CountryFlag
              style={{ width: SIZES.p40, height: SIZES.p40 }}
              isoCode={getCountryISO2(item.CountryCode) || ""}
              size={35}
            />
          </View>
          <View style={{ width: "100%", marginLeft: SIZES.p15, flex: 1 }}>
            <Text
              style={{
                color: "#1F2937",
                fontWeight: "500",
                fontSize: 14,
                textTransform: "capitalize",
              }}
              numberOfLines={1}
            >
              {item.FirstName} {item.LastName}
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "center",
              alignContent: "center",
            }}
          >
            <Menu>
              <MenuTrigger customStyles={{ triggerWrapper: { padding: 8 } }}>
                <Vector as="materialCI" name="dots-vertical" size={24} color="#9CA3AF" />
              </MenuTrigger>
              <MenuOptions customStyles={{
                optionsContainer: {
                  borderRadius: 14,
                  paddingVertical: 8,
                  width: 180,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 12,
                  elevation: 5,
                }
              }}>
                <MenuOption onSelect={() => handleSendMoney(item)} customStyles={{ optionWrapper: { flexDirection: 'row', alignItems: 'center', padding: 12 } }}>
                  <Vector as="ionicons" name="paper-plane-outline" size={18} color="#111827" style={{ marginRight: 12 }} />
                  <Text style={{ color: "#111827", fontSize: 15, fontWeight: "500" }}>Send Money</Text>
                </MenuOption>
                
                <View style={{ height: 1, backgroundColor: "#F3F4F6", marginHorizontal: 12 }} />

                <MenuOption onSelect={() => handleEditRecipient(item)} customStyles={{ optionWrapper: { flexDirection: 'row', alignItems: 'center', padding: 12 } }}>
                  <Vector as="ionicons" name="pencil-outline" size={18} color="#111827" style={{ marginRight: 12 }} />
                  <Text style={{ color: "#111827", fontSize: 15, fontWeight: "500" }}>Edit</Text>
                </MenuOption>

                <View style={{ height: 1, backgroundColor: "#F3F4F6", marginHorizontal: 12 }} />

                <MenuOption onSelect={() => handleDeleteRecipient(item)} customStyles={{ optionWrapper: { flexDirection: 'row', alignItems: 'center', padding: 12 } }}>
                  <Vector as="ionicons" name="trash-outline" size={18} color="#EF4444" style={{ marginRight: 12 }} />
                  <Text style={{ color: "#EF4444", fontSize: 15, fontWeight: "500" }}>Delete</Text>
                </MenuOption>
              </MenuOptions>
            </Menu>
          </View>
        </View>
      ))}
      {showConfirm && (
        <Modal transparent visible animationType="fade">
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View
              style={{
                backgroundColor: "#fff",
                paddingVertical: 25,
                paddingHorizontal: 20,
                borderRadius: 24,
                minWidth: 320,
                alignItems: "center",
              }}
            >
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Vector as="ionicons" name="trash-outline" size={32} color="#EF4444" />
              </View>
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 8 }}>Remove Recipient?</Text>
              <Text style={{ fontSize: 15, color: "#6B7280", textAlign: "center", marginBottom: 24 }}>
                Are you sure you want to delete this recipient? This action cannot be undone.
              </Text>

              <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%" }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor: "#F3F4F6",
                    marginRight: 8,
                    alignItems: "center"
                  }}
                  onPress={() => setShowConfirm(false)}
                >
                  <Text style={{ color: "#4B5563", fontWeight: "600", fontSize: 15 }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor: "#FEF2F2",
                    marginLeft: 8,
                    alignItems: "center"
                  }}
                  onPress={confirmDelete}
                >
                  <Text style={{ color: "#EF4444", fontWeight: "700", fontSize: 15 }}>Yes, Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

    </View>
  );
};

export default RecipientsItem;
