
import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity,
  PanResponder,
  Animated,
  ScrollView
} from 'react-native';
import { commonStyles, colors } from '../styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Icon from '../components/Icon';
import SimpleBottomSheet from '../components/BottomSheet';

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
}

const PLAYER_SIZE = 60;

const DraggablePlayer: React.FC<DraggablePlayerProps> = ({ 
  player, 
  onPositionChange, 
  onPlayerSwap,
  fieldWidth, 
  fieldHeight,
  isSubstitute = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [currentPosition, setCurrentPosition] = useState({ x: player.x, y: player.y });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        console.log(`Started dragging player ${player.name}`);
        setIsDragging(true);
      },
      onPanResponderMove: (_, gestureState) => {
        if (isSubstitute) return; // Don't allow dragging substitutes
        
        // Calculate new position with boundary constraints
        const newX = Math.max(0, Math.min(fieldWidth - PLAYER_SIZE, player.x + gestureState.dx));
        const newY = Math.max(0, Math.min(fieldHeight - PLAYER_SIZE, player.y + gestureState.dy));
        
        setCurrentPosition({ x: newX, y: newY });
        console.log(`Moving player ${player.name} to (${newX.toFixed(1)}, ${newY.toFixed(1)})`);
      },
      onPanResponderRelease: (_, gestureState) => {
        console.log(`Released player ${player.name}`);
        setIsDragging(false);
        
        if (isSubstitute) return;
        
        // Final position calculation with boundary constraints
        const finalX = Math.max(0, Math.min(fieldWidth - PLAYER_SIZE, player.x + gestureState.dx));
        const finalY = Math.max(0, Math.min(fieldHeight - PLAYER_SIZE, player.y + gestureState.dy));
        
        setCurrentPosition({ x: finalX, y: finalY });
        onPositionChange(player.id, finalX, finalY);
        
        console.log(`Player ${player.name} final position: (${finalX}, ${finalY})`);
      },
      onPanResponderTerminate: () => {
        console.log(`Terminated dragging player ${player.name}`);
        setIsDragging(false);
        setCurrentPosition({ x: player.x, y: player.y });
      },
    })
  ).current;

  // Update current position when player prop changes (e.g., from formation changes)
  React.useEffect(() => {
    setCurrentPosition({ x: player.x, y: player.y });
  }, [player.x, player.y]);

  const handlePlayerPress = () => {
    if (isSubstitute && onPlayerSwap) {
      onPlayerSwap(player.id);
    }
  };

  return (
    <TouchableOpacity
      style={[
        isSubstitute ? styles.substitutePlayer : styles.player,
        isSubstitute ? {} : {
          left: currentPosition.x,
          top: currentPosition.y,
          zIndex: isDragging ? 1000 : 1,
          elevation: isDragging ? 10 : 2,
        },
        isDragging && styles.playerDragging,
        !player.isAvailable && styles.playerUnavailable,
      ]}
      onPress={handlePlayerPress}
      {...(!isSubstitute ? panResponder.panHandlers : {})}
    >
      <Text style={[
        isSubstitute ? styles.substitutePlayerText : styles.playerText,
        !player.isAvailable && styles.playerTextUnavailable
      ]} numberOfLines={1}>
        {player.name}
      </Text>
      {isSubstitute && (
        <View style={styles.substituteIcon}>
          <Icon name="arrow-up" size={12} color={colors.background} />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function FormationScreen() {
  const router = useRouter();
  const { players: playersParam } = useLocalSearchParams();
  
  const allPlayers: Player[] = JSON.parse(playersParam as string || '[]').map((p: any, index: number) => ({
    ...p,
    x: Math.random() * 200 + 50,
    y: Math.random() * 300 + 100,
    isOnField: p.isAvailable, // Initially, available players are on field
  }));

  const [players, setPlayers] = useState<Player[]>(allPlayers);
  const [fieldDimensions, setFieldDimensions] = useState({ width: 0, height: 0 });
  const [showSubstitutes, setShowSubstitutes] = useState(false);

  const fieldPlayers = players.filter(p => p.isOnField && p.isAvailable);
  const substitutePlayers = players.filter(p => !p.isOnField && p.isAvailable);

  const handlePositionChange = (id: string, x: number, y: number) => {
    console.log(`Updating player ${id} position to (${x}, ${y})`);
    setPlayers(prev => prev.map(player => 
      player.id === id ? { ...player, x, y } : player
    ));
  };

  const handlePlayerSwap = (substituteId: string) => {
    console.log('Swapping substitute player:', substituteId);
    
    // Find the substitute player
    const substitute = players.find(p => p.id === substituteId);
    if (!substitute) return;

    // Find a random field player to swap with
    const fieldPlayersList = players.filter(p => p.isOnField && p.isAvailable);
    if (fieldPlayersList.length === 0) {
      // If no field players, just move substitute to field
      setPlayers(prev => prev.map(player => 
        player.id === substituteId 
          ? { 
              ...player, 
              isOnField: true,
              x: Math.random() * (fieldDimensions.width - PLAYER_SIZE) + 10,
              y: Math.random() * (fieldDimensions.height - PLAYER_SIZE) + 10,
            }
          : player
      ));
      return;
    }

    // Swap with the first field player (or implement selection logic)
    const fieldPlayer = fieldPlayersList[0];
    
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
  };

  const resetPositions = () => {
    const resetPlayers = players.map((player) => ({
      ...player,
      x: player.isOnField ? Math.random() * (fieldDimensions.width - PLAYER_SIZE) + 10 : 0,
      y: player.isOnField ? Math.random() * (fieldDimensions.height - PLAYER_SIZE) + 10 : 0,
    }));
    setPlayers(resetPlayers);
    console.log('Reset all player positions');
  };

  const arrangeInGAAFormation = () => {
    const { width, height } = fieldDimensions;
    const fieldPlayersList = players.filter(p => p.isOnField && p.isAvailable);
    const playersCount = fieldPlayersList.length;
    
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
        <Text style={styles.title}>Team Formation Planned</Text>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setShowSubstitutes(true)}
        >
          <Icon name="people" size={24} color={colors.text} />
          {substitutePlayers.length > 0 && (
            <View style={styles.substituteBadge}>
              <Text style={styles.substituteBadgeText}>{substitutePlayers.length}</Text>
            </View>
          )}
        </TouchableOpacity>
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
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={() => setShowSubstitutes(true)}
        >
          <Icon name="swap-horizontal" size={16} color={colors.background} />
          <Text style={styles.controlButtonText}>Subs ({substitutePlayers.length})</Text>
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
            fieldWidth={fieldDimensions.width}
            fieldHeight={fieldDimensions.height}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.instruction}>
          Drag players to position them on the GAA pitch
        </Text>
        <Text style={styles.gaaInfo}>
          GAA pitch: 130-145m × 80-90m with H-shaped goals at top and bottom
        </Text>
        <Text style={styles.designerNote}>Designed by Paul Halton</Text>
      </View>

      {/* Substitutes Bottom Sheet */}
      <SimpleBottomSheet 
        isVisible={showSubstitutes} 
        onClose={() => setShowSubstitutes(false)}
      >
        <View style={styles.bottomSheetContent}>
          <View style={styles.bottomSheetHeader}>
            <Text style={styles.bottomSheetTitle}>Substitutes</Text>
            <TouchableOpacity onPress={() => setShowSubstitutes(false)}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          {substitutePlayers.length === 0 ? (
            <View style={styles.noSubstitutes}>
              <Icon name="checkmark-circle" size={48} color={colors.accent} />
              <Text style={styles.noSubstitutesText}>All available players are on the field!</Text>
            </View>
          ) : (
            <ScrollView style={styles.substitutesList} showsVerticalScrollIndicator={false}>
              <Text style={styles.substitutesInstruction}>
                Tap a substitute to swap them with a field player
              </Text>
              <View style={styles.substitutesGrid}>
                {substitutePlayers.map((player) => (
                  <DraggablePlayer
                    key={player.id}
                    player={player}
                    onPositionChange={() => {}}
                    onPlayerSwap={handlePlayerSwap}
                    fieldWidth={0}
                    fieldHeight={0}
                    isSubstitute={true}
                  />
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      </SimpleBottomSheet>
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
  menuButton: {
    padding: 8,
    position: 'relative',
  },
  substituteBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  substituteBadgeText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '700',
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
    margin: 20,
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
    backgroundColor: colors.secondary,
    borderRadius: PLAYER_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.accent,
    margin: 5,
    position: 'relative',
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
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: colors.backgroundAlt,
    alignItems: 'center',
  },
  instruction: {
    color: colors.grey,
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  gaaInfo: {
    color: colors.grey,
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  designerNote: {
    fontSize: 12,
    color: colors.grey,
    fontStyle: 'italic',
  },
  bottomSheetContent: {
    padding: 20,
    maxHeight: 400,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  noSubstitutes: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noSubstitutesText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginTop: 10,
  },
  substitutesList: {
    maxHeight: 300,
  },
  substitutesInstruction: {
    fontSize: 14,
    color: colors.grey,
    textAlign: 'center',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  substitutesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
});
