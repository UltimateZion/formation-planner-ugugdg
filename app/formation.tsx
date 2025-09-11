
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity,
  PanResponder,
  Animated,
  ScrollView,
  Alert
} from 'react-native';
import { commonStyles, colors } from '../styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Icon from '../components/Icon';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Player {
  id: string;
  name: string;
  x: number;
  y: number;
  isAvailable: boolean;
  isOnField: boolean;
}

interface DraggablePlayerProps {
  player: Player;
  onPositionChange: (id: string, x: number, y: number) => void;
  onPlayerSwap?: (playerId: string) => void;
  fieldWidth: number;
  fieldHeight: number;
  isSubstitute?: boolean;
  onDragToSubBench?: (playerId: string) => void;
  onDragToField?: (playerId: string, x: number, y: number) => void;
  subBenchHeight?: number;
}

const PLAYER_SIZE = 60;
const SUB_BENCH_HEIGHT = 120;
const FORMATION_STORAGE_KEY = 'team_formation_positions';

const DraggablePlayer: React.FC<DraggablePlayerProps> = ({ 
  player, 
  onPositionChange, 
  onPlayerSwap,
  fieldWidth, 
  fieldHeight,
  isSubstitute = false,
  onDragToSubBench,
  onDragToField,
  subBenchHeight = 0
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const pan = useRef(new Animated.ValueXY({ x: player.x, y: player.y })).current;

  // Update animated value when player position changes externally
  React.useEffect(() => {
    pan.setValue({ x: player.x, y: player.y });
  }, [player.x, player.y, pan]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      
      onPanResponderGrant: () => {
        console.log(`Started dragging player ${player.name} (substitute: ${isSubstitute})`);
        setIsDragging(true);
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      
      onPanResponderMove: (_, gestureState) => {
        console.log(`Moving player ${player.name}: dx=${gestureState.dx}, dy=${gestureState.dy}`);
        pan.setValue({
          x: gestureState.dx,
          y: gestureState.dy,
        });
      },
      
      onPanResponderRelease: (_, gestureState) => {
        console.log(`Released player ${player.name}`);
        setIsDragging(false);
        pan.flattenOffset();
        
        // Get current position
        const currentX = pan.x._value;
        const currentY = pan.y._value;
        
        if (isSubstitute) {
          // Substitute being dragged to field
          const isInField = currentY < fieldHeight && currentX >= 0 && currentX <= fieldWidth;
          
          if (isInField && onDragToField) {
            const constrainedX = Math.max(0, Math.min(fieldWidth - PLAYER_SIZE, currentX));
            const constrainedY = Math.max(0, Math.min(fieldHeight - PLAYER_SIZE, currentY));
            console.log(`Substitute ${player.name} dropped on field at (${constrainedX}, ${constrainedY})`);
            onDragToField(player.id, constrainedX, constrainedY);
            return;
          } else {
            // Snap back to original position
            pan.setValue({ x: player.x, y: player.y });
            console.log(`Substitute ${player.name} snapped back to bench`);
          }
        } else {
          // Field player being dragged
          const isInSubBench = currentY > fieldHeight - 20; // 20px buffer for sub bench
          
          if (isInSubBench && onDragToSubBench) {
            console.log(`Field player ${player.name} dropped in sub bench`);
            onDragToSubBench(player.id);
            return;
          } else {
            // Keep on field with constraints
            const constrainedX = Math.max(0, Math.min(fieldWidth - PLAYER_SIZE, currentX));
            const constrainedY = Math.max(0, Math.min(fieldHeight - PLAYER_SIZE, currentY));
            
            pan.setValue({ x: constrainedX, y: constrainedY });
            onPositionChange(player.id, constrainedX, constrainedY);
            console.log(`Field player ${player.name} moved to (${constrainedX}, ${constrainedY})`);
          }
        }
      },
      
      onPanResponderTerminate: () => {
        console.log(`Terminated dragging player ${player.name}`);
        setIsDragging(false);
        pan.flattenOffset();
        // Snap back to original position
        pan.setValue({ x: player.x, y: player.y });
      },
    })
  ).current;

  const handlePlayerPress = () => {
    if (isSubstitute && onPlayerSwap) {
      console.log(`Tapping substitute ${player.name}`);
      onPlayerSwap(player.id);
    }
  };

  if (isSubstitute) {
    return (
      <Animated.View
        style={[
          styles.substitutePlayer,
          {
            transform: pan.getTranslateTransform(),
            zIndex: isDragging ? 1000 : 1,
            elevation: isDragging ? 10 : 2,
          },
          !player.isAvailable && styles.playerUnavailable,
          isDragging && styles.playerDragging,
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.substitutePlayerContent}
          onPress={handlePlayerPress}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.substitutePlayerText,
            !player.isAvailable && styles.playerTextUnavailable
          ]} numberOfLines={1}>
            {player.name}
          </Text>
          <View style={styles.substituteIcon}>
            <Icon name="arrow-up" size={12} color={colors.background} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.player,
        {
          transform: pan.getTranslateTransform(),
          zIndex: isDragging ? 1000 : 1,
          elevation: isDragging ? 10 : 2,
        },
        isDragging && styles.playerDragging,
        !player.isAvailable && styles.playerUnavailable,
      ]}
      {...panResponder.panHandlers}
    >
      <Text style={[
        styles.playerText,
        !player.isAvailable && styles.playerTextUnavailable
      ]} numberOfLines={1}>
        {player.name}
      </Text>
    </Animated.View>
  );
};

