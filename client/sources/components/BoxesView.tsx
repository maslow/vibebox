import * as React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Typography } from '@/constants/Typography';
import { Header } from './navigation/Header';
import { Image } from 'expo-image';

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.groupped.background,
    },
    headerButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleText: {
        fontSize: 17,
        color: theme.colors.header.tint,
        fontWeight: '600',
        ...Typography.default('semiBold'),
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 8,
        textAlign: 'center',
        ...Typography.default('semiBold'),
    },
    emptyDescription: {
        fontSize: 15,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        ...Typography.default(),
    },
}));

function HeaderTitle() {
    return (
        <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.titleText}>
                Boxes
            </Text>
        </View>
    );
}

function HeaderLeft() {
    const { theme } = useUnistyles();
    return (
        <View style={styles.logoContainer}>
            <Image
                source={require('@/assets/images/logo-black.png')}
                contentFit="contain"
                style={[{ width: 24, height: 24 }]}
                tintColor={theme.colors.header.tint}
            />
        </View>
    );
}

function HeaderRight() {
    // Empty view to maintain header centering
    return <View style={styles.headerButton} />;
}

export const BoxesView = React.memo(() => {
    return (
        <View style={styles.container}>
            <View style={{ backgroundColor: styles.container.backgroundColor }}>
                <Header
                    title={<HeaderTitle />}
                    headerRight={() => <HeaderRight />}
                    headerLeft={() => <HeaderLeft />}
                    headerShadowVisible={false}
                    headerTransparent={true}
                />
            </View>

            <ScrollView contentContainerStyle={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📦</Text>
                <Text style={styles.emptyTitle}>No Boxes Yet</Text>
                <Text style={styles.emptyDescription}>
                    Subscribe to get your own 2-core 4GB VibeBox with full root access and pre-installed development environment.
                </Text>
            </ScrollView>
        </View>
    );
});
