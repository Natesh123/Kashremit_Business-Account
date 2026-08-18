import { FONTS } from "../../constants/Assets";
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
          <Pressable onPress={() => handleEdit(item)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0F9FF', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="pencil" size={18} color="#0284C7" />
          </Pressable>

          {/* 🗑️ Delete */}
          <Pressable
            onPress={() => {
              setSelectedItem(item);
              setShowConfirm(true);
            }}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginLeft: 8 }}
          >
            <Ionicons name="trash" size={18} color="#DC2626" />
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#316b83' }}>
        <HomeHeader name={currentToken?.firstName || ""} currency="£" reward="" />
      </SafeAreaView>

      <View style={styles.headerRow}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#9CA3AF"
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search currencies..."
            placeholderTextColor="#9CA3AF"
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
              name="add"
              size={22}
              color="#fff"
              style={{ marginRight: 4 }}
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
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Ionicons name="trash-outline" size={32} color="#DC2626" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 8 }}>Remove Currency?</Text>
              <Text style={styles.modalText}>
                Are you sure you want to remove {selectedItem?.ToCountryName} from your watchlist?
              </Text>

              <View style={{ flexDirection: "row", justifyContent: "space-between", width: '100%' }}>
                <Pressable
                  style={styles.cancelBtn}
                  onPress={() => {
                    setShowConfirm(false);
                    setSelectedItem(null);
                  }}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>

                <Pressable style={styles.deleteBtn} onPress={confirmDelete}>
                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
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
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    height: 48,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#1F2937", fontWeight: '500' },
  addButtonRound: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#316b83",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    height: 48,
    shadowColor: "#316b83",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  currencyCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  cardContent: { flexDirection: "row", alignItems: "center" },
  flag: { width: 32, height: 32, marginRight: 12, borderRadius: 16 },
  textContainer: { flex: 1 },
  cardText: { fontSize: 13, color: "#6B7280", fontWeight: '500' },
  cardRate: { fontSize: 16, fontWeight: "700", color: "#111827", marginTop: 4 },
  actionContainer: { flexDirection: "row", alignItems: "center" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderRadius: 24,
    width: '85%',
    maxWidth: 340,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalText: { fontSize: 14, color: '#6B7280', fontWeight: '400', textAlign: "center", marginBottom: 24, lineHeight: 22 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    marginRight: 12,
    alignItems: 'center'
  },
  cancelText: { color: "#4B5563", fontWeight: "600", fontSize: 14 },
  deleteBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    alignItems: 'center'
  },
  deleteText: { color: "#DC2626", fontWeight: "700", fontSize: 14 },
});

export default QuickAddWatchlist;
