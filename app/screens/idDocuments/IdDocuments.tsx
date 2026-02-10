import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
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

        // split docs into ID and Non-ID
        const idDocs = docs.filter(
          (d: any) =>
            d?.Document_Type &&
            ID_DOC_TYPES.some(
              (type) => type.toLowerCase() === d.Document_Type.toLowerCase()
            )
        );

        const nonIdDocs = docs.filter(
          (d: any) =>
            d?.Document_Type &&
            !ID_DOC_TYPES.some(
              (type) => type.toLowerCase() === d.Document_Type.toLowerCase()
            )
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

      if (res.status === 200 && res.data.StatusCode === "ER0000") {
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
    <SafeAreaView style={[styles.container, { flex: 1 }]}>
      <HomeHeader
        name={currentToken.firstName}
        currency={currency}
        reward={reward}
      />
      <Container>
        <View
  style={{
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "5%",
    marginHorizontal: "5%",
  }}
>
 
  <Text style={styles.header}>My Documents</Text>

  {/* Right side - Upload button */}
 <TouchableOpacity
  onPress={() => navigation.navigate("UploadnewDocuments")}
  style={{
    backgroundColor: "#316b83",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  }}
>
  <Text style={{ fontWeight: "600", color: "#fff", fontSize: 12,   fontFamily: "SF Pro Display" }}>
    Upload New Document
  </Text>
</TouchableOpacity>

</View>


        <ScrollView
          style={{
            width: "100%",
            backgroundColor: "#f5f7f9",
            padding: 16,
            marginTop: 20,
            marginBottom: 70,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* ID Documents */}
          <View>
            <Text style={styles.header}>ID Documents Submitted ({idDocuments.length})</Text>
          </View>

          {idDocuments.length > 0 ? (
            idDocuments.map((doc, idx) => (
              <View
                key={idx}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#f2f1f7ff",
                  padding: 16,
                  marginBottom: 12,
                  borderRadius: 6,
                  shadowColor: "#000",
                  shadowOpacity: 0.1,
                  shadowOffset: { width: 0, height: 1 },
                  shadowRadius: 3,
                  elevation: 2,
                }}
              >
                <Image
                  source={require("../../assets/pdf.png")}
                  style={{ width: 24, height: 24, marginRight: 12 }}
                />
                <Text style={{ fontWeight: "600", fontSize:12,  fontFamily: "SF Pro Display", color: "#333" }}>
                  {doc.Document_Type}
                </Text>
              </View>
            ))
          ) : (
            <Text style={{ marginVertical: 8, color: "#777", fontSize:12,  fontFamily: "SF Pro Display" }}>
               ID documents submitted
            </Text>
          )}

          {/* Non-ID Documents */}
          <View style={{ marginTop: 20 }}>
            <Text style={styles.header}>Non-ID Documents Submitted ({nonIdDocuments.length})</Text>
          </View>

          {nonIdDocuments.length > 0 ? (
            nonIdDocuments.map((doc, idx) => (
              <View
                key={idx}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#f2f1f7ff",
                  padding: 16,
                  marginBottom: 12,
                  borderRadius: 6,
                  shadowColor: "#000",
                  shadowOpacity: 0.1,
                  shadowOffset: { width: 0, height: 1 },
                  shadowRadius: 3,
                  elevation: 2,
                }}
              >
                <Image
                  source={require("../../assets/pdf.png")}
                  style={{ width: 24, height: 24, marginRight: 12 }}
                />
                <Text style={{ fontWeight: "700", color: "#333" }}>
                  {doc.Document_Type}
                </Text>
              </View>
            ))
          ) : (
            <Text style={{ marginVertical: 8, color: "#777" }}>
              No Non-ID documents submitted
            </Text>
          )}

         
        


          
        </ScrollView>
      </Container>
    </SafeAreaView>
  );
};

export default IdDocuments;
