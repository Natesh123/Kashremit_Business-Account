import { IWalletTab } from "types";

const Wallet = require("../assets/images/wallet.png");
const MenUser = require("../assets/images/user.png");
const WomanUser = require("../assets/images/woman.png");
const User = require("../assets/images/user.png");

export const IMAGES = {
  Wallet,
  MenUser,
  WomanUser,
  User
};

import { Platform } from "react-native";

const elevationNone = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: {
      height: 4,
      width: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  android: {
    elevation: 4,
  },
  web: {
    boxShadow: "0px 4px 4.65px rgba(0,0,0,0.3)",
  },
});

export const SHADOWS = {
  shadow8: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: {
        height: 4,
        width: 0,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
    },
    android: {
      elevation: 8,
    },
    web: {
      boxShadow: "0px 4px 4.65px rgba(0,0,0,0.3)",
    },
  }),
  shadow: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: {
        height: 0,
        width: 0,
      },
      shadowOpacity: 0.2,
      shadowRadius: 4.65,
      elevation: 4,
    },
    android: {
      elevation: 4,
    },
    web: {
      boxShadow: "0px 0px 4.65px rgba(0,0,0,0.2)",
    },
  }),
  elevation0: {
    ...(elevationNone as object),
  },
};

import { RFValue } from "react-native-responsive-fontsize";

export const SIZES = {
  h1: RFValue(15),
  h2: RFValue(13),
  h3: RFValue(11),
  h4: RFValue(9.5),
  p60: RFValue(50),
  p50: RFValue(42),
  p48: RFValue(20),
  p45: RFValue(18),
  p40: RFValue(22),
  p34: RFValue(13),
  p30: RFValue(12),
  p26: RFValue(8.5),
  p24: RFValue(7.5),
  p22: RFValue(11),
  p20: RFValue(10.5),
  p19: RFValue(9.5),
  p16: RFValue(9.5),
  p15: RFValue(8.5),
  p13: RFValue(7.5),
  p12: RFValue(6.5),
  p11: RFValue(5.5),
  p10: RFValue(5.5),
  p9: RFValue(4.5),
  p6: RFValue(4),
  base: RFValue(5),
  small: RFValue(8),
  font: RFValue(10),
  medium: RFValue(11),
  large: RFValue(12),
  extraLarge: RFValue(14),
  half: "50%",
  full: "100%",
};

export const FONTS = {
  light: "SF Pro Display",
  regular: "SF Pro Display",
  medium: "SF Pro Display",
  semibold: "SF Pro Display",
  bold: "SF Pro Display",
  monoLight: "SF Pro Display",
  monoRegular: "SF Pro Display",
  monoMedium: "SF Pro Display",
  monoBold: "SF Pro Display",
};

export const Opacity = {
  opacity2: "rgba(0,0,0, 0.2)",
};
