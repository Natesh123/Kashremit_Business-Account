import React, { useCallback } from "react";
import { Dimensions, ImageURISource, Text, useWindowDimensions, View, ViewToken, TouchableOpacity, Image } from "react-native";
import AppStatusBar from "../../components/AppStatusBar";
import { FONTS, IMAGES, SIZES } from "../../constants/Assets";
import Button from "../../components/Button";
import { Navigation } from "../../../types";
import Container from "../../theme/Container";
import Animated, { useAnimatedRef, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import ListItem from "./components/listItem";
import PaginationElement from "./components/paginationElement";
import AsyncStorage from "@react-native-async-storage/async-storage";
import navigation from "app/navigation";


const pages = [
  {
    text: 'Fast and Reliable Transfers',
    description: 'Your money reaches its destination swiftly, ensuring timely support for your recipients.',
    image: require('../../assets/logos/kashremit_logo.png'),
  },
  {
    text: 'International Transfers',
    description: 'Send money to over 100+ countries worldwide with competitive exchange rates and low fees.',
    image: require('../../assets/logos/kashremit_logo.png'),
  },
  {
    text: 'Secure Transactions',
    description: 'Rest assured with our robust security measures, safeguarding your funds throughout the transfer process.',
    image: require('../../assets/logos/kashremit_logo.png'),
  },
];

type Props = {
  navigation: Navigation;
};



const Onboarding = ({ navigation }: Props) => {
  const { width } = useWindowDimensions();
  const x = useSharedValue(0);
  const flatListIndex = useSharedValue(0);
  const flatListRef = useAnimatedRef<
    Animated.FlatList<{
      text: string;
      image: ImageURISource;
    }>
  >();

  const completeOnboarding = async (nextRoute: "Login" | "Signup") => {
    try {
      await AsyncStorage.setItem("hasOnboarded", "true");
      navigation.replace(nextRoute);
    } catch (error) {
      console.error("Error saving onboarding status:", error);
    }
  };

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      flatListIndex.value = viewableItems[0]?.index ?? 0;
    },
    []
  );
  const scrollHandle = useAnimatedScrollHandler({
    onScroll: (event) => {
      x.value = event.contentOffset.x;
    },
  });
  const { height: screenHeight } = Dimensions.get('window');
  const listItemHeight = screenHeight * 0.78;

  const renderItem = useCallback(
    ({
      item,
      index,
    }: {
      item: { text: string; description: string; image: ImageURISource };
      index: number;
    }) => {
      return <ListItem style={{ height: listItemHeight }} item={item} index={index} x={x} />;
    },
    [x]
  );
  return (
    <Container>
      <AppStatusBar backgroundColor="#fff" />
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <Animated.FlatList
          ref={flatListRef}
          onScroll={scrollHandle}
          horizontal
          scrollEventThrottle={16}
          pagingEnabled={true}
          data={pages}
          keyExtractor={(_, index) => index.toString()}
          bounces={false}
          renderItem={({ item, index }) => (
            <ListItem style={{ height: listItemHeight }} item={item} index={index} x={x} />
          )}
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
        />

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 20 }}>
          <PaginationElement length={pages.length} x={x} />
        </View>
        <View style={{ paddingBottom: 20, paddingHorizontal: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 10 }}>
            <View style={{ flex: 1, marginHorizontal: 10, marginRight: 5 }}>
              <Button onPress={() => completeOnboarding("Signup")}>Sign up</Button>
            </View>
            <View style={{ flex: 1, marginHorizontal: 10, marginLeft: 5 }}>
              <Button onPress={() => completeOnboarding("Login")}>Log in</Button>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
            <View style={{ flex: 1, marginHorizontal: 10 }}>
              <TouchableOpacity style={{ flexDirection: 'row', backgroundColor: '#fff', padding: 11, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ae9efb', shadowColor: '#000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.05, shadowRadius: 24, }}>
                <Image
                  source={require('../../assets/icons/google.png')}
                  style={{ width: 24, height: 24, marginRight: 10, }}
                />
                <Text style={{ fontWeight: '500', fontSize: SIZES.medium, lineHeight: 26, textAlign: 'center' }}>Sign in with Google</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Container>
  );
};

export default Onboarding;
