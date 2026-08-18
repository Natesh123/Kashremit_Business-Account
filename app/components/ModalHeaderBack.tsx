import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import TouchableText from "./TouchableText";
import { FONTS, SIZES } from "../constants/Assets";
import COLORS from "../constants/Colors";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRecoilValue } from "recoil";
import { SendMoneyTabState } from "../atoms";
import CircularProgress from "./CircularProgress";

type Props = {
    title?: string;
};

const ModalHeaderBack = ({ title = '' }: Props) => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const styles = StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            backgroundColor: "#316b83",
            paddingVertical: 18,
        },
        title: {
            fontSize: 18,
            marginLeft: 12,
            fontWeight: 'bold',
            fontFamily: FONTS.bold,
            color: '#fff'
        },
    });
    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => {
                if (navigation.canGoBack()) {
                    navigation.goBack();
                } else {
                    navigation.navigate("Root" as any);
                }
            }}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>{title}</Text>
        </View>
        //         <View>

        //             <View
        //                 style={{
        //                     backgroundColor: COLORS.white, padding: 10,
        //                     flexDirection: "row",
        //                     alignItems: "center", alignContent: "center"
        //                 }}>
        //                 <TouchableOpacity onPress={() => navigation.goBack()}>
        //                     <Vector
        //                         as="ionicons"
        //                         name="arrow-back-sharp"
        //                         size={25}
        //                         color={COLORS.black50}
        //                     />
        //                 </TouchableOpacity>
        //                 <View
        //                     style={{
        //                         flexDirection: "row",
        //                         flex: 1,
        //                         width: "100%",
        //                     }}
        //                 >
        //                     <View
        //                         style={{
        //                             flexDirection: "column",
        //                             alignSelf: "center",
        //                             justifyContent: "space-between",
        //                             padding: 4,
        //                             borderRadius: SIZES.p6,
        //                         }}>
        // {title}
        //                     </View>
        //                 </View>
        //             </View>
        //         </View>
    );
};

export default ModalHeaderBack;
