import { FONTS } from "../../../constants/Assets";
import { View, Text, ViewStyle, ScrollView, RefreshControl, Dimensions, TextInput, TouchableOpacity } from "react-native";
import React, { useEffect, useState } from "react";
import styles from "app/styles";
import Checkbox from "../../../components/Checkbox";
import { BoldMonoText, LightMonoText, MediumMonoText, RegularText } from "app/components/StyledText";
import { GetDocument, GetGDPR, GetReferDetails, GetRemitterProfile } from "app/http-services";
import { useIsFocused } from "@react-navigation/native";
import { useRecoilValue } from "recoil";
import { ProfileState } from "app/atoms";
import { theme } from "app/core/theme";
import { dateFormat } from "app/helpers";
import moment from "moment";
import Vector from "app/assets/vectors";

type Props = {
    profile: any,
    style?: ViewStyle
};

type CheckboxRowProps = {
    status: 'checked' | 'unchecked';
    onPress: () => void;
    label: string;
};


const PersonalDetails = ({ profile, style }: Props) => {
    const isFocused = useIsFocused();
    const currentToken = useRecoilValue(ProfileState);
    const [document, setDocument] = useState(0);
    const [loading, setLoading] = useState(false);


    const [checkedTermsRemitSMS, setCheckedTermsRemitSMS] = useState('N');
    const [checkedTermsRemitEMAIL, setCheckedTermsRemitEMAIL] = useState('N');
    const [checkedTermsInsureSMS, setCheckedTermsInsureSMS] = useState('N');
    const [checkedTermsInsureEMAIL, setCheckedTermsInsureEMAIL] = useState('N');


    useEffect(() => {
        fetchGDPR(currentToken.tokenId, currentToken.remitterId);
        fetchDocument(currentToken.tokenId, currentToken.remitterId);
    }, [isFocused]);

    const fetchDocument = async (tokenId: string, remitterId: string) => {
        try {
            setLoading(true);
            const response = GetDocument(tokenId);
            response.then((res: any) => {
                if (res.status === 200) {
                    if (res.data.StatusCode === "ER0000") {
                        if (res?.data?.Document) {
                            setDocument((res?.data?.Document as any[]).length);
                        }
                    } else {
                        setDocument(0)
                    }
                }
            })
                .catch((err) => {
                    console.error('Fetch Remitter Document', err.response?.data?.message)
                })
                .finally(() => setLoading(false));
        } catch (error) {
            console.error('Error Remitter profile:', error);
        }
    };

    const fetchGDPR = async (tokenId: string, remitterId: string) => {
        try {
            setLoading(true);
            const response = GetGDPR(tokenId);
            response.then((res: any) => {
                if (res.status === 200) {
                    setCheckedTermsRemitSMS(res?.data?.Option1)
                    setCheckedTermsRemitEMAIL(res?.data?.Consent)
                    setCheckedTermsInsureSMS(res?.data?.Option2)
                    setCheckedTermsInsureEMAIL(res?.data?.Option3)
                }
            })
                .catch((err) => {
                    console.error('Fetch Remitter profile', err.response?.data?.message)
                })
                .finally(() => setLoading(false));
        } catch (error) {
            console.error('Error Remitter profile:', error);
        }
    };

    const CheckboxRow = ({ status, onPress, label }: CheckboxRowProps) => (
        <TouchableOpacity
            onPress={onPress}
            style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                marginHorizontal: 20,
                marginTop: 0,
                marginBottom: 10,
            }}
        >
            <Checkbox
                status={status}
                onPress={onPress}
            />
            <Text
                style={{
                    flexShrink: 1,
                    fontFamily: FONTS.regular,
                    fontSize: 14,
                    flexWrap: 'wrap',
                    marginTop: 6,
                    paddingLeft: 8,
                }}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );


    const FieldRow = ({ label, value, icon, hideBorder = false }: { label: string, value: any, icon: string, hideBorder?: boolean }) => (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: hideBorder ? 0 : 1, borderBottomColor: '#F3F4F6' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Vector as="ionicons" name={icon} size={20} color="#6B7280" />
                <Text style={{ fontSize: 15, color: '#6B7280', marginLeft: 10 }}>{label}</Text>
            </View>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827', textAlign: 'right', flex: 1.5, marginLeft: 16 }}>{value || '--'}</Text>
        </View>
    );

    const formattedDOB = profile?.DOB
        ? moment(profile.DOB, [moment.ISO_8601, "MM/DD/YYYY", "MM/DD/YYYY HH:mm:ss", "M/D/YYYY h:mm:ss A", "YYYY-MM-DD", "DD-MMM-YYYY"]).isValid()
            ? moment(profile.DOB, [moment.ISO_8601, "MM/DD/YYYY", "MM/DD/YYYY HH:mm:ss", "M/D/YYYY h:mm:ss A", "YYYY-MM-DD", "DD-MMM-YYYY"]).format('MM/DD/YYYY')
            : profile.DOB
        : '';

    return (
        <ScrollView
            contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
        >
            <View style={style}>


                <View style={{ backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 20, marginTop: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, overflow: 'hidden' }}>
                    <FieldRow icon="person-outline" label="First Name" value={profile?.FirstName} />
                    <FieldRow icon="person-outline" label="Last Name" value={profile?.LastName} />
                    <FieldRow icon="mail-outline" label="Email" value={profile?.Email} />
                    <FieldRow icon="call-outline" label="Mobile number" value={profile?.Mobile} />
                    <FieldRow icon="calendar-outline" label="Date of Birth" value={formattedDOB} />
                    <FieldRow icon="home-outline" label="Address Line 1" value={profile?.Address1} />
                    <FieldRow icon="business-outline" label="Address Line 2" value={profile?.Address2} />
                    <FieldRow icon="globe-outline" label="Country Residing" value={profile?.CountryName} />
                    <FieldRow icon="location-outline" label="Post Code" value={profile?.PostCode} hideBorder />
                </View>
                <View style={{ paddingHorizontal: 20, marginTop: 24, marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: '#316b83', letterSpacing: 0.5 }}>KYC Documents</Text>
                        <Vector as="ionicons" name="folder-open-outline" size={18} color="#316b83" style={{ marginLeft: 8 }} />
                    </View>
                    <View style={{ height: 1, backgroundColor: '#E5E7EB', width: '100%' }} />
                </View>
                <View style={{ backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, overflow: 'hidden' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' }}>
                                <Vector as="ionicons" name="document-text-outline" size={20} color="#3B82F6" />
                            </View>
                            <Text style={{ fontSize: 15, fontWeight: '500', color: '#111827', marginLeft: 12 }}>Submitted Files</Text>
                        </View>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: '#6B7280' }}>{document} attachments</Text>
                    </View>
                </View>
                <View style={{ paddingHorizontal: 20, marginTop: 32, marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: '#316b83', letterSpacing: 0.5 }}>Consent for Marketing</Text>
                        <Vector as="ionicons" name="megaphone-outline" size={18} color="#316b83" style={{ marginLeft: 8 }} />
                    </View>
                    <View style={{ height: 1, backgroundColor: '#E5E7EB', width: '100%' }} />
                </View>
                <CheckboxRow
                    status={checkedTermsRemitSMS === 'Y' ? 'checked' : 'unchecked'}
                    onPress={() =>
                        setCheckedTermsRemitSMS(checkedTermsRemitSMS === 'Y' ? 'N' : 'Y')
                    }
                    label="Yes, I would like to receive offers and promotions through SMS Remit"
                />

                <CheckboxRow
                    status={checkedTermsRemitEMAIL === 'Y' ? 'checked' : 'unchecked'}
                    onPress={() =>
                        setCheckedTermsRemitEMAIL(checkedTermsRemitEMAIL === 'Y' ? 'N' : 'Y')
                    }
                    label="Yes, I would like to receive offers and promotions through Email Remit"
                />

                <CheckboxRow
                    status={checkedTermsInsureSMS === 'Y' ? 'checked' : 'unchecked'}
                    onPress={() =>
                        setCheckedTermsInsureSMS(checkedTermsInsureSMS === 'Y' ? 'N' : 'Y')
                    }
                    label="Yes, I would like to receive offers and promotions through SMS from Insure"
                />

                <CheckboxRow
                    status={checkedTermsInsureEMAIL === 'Y' ? 'checked' : 'unchecked'}
                    onPress={() =>
                        setCheckedTermsInsureEMAIL(checkedTermsInsureEMAIL === 'Y' ? 'N' : 'Y')
                    }
                    label="Yes, I would like to receive offers and promotions through Email from Insure"
                />


            </View>
        </ScrollView>
    );
};

export default PersonalDetails;
