import { View, Text, ViewStyle, TextInput, useWindowDimensions, ScrollView } from "react-native";
import React, { useEffect, useState } from "react";
import styles from "app/styles";
import { MetaService } from "app/services/meta.service";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import Button from "app/components/controls/Button";
import { theme } from "app/core/theme";
import { useRecoilValue } from "recoil";
import { ProfileState } from "app/atoms";
import { GetOccupation, ViewPreferCountry, GetIndustry, GetAnnualIncome, GetPurposeOfTransaction, GetRemitterProfile, AddPreferCountry, EditPreferCountry, UpdateRemitterProfile } from "app/http-services";
import TransactionalPreferences from "./TransactionalPreferences";
import { TDropDown } from "types";
import ModalPicker from "app/components/customComponents/ModalPicker";
import { FONTS } from "app/constants/Assets";
import Toast from "react-native-toast-message";



type Props = {
  profile: any,
  style?: ViewStyle
};

const AdditionalDetails = ({ profile, style }: Props) => {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isFocused = useIsFocused();
  const currentToken = useRecoilValue(ProfileState);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isOccupationEdited, setIsOccupationEdited] = useState(false);
  const [isEditingPreferCountry, setIsEditingPreferCountry] = useState(false);
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState(profile?.CompanyName || '');
  const [disableOccupation, setDisableOccupation] = useState(false);
  const [disableIndustry, setDisableIndustry] = useState(false);
  const [disableAnnualIncome, setDisableAnnualIncome] = useState(false);

  const [preferCountry, setPreferCountry] = useState<any[]>([]);
  const [countryList, setCountryList] = useState<TDropDown[]>([]);
  const [occupationList, setOccupationList] = useState<{ dataValue: string; displayvalue: string }[]>([]);
  const [occupation, setOccupation] = useState({ value: profile?.Occupation || '', error: '' });
  const [industryList, setIndustryList] = useState<{ dataValue: string; displayvalue: string }[]>([]);
  const [industry, setIndustry] = useState({ value: profile?.OrgType || '', error: '' });
  const [annualincomeList, setAnnualincomeList] = useState<{ dataValue: string; displayvalue: string }[]>([]);
  const [annualincome, setAnnualincome] = useState({ value: profile?.AnnualIncome || '', error: '' });
  const [purposeoftransactionList, setPurposeoftransactionList] = useState<{ dataValue: string; displayvalue: string }[]>([]);
  const [purposeoftransaction, setPurposeoftransaction] = useState({ value: '', error: '' });
  const [country, setCountry] = useState({ value: '', error: '' });
  //   const [purposeOfTransaction, setPurposeOfTransaction] = useState({ value: '', error: '' });
  const [amountPerTransaction, setAmountPerTransaction] = useState({ value: '', error: '' });
  const [numberOfTransactionsPerMonth, setNumberOfTransactionsPerMonth] = useState({ value: '', error: '' });
  const [disabledEmployerField, setDisabledEmployerField] = useState(false);


  useEffect(() => {
    fetchCountries();
    fetchOccupation(currentToken.tokenId, currentToken.remitterId);
    fetchindustry(currentToken.tokenId, currentToken.remitterId);
    fetchannualincome(currentToken.tokenId, currentToken.remitterId);
    fetchpurposeoftransaction(currentToken.tokenId, currentToken.remitterId);
    fetchremitterprofile(currentToken.tokenId, currentToken.remitterId);
  }, []);

  useEffect(() => {
    if (profile?.Occupation) {
      setOccupation({ value: profile.Occupation, error: '' });
      setDisableOccupation(true);
    } else {
      setDisableOccupation(false);
    }
  }, [profile]);

  useEffect(() => {
    if (profile?.OrgType) {
      setIndustry({ value: profile.OrgType, error: '' });
      setDisableIndustry(true);
    } else {
      setDisableIndustry(false);
    }
  }, [profile]);

  useEffect(() => {
    if (profile?.AnnualIncome) {
      setAnnualincome({ value: profile.AnnualIncome, error: '' });
      setDisableAnnualIncome(true);
    } else {
      setDisableAnnualIncome(false);
    }
  }, [profile]);





  useEffect(() => {
    if (profile?.CompanyName) {
      setCompanyName(profile.CompanyName);
      setDisabledEmployerField(true); // Disable when CompanyName is not empty
    } else {
      setDisabledEmployerField(false); // Enable otherwise
    }
  }, [profile]);





  useEffect(() => {
    if (isFocused) {
      fetchViewPreferCountry(currentToken.tokenId, currentToken.remitterId);
    }
  }, [isFocused]);

  const fetchCountries = async () => {
    try {
      setLoading(true);
      MetaService.fetchCountryMetas(
        false, true, false,
        (countries: any[]) => {
          const countryMetas = countries.map((country: any) => ({
            dataValue: country.Alpha_3_Code,
            displayvalue: country.CountryName,
            ISDCode: country.ISDCode,
          }));
          setCountryList(countryMetas);
        },
        () => { },
        () => setLoading(false)
      );
    } catch (error) {
      console.error('Error fetching countries:', error);
    }
  };

  const fetchOccupation = async (tokenId: string, remitterId: string) => {
    try {
      setLoading(true);
      const response = await GetOccupation(tokenId);

      if (response.status === 200 && response.data.OccpationDetail) {
        // ✅ Filter out "Select Occupation" and map data
        const formattedList = response.data.OccpationDetail
          .filter((item: any) => item.Value_occupation !== "0")
          .map((item: any) => ({
            dataValue: item.Value_occupation,
            displayvalue: item.Text_occupation,
          }));

        setOccupationList(formattedList);

        // ✅ Optionally set default selected occupation from profile
        if (profile?.Occupation) {
          setOccupation({ value: profile.Occupation, error: '' });
        }
      }
    } catch (err) {
      console.error("Error fetching occupation list:", err);
    } finally {
      setLoading(false);
    }
  };


  const fetchindustry = async (tokenId: string, remitterId: string) => {
    try {
      setLoading(true);
      const response = await GetIndustry(tokenId);
      console.log("Response :", response);

      if (response.status === 200 && response.data.Industry) {
        // ✅ Filter out "Select Industry" and map data
        const formattedList = response.data.Industry
          .filter((item: any) => item.Value_Industry !== "0")
          .map((item: any) => ({
            dataValue: item.Value_Industry,
            displayvalue: item.Text_Industry,
          }));

        setIndustryList(formattedList);

        // ✅ Optionally set default selected Industry from profile
        if (profile?.Industry) {
          setIndustry({ value: profile.Industry, error: '' });
        }
      }
    } catch (err) {
      console.error("Error fetching Industry list:", err);
    } finally {
      setLoading(false);
    }
  };


  const fetchremitterprofile = async (tokenId: string, remitterId: string) => {
    try {
      setLoading(true);
      const response = await GetRemitterProfile(tokenId);
      console.log("Response :", response);

      if (response.status === 200 && response.data.Sender) {
        // ✅ Filter out "Select Sender" and map data
        const formattedList = response.data.Sender
        console.log("Remitter Profile :", formattedList)

      }
    } catch (err) {
      console.error("Error fetching Industry list:", err);
    } finally {
      setLoading(false);
    }
  };



  const fetchannualincome = async (tokenId: string, remitterId: string) => {
    try {
      setLoading(true);
      const response = await GetAnnualIncome(tokenId);
      console.log("Response :", response);

      if (response.status === 200 && response.data.AnnualIncome) {
        // ✅ Filter out "Select AnnualIncome" and map data
        const formattedList = response.data.AnnualIncome
          .filter((item: any) => item.Value_AnnualIncome !== "0")
          .map((item: any) => ({
            dataValue: item.Value_AnnualIncome,
            displayvalue: item.Annual_Income,
          }));

        setAnnualincomeList(formattedList);

        // ✅ Optionally set default selected Annualincome from profile
        if (profile?.Annualincome) {
          setAnnualincome({ value: profile.Annualincome, error: '' });
        }
      }
    } catch (err) {
      console.error("Error fetching Annualincome list:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchpurposeoftransaction = async (tokenId: string, remitterId: string) => {
    try {
      setLoading(true);
      const response = await GetPurposeOfTransaction(tokenId);
      console.log("Response :", response);

      if (response.status === 200 && response.data.POT) {
        // ✅ Filter out "Select POT" and map data
        const formattedList = response.data.POT
          .filter((item: any) => item.Value_POT !== "0")
          .map((item: any) => ({
            dataValue: item.Value_POT,
            displayvalue: item.Text_POT,
          }));

        setPurposeoftransactionList(formattedList);

        // ✅ Optionally set default selected POT from profile
        if (profile?.Purposeoftransaction) {
          setPurposeoftransaction({ value: profile.Purposeoftransaction, error: '' });
        }
      }
    } catch (err) {
      console.error("Error fetching Purposeoftransaction list:", err);
    } finally {
      setLoading(false);
    }
  };


  const fetchViewPreferCountry = async (tokenId: string, remitterId: string) => {
    try {
      setLoading(true);
      const response = await ViewPreferCountry(tokenId);
      if (response.status === 200 && response.data.StatusCode === "ER0000") {
        setPreferCountry(response.data.prefercountry);
      }
    } catch (error) {
      console.error("Error fetching prefer country:", error);
    } finally {
      setLoading(false);
    }
  };

  const onEditPreferCountry = (selected: any) => {
    setIsEditingPreferCountry(true); // show Cancel/Update buttons
    setCountry({ value: selected.country, error: '' });
    setPurposeoftransaction({ value: selected.reason, error: '' });
    setAmountPerTransaction({ value: selected.amount, error: '' });
    setNumberOfTransactionsPerMonth({ value: selected.count, error: '' });
  };

  const onCancelEdit = () => {
    setIsEditingPreferCountry(false); // show Add button
    setCountry({ value: '', error: '' });
    setPurposeoftransaction({ value: '', error: '' });
    setAmountPerTransaction({ value: '', error: '' });
    setNumberOfTransactionsPerMonth({ value: '', error: '' });
  };


  const onCountryChange = (value: any) => {
    setCountry({ value, error: '' });
  };

  const onOccupationChange = (value: any) => {
    setOccupation({ value, error: '' });
  };



  const handleAddPreferCountry = async () => {
    if (!country.value || !purposeoftransaction.value || !amountPerTransaction.value || !numberOfTransactionsPerMonth.value) {
      Toast.show({
        type: 'error',
        text2: 'Please fill all fields'
      });
      return;
    }

    const payload = {
      Country: country.value,
      Reason: purposeoftransaction.value,
      Amount: amountPerTransaction.value,
      Count: numberOfTransactionsPerMonth.value,
      tokenId: currentToken.tokenId,
      remitterId: currentToken.remitterId,
    };

    try {
      setLoading(true);
      const response = await AddPreferCountry(payload);
      if (response?.data?.StatusCode === "ER0000") {
        // alert("Preferred country added successfully");
        Toast.show({
          type: 'success',
          text2: 'Preferred country added successfully'
        });
        fetchViewPreferCountry(currentToken.tokenId, currentToken.remitterId);
        setCountry({ value: '', error: '' });
        setPurposeoftransaction({ value: '', error: '' });
        setAmountPerTransaction({ value: '', error: '' });
        setNumberOfTransactionsPerMonth({ value: '', error: '' });
      } else {
        alert(response?.data?.StatusDesc || "Something went wrong");
      }
    } catch (error) {
      console.error("AddPreferCountry error", error);
      alert("Error while adding preferred country");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRemitterProfile = async () => {
    if (!companyName || !occupation.value || !industry.value || !annualincome.value) {
      Toast.show({
        type: 'error',
        text2: 'Please fill all fields before updating',
      });
      return;
    }

    const payload = {
      remitterId: currentToken.remitterId,
      tokenId: currentToken.tokenId,
      CompanyName: companyName,
      Occupation: occupation.value,
      OrgType: industry.value,
      AnnualIncome: annualincome.value,
    };

    try {
      setLoading(true);
      const response = await UpdateRemitterProfile(payload);

      if (response?.data?.StatusCode === 'ER0000') {
        Toast.show({
          type: 'success',
          text2: 'Profile updated successfully',
        });
        fetchremitterprofile(currentToken.tokenId, currentToken.remitterId);
      } else {
        Toast.show({
          type: 'error',
          text2: response?.data?.StatusDesc || 'Update failed',
        });
      }
    } catch (err) {
      console.error('UpdateRemitterProfile error', err);
      Toast.show({
        type: 'error',
        text2: 'Something went wrong during update',
      });
    } finally {
      setLoading(false);
    }
  };


  const handleUpdatePreferCountry = async () => {
    if (!country.value || !purposeoftransaction.value || !amountPerTransaction.value || !numberOfTransactionsPerMonth.value) {
      Toast.show({
        type: 'error',
        text2: 'Please fill all fields',
      });
      return;
    }

    const payload = {
      Country: country.value,
      Reason: purposeoftransaction.value,
      Amount: amountPerTransaction.value,
      Count: numberOfTransactionsPerMonth.value,
      tokenId: currentToken.tokenId,
      remitterId: currentToken.remitterId,
    };

    try {
      setLoading(true);
      const response = await EditPreferCountry(payload);

      if (response?.data?.StatusCode === "ER0000") {
        Toast.show({
          type: 'success',
          text2: 'Updated successfully',
        });

        // Refresh list and reset form
        fetchViewPreferCountry(currentToken.tokenId, currentToken.remitterId);
        onCancelEdit();
      } else {
        Toast.show({
          type: 'error',
          text2: response?.data?.StatusDesc || 'Something went wrong while updating',
        });
      }
    } catch (error) {
      console.error("EditPreferCountry error", error);
      Toast.show({
        type: 'error',
        text2: 'Error while updating preferred country',
      });
    } finally {
      setLoading(false);
    }
  };



  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={style}>
        {/* <View style={{ flexDirection: 'row', margin: 20, marginTop: 0, marginBottom: 10, alignItems: "center", justifyContent: "space-between" }}>
          <Text style={styles.header}>Additional Details</Text>
        </View> */}

        <View style={{ paddingHorizontal: 20, marginBottom: 5 }}>
          <Text style={styles.inputLabel}>Employer Name</Text>
          <View style={{
            backgroundColor: disabledEmployerField ? '#f5f5f5' : '#fff',
            borderColor: disabledEmployerField ? '#eee' : '#eef0f2',
            borderWidth: 1.5,
            borderRadius: 12,
            paddingHorizontal: 12,
            height: 50,
            justifyContent: 'center',
          }}>
            <TextInput
              style={{
                fontSize: 14,
                color: '#000',
                fontFamily: "SF Pro Display",
                fontWeight: '500',
                outlineStyle: 'none',
              } as any}
              value={companyName}
              onChangeText={(text) => setCompanyName(text)}
              placeholder="Enter Employer Name"
              placeholderTextColor="#666"
              editable={!disabledEmployerField}
            />
          </View>
        </View>



        <View style={{ paddingHorizontal: 20 }}>
          <ModalPicker
            label="Occupation"
            dataList={occupationList}
            selectedValue={occupation.value}
            onValueChange={(value) => setOccupation({ value, error: '' })}
            placeholder="Select Occupation"
            disabled={disableOccupation}
          />
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <ModalPicker
            label="Industry"
            dataList={industryList}
            selectedValue={industry.value}
            onValueChange={(value) => setIndustry({ value, error: '' })}
            placeholder="Select Industry"
            disabled={disableIndustry}
          />
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <ModalPicker
            label="Annual Income"
            dataList={annualincomeList}
            selectedValue={annualincome.value}
            onValueChange={(value) => setAnnualincome({ value, error: '' })}
            placeholder="Select Annual Income"
            disabled={disableAnnualIncome}
          />
        </View>

        <View style={{ marginTop: 20 }}>
          <Text style={[styles.header, { paddingHorizontal: 20 }]}>Transactional Preferences</Text>
          <TransactionalPreferences onPress={onEditPreferCountry} preferCountry={preferCountry} />
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <ModalPicker
            label="Country"
            dataList={countryList}
            selectedValue={country.value}
            onValueChange={(value) => setCountry({ value, error: '' })}
            placeholder="Select Country"
          />
        </View>


        <View style={{ paddingHorizontal: 20 }}>
          <ModalPicker
            label="Purpose of Transaction"
            dataList={purposeoftransactionList}
            selectedValue={purposeoftransaction.value}
            onValueChange={(value) => setPurposeoftransaction({ value, error: '' })}
            placeholder="Select Purpose"
          />
        </View>



        <View style={{ paddingHorizontal: 20, marginBottom: 5 }}>
          <Text style={styles.inputLabel}>Approximate amount per transaction</Text>
          <View style={{
            backgroundColor: '#fff',
            borderColor: '#eef0f2',
            borderWidth: 1.5,
            borderRadius: 12,
            paddingHorizontal: 12,
            height: 50,
            justifyContent: 'center',
          }}>
            <TextInput
              style={{
                fontSize: 14,
                color: '#000',
                fontFamily: "SF Pro Display",
                fontWeight: '500',
                outlineStyle: 'none',
              } as any}
              value={amountPerTransaction.value}
              onChangeText={text => setAmountPerTransaction({ value: text, error: '' })}
              placeholder="Enter amount"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
          </View>
          {amountPerTransaction.error ? <Text style={styles.error}>{amountPerTransaction.error}</Text> : null}
        </View>

        <View style={{ paddingHorizontal: 20, marginBottom: 5 }}>
          <Text style={styles.inputLabel}>Approximate number of transactions per month</Text>
          <View style={{
            backgroundColor: '#fff',
            borderColor: '#eef0f2',
            borderWidth: 1.5,
            borderRadius: 12,
            paddingHorizontal: 12,
            height: 50,
            justifyContent: 'center',
          }}>
            <TextInput
              style={{
                fontSize: 14,
                color: '#000',
                fontFamily: "SF Pro Display",
                fontWeight: '500',
                outlineStyle: 'none',
              } as any}
              value={numberOfTransactionsPerMonth.value}
              onChangeText={text => setNumberOfTransactionsPerMonth({ value: text, error: '' })}
              placeholder="Enter number of transactions"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
          </View>
          {numberOfTransactionsPerMonth.error ? <Text style={styles.error}>{numberOfTransactionsPerMonth.error}</Text> : null}
        </View>


        {isEditingPreferCountry && (
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20 }}>
            <View style={{ flex: 1, marginHorizontal: 10, marginRight: 5 }}>
              <Button onPress={onCancelEdit}>Cancel</Button>
            </View>
            <View style={{ flex: 1, marginHorizontal: 10, marginLeft: 5 }}>
              <Button onPress={handleUpdatePreferCountry}>Update</Button>
            </View>
          </View>
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20 }}>
          <View style={{ flex: 1, marginHorizontal: 10, marginRight: 5 }}>
            <Button onPress={handleUpdateRemitterProfile}>Update</Button>
          </View>
          {/* Only show Add button when not editing */}
          {!isEditingPreferCountry && (
            <View style={{ flex: 1, marginHorizontal: 10, marginLeft: 5 }}>
              <Button onPress={handleAddPreferCountry}>Add</Button>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default AdditionalDetails;
