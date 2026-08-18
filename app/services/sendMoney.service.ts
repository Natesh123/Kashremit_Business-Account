import axiosInstance from "../interceptor/axios.interceptor";
import {
	GET_COUNTRY_LIST,
	GET_NATIONALITY_LIST,
	GET_OPERATORS,
	GET_PRODUCTS,
	GET_SERVICE_PROVIDER,
	GET_SOI,
	GET_TRANSFER_TYPE_FIELD,
	GET_TRANSFER_TYPES,
} from "../routes/api.routes";
import { User } from "../http-services/models/request//user.model";
import { NotificationTypes } from "../enums/notificationTypes";
import { Login } from "../http-services/models/request/login.model";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from "react-native-toast-message";
import { StatusCodeEnum } from "app/enums/statusCode.enum";
import { ReceivingModeFieldTypeEnum } from "app/enums/receivingModeFieldType.enum";
import { ReceivingModeField } from "app/models/receivingModeField.model";

export interface IDropdownOption {
	label: any;
	value: any;
	optionalFilterProp?: string;
}


export class SendMoneyService {

	static getTransferTypes(
		countryDetails: { FromCountry: string; ToCountry: string },
		onSuccess: (transferType: any[]) => void,
		onError: Function,
		onFinal: () => void
	) {
		const remitterJSON = {
			request: {
				...countryDetails,
			},
		};
		return axiosInstance
			.post(GET_TRANSFER_TYPES, remitterJSON)
			.then((response) => {
				const TransferDetails = response.data?.TransferDetails?.TDFields
				onSuccess(TransferDetails)
			})
			.catch((error) => {
				onError();
			})
			.finally(onFinal);
	}

	static async getTransferTypeField(
		countryCode: string | null,
		sessionCode: string,
		onSuccess: Function,
		onError: Function,
		onFinal: () => void
	) {
		try {
			const beneficiaryJSON = {
				request: {
					ToCountry: countryCode,
					ChannelTransferType: "BANKS",
					SessionCode: sessionCode,
				},
			};
			const transferTypeJSON = await axiosInstance.post(
				GET_TRANSFER_TYPE_FIELD,
				beneficiaryJSON
			);
			const bankFields = transferTypeJSON.data["Banks"]["Fields"];
			console.log("Bank", bankFields)
			const branchRequired = transferTypeJSON.data["BranchRequired"];
			const receivingModeFields = bankFields;
			if (Array.isArray(receivingModeFields)) {
				const responsePromises = receivingModeFields.map(
					async (receivingModeField: ReceivingModeField) => {
						if (
							receivingModeField.type ===
							ReceivingModeFieldTypeEnum.SELECT
						) {
							if (receivingModeField.key === "BankCode") {
								let url = receivingModeField.url;
								if (url && (url.includes("localhost") || url.includes("127.0.0.1"))) {
									const match = url.match(/\/api(\/[a-zA-Z0-9_/]+)/);
									if (match && match[1]) {
										url = match[1];
									} else {
										url = "/GetBankDetails";
									}
								}
								console.log("Fetching bank details from url:", url);
								const bankDetailsJSON = {
									request: {
										BankDetail: {
											CountryCode: countryCode,
											BankName: null,
											BankCode: null,
											SessionCode: sessionCode,
											City: null,
											State: null,
											StartFrom: null,
											EndWith: null,
										},
									},
								};
								const optionsResponse = await axiosInstance.post(
									url,
									bankDetailsJSON
								);
								if (
									optionsResponse.data &&
									optionsResponse.data["StatusCode"] ===
									StatusCodeEnum.SUCCESS
								) {
									if (
										Array.isArray(
											optionsResponse.data["Bank"]
										)
									) {
										receivingModeField.receivingModeOptions = optionsResponse.data[
											"Bank"
										].map((optionMeta) => {
											return {
												value: optionMeta["BankCode"],
												label: optionMeta["BankName"],
												CountryCode: optionMeta["CountryCode"],
												BankName: optionMeta["BankName"],
												BankCode: optionMeta["BankCode"],
												SessionCode: optionMeta["SessionCode"],
												City: optionMeta["City"],
												State: optionMeta["State"],
												SearchText: optionMeta["SearchText"],
												StartFrom: optionMeta["StartFrom"],
												EndWith: optionMeta["EndWith"],
											};
										});
									}
								}
							}
							if (receivingModeField.key === "Account_Type") {
								receivingModeField.receivingModeOptions = receivingModeField.optionMetas.map(
									(optionMeta: any) => {
										return {
											label: optionMeta.text,
											value: optionMeta.key,
										};
									}
								);
							}

						}
						return receivingModeField;
					}
				);
				const responseFields = await Promise.all(responsePromises);
				onSuccess(responseFields, branchRequired);
			}
		} catch (e) {
			console.error("Error in getTransferTypeField:", e);
			onError(e);
		} finally {
			onFinal();
		}
	}
}
