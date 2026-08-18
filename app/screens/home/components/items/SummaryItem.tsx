import { View, Text, TextInput } from "react-native";
import React from "react";
import { useRecoilValue } from "recoil";
import { FONTS, SIZES } from "../../../../constants/Assets";
import COLORS from "../../../../constants/Colors";
import styles from "../../../../styles";
import { ProfileState } from "../../../../atoms";
import { useNavigation } from "@react-navigation/native";
import { SummaryModel } from "app/models/summary-model";
import Vector from "app/assets/vectors";
import { theme } from '../../../../core/theme';
import { Image, useWindowDimensions } from "react-native";
type Props = SummaryModel;


const SummaryItem = ({ id, icon, title, value, columnIndex, totalColumns }: Props) => {
    const navigation = useNavigation();
    const currentToken = useRecoilValue(ProfileState);
    const isFirst = columnIndex === 0;
    const isLast = columnIndex === totalColumns - 1;
    const { width } = useWindowDimensions();
    return (
        <View>
            <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 16, marginLeft: isFirst ? 16 : 8,
                marginRight: isLast ? 16 : 8, width: (width * 0.50)-24, minHeight: 140, justifyContent: "space-between", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: "#E5E7EB" }}>
                <View
                    style={{
                        alignItems: "center",
                        justifyContent: "center",
                        width: 44,
                        height: 44, 
                        borderRadius: 22,
                        backgroundColor: '#F0F9FF',
                        marginBottom: 16
                    }}>
                    <Vector
                        as="ionicons"
                        name={icon}
                        size={24}
                        color={'#316b83'}
                    />
                </View>
                <View>
                    <Text numberOfLines={2} style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>
                        {title}
                    </Text>
                </View>
                <View style={{ justifyContent: "flex-start"}}>
                    <Text style={{ color: "#111827", fontWeight: '700', fontSize: 16 }}>
                        {value}
                    </Text>
                </View>
            </View>
        </View>
    );
};

export default SummaryItem;
