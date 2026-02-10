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
            <View style={[styles.cardMainWrapper,{ borderRadius:14, paddingHorizontal:12, paddingVertical:14, marginLeft: isFirst ? 20 : 10,
                marginRight: isLast ? 20 : 0, width: (width * 0.50)-25, height: 160, justifyContent: "space-between"}]}>
                <View
                    style={{
                        alignItems: "flex-start",
                        justifyContent: "flex-start",
                        width: 30,
                        height: 30, 
                        borderRadius: 50,
                        marginBottom:20
                    }}>
                    <Vector
                        as="ionicons"
                        name={icon}
                        size={30}
                        color={theme.colors.buttonPrimary}
                    />
                </View>
                <View>
                    <Text numberOfLines={2} style={{ color: COLORS.black50, flexWrap: "wrap", fontFamily: FONTS.regular}}>
                        {title}
                    </Text>
                </View>
                <View  style={{ justifyContent: "flex-start"}}>
                    <Text style={{ color: "#1c1a40", fontFamily: FONTS.semibold, fontSize: SIZES.medium, marginBottom:5, marginTop:15}}>
                        {value}
                    </Text>
                </View>
            </View>
        </View>
    );
};

export default SummaryItem;
