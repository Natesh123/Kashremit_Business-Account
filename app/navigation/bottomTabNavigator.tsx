import React from 'react';
import {
    Alert,
    Animated,
    StyleSheet,
    TouchableOpacity,
    View, Text
} from 'react-native';
import { CurvedBottomBarExpo } from 'react-native-curved-bottom-bar';
import Recipients from 'app/screens/recipients/Recipients';
import Vector from 'app/assets/vectors';
import Transactions from 'app/screens/transactions/Transactions';
import Profile from "../screens/profile/Profile";
import { theme } from '../core/theme';
import { LinearGradient } from 'expo-linear-gradient';
import Home from 'app/screens/home/Home';
import { SIZES } from 'app/constants/Assets';
export default function BottomTabNavigator() {
    const _renderIcon = (routeName: any, selectedTab: any) => {
        let icon = '';
        type TVector = "feather" | "fontawesome" | "ionicons" | "materialCI" | "materialicons" | "materialcommunityicons";

        let asIcon: TVector = 'ionicons';
        switch (routeName) {
            case 'Dashboard':
                icon = 'grid-view';
                asIcon = 'materialicons';
                break;
            case 'Recipients':
                icon = 'group';
                asIcon = 'materialicons';
                break;
            case 'Transactions':
                icon = 'swap-vertical-bold';
                asIcon = 'materialcommunityicons';
                break;
            case 'Profile':
                icon = 'person-circle-outline';
                asIcon = 'ionicons';
                break;
        }

        return (
            <Vector
                as={asIcon}
                name={icon}
                size={24}
                color={routeName === selectedTab ? theme.colors.buttonPrimary : theme.colors.black50}
            />

        );
    };
    const renderTabBar = ({ routeName, selectedTab, navigate }: { routeName: any, selectedTab: any, navigate: any }) => {
        return (
            <TouchableOpacity
                onPress={() => navigate(routeName)}
                style={styles.tabbarItem}
            >
                {_renderIcon(routeName, selectedTab)}
                <Text style={[{ color: routeName === selectedTab ? theme.colors.buttonPrimary : theme.colors.black50 }, { fontSize: SIZES.small }]}>{routeName} </Text>
            </TouchableOpacity>
        );
    };

    return (
        <CurvedBottomBarExpo.Navigator
            type="DOWN"
            shadowStyle={styles.shawdow}
            height={70}
            circleWidth={60}
            bgColor="white"
            initialRouteName="Dashboard"
            borderTopLeftRight
            screenOptions={{ headerShown: false }}
            renderCircle={({ selectedTab, navigate }) => (
                <Animated.View style={styles.btnCircleUp}>
                    <TouchableOpacity style={styles.button} onPress={() => navigate('SendMoney')}>
                        <LinearGradient
                            colors={[theme.colors.buttonPrimary, theme.colors.buttonSecondary]}
                            start={{ x: -0.1, y: 0.0 }}
                            end={{ x: 1.1, y: 0.4 }}
                            style={{
                                padding: 10,
                                borderRadius: 50,
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 58,
                                height: 58
                            }}
                        >
                            <Vector as="ionicons" name="paper-plane" size={30} color={theme.colors.secondary} />
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            )}
            tabBar={renderTabBar}
        >
            <CurvedBottomBarExpo.Screen name="Dashboard" position="LEFT" component={() => <Home />} />
            <CurvedBottomBarExpo.Screen name="Recipients" position="LEFT" component={() => <Recipients />} />
            <CurvedBottomBarExpo.Screen name="Transactions" position="RIGHT" component={() => <Transactions />} />
            <CurvedBottomBarExpo.Screen name="Profile" position="RIGHT" component={() => <Profile navigation={{
                replace: function (nextRoute: string): unknown {
                    throw new Error('Function not implemented.');
                },
                navigate: function (scene: string): void {
                    throw new Error('Function not implemented.');
                }
            }} />} />
        </CurvedBottomBarExpo.Navigator>
    );
}

export const styles = StyleSheet.create({
    container: {
        flex: 1, padding: 20,
    },
    shawdow: {
        shadowColor: '#000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.05, shadowRadius: 24,
    },
    button: {
        flex: 1,
        justifyContent: 'center',
    },
    btnCircleUp: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        bottom: 30,
        elevation: 5,
    },
    imgCircle: {
        width: 30,
        height: 30,
        tintColor: 'gray',
    },
    tabbarItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    img: {
        width: 30,
        height: 30,
    },
});