
import React, { useState } from 'react';
import { 
  Text, 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput, 
  ScrollView,
  Alert 
} from 'react-native';
import { commonStyles, colors } from '../styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Icon from '../components/Icon';

interface Player {
  id: string;
  name: string;
}

export default function TeamSetupScreen() {
  const router = useRouter();
  const [numberOfPlayers, setNumberOfPlayers] = useState('11');
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');

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

  const generateDefaultPlayers = () => {
    const defaultPlayers: Player[] = [];
    const targetCount = parseInt(numberOfPlayers);
    
    for (let i = 1; i <= targetCount; i++) {
      defaultPlayers.push({
        id: `default-${i}`,
        name: `Player ${i}`,
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
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Number of Players</Text>
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
              Players ({players.length}/{numberOfPlayers})
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
              <View key={player.id} style={styles.playerItem}>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerNumber}>{index + 1}</Text>
                  <Text style={styles.playerName}>{player.name}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => removePlayer(player.id)}
                >
                  <Icon name="close" size={16} color={colors.text} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {remainingSlots > 0 && (
            <Text style={styles.remainingText}>
              {remainingSlots} more player{remainingSlots !== 1 ? 's' : ''} needed
            </Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.proceedButton, 
            players.length === 0 && styles.proceedButtonDisabled
          ]} 
          onPress={proceedToFormation}
          disabled={players.length === 0}
        >
          <Text style={[
            styles.proceedButtonText,
            players.length === 0 && styles.proceedButtonTextDisabled
          ]}>
            Create Formation
          </Text>
          <Icon 
            name="arrow-forward" 
            size={20} 
            color={players.length === 0 ? colors.grey : colors.background} 
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
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  placeholder: {
    width: 40,
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
  playerName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
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
    boxShadow: '0px 4px 12px rgba(100, 181, 246, 0.3)',
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