export default function FormationScreen() {
  const router = useRouter();
  const { players: playersParam } = useLocalSearchParams();
  
  const allPlayers: Player[] = JSON.parse(playersParam as string || '[]').map((p: any, index: number) => ({
    ...p,
    x: Math.random() * 200 + 50,
    y: Math.random() * 200 + 50,
    isOnField: p.isAvailable, // Only available players start on field
  }));

  const [players, setPlayers] = useState<Player[]>(allPlayers);
  const [fieldDimensions, setFieldDimensions] = useState({ width: 0, height: 0 });

  // Load saved formation positions
  useEffect(() => {
    loadFormationPositions();
  }, []);

  // Save formation positions whenever players change
  useEffect(() => {
    if (fieldDimensions.width > 0) {
      saveFormationPositions();
    }
  }, [players, fieldDimensions]);

  const loadFormationPositions = async () => {
    try {
      const savedPositions = await AsyncStorage.getItem(FORMATION_STORAGE_KEY);
      if (savedPositions) {
        const positions = JSON.parse(savedPositions);
        console.log('Loaded saved formation positions');
        
        // Apply saved positions to matching players
        setPlayers(prevPlayers => 
          prevPlayers.map(player => {
            const savedPlayer = positions.find((p: any) => p.id === player.id);
            if (savedPlayer) {
              return {
                ...player,
                x: savedPlayer.x,
                y: savedPlayer.y,
                isOnField: savedPlayer.isOnField,
              };
            }
            return player;
          })
        );
      }
    } catch (error) {
      console.error('Error loading formation positions:', error);
    }
  };

  const saveFormationPositions = async () => {
    try {
      const positionsToSave = players.map(player => ({
        id: player.id,
        x: player.x,
        y: player.y,
        isOnField: player.isOnField,
      }));
      await AsyncStorage.setItem(FORMATION_STORAGE_KEY, JSON.stringify(positionsToSave));
      console.log('Formation positions saved');
    } catch (error) {
      console.error('Error saving formation positions:', error);
    }
  };

  const fieldPlayers = players.filter(p => p.isOnField && p.isAvailable);
  const substitutePlayers = players.filter(p => !p.isOnField && p.isAvailable);

  const handlePositionChange = (id: string, x: number, y: number) => {
    console.log(`Updating player ${id} position to (${x}, ${y})`);
    setPlayers(prev => prev.map(player => 
      player.id === id ? { ...player, x, y } : player
    ));
  };

  const handleDragToSubBench = (playerId: string) => {
    console.log('Moving player to sub bench:', playerId);
    setPlayers(prev => prev.map(player => 
      player.id === playerId 
        ? { ...player, isOnField: false, x: 0, y: 0 }
        : player
    ));
  };

  const handleDragToField = (playerId: string, x: number, y: number) => {
    console.log('Moving substitute to field:', playerId, x, y);
    setPlayers(prev => prev.map(player => 
      player.id === playerId 
        ? { ...player, isOnField: true, x, y }
        : player
    ));
  };

  const handlePlayerSwap = (substituteId: string) => {
    console.log('Swapping substitute player:', substituteId);
    
    const substitute = players.find(p => p.id === substituteId);
    if (!substitute) return;

    const fieldPlayersList = players.filter(p => p.isOnField && p.isAvailable);
    
    if (fieldPlayersList.length === 0) {
      // No field players, just move substitute to field
      const randomX = Math.random() * (fieldDimensions.width - PLAYER_SIZE) + 10;
      const randomY = Math.random() * (fieldDimensions.height - PLAYER_SIZE) + 10;
      
      setPlayers(prev => prev.map(player => 
        player.id === substituteId 
          ? { ...player, isOnField: true, x: randomX, y: randomY }
          : player
      ));
      return;
    }

    // Show selection dialog for which player to swap with
    const playerNames = fieldPlayersList.map(p => p.name);
    
    Alert.alert(
      'Select Player to Swap',
      `Choose which field player to swap with ${substitute.name}:`,
      [
        ...fieldPlayersList.map((fieldPlayer, index) => ({
          text: fieldPlayer.name,
          onPress: () => {
            setPlayers(prev => prev.map(player => {
              if (player.id === substituteId) {
                return { 
                  ...player, 
                  isOnField: true,
                  x: fieldPlayer.x,
                  y: fieldPlayer.y,
                };
              } else if (player.id === fieldPlayer.id) {
                return { ...player, isOnField: false, x: 0, y: 0 };
              }
              return player;
            }));
            console.log(`Swapped ${substitute.name} with ${fieldPlayer.name}`);
          }
        })),
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const resetPositions = () => {
    Alert.alert(
      'Reset Positions',
      'This will randomly redistribute all field players. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: () => {
            const resetPlayers = players.map((player) => ({
              ...player,
              x: player.isOnField ? Math.random() * (fieldDimensions.width - PLAYER_SIZE) + 10 : 0,
              y: player.isOnField ? Math.random() * (fieldDimensions.height - PLAYER_SIZE) + 10 : 0,
            }));
            setPlayers(resetPlayers);
            console.log('Reset all player positions');
          }
        }
      ]
    );
  };

  const arrangeInGAAFormation = () => {
    const { width, height } = fieldDimensions;
    const fieldPlayersList = players.filter(p => p.isOnField && p.isAvailable);
    const playersCount = fieldPlayersList.length;
    
    if (playersCount === 0) {
      Alert.alert('No Field Players', 'Add some players to the field first.');
      return;
    }
    
    console.log(`Arranging ${playersCount} players in GAA formation on field ${width}x${height}`);
    
    // GAA formation arrangement - rotated to vertical orientation (goals top/bottom)
    const arrangedPlayers = players.map((player) => {
      if (!player.isOnField || !player.isAvailable) return player;
      
      const index = fieldPlayersList.findIndex(p => p.id === player.id);
      let x, y;
      
      if (playersCount <= 15) {
        // Traditional GAA positions - rotated 90 degrees
        switch (index) {
          case 0: // Goalkeeper
            x = width * 0.5 - PLAYER_SIZE / 2;
            y = height * 0.05;
            break;
          case 1: // Right Corner Back
            x = width * 0.25 - PLAYER_SIZE / 2;
            y = height * 0.15;
            break;
          case 2: // Full Back
            x = width * 0.5 - PLAYER_SIZE / 2;
            y = height * 0.15;
            break;
          case 3: // Left Corner Back
            x = width * 0.75 - PLAYER_SIZE / 2;
            y = height * 0.15;
            break;
          case 4: // Right Half Back
            x = width * 0.25 - PLAYER_SIZE / 2;
            y = height * 0.35;
            break;
          case 5: // Centre Half Back
            x = width * 0.5 - PLAYER_SIZE / 2;
            y = height * 0.35;
            break;
          case 6: // Left Half Back
            x = width * 0.75 - PLAYER_SIZE / 2;
            y = height * 0.35;
            break;
          case 7: // Midfield Right
            x = width * 0.4 - PLAYER_SIZE / 2;
            y = height * 0.5;
            break;
          case 8: // Midfield Left
            x = width * 0.6 - PLAYER_SIZE / 2;
            y = height * 0.5;
            break;
          case 9: // Right Half Forward
            x = width * 0.25 - PLAYER_SIZE / 2;
            y = height * 0.65;
            break;
          case 10: // Centre Half Forward
            x = width * 0.5 - PLAYER_SIZE / 2;
            y = height * 0.65;
            break;
          case 11: // Left Half Forward
            x = width * 0.75 - PLAYER_SIZE / 2;
            y = height * 0.65;
            break;
          case 12: // Right Corner Forward
            x = width * 0.25 - PLAYER_SIZE / 2;
            y = height * 0.85;
            break;
          case 13: // Full Forward
            x = width * 0.5 - PLAYER_SIZE / 2;
            y = height * 0.85;
            break;
          case 14: // Left Corner Forward
            x = width * 0.75 - PLAYER_SIZE / 2;
            y = height * 0.85;
            break;
          default:
            x = width * 0.5 - PLAYER_SIZE / 2;
            y = height * 0.7 + (index - 15) * 40;
        }
      } else {
        // For more than 15 players, distribute evenly
        const cols = Math.ceil(Math.sqrt(playersCount));
        const rows = Math.ceil(playersCount / cols);
        const col = index % cols;
        const row = Math.floor(index / cols);
        
        x = (width / (cols + 1)) * (col + 1) - PLAYER_SIZE / 2;
        y = (height / (rows + 1)) * (row + 1) - PLAYER_SIZE / 2;
      }
      
      // Ensure positions are within bounds
      const finalX = Math.max(0, Math.min(width - PLAYER_SIZE, x));
      const finalY = Math.max(0, Math.min(height - PLAYER_SIZE, y));
      
      console.log(`Player ${index} (${player.name}) positioned at (${finalX}, ${finalY})`);
      
      return { ...player, x: finalX, y: finalY };
    });
    
    setPlayers(arrangedPlayers);
    console.log('Arranged players in GAA formation');
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Team Formation Planner</Text>
        <View style={styles.headerRight}>
          <Text style={styles.subCount}>{substitutePlayers.length} subs</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={arrangeInGAAFormation}>
          <Icon name="grid" size={16} color={colors.background} />
          <Text style={styles.controlButtonText}>GAA Formation</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={resetPositions}>
          <Icon name="refresh" size={16} color={colors.background} />
          <Text style={styles.controlButtonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <View 
        style={styles.gaaField}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setFieldDimensions({ width, height });
          console.log('GAA Field dimensions:', width, height);
        }}
      >
        {/* GAA Field markings - rotated to vertical orientation */}
        
        {/* Center line (horizontal) */}
        <View style={styles.centerLine} />
        
        {/* 45m lines (horizontal) */}
        <View style={styles.line45m1} />
        <View style={styles.line45m2} />
        
        {/* 21m lines (horizontal) */}
        <View style={styles.line21m1} />
        <View style={styles.line21m2} />
        
        {/* Goal areas (top and bottom) */}
        <View style={styles.goalArea1} />
        <View style={styles.goalArea2} />
        
        {/* Small rectangles (goal areas) */}
        <View style={styles.smallRectangle1} />
        <View style={styles.smallRectangle2} />
        
        {/* Goals with posts (top and bottom) */}
        <View style={styles.goal1}>
          <View style={styles.goalPost} />
          <View style={styles.goalPost} />
          <View style={styles.crossbar} />
        </View>
        <View style={styles.goal2}>
          <View style={styles.goalPost} />
          <View style={styles.goalPost} />
          <View style={styles.crossbar} />
        </View>
        
        {/* Penalty spots */}
        <View style={styles.penaltySpot1} />
        <View style={styles.penaltySpot2} />
        
        {/* Field Players */}
        {fieldDimensions.width > 0 && fieldDimensions.height > 0 && fieldPlayers.map((player) => (
          <DraggablePlayer
            key={player.id}
            player={player}
            onPositionChange={handlePositionChange}
            onDragToSubBench={handleDragToSubBench}
            fieldWidth={fieldDimensions.width}
            fieldHeight={fieldDimensions.height}
            subBenchHeight={SUB_BENCH_HEIGHT}
          />
        ))}
      </View>

      {/* Substitution Bench */}
      <View style={styles.subBench}>
        <View style={styles.subBenchHeader}>
          <Icon name="people" size={20} color={colors.text} />
          <Text style={styles.subBenchTitle}>Substitution Bench</Text>
          <Text style={styles.subBenchCount}>({substitutePlayers.length})</Text>
        </View>
        
        <ScrollView 
          horizontal 
          style={styles.subBenchScroll}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subBenchContent}
        >
          {substitutePlayers.length === 0 ? (
            <View style={styles.emptySubBench}>
              <Icon name="checkmark-circle" size={32} color={colors.accent} />
              <Text style={styles.emptySubBenchText}>All available players on field</Text>
            </View>
          ) : (
            substitutePlayers.map((player) => (
              <DraggablePlayer
                key={player.id}
                player={player}
                onPositionChange={() => {}}
                onPlayerSwap={handlePlayerSwap}
                onDragToField={handleDragToField}
                fieldWidth={fieldDimensions.width}
                fieldHeight={fieldDimensions.height}
                isSubstitute={true}
              />
            ))
          )}
        </ScrollView>
        
        <Text style={styles.subBenchInstruction}>
          Drag substitutes to field • Tap to swap with field players • Drag field players here to substitute
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.designerNote}>Designed by Paul Halton</Text>
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
  headerRight: {
    alignItems: 'flex-end',
  },
  subCount: {
    fontSize: 14,
    color: colors.grey,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  controls: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
  },
  controlButton: {
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  controlButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  gaaField: {
    flex: 1,
    backgroundColor: '#2E7D32', // GAA green
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
    position: 'relative',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)',
    elevation: 4,
  },
  // Rotated field markings - now horizontal lines
  centerLine: {
    position: 'absolute',
    left: 0,
    top: '50%',
    width: '100%',
    height: 2,
    backgroundColor: '#FFFFFF',
    marginTop: -1,
  },
  line45m1: {
    position: 'absolute',
    left: 0,
    top: '25%',
    width: '100%',
    height: 2,
    backgroundColor: '#FFFFFF',
    marginTop: -1,
  },
  line45m2: {
    position: 'absolute',
    left: 0,
    bottom: '25%',
    width: '100%',
    height: 2,
    backgroundColor: '#FFFFFF',
    marginBottom: -1,
  },
  line21m1: {
    position: 'absolute',
    left: 0,
    top: '15%',
    width: '100%',
    height: 2,
    backgroundColor: '#FFFFFF',
    marginTop: -1,
  },
  line21m2: {
    position: 'absolute',
    left: 0,
    bottom: '15%',
    width: '100%',
    height: 2,
    backgroundColor: '#FFFFFF',
    marginBottom: -1,
  },
  // Goal areas at top and bottom
  goalArea1: {
    position: 'absolute',
    left: '30%',
    top: 0,
    width: '40%',
    height: '15%',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderTopWidth: 0,
  },
  goalArea2: {
    position: 'absolute',
    left: '30%',
    bottom: 0,
    width: '40%',
    height: '15%',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderBottomWidth: 0,
  },
  smallRectangle1: {
    position: 'absolute',
    left: '42%',
    top: 0,
    width: '16%',
    height: '8%',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderTopWidth: 0,
  },
  smallRectangle2: {
    position: 'absolute',
    left: '42%',
    bottom: 0,
    width: '16%',
    height: '8%',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderBottomWidth: 0,
  },
  // Goals at top and bottom with H-shape
  goal1: {
    position: 'absolute',
    left: '46%',
    top: -3,
    width: '8%',
    height: 6,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  goal2: {
    position: 'absolute',
    left: '46%',
    bottom: -3,
    width: '8%',
    height: 6,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  goalPost: {
    width: '200%',
    height: 3,
    backgroundColor: '#FFFFFF',
    marginLeft: '-50%',
  },
  crossbar: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#FFFFFF',
    marginLeft: -1.5,
  },
  penaltySpot1: {
    position: 'absolute',
    left: '48%',
    top: '11%',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginLeft: -3,
    marginTop: -3,
  },
  penaltySpot2: {
    position: 'absolute',
    left: '48%',
    bottom: '11%',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginLeft: -3,
    marginBottom: -3,
  },
  player: {
    position: 'absolute',
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    backgroundColor: colors.accent,
    borderRadius: PLAYER_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.3)',
    elevation: 3,
  },
  playerDragging: {
    backgroundColor: colors.secondary,
    transform: [{ scale: 1.1 }],
    boxShadow: '0px 6px 16px rgba(0, 0, 0, 0.4)',
    elevation: 8,
  },
  playerUnavailable: {
    backgroundColor: colors.grey,
    opacity: 0.6,
  },
  playerText: {
    color: colors.background,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  playerTextUnavailable: {
    color: colors.text,
  },
  substitutePlayer: {
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    margin: 5,
    position: 'relative',
  },
  substitutePlayerContent: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.secondary,
    borderRadius: PLAYER_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  substitutePlayerText: {
    color: colors.background,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  substituteIcon: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: colors.accent,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subBench: {
    height: SUB_BENCH_HEIGHT,
    backgroundColor: colors.backgroundAlt,
    borderTopWidth: 2,
    borderTopColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  subBenchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  subBenchTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  subBenchCount: {
    fontSize: 14,
    color: colors.grey,
    fontWeight: '600',
  },
  subBenchScroll: {
    flex: 1,
  },
  subBenchContent: {
    alignItems: 'center',
    paddingVertical: 5,
  },
  emptySubBench: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  emptySubBenchText: {
    fontSize: 14,
    color: colors.grey,
    marginTop: 5,
    fontStyle: 'italic',
  },
  subBenchInstruction: {
    fontSize: 12,
    color: colors.grey,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 5,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  designerNote: {
    fontSize: 12,
    color: colors.grey,
    fontStyle: 'italic',
  },
});
