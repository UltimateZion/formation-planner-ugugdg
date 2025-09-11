
import React, { useState, useEffect } from 'react';
import { 
  Text, 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput, 
  ScrollView,
  Alert,
  Switch
} from 'react-native';
import { commonStyles, colors } from '../styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Icon from '../components/Icon';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Player {
  id: string;
  name: string;
  isAvailable: boolean;
}

const STORAGE_KEY = 'team_formation_players';

export default function TeamSetupScreen() {
  const router = useRouter();
  const [numberOfPlayers, setNumberOfPlayers] = useState('11');
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved players on component mount
  useEffect(() => {
    loadSavedPlayers();
  }, []);

  // Save players whenever the players array changes
  useEffect(() => {
    if (!isLoading) {
      savePlayers();
    }
  }, [players, isLoading]);

  const loadSavedPlayers = async () => {
    try {
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setPlayers(parsedData.players || []);
        setNumberOfPlayers(parsedData.numberOfPlayers || '11');
        console.log('Loaded saved players:', parsedData.players?.length || 0);
      }
    } catch (error) {
      console.error('Error loading saved players:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePlayers = async () => {
    try {
      const dataToSave = {
        players,
        numberOfPlayers,
        lastUpdated: new Date().toISOString(),
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      console.log('Players saved successfully');
    } catch (error) {
      console.error('Error saving players:', error);
    }
  };

  const clearAllData = async () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to remove all players? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(STORAGE_KEY);
              setPlayers([]);
              setNumberOfPlayers('11');
              console.log('All player data cleared');
            } catch (error) {
              console.error('Error clearing data:', error);
            }
          },
        },
      ]
    );
  };

  const handleNumberChange = (text: string) => {
    const num = parseInt(text) || 0;
    if (num >= 1 && num <= 30) {
      setNumberOfPlayers(text);
      console.log('Number of players set to:', num);
    }
  };

  const addPlayer = () => {
    if (newPlayerName.trim() && players.length < parseInt(numberOfPlayers)) {
      const newPlayer: Player = {
        id: Date.now().toString(),
        name: newPlayerName.trim(),
        isAvailable: true,
      };
      setPlayers([...players, newPlayer]);
      setNewPlayerName('');
      console.log('Added player:', newPlayer.name);
    }
  };

  const removePlayer = (id: string) => {
    setPlayers(players.filter(player => player.id !== id));
    console.log('Removed player with id:', id);
  };

  const togglePlayerAvailability = (id: string) => {
    setPlayers(players.map(player => 
      player.id === id ? { ...player, isAvailable: !player.isAvailable } : player
    ));
    console.log('Toggled availability for player:', id);
  };

  const generateDefaultPlayers = () => {
    const defaultPlayers: Player[] = [];
    const targetCount = parseInt(numberOfPlayers);
    
    for (let i = 1; i <= targetCount; i++) {
      defaultPlayers.push({
        id: `default-${i}-${Date.now()}`,
        name: `Player ${i}`,
        isAvailable: true,
      });
    }
    
    setPlayers(defaultPlayers);
    console.log('Generated default players:', defaultPlayers.length);
  };

  const proceedToFormation = () => {
    if (players.length === 0) {
      Alert.alert('No Players', 'Please add at least one player to continue.');
      return;
    }
    
    const availablePlayers = players.filter(p => p.isAvailable);
    if (availablePlayers.length === 0) {
      Alert.alert('No Available Players', 'Please mark at least one player as available to continue.');
      return;
    }
    
    console.log('Proceeding to formation with players:', players);
    router.push({
      pathname: '/formation',
      params: { 
        players: JSON.stringify(players),
        totalPlayers: numberOfPlayers 
      }
    });
  };

  const remainingSlots = parseInt(numberOfPlayers) - players.length;
  const availableCount = players.filter(p => p.isAvailable).length;
  const unavailableCount = players.filter(p => !p.isAvailable).length;

  if (isLoading) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <View style={[commonStyles.content, { justifyContent: 'center' }]}>
          <Text style={commonStyles.text}>Loading your team...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Team Setup</Text>
        <TouchableOpacity 
          style={styles.clearButton} 
          onPress={clearAllData}
        >
          <Icon name="trash" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Squad Size</Text>
          <View style={styles.numberInputContainer}>
            <TouchableOpacity 
              style={styles.numberButton}
              onPress={() => handleNumberChange((parseInt(numberOfPlayers) - 1).toString())}
            >
              <Icon name="remove" size={20} color={colors.text} />
            </TouchableOpacity>
            <TextInput
              style={styles.numberInput}
              value={numberOfPlayers}
              onChangeText={handleNumberChange}
              keyboardType="numeric"
              maxLength={2}
            />
            <TouchableOpacity 
              style={styles.numberButton}
              onPress={() => handleNumberChange((parseInt(numberOfPlayers) + 1).toString())}
            >
              <Icon name="add" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Squad ({players.length}/{numberOfPlayers})
            </Text>
            {players.length === 0 && (
              <TouchableOpacity 
                style={styles.generateButton}
                onPress={generateDefaultPlayers}
              >
                <Text style={styles.generateButtonText}>Generate Default</Text>
              </TouchableOpacity>
            )}
          </View>

          {players.length > 0 && (
            <View style={styles.statusSummary}>
              <View style={styles.statusItem}>
                <View style={[styles.statusDot, { backgroundColor: colors.accent }]} />
                <Text style={styles.statusText}>Available: {availableCount}</Text>
              </View>
              <View style={styles.statusItem}>
                <View style={[styles.statusDot, { backgroundColor: colors.grey }]} />
                <Text style={styles.statusText}>Unavailable: {unavailableCount}</Text>
              </View>
            </View>
          )}

          {players.length < parseInt(numberOfPlayers) && (
            <View style={styles.addPlayerContainer}>
              <TextInput
                style={styles.playerInput}
                placeholder="Enter player name"
                placeholderTextColor={colors.grey}
                value={newPlayerName}
                onChangeText={setNewPlayerName}
                onSubmitEditing={addPlayer}
              />
              <TouchableOpacity style={styles.addButton} onPress={addPlayer}>
                <Icon name="add" size={20} color={colors.background} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.playersList}>
            {players.map((player, index) => (
              <View key={player.id} style={[
                styles.playerItem,
                !player.isAvailable && styles.playerItemUnavailable
              ]}>
                <View style={styles.playerInfo}>
                  <Text style={[
                    styles.playerNumber,
                    !player.isAvailable && styles.playerNumberUnavailable
                  ]}>
                    {index + 1}
                  </Text>
                  <Text style={[
                    styles.playerName,
                    !player.isAvailable && styles.playerNameUnavailable
                  ]}>
                    {player.name}
                  </Text>
                </View>
                <View style={styles.playerControls}>
                  <View style={styles.availabilityContainer}>
                    <Text style={[
                      styles.availabilityLabel,
                      !player.isAvailable && styles.availabilityLabelUnavailable
                    ]}>
                      {player.isAvailable ? 'Available' : 'Unavailable'}
                    </Text>
                    <Switch
                      value={player.isAvailable}
                      onValueChange={() => togglePlayerAvailability(player.id)}
                      trackColor={{ false: colors.grey, true: colors.accent }}
                      thumbColor={colors.background}
                    />
                  </View>
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => removePlayer(player.id)}
                  >
                    <Icon name="close" size={16} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {remainingSlots > 0 && (
            <Text style={styles.remainingText}>
              {remainingSlots} more player{remainingSlots !== 1 ? 's' : ''} can be added
            </Text>
          )}

          {players.length > 0 && (
            <View style={styles.infoBox}>
              <Icon name="information-circle" size={20} color={colors.accent} />
              <Text style={styles.infoText}>
                Only available players will appear on the field initially. 
                You can swap players during formation planning.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.proceedButton, 
            (players.length === 0 || availableCount === 0) && styles.proceedButtonDisabled
          ]} 
          onPress={proceedToFormation}
          disabled={players.length === 0 || availableCount === 0}
        >
          <Text style={[
            styles.proceedButtonText,
            (players.length === 0 || availableCount === 0) && styles.proceedButtonTextDisabled
          ]}>
            Create Formation
          </Text>
          <Icon 
            name="arrow-forward" 
            size={20} 
            color={(players.length === 0 || availableCount === 0) ? colors.grey : colors.background} 
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.backgroundAlt,
  },
  backButton: {
    padding: 8,
  },
  clearButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 15,
  },
  numberInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 4,
  },
  numberButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
  },
  numberInput: {
    backgroundColor: 'transparent',
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    minWidth: 60,
    paddingHorizontal: 20,
  },
  generateButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  generateButtonText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  statusSummary: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 15,
    paddingVertical: 10,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  addPlayerContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  playerInput: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    color: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: colors.accent,
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playersList: {
    gap: 8,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundAlt,
    padding: 12,
    borderRadius: 8,
  },
  playerItemUnavailable: {
    backgroundColor: colors.card,
    opacity: 0.7,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playerNumber: {
    backgroundColor: colors.accent,
    color: colors.background,
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: '700',
    marginRight: 12,
  },
  playerNumberUnavailable: {
    backgroundColor: colors.grey,
  },
  playerName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  playerNameUnavailable: {
    color: colors.grey,
  },
  playerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  availabilityLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '500',
  },
  availabilityLabelUnavailable: {
    color: colors.grey,
  },
  removeButton: {
    padding: 4,
  },
  remainingText: {
    color: colors.grey,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.backgroundAlt,
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    gap: 10,
  },
  infoText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: colors.backgroundAlt,
  },
  proceedButton: {
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    boxShadow: '0px 4px 12px rgba(76, 175, 80, 0.3)',
    elevation: 4,
  },
  proceedButtonDisabled: {
    backgroundColor: colors.backgroundAlt,
  },
  proceedButtonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: '700',
    marginRight: 10,
  },
  proceedButtonTextDisabled: {
    color: colors.grey,
  },
});
