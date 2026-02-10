import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  FlatList,
  Modal,
} from "react-native";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useRecoilValue } from "recoil";
import { ProfileState } from "app/atoms";
import HomeHeader from "app/components/HomeHeader";
import { Ionicons } from "@expo/vector-icons";
import { GetQuickWatchList, DeleteWatchList } from "app/http-services";

const QuickAddWatchlist: React.FC = () => {
  const currentToken = useRecoilValue(ProfileState);
  const isFocused = useIsFocused();
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [watchList, setWatchList] = useState<any[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    if (isFocused) fetchQuickWatchList();
  }, [isFocused]);

  const fetchQuickWatchList = async () => {
    try {
      setLoading(true);
      const req = { RemitterID: currentToken?.remitterId };
      const response = await GetQuickWatchList(req);
      if (
        response.data.StatusCode === "ER0000" &&
        Array.isArray(response.data.Quickwatchdetail)
      ) {
        setWatchList(response.data.Quickwatchdetail);
      } else {
        setWatchList([]);
      }
    } catch (error) {
      console.error("GetQuickWatchList error:", error);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;
    try {
      setLoading(true);
      const req = {
        RemitterID: currentToken?.remitterId,
        ToCountryCode: selectedItem.ToCountryCode,
      };
      const res = await DeleteWatchList(req);
      if (res.data.StatusCode === "ER0000") {
        setWatchList((prev) =>
          prev.filter((w) => w.ToCountryCode !== selectedItem.ToCountryCode)
        );
        Toast.show({
                type: 'success',
                text1: 'Success',
                text2: res?.data?.StatusMsg || 'Deleted Success',
                position: 'top',
              });
      } else {
        console.warn("Failed:", res.data.StatusDesc || "Something went wrong");
      }
    } catch (error) {
      console.error("DeleteWatchList error:", error);
    } finally {
      setLoading(false);
      setShowConfirm(false);
      setSelectedItem(null);
    }
  };

  const filteredData = watchList.filter(
    (item) =>
      item.ToCountryName?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.ToCurrency?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.ToCountryCode?.toLowerCase().includes(searchText.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  const handleEdit = (item: any) => {
    // ✅ Navigate to form with edit data
    navigation.navigate("QuickAddWatchlistForm", { editItem: item });
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.currencyCard, { width: "100%" }]}>
      <View style={styles.cardContent}>
        <Image source={{ uri: item.CountryFlag }} style={styles.flag} />
        <View style={styles.textContainer}>
          <Text style={styles.cardText}>
            1 GBP to {item.ToCurrency} ({item.ToCountryCode})
          </Text>
          <Text style={styles.cardRate}>{item.ExchangeCheckRate}</Text>
        </View>
        <View style={styles.actionContainer}>
          {/* ✏️ Edit */}
          <Pressable onPress={() => handleEdit(item)} style={{ padding: 8 }}>
            <Ionicons name="pencil" size={20} color="#316b83" />
          </Pressable>

          {/* 🗑️ Delete */}
          <Pressable
            onPress={() => {
              setSelectedItem(item);
              setShowConfirm(true);
            }}
            style={{ padding: 8, marginLeft: 12 }}
          >
            <Ionicons name="trash" size={20} color="#e53935" />
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <HomeHeader name={currentToken.firstName} currency="£" reward="" />

      <View style={styles.headerRow}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={18}
            color="#316b83"
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Country or Code..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* ✅ Quick Add Button */}
        {watchList.length < 5 && (
          <Pressable
            style={styles.addButtonRound}
            onPress={() => navigation.navigate("QuickAddWatchlistForm")}
          >
            <Ionicons
              name="add-circle-outline"
              size={20}
              color="#fff"
              style={{ marginRight: 5 }}
            />
            <Text style={styles.addButtonText}>Quick Add</Text>
          </Pressable>
        )}
      </View>

      {filteredData.length === 0 ? (
        <Text style={{ marginTop: 20, color: "#777", textAlign: "center" }}>
          No records found.
        </Text>
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={(item) => item.ToCountryCode}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        />
      )}

      {/* 🟡 Confirm Delete Modal */}
      {showConfirm && (
        <Modal transparent visible animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalText}>
                Are you sure you want to delete {selectedItem?.ToCountryName}?
              </Text>

              <View style={{ flexDirection: "row", justifyContent: "center" }}>
                <Pressable
                  style={styles.cancelBtn}
                  onPress={() => {
                    setShowConfirm(false);
                    setSelectedItem(null);
                  }}
                >
                  <Text style={styles.cancelText}>CANCEL</Text>
                </Pressable>

                <Pressable style={styles.deleteBtn} onPress={confirmDelete}>
                  <Text style={styles.deleteText}>YES, DELETE</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 10
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    height: 45,
  },
  searchInput: { flex: 1, fontSize: 14,   fontFamily: "SF Pro Display", color: "#333" },
  addButtonRound: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#316b83",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  addButtonText: { color: "#fff", fontSize: 14,   fontFamily: "SF Pro Display", fontWeight: "600" },
  currencyCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardContent: { flexDirection: "row", alignItems: "center" },
  flag: { width: 32, height: 32, marginRight: 12, borderRadius: 16 },
  textContainer: { flex: 1 },
  cardText: { fontSize: 12,   fontFamily: "SF Pro Display", color: "#333" },
  cardRate: { fontSize: 14,   fontFamily: "SF Pro Display", fontWeight: "600", color: "#316b83", marginTop: 4 },
  actionContainer: { flexDirection: "row", alignItems: "center" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    paddingVertical: 25,
    paddingHorizontal: 20,
    borderRadius: 6,
    minWidth: 300,
    alignItems: "center",
  },
  modalText: { fontSize: 12,   fontFamily: "SF Pro Display", textAlign: "center", marginBottom: 20 },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 4,
    backgroundColor: "#f1f1f1",
    marginRight: 10,
  },
  cancelText: { color: "#316b83", fontWeight: "bold", fontSize: 12,   fontFamily: "SF Pro Display" },
  deleteBtn: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 4,
    backgroundColor: "#316b83",
  },
  deleteText: { color: "#fff", fontWeight: "bold", fontSize: 12,  fontFamily: "SF Pro Display" },
});

export default QuickAddWatchlist;
