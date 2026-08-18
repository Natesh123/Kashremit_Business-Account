import { FONTS } from "../../constants/Assets";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import Container from "../../theme/Container";
import styles from "../../styles";
import { GetDocumentList, RemitterUpgrade } from "app/http-services";
import { useRecoilValue } from "recoil";
import { ProfileState } from "app/atoms";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import ModalHeaderBack from "../../components/ModalHeaderBack";
import { LinearGradient } from "expo-linear-gradient";

const ID_DOC_TYPES = [
  "aadhaar",
  "passport",
  "driving license",
  "driving licence",
  "pan",
  "voter id",
];

const UploadnewDocuments: React.FC = () => {
  const currentToken = useRecoilValue(ProfileState);
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const [loading, setLoading] = useState(false);
  const [documentType, setDocumentType] = useState<any>({ value: "", error: "" });
  const [documentGroups, setDocumentGroups] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [frontDoc, setFrontDoc] = useState<any>(null);
  const [backDoc, setBackDoc] = useState<any>(null);

  const [showPopup, setShowPopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  useEffect(() => {
    if (isFocused) {
      fetchDocumentList(currentToken.tokenId, currentToken.remitterId);
    }
  }, [isFocused]);

  /** Get extension */
  const getExtensionFromMime = (mime: string) => {
    switch (mime) {
      case "image/png":
        return ".png";
      case "image/jpeg":
      case "image/jpg":
        return ".jpg";
      case "application/pdf":
        return ".pdf";
      default:
        return "";
    }
  };

  /** Fetch document types */
  const fetchDocumentList = async (tokenId: string, remitterId: string) => {
    try {
      setLoading(true);
      const res = await GetDocumentList(tokenId);

      if (res.status === 200 && res.data.StatusCode === "ER0000") {
        const types = Array.isArray(res.data.DocumentTypes)
          ? res.data.DocumentTypes
          : [];

        let groupedDocs = types.map((type: any) => {
          const subCategories = Array.isArray(type.SubCategories)
            ? type.SubCategories
            : [];

          const typeDocuments = Array.isArray(type.Documents)
            ? type.Documents
            : [];

          return {
            type: type.Type || "",
            typeDocuments,
            subCategories: subCategories.map((sub: any) => ({
              name: sub?.Name?.trim() ? sub.Name : null,
              documents: Array.isArray(sub.Documents) ? sub.Documents : [],
              expanded: false,
            })),
            expanded: false,
          };
        });

        // ✅ SORT: ID-Document first → Non-ID-Document second
        groupedDocs.sort((a: any, b: any) => {
          const aIsID = a.type.toLowerCase().startsWith("id-");
          const bIsID = b.type.toLowerCase().startsWith("id-");

          if (aIsID && !bIsID) return -1;  // ID first
          if (!aIsID && bIsID) return 1;   // Non-ID second
          return 0;
        });


        setDocumentGroups(groupedDocs);
      } else {
        setDocumentGroups([]);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      setDocumentGroups([]);
    } finally {
      setLoading(false);
    }
  };
  ;




  /** Pick a file */
  const pickFile = async (side: "front" | "back") => {
    if (!documentType.value) {
      setShowPopup(true);
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/jpeg", "image/png", "image/jpg", "application/pdf"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const file = result.assets[0];

        // 1. Validation: File Format
        const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
        if (!allowedTypes.includes(file.mimeType || "")) {
          alert("Selected file format is not supported. Please use JPG, JPEG, PNG, or PDF.");
          return;
        }

        // 2. Validation: File Size (2MB = 2,097,152 bytes)
        const sizeLimit = 2 * 1024 * 1024;
        if (file.size && file.size > sizeLimit) {
          alert("File is too large! Please upload a file smaller than 2MB.");
          return;
        }

        const response = await fetch(file.uri);
        const blob = await response.blob();
        const reader = new FileReader();

        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1];
          const enrichedFile = { ...file, base64 };
          if (side === "front") setFrontDoc(enrichedFile);
          else setBackDoc(enrichedFile);
        };

        reader.readAsDataURL(blob);
      }
    } catch (err) {
      console.log("Error picking file:", err);
    }
  };

  /** Upload */
  const handleUpload = async () => {
    if (!documentType.value) {
      setDocumentType((prev: any) => ({ ...prev, error: "Please select document type" }));
      return;
    }
    if (!frontDoc || !backDoc) {
      alert("Please select both front and back files");
      return;
    }

    const req = {
      TokenId: currentToken.tokenId,
      RemitterId: currentToken.remitterId,
      IdType: documentType.value,
      ImageType: getExtensionFromMime(frontDoc.mimeType),
      Imagebase64: frontDoc.base64,
      Imagename:
        frontDoc.name ||
        `front${getExtensionFromMime(frontDoc.mimeType)}`,

      BackSideImageType: getExtensionFromMime(backDoc.mimeType),
      BackSideImagebase64: backDoc.base64,
      BackSideImagename:
        backDoc.name ||
        `back${getExtensionFromMime(backDoc.mimeType)}`,
    };

    try {
      setLoading(true);
      const res = await RemitterUpgrade(req);

      if (res.data.StatusCode === "ER0000") {
        setShowSuccessPopup(true);
      } else {
        alert(res.data.Status || "Upload failed");
      }
    } catch (e) {
      console.error("Upload error:", e);
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  /** File preview */
  const renderPreview = (file: any) => {
    if (!file) return <Text style={{ color: "#888", marginBottom: 8 }}>Drop your file here</Text>;
    if (file.mimeType === "application/pdf") {
      return (
        <Image
          source={{ uri: "https://cdn-icons-png.flaticon.com/512/337/337946.png" }}
          style={{ width: 60, height: 60, marginBottom: 8 }}
        />
      );
    }
    return (
      <Image
        source={{ uri: file.uri }}
        style={{ width: 120, height: 70, resizeMode: "contain", marginBottom: 8 }}
      />
    );
  };

  return (
    <SafeAreaView style={[styles.container, { flex: 1, backgroundColor: '#316b83', marginTop: 0 }]}>
      <ModalHeaderBack title="Upload New Documents" />
      <Container style={{ backgroundColor: '#f9f9f9', flex: 1 }}>


        {/* Document Type Dropdown */}
        <View style={{ paddingHorizontal: 16, paddingTop: 12, marginBottom: 10 }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
            paddingBottom: 10,
            borderBottomWidth: 1,
            borderBottomColor: '#ddd',
            marginTop: 8
          }}>
            <Ionicons name="document-text-outline" size={24} color="#316b83" style={{ marginRight: 8 }} />
            <Text style={{
                fontSize: 15,
                fontWeight: '700',
                color: '#316b83',
            }}>Document Type</Text>
          </View>

          <View
            style={{
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 12,
              backgroundColor: "#fff",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            {/* Selected Value */}
            <TouchableOpacity
              onPress={() => {
                setShowDropdown(!showDropdown);

                // collapse all open groups
                const updated = documentGroups.map(group => ({
                  ...group,
                  expanded: false,
                  visibleSubCategory: null,
                }));

                setDocumentGroups(updated);
              }}

              style={{
                padding: 12,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ fontWeight: "500", fontSize: 12, fontFamily: FONTS.regular }}>
                {documentType.value?.includes(",")
                  ? documentType.value.split(",")[1].trim()
                  : (documentType.value || "Select ID Doc / Non ID Doc")}
              </Text>
              <Text style={{ fontWeight: "500", fontSize: 12, fontFamily: FONTS.regular }}>
                {showDropdown ? "▲" : "▼"}
              </Text>
            </TouchableOpacity>

            {/* Nested Dropdown */}
            {showDropdown && (
              <View
                style={{
                  marginTop: 4,
                  borderWidth: 1,
                  borderColor: "#ddd",
                  backgroundColor: "#fff",
                  borderRadius: 10,
                  maxHeight: 250,
                }}
              >
                <ScrollView nestedScrollEnabled>
                  {documentGroups.map((group, gIndex) => (
                    <View key={group.type}>
                      {/* MAIN TYPE */}
                      <TouchableOpacity
                        onPress={() => {
                          const updated = documentGroups.map((group, index) => ({
                            ...group,
                            expanded: index === gIndex ? !group.expanded : false,
                            visibleSubCategory: null,
                          }));

                          setDocumentGroups(updated);
                        }}

                        style={{
                          padding: 12,
                          backgroundColor: "#eee",
                          marginVertical: 2,
                        }}
                      >
                        <Text style={{ fontWeight: "bold", fontSize: 12, fontFamily: FONTS.regular }}>
                          {group.type}
                        </Text>
                      </TouchableOpacity>

                      {/* EXPANDED ITEMS */}
                      {group.expanded && (
                        <View style={{ paddingLeft: 16 }}>
                          {/* TYPE-LEVEL DOCUMENTS */}
                          {[...(group.typeDocuments || [])]
                            .sort((a, b) => (a === "Others" ? 1 : b === "Others" ? -1 : 0))
                            .map((doc) => (
                              <TouchableOpacity
                                key={doc}
                                onPress={() => {
                                  setDocumentType({ value: `${group.type}, ${doc}`, error: "" });
                                  setShowDropdown(false);
                                }}
                                style={{
                                  padding: 8,
                                  backgroundColor: "#f5f5f5",
                                  marginVertical: 1,
                                }}
                              >
                                <Text style={{ fontWeight: "bold", fontSize: 12, fontFamily: FONTS.regular }}>
                                  {doc}
                                </Text>
                              </TouchableOpacity>
                            ))}

                          {/* SUBCATEGORY DOCUMENTS */}
                          {group.subCategories?.map((sub: { name: string | null; documents: any; }, sIndex: number) => {
                            // Only show this subcategory if nothing is open OR this is the open one
                            if (!group.visibleSubCategory || group.visibleSubCategory === sub.name) {
                              return (
                                <View key={sub.name || `sub-${sIndex}`}>
                                  {sub.name && sub.name !== "ADD_DOC" ? (
                                    <>
                                      <TouchableOpacity
                                        onPress={() => {
                                          const updated = [...documentGroups];

                                          // If this subcategory is already open → close it
                                          if (updated[gIndex].visibleSubCategory === sub.name) {
                                            updated[gIndex].visibleSubCategory = null;
                                          } else {
                                            // Open this one, hide all others
                                            updated[gIndex].visibleSubCategory = sub.name;
                                          }

                                          setDocumentGroups(updated);
                                        }}
                                        style={{
                                          padding: 10,
                                          backgroundColor: "#f5f5f5",
                                          marginVertical: 1,
                                        }}
                                      >
                                        <Text>{String(sub.name)}</Text>
                                      </TouchableOpacity>

                                      {/* Documents of this subcategory */}
                                      {group.visibleSubCategory === sub.name &&
                                        [...(sub.documents || [])]
                                          .sort((a, b) => (a === "Others" ? 1 : b === "Others" ? -1 : 0))
                                          .map((doc) => (
                                            <TouchableOpacity
                                              key={doc}
                                              onPress={() => {
                                                setDocumentType({ value: `${group.type}, ${doc}`, error: "" });
                                                setShowDropdown(false);
                                              }}
                                              style={{
                                                padding: 8,
                                                paddingLeft: 20,
                                              }}
                                            >
                                              <Text>{doc}</Text>
                                            </TouchableOpacity>
                                          ))}
                                    </>
                                  ) : (
                                    // Flatten ADD_DOC documents
                                    [...(sub.documents || [])]
                                      .sort((a, b) => (a === "Others" ? 1 : b === "Others" ? -1 : 0))
                                      .map((doc) => (
                                        <TouchableOpacity
                                          key={doc}
                                          onPress={() => {
                                            setDocumentType({ value: `${group.type}, ${doc}`, error: "" });
                                            setShowDropdown(false);
                                          }}
                                          style={{
                                            padding: 8,
                                            backgroundColor: "#f5f5f5",
                                            marginVertical: 1,
                                            paddingLeft: 16,
                                          }}
                                        >
                                          <Text>{doc}</Text>
                                        </TouchableOpacity>
                                      ))
                                  )}
                                </View>
                              );
                            } else {
                              return null;
                            }
                          })}



                        </View>
                      )}
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Error message */}
          {documentType.error && (
            <Text style={{ color: "red", marginTop: 4 }}>{documentType.error}</Text>
          )}
        </View>


        {/* File Upload Section */}
        <ScrollView
          style={{ flex: 1, width: "100%", backgroundColor: "#f5f7f9", padding: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
            paddingBottom: 10,
            borderBottomWidth: 1,
            borderBottomColor: '#ddd',
            marginTop: 10
          }}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#316b83" style={{ marginRight: 8 }} />
            <Text style={{
                fontSize: 15,
                fontWeight: '700',
                color: '#316b83',
            }}>Proof Of Identification</Text>
          </View>
          <Text style={{ color: "#6B7280", fontSize: 13, fontFamily: FONTS.regular, marginTop: 6, marginBottom: 12 }}>
            Please upload documents in JPEG, JPG, PNG, or PDF format only. Each file must not exceed 2MB in size
          </Text>

          <View style={{ marginBottom: 20, marginTop: 16, flexDirection: "column", gap: 20 }}>

            {/* Front */}
            <TouchableOpacity
              onPress={() => pickFile("front")}
              activeOpacity={0.8}
              style={{
                borderWidth: 2,
                borderColor: "#316b83",
                borderStyle: "dashed",
                borderRadius: 16,
                padding: 24,
                alignItems: "center",
                backgroundColor: "#F8FAFC",
              }}
            >
              <Ionicons name="cloud-upload-outline" size={36} color="#316b83" style={{ marginBottom: 8 }} />
              <Text style={{ fontFamily: FONTS.bold, fontSize: 16, color: '#1F2937', marginBottom: 12 }}>Front Side</Text>
              {renderPreview(frontDoc)}
              <View style={{
                backgroundColor: '#316b83',
                borderRadius: 20,
                paddingVertical: 10,
                paddingHorizontal: 24,
                marginTop: 12,
              }}>
                <Text style={{ color: "#fff", fontFamily: FONTS.semibold, fontSize: 13 }}>Browse Files</Text>
              </View>
            </TouchableOpacity>

            {/* Back */}
            <TouchableOpacity
              onPress={() => pickFile("back")}
              activeOpacity={0.8}
              style={{
                borderWidth: 2,
                borderColor: "#316b83",
                borderStyle: "dashed",
                borderRadius: 16,
                padding: 24,
                alignItems: "center",
                backgroundColor: "#F8FAFC",
              }}
            >
              <Ionicons name="cloud-upload-outline" size={36} color="#316b83" style={{ marginBottom: 8 }} />
              <Text style={{ fontFamily: FONTS.bold, fontSize: 16, color: '#1F2937', marginBottom: 12 }}>Back Side</Text>
              {renderPreview(backDoc)}
              <View style={{
                backgroundColor: '#316b83',
                borderRadius: 20,
                paddingVertical: 10,
                paddingHorizontal: 24,
                marginTop: 12,
              }}>
                <Text style={{ color: "#fff", fontFamily: FONTS.semibold, fontSize: 13 }}>Browse Files</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Upload Button */}
        <View style={{ padding: 16 }}>
          <TouchableOpacity onPress={handleUpload} disabled={loading} activeOpacity={0.8}>
            <LinearGradient
              colors={["#104e5b", "#316b83"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                height: 56,
                borderRadius: 28,
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "row",
                shadowColor: "#104e5b",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6
              }}
            >
              {loading && <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />}
              <Text style={{ color: "#fff", fontFamily: FONTS.bold, fontSize: 16 }}>Upload Document</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Error Popup */}
        <Modal visible={showPopup} transparent animationType="fade">
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
          >
            <View
              style={{
                width: "80%",
                backgroundColor: "#fff",
                borderRadius: 20,
                padding: 25,
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.25,
                shadowRadius: 15,
                elevation: 10,
              }}
            >
              <View style={{ backgroundColor: '#FEE2E2', padding: 15, borderRadius: 50, marginBottom: 15 }}>
                <Ionicons name="warning-outline" size={40} color="#EF4444" />
              </View>
              <Text style={{ fontSize: 14, fontWeight: '700', marginBottom: 10, textAlign: "center", color: '#111827' }}>
                Required
              </Text>
              <Text style={{ fontSize: 14, marginBottom: 25, textAlign: "center", color: '#4B5563', lineHeight: 20 }}>
                Please select a document type first!
              </Text>
              <TouchableOpacity
                onPress={() => setShowPopup(false)}
                style={{
                  paddingVertical: 12,
                  width: '100%',
                  backgroundColor: "#316b83",
                  borderRadius: 12,
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Success Popup */}
        <Modal visible={showSuccessPopup} transparent animationType="fade">
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
          >
            <View
              style={{
                width: "85%",
                backgroundColor: "#fff",
                borderRadius: 24,
                padding: 30,
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
                elevation: 15,
              }}
            >
              <View style={{ backgroundColor: '#D1FAE5', padding: 20, borderRadius: 60, marginBottom: 20 }}>
                <Ionicons name="checkmark-circle" size={60} color="#10B981" />
              </View>

              <Text style={{ fontSize: 16, fontWeight: '800', marginBottom: 12, textAlign: "center", color: '#065F46' }}>
                Success!
              </Text>

              <Text style={{ fontSize: 14, marginBottom: 30, textAlign: "center", color: '#374151', lineHeight: 22 }}>
                Your document has been submitted successfully and is currently under review.
              </Text>

              <TouchableOpacity
                onPress={() => {
                  setShowSuccessPopup(false);
                  navigation.navigate("IdDocuments" as never);
                }}
                style={{
                  paddingVertical: 15,
                  width: '100%',
                  backgroundColor: "#316b83",
                  borderRadius: 14,
                  alignItems: 'center',
                  shadowColor: "#316b83",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>Go to Documents</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </Container>
    </SafeAreaView>
  );
};

export default UploadnewDocuments;
