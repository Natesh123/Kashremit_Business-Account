import axiosInstance from "../interceptor/axios.interceptor";
import {
    CHANGE_PASSWORD,
    FORGOT_PASSWORD,
    GENERATE_OTP, LOGOUT,
    PRE_REGISTRATION,
    UNSUBSCRIBE,
    USER_LOGIN,
    VALIDATE_OTP,
    VALIDATE_PRE_REGISTRATION, VALIDATE_REFERRAL_CODE
} from "../routes/api.routes";
import { User } from "../http-services/models/request//user.model";
import { NotificationTypes } from "../enums/notificationTypes";
import { Login } from "../http-services/models/request/login.model";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from "react-native-toast-message";
import { StatusCodeEnum } from "app/enums/statusCode.enum";



export const loginService = async (login: Login, onSuccess: any, onError: any, onFinal: () => void) => {

    const loginJSON = {
        request: {
            Authenticate: login
        }
    };
    return await axiosInstance
        .post(USER_LOGIN, loginJSON)
        .then(response => {
            if (response.data && response.data.StatusCode !== StatusCodeEnum.INVALID_CREDENTIALS) {
                const user = response.data;
                AsyncStorage.setItem('user', JSON.stringify(user));

                onSuccess(user);
            } else {
                Toast.show({
                    type: NotificationTypes.ERROR,
                    text1: 'Login',
                    text2: response.data.StatusMsg
                });

            }
        })
        .catch(error => {
            Toast.show({
                type: NotificationTypes.ERROR,
                text1: "Login failed",
                text2: "Incorrect email or password"
            });

            onError(error);
        })
        .finally(onFinal)
}
