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

const elevationNone = {
  shadowColor: "#000",
  shadowOffset: {
    height: 4,
    width: 0,
  },
  shadowOpacity: 0.3,
  shadowRadius: 4.65,
};

export const SHADOWS = {
  shadow8: {
    ...elevationNone,
    elevation: 8,
  },
  shadow: {
    shadowColor: "#000",
    shadowOffset: {
      height: 0,
      width: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4.65,
    elevation: 4,
  },
  elevation0: {
    ...elevationNone,
  },
};

export const SIZES = {
  p60: 60,
  p50: 50,
  p40: 40,
  p30: 30,
  p12: 12,
  p20: 20,
  p15: 15,
  p10: 10,
  p6: 6,
  base: 8,
  small: 12,
  font: 14,
  medium: 16,
  large: 18,
  extraLarge: 24,
  half: "50%",
  full: "100%",
};

export const FONTS = {
  light: "SF Pro DisplayLight",
  regular: "SF Pro DisplayRegular",
  medium: "SF Pro DisplayMedium",
  semibold: "SF Pro DisplaySemiBold",
  bold: "SF Pro DisplayBold",
  monoLight: "SF Pro DisplayMonoLight",
  monoRegular: "SF Pro DisplayMonoRegular",
  monoMedium: "SF Pro DisplayMonoMedium",
  monoBold: "SF Pro DisplayMonoBold",
};

export const Opacity = {
  opacity2: "rgba(0,0,0, 0.2)",
};
