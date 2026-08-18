import { FONTS } from "../../constants/Assets";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
} from "react-native";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from "expo-media-library";
import { SafeAreaView } from "react-native-safe-area-context";
import Container from "../../theme/Container";
import styles from "../../styles";
import Picker from "app/components/customComponents/Picker";
import { GetDocument, GetDocumentList } from "app/http-services";
import { useRecoilValue } from "recoil";
import { ProfileState } from "app/atoms";
import { useIsFocused } from "@react-navigation/native";
import { TDropDown } from "types";
import HomeHeader from "app/components/HomeHeader";
import { SIZES } from "app/constants/Assets";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment';
import { Ionicons } from "@expo/vector-icons";

const getMimeType = (ext: string) => {
  const mimes: { [key: string]: string } = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
  return mimes[ext.toLowerCase()] || "application/octet-stream";
};

const StatusTimeline = ({ status }: { status: string }) => {
  const isAccepted = status === "ACCEPT";
  const isRejected = status === "REJECT";
  const isProcessing = status === "PROCESS";
  const isCompleted = isAccepted || isRejected;

  // Steps: 1. Submitted, 2. Progressing, 3. Success/Fail
  return (
    <View style={{ marginTop: 8, paddingHorizontal: 5 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Step 1: Submitted */}
        <View style={{ alignItems: 'center', flex: 1 }}>
          <View style={{
            width: 22, height: 22, borderRadius: 11,
            backgroundColor: '#fff',
            justifyContent: 'center', alignItems: 'center',
            borderWidth: 1.5, borderColor: '#10B981'
          }}>
            <Ionicons name="checkmark" size={14} color="#059669" />
          </View>
          <Text style={{ fontSize: 9, color: '#059669', fontWeight: '700', marginTop: 4 }}>Submitted</Text>
        </View>

        {/* Connector 1 */}
        <View style={{ height: 2, flex: 0.8, backgroundColor: (isCompleted || isProcessing) ? '#10B981' : '#E5E7EB', marginBottom: 14 }} />

        {/* Step 2: Progressing */}
        <View style={{ alignItems: 'center', flex: 1.2 }}>
          <View style={{
            width: 22, height: 22, borderRadius: 11,
            backgroundColor: isCompleted ? '#fff' : (isProcessing ? '#FEF3C7' : '#F3F4F6'),
            justifyContent: 'center', alignItems: 'center',
            borderWidth: 1.5, borderColor: isCompleted ? '#10B981' : (isProcessing ? '#F59E0B' : '#D1D5DB')
          }}>
            {isCompleted ? (
              <Ionicons name="checkmark" size={14} color="#059669" />
            ) : isProcessing ? (
              <ActivityIndicator size="small" color="#D97706" style={{ transform: [{ scale: 0.7 }] }} />
            ) : (
              <Ionicons name="ellipsis-horizontal" size={12} color="#9CA3AF" />
            )}
          </View>
          <Text style={{ fontSize: 9, color: isCompleted ? '#059669' : (isProcessing ? '#D97706' : '#6B7280'), fontWeight: '700', marginTop: 4 }}>Progressing</Text>
        </View>

        {/* Connector 2 */}
        <View style={{ height: 2, flex: 0.8, backgroundColor: isAccepted ? '#10B981' : (isRejected ? '#EF4444' : '#E5E7EB'), marginBottom: 14 }} />

        {/* Step 3: Decision */}
        <View style={{ alignItems: 'center', flex: 1 }}>
          <View style={{
            width: 22, height: 22, borderRadius: 11,
            backgroundColor: isAccepted ? '#fff' : (isRejected ? '#FEE2E2' : '#F3F4F6'),
            justifyContent: 'center', alignItems: 'center',
            borderWidth: 1.5, borderColor: isAccepted ? '#10B981' : (isRejected ? '#EF4444' : '#D1D5DB')
          }}>
            {isAccepted ? (
              <Ionicons name="checkmark-done" size={14} color="#059669" />
            ) : isRejected ? (
              <Ionicons name="close" size={14} color="#DC2626" />
            ) : (
              <Ionicons name="hourglass-outline" size={12} color="#9CA3AF" />
            )}
          </View>
          <Text style={{
            fontSize: 9,
            color: isAccepted ? '#059669' : (isRejected ? '#DC2626' : '#6B7280'),
            fontWeight: '800', marginTop: 4
          }}>
            {isRejected ? 'Rejected' : (isAccepted ? 'Accepted' : 'Review')}
          </Text>
        </View>
      </View>
    </View>
  );
};

const DocumentDetailModal = ({ visible, onClose, doc, remitterId }: { visible: boolean, onClose: () => void, doc: any, remitterId: string }) => {
  if (!doc) return null;

  const detailRow = (label: string, value: string, icon?: string, isLast?: boolean) => (
    <View style={{
      flexDirection: 'row',
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderBottomWidth: isLast ? 0 : 1,
      borderBottomColor: '#f0f0f0'
    }}>
      <View style={{ width: 40, justifyContent: 'center' }}>
        {icon && <Ionicons name={icon as any} size={22} color="#316b83" />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, color: '#9CA3AF', fontFamily: FONTS.semibold, textTransform: 'uppercase' }}>{label}</Text>
        <Text style={{ fontSize: 15, color: '#1F2937', fontFamily: FONTS.bold, marginTop: 4 }}>{value || 'N/A'}</Text>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#F9FAFB', borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' }}>

          {/* Integrated Modal Header */}
          <LinearGradient
            colors={["#104e5b", "#316b83"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              paddingTop: 12,
              paddingBottom: 16,
            }}
          >
            {/* Bottom Sheet Handle */}
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <View style={{ width: 40, height: 5, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 10 }} />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 }}>
              <Text style={{
                flex: 1,
                fontSize: 18,
                fontFamily: FONTS.bold,
                color: '#FFFFFF',
                textAlign: 'center',
              }}>Document Details</Text>
              <TouchableOpacity
                onPress={onClose}
                style={{
                  position: 'absolute',
                  right: 20,
                  width: 32,
                  height: 32,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: 16,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Ionicons name="close" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <View style={{ padding: 20 }}>
            <View style={{ alignItems: 'center', marginBottom: 25 }}>
              <View style={{
                width: 170,
                height: 110,
                backgroundColor: '#fff',
                borderRadius: 20,
                overflow: 'hidden',
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.15,
                shadowRadius: 15,
                elevation: 10,
                borderWidth: 1,
                borderColor: '#E5E7EB'
              }}>
                <Image
                  source={doc.Document_Name ? { uri: doc.Document_Name } : require("../../assets/pdf.png")}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                />
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              <View style={{
                backgroundColor: '#fff',
                borderRadius: 16,
                overflow: 'hidden',
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}>
                {detailRow("Document Category", doc.Document_Type?.split(",")[0]?.trim(), "layers-outline")}
                {detailRow("Document Type", doc.Document_Type?.split(",")[1]?.trim() || doc.Document_Type, "document-text-outline")}
                {detailRow("Remitter ID", remitterId, "person-outline")}
                {detailRow("Upload Date", doc.UploadedDate ? moment(doc.UploadedDate).format("DD-MMM-YYYY HH:mm") : 'N/A', "calendar-outline")}
                {detailRow("Current Status", doc.Status === "ACCEPT" ? "Accepted" : (doc.Status === "REJECT" ? "Rejected" : (doc.Status === "PROCESS" ? "In Progress" : "Submitted")), "shield-checkmark-outline", true)}
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.8}
              style={{
                backgroundColor: '#316b83',
                paddingVertical: 16,
                borderRadius: 16,
                marginTop: 24,
                alignItems: 'center',
                shadowColor: "#316b83",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4
              }}>
              <Text style={{ color: '#fff', fontFamily: FONTS.bold, fontSize: 16 }}>Close Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const IdDocuments: React.FC = () => {
  const [uploadDocChecked, setUploadDocChecked] = useState<boolean>(false);
  const [frontDocSelected, setFrontDocSelected] = useState<boolean>(false);
  const [backDocSelected, setBackDocSelected] = useState<boolean>(false);
  const [reward, setReward] = useState("");
  const [currency, setCurrency] = useState("£");
  const currentToken = useRecoilValue(ProfileState);
  const [loading, setLoading] = useState(false);
  const isFocused = useIsFocused();
  const navigation = useNavigation()

  const [documentType, setDocumentType] = useState<any>({ value: "", error: "" });
  const [documentTypes, setDocumentTypes] = useState<TDropDown[]>([
    {
      dataValue: "",
      displayvalue: "Select Document Type",
      ISDCode: undefined,
      price: undefined,
      description: undefined,
      flag: undefined
    },
  ]);

  // keep ID and Non-ID separately
  const [idDocuments, setIdDocuments] = useState<any[]>([]);
  const [nonIdDocuments, setNonIdDocuments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"ID" | "Non-ID">("ID");
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const handleDownload = async (url: string, docType: string) => {
    try {
      if (!url) {
        Alert.alert("Error", "Download link not available for this document.");
        return;
      }
      setLoading(true);

      // Extract extension from URL
      const urlParts = url.split('.');
      const extension = (urlParts.length > 1 ? urlParts.pop()?.split('?')[0]?.toLowerCase() : 'pdf') || 'pdf';

      // Clean filename from docType
      const cleanName = docType.replace(/[/\\?%*:|"<>]/g, '-').replace(/\s+/g, '_');
      const fileName = `${cleanName}.${extension}`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      const downloadRes = await FileSystem.downloadAsync(url, fileUri);

      if (downloadRes.status === 200) {
        if (Platform.OS === 'android') {
          // 1. If it's an image, save to gallery
          const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp'];
          if (imageExtensions.includes(extension)) {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status === 'granted') {
              try {
                await MediaLibrary.saveToLibraryAsync(downloadRes.uri);
                Alert.alert("Success", "Document saved to gallery.");
                return;
              } catch (err) {
                console.log("MediaLibrary error, falling back", err);
              }
            }
          }

          // 2. For documents or if gallery failed, use StorageAccessFramework to save to a user chosen folder
          try {
            const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
            if (permissions.granted) {
              const base64 = await FileSystem.readAsStringAsync(downloadRes.uri, { encoding: FileSystem.EncodingType.Base64 });
              const mimeType = getMimeType(extension);

              const newUri = await FileSystem.StorageAccessFramework.createFileAsync(
                permissions.directoryUri,
                fileName,
                mimeType
              );

              await FileSystem.writeAsStringAsync(newUri, base64, { encoding: FileSystem.EncodingType.Base64 });
              Alert.alert("Success", "Document downloaded successfully!");
            } else {
              // Fallback to sharing if permission denied
              await Sharing.shareAsync(downloadRes.uri);
            }
          } catch (safError) {
            console.error("SAF Error:", safError);
            await Sharing.shareAsync(downloadRes.uri);
          }
        } else {
          // iOS: Standard sharing sheet (includes "Save to Files")
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(downloadRes.uri);
          } else {
            Alert.alert("Success", "File downloaded successfully!");
          }
        }
      } else {
        Alert.alert("Error", "Failed to download the document.");
      }
    } catch (error) {
      console.error("Download Error:", error);
      Alert.alert("Error", "Could not download the file. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchSubmittedDocuments(currentToken.tokenId, currentToken.remitterId);
      fetchDocumentList(currentToken.tokenId, currentToken.remitterId);
    }
  }, [isFocused]);

  const canUpload = uploadDocChecked && !!documentType.value && frontDocSelected;

  /** ID DOC TYPES */
  const ID_DOC_TYPES = [
    "aadhaar",
    "passport",
    "driving license",
    "driving licence",
    "pan",
    "voter id",
  ];

  /** Fetch submitted documents */
  const fetchSubmittedDocuments = async (tokenId: string, remitterId: string) => {
    try {
      setLoading(true);
      const res = await GetDocument(tokenId);

      if (res?.status === 200 && res.data.StatusCode === "ER0000") {
        const docs = Array.isArray(res.data.Document) ? res.data.Document : [];

        // split docs into ID and Non-ID based on prefix before comma
        const idDocs = docs.filter(
          (d: any) => {
            const typePrefix = d?.Document_Type?.split(",")[0]?.trim()?.toLowerCase();
            return typePrefix === "id-document";
          }
        );

        const nonIdDocs = docs.filter(
          (d: any) => {
            const typePrefix = d?.Document_Type?.split(",")[0]?.trim()?.toLowerCase();
            return typePrefix === "non-id-document";
          }
        );

        setIdDocuments(idDocs);
        setNonIdDocuments(nonIdDocs);
      } else {
        setIdDocuments([]);
        setNonIdDocuments([]);
      }
    } catch (error) {
      console.error("Fetch Submitted Documents Error:", error);
      setIdDocuments([]);
      setNonIdDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  /** Fetch document types for dropdown */
  const fetchDocumentList = async (tokenId: string, remitterId: string) => {
    try {
      setLoading(true);
      const res = await GetDocumentList(tokenId);

      if (res.status === 200 && res.data.StatusCode === "ER0000" && Array.isArray(res.data.Document)) {
        const documents = res.data.Document.map((data: any) => ({
          dataValue: data.Document_Name,
          displayvalue: data.Document_Type,
        }));

        const docsWithPlaceholder = [
          {
            dataValue: "",
            displayvalue: "Select Document Type",
            ISDCode: undefined,
          },
          ...documents,
        ];

        setDocumentTypes(docsWithPlaceholder);
        setDocumentType({ value: "", error: "" });
      } else {
        setDocumentTypes([
          {
            dataValue: "",
            displayvalue: "Select Document Type",
            ISDCode: undefined,
            price: undefined,
            description: undefined,
            flag: undefined
          },
        ]);
        setDocumentType({ value: "", error: "" });
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#316b83' }}>
        <HomeHeader
          name={currentToken.firstName}
          currency={currency}
          reward={reward}
        />
      </SafeAreaView>
      <Container>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 20,
            marginHorizontal: 16,
            paddingBottom: 15,
            borderBottomWidth: 1,
            borderBottomColor: '#ddd',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="documents-outline" size={24} color="#316b83" style={{ marginRight: 8 }} />
            <Text style={{ 
              fontSize: 16, 
              fontWeight: "700", 
              color: "#316b83", 
              fontFamily: FONTS.bold 
            }}>
              My Documents
            </Text>
          </View>

          {/* Right side - Upload button */}
          <TouchableOpacity
            onPress={() => navigation.navigate("UploadnewDocuments")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#316b83",
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderRadius: 20,
              shadowColor: "#316b83",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 4
            }}
          >
            <Ionicons name="cloud-upload-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={{ 
              fontWeight: "700", 
              color: "#fff", 
              fontSize: 12, 
              fontFamily: FONTS.regular 
            }}>
              Upload New
            </Text>
          </TouchableOpacity>
        </View>


        {/* Tabs */}
        <View
          style={{
            flexDirection: "row",
            marginHorizontal: 16,
            marginTop: 16,
            borderBottomWidth: 1,
            borderBottomColor: "#E5E7EB",
          }}
        >
          <TouchableOpacity
            onPress={() => setActiveTab("ID")}
            style={{
              flex: 1,
              paddingVertical: 12,
              alignItems: "center",
              borderBottomWidth: activeTab === "ID" ? 3 : 0,
              borderBottomColor: activeTab === "ID" ? "#316b83" : "transparent",
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontFamily: activeTab === "ID" ? FONTS.bold : FONTS.semibold,
                color: activeTab === "ID" ? "#316b83" : "#9CA3AF",
              }}
            >
              ID Documents ({idDocuments.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("Non-ID")}
            style={{
              flex: 1,
              paddingVertical: 12,
              alignItems: "center",
              borderBottomWidth: activeTab === "Non-ID" ? 3 : 0,
              borderBottomColor: activeTab === "Non-ID" ? "#316b83" : "transparent",
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontFamily: activeTab === "Non-ID" ? FONTS.bold : FONTS.semibold,
                color: activeTab === "Non-ID" ? "#316b83" : "#9CA3AF",
              }}
            >
              Non-ID Documents ({nonIdDocuments.length})
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{
            width: "100%",
            backgroundColor: "#F8F2F7",
            padding: 16,
            marginTop: 10,
          }}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === "ID" ? (
            <View>
              {idDocuments.length > 0 ? (
                idDocuments.map((doc, idx) => (
                  <View
                    key={idx}
                    style={{
                      backgroundColor: "#FFFFFF",
                      marginBottom: 16,
                      borderRadius: 16,
                      overflow: "hidden",
                      shadowColor: "#000",
                      shadowOpacity: 0.1,
                      shadowOffset: { width: 0, height: 4 },
                      shadowRadius: 10,
                      elevation: 5,
                    }}
                  >
                    {/* Header with Gradient */}
                    <LinearGradient
                      colors={["#104e5b", "#2c637a"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                      }}
                    >
                      <Text
                        numberOfLines={1}
                        style={{
                          color: "#FFFFFF",
                          fontWeight: "600",
                          fontSize: 15,
                          fontFamily: FONTS.semibold,
                          flex: 1,
                          marginRight: 10,
                        }}
                      >
                        {doc.Document_Type?.includes(",") ? doc.Document_Type.split(",")[1].trim() : doc.Document_Type}
                      </Text>
                      <Text
                        style={{
                          color: "#FFFFFF",
                          fontSize: 12,
                          fontWeight: "600",
                          fontFamily: FONTS.regular,
                        }}
                      >
                        {doc.UploadedDate ? moment(doc.UploadedDate).format("DD-MMM-YYYY") : moment().format("DD-MMM-YYYY")}
                      </Text>
                    </LinearGradient>

                    {/* Content Body */}
                    <View style={{ flexDirection: "row", padding: 12, alignItems: 'center', backgroundColor: "#FFFFFF" }}>
                      {/* Left Side: Document Icon/Image */}
                      <View
                        style={{
                          width: 150,
                          height: 90,
                          backgroundColor: "#FFFFFF",
                          borderRadius: 8,
                          justifyContent: "center",
                          alignItems: "center",
                          borderWidth: 1,
                          borderColor: "#E5E7EB",
                          overflow: 'hidden'
                        }}
                      >
                        <Image
                          source={doc.Document_Name ? { uri: doc.Document_Name } : require("../../assets/pdf.png")}
                          style={doc.Document_Name ? { width: "100%", height: "100%" } : { width: 30, height: 30 }}
                          resizeMode="contain"
                        />
                      </View>

                      {/* Right Side: Action */}
                      <View style={{ flex: 1, paddingLeft: 12, justifyContent: "center", alignItems: 'flex-end' }}>
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedDoc(doc);
                            setShowDetailModal(true);
                          }}
                          style={{
                            borderRadius: 25,
                            overflow: 'hidden'
                          }}>
                          <LinearGradient
                            colors={["#0A4E5A", "#316b83"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              paddingHorizontal: 20,
                              paddingVertical: 10,
                              borderRadius: 25,
                              minWidth: 120,
                            }}
                          >
                            <Ionicons name="eye-outline" size={18} color="#FFFFFF" />
                            <Text style={{ marginLeft: 8, color: "#FFFFFF", fontSize: 14, fontWeight: "700", fontFamily: FONTS.regular }}>View</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Status Tracker */}
                    <View style={{ backgroundColor: '#FFFFFF', paddingBottom: 12, borderTopWidth: 0.5, borderTopColor: '#f0f0f0' }}>
                      <StatusTimeline status={doc.Status} />
                    </View>
                  </View>
                ))
              ) : (
                <View style={{ alignItems: 'center', marginTop: 40 }}>
                  <Text
                    style={{
                      color: "#9CA3AF",
                      fontSize: 14,
                      fontFamily: FONTS.regular,
                    }}
                  >
                    No ID documents submitted
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View>
              {nonIdDocuments.length > 0 ? (
                nonIdDocuments.map((doc, idx) => (
                  <View
                    key={idx}
                    style={{
                      backgroundColor: "#FFFFFF",
                      marginBottom: 16,
                      borderRadius: 16,
                      overflow: "hidden",
                      shadowColor: "#000",
                      shadowOpacity: 0.1,
                      shadowOffset: { width: 0, height: 4 },
                      shadowRadius: 10,
                      elevation: 5,
                    }}
                  >
                    {/* Header with Gradient */}
                    <LinearGradient
                      colors={["#104e5b", "#2c637a"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                      }}
                    >
                      <Text
                        numberOfLines={1}
                        style={{
                          color: "#FFFFFF",
                          fontWeight: "600",
                          fontSize: 15,
                          fontFamily: FONTS.semibold,
                          flex: 1,
                          marginRight: 10,
                        }}
                      >
                        {doc.Document_Type?.includes(",") ? doc.Document_Type.split(",")[1].trim() : doc.Document_Type}
                      </Text>
                      <Text
                        style={{
                          color: "#FFFFFF",
                          fontSize: 12,
                          fontWeight: "600",
                          fontFamily: FONTS.regular,
                        }}
                      >
                        {doc.UploadedDate ? moment(doc.UploadedDate).format("DD-MMM-YYYY") : moment().format("DD-MMM-YYYY")}
                      </Text>
                    </LinearGradient>

                    {/* Content Body */}
                    <View style={{ flexDirection: "row", padding: 12, alignItems: 'center', backgroundColor: "#FFFFFF" }}>
                      {/* Left Side: Document Icon/Image */}
                      <View
                        style={{
                          width: 150,
                          height: 90,
                          backgroundColor: "#FFFFFF",
                          borderRadius: 8,
                          justifyContent: "center",
                          alignItems: "center",
                          borderWidth: 1,
                          borderColor: "#E5E7EB",
                          overflow: 'hidden'
                        }}
                      >
                        <Image
                          source={doc.Document_Name ? { uri: doc.Document_Name } : require("../../assets/pdf.png")}
                          style={doc.Document_Name ? { width: "100%", height: "100%" } : { width: 30, height: 30 }}
                          resizeMode="contain"
                        />
                      </View>

                      {/* Right Side: Action */}
                      <View style={{ flex: 1, paddingLeft: 12, justifyContent: "center", alignItems: 'flex-end' }}>
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedDoc(doc);
                            setShowDetailModal(true);
                          }}
                          style={{
                            borderRadius: 25,
                            overflow: 'hidden'
                          }}>
                          <LinearGradient
                            colors={["#0A4E5A", "#316b83"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              paddingHorizontal: 20,
                              paddingVertical: 10,
                              minWidth: 120,
                            }}
                          >
                            <Ionicons name="eye-outline" size={18} color="#FFFFFF" />
                            <Text style={{ marginLeft: 8, color: "#FFFFFF", fontSize: 14, fontWeight: "700", fontFamily: FONTS.regular }}>View</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Status Tracker */}
                    <View style={{ backgroundColor: '#FFFFFF', paddingBottom: 12, borderTopWidth: 0.5, borderTopColor: '#f0f0f0' }}>
                      <StatusTimeline status={doc.Status} />
                    </View>
                  </View>
                ))
              ) : (
                <View style={{ alignItems: 'center', marginTop: 40 }}>
                  <Text
                    style={{
                      color: "#9CA3AF",
                      fontSize: 14,
                      fontFamily: FONTS.regular,
                    }}
                  >
                    No Non-ID documents submitted
                  </Text>
                </View>
              )}
            </View>
          )}

          <DocumentDetailModal
            visible={showDetailModal}
            onClose={() => setShowDetailModal(false)}
            doc={selectedDoc}
            remitterId={currentToken.remitterId}
          />
        </ScrollView>
      </Container>
    </View>
  );
};

export default IdDocuments;
