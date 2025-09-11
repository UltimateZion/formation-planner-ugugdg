
import React, { useState } from 'react';
import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import { commonStyles, colors } from '../styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Icon from '../components/Icon';

export default function MainScreen() {
  const router = useRouter();

  const handleStartPlanning = () => {
    console.log('Navigating to team setup');
    router.push('/team-setup');
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Icon name="football" size={80} color={colors.accent} />
          <Text style={styles.title}>Team Formation Planner</Text>
          <Text style={styles.subtitle}>
            Create flexible football formations with any number of players
          </Text>
        </View>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Icon name="people" size={24} color={colors.accent} />
            <Text style={styles.featureText}>Flexible team sizes</Text>
          </View>
          <View style={styles.feature}>
            <Icon name="move" size={24} color={colors.accent} />
            <Text style={styles.featureText}>Drag & drop positioning</Text>
          </View>
          <View style={styles.feature}>
            <Icon name="create" size={24} color={colors.accent} />
            <Text style={styles.featureText}>Player availability tracking</Text>
          </View>
          <View style={styles.feature}>
            <Icon name="swap-horizontal" size={24} color={colors.accent} />
            <Text style={styles.featureText}>Substitution management</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.startButton} onPress={handleStartPlanning}>
          <Text style={styles.startButtonText}>Start Planning</Text>
          <Icon name="arrow-forward" size={20} color={colors.background} />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.designerNote}>Designed by Paul Halton</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    maxWidth: 400,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.grey,
    textAlign: 'center',
    lineHeight: 24,
  },
  features: {
    width: '100%',
    marginBottom: 60,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  featureText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 15,
    fontWeight: '500',
  },
  startButton: {
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    maxWidth: 280,
    boxShadow: '0px 4px 12px rgba(100, 181, 246, 0.3)',
    elevation: 4,
  },
  startButtonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: '700',
    marginRight: 10,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: 'center',
  },
  designerNote: {
    fontSize: 12,
    color: colors.grey,
    fontStyle: 'italic',
  },
});
