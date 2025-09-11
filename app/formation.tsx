
import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity,
  PanResponder,
  Animated
} from 'react-native';
import { commonStyles, colors } from '../styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Icon from '../components/Icon';

interface Player {
  id: string;
  name: string;
  x: number;
  y: number;
}

interface DraggablePlayerProps {
  player: Player;
  onPositionChange: (id: string, x: number, y: number) => void;
  fieldWidth: number;
  fieldHeight: number;
}

const DraggablePlayer: React.FC<DraggablePlayerProps> = ({ 
  player, 
  onPositionChange, 
  fieldWidth, 
  fieldHeight 
}) => {
  const pan = useRef(new Animated.ValueXY({ x: player.x, y: player.y })).current;
  const [isDragging, setIsDragging] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gestureState) => {
        setIsDragging(false);
        pan.flattenOffset();
        
        const newX = Math.max(0, Math.min(fieldWidth - 60, (pan.x as any)._value));
        const newY = Math.max(0, Math.min(fieldHeight - 60, (pan.y as any)._value));
        
        pan.setValue({ x: newX, y: newY });
        onPositionChange(player.id, newX, newY);
        
        console.log(`Player ${player.name} moved to (${newX}, ${newY})`);
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.player,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
          zIndex: isDragging ? 1000 : 1,
          elevation: isDragging ? 10 : 2,
        },
        isDragging && styles.playerDragging,
      ]}
      {...panResponder.panHandlers}
    >
      <Text style={styles.playerText} numberOfLines={1}>
        {player.name}
      </Text>
    </Animated.View>
  );
};

export default function FormationScreen() {
  const router = useRouter();
  const { players: playersParam } = useLocalSearchParams();
  
  const initialPlayers: Player[] = JSON.parse(playersParam as string || '[]').map((p: any, index: number) => ({
    ...p,
    x: Math.random() * 200 + 50,
    y: Math.random() * 300 + 100,
  }));

  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [fieldDimensions, setFieldDimensions] = useState({ width: 0, height: 0 });

  const handlePositionChange = (id: string, x: number, y: number) => {
    setPlayers(prev => prev.map(player => 
      player.id === id ? { ...player, x, y } : player
    ));
  };

  const resetPositions = () => {
    const resetPlayers = players.map((player, index) => ({
      ...player,
      x: Math.random() * (fieldDimensions.width - 60) + 30,
      y: Math.random() * (fieldDimensions.height - 60) + 30,
    }));
    setPlayers(resetPlayers);
    console.log('Reset all player positions');
  };

  const arrangeInGAAFormation = () => {
    const { width, height } = fieldDimensions;
    const playersCount = players.length;
    
    // GAA formation arrangement - typical 15 player setup adapted for any number
    const arrangedPlayers = players.map((player, index) => {
      let x, y;
      
      if (playersCount <= 15) {
        // Traditional GAA positions
        switch (index) {
          case 0: // Goalkeeper
            x = width * 0.05;
            y = height * 0.5;
            break;
          case 1: // Right Corner Back
            x = width * 0.15;
            y = height * 0.25;
            break;
          case 2: // Full Back
            x = width * 0.15;
            y = height * 0.5;
            break;
          case 3: // Left Corner Back
            x = width * 0.15;
            y = height * 0.75;
            break;
          case 4: // Right Half Back
            x = width * 0.35;
            y = height * 0.25;
            break;
          case 5: // Centre Half Back
            x = width * 0.35;
            y = height * 0.5;
            break;
          case 6: // Left Half Back
            x = width * 0.35;
            y = height * 0.75;
            break;
          case 7: // Midfield Right
            x = width * 0.5;
            y = height * 0.4;
            break;
          case 8: // Midfield Left
            x = width * 0.5;
            y = height * 0.6;
            break;
          case 9: // Right Half Forward
            x = width * 0.65;
            y = height * 0.25;
            break;
          case 10: // Centre Half Forward
            x = width * 0.65;
            y = height * 0.5;
            break;
          case 11: // Left Half Forward
            x = width * 0.65;
            y = height * 0.75;
            break;
          case 12: // Right Corner Forward
            x = width * 0.85;
            y = height * 0.25;
            break;
          case 13: // Full Forward
            x = width * 0.85;
            y = height * 0.5;
            break;
          case 14: // Left Corner Forward
            x = width * 0.85;
            y = height * 0.75;
            break;
          default:
            x = width * 0.7 + (index - 15) * 30;
            y = height * 0.5;
        }
      } else {
        // For more than 15 players, distribute evenly
        const cols = Math.ceil(Math.sqrt(playersCount));
        const rows = Math.ceil(playersCount / cols);
        const col = index % cols;
        const row = Math.floor(index / cols);
        
        x = (width / (cols + 1)) * (col + 1) - 30;
        y = (height / (rows + 1)) * (row + 1) - 30;
      }
      
      return { ...player, x: Math.max(30, Math.min(width - 90, x)), y: Math.max(30, Math.min(height - 90, y)) };
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
        <Text style={styles.title}>GAA Formation</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Icon name="menu" size={24} color={colors.text} />
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
      </View>

      <View 
        style={styles.gaaField}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setFieldDimensions({ width, height });
          console.log('GAA Field dimensions:', width, height);
        }}
      >
        {/* GAA Field markings */}
        
        {/* Center line */}
        <View style={styles.centerLine} />
        
        {/* 45m lines */}
        <View style={styles.line45m1} />
        <View style={styles.line45m2} />
        
        {/* 21m lines (65m from goals) */}
        <View style={styles.line21m1} />
        <View style={styles.line21m2} />
        
        {/* Goal areas */}
        <View style={styles.goalArea1} />
        <View style={styles.goalArea2} />
        
        {/* Small rectangles (goal areas) */}
        <View style={styles.smallRectangle1} />
        <View style={styles.smallRectangle2} />
        
        {/* Goals with posts */}
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
        
        {/* Players */}
        {players.map((player) => (
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
          GAA pitch: 130-145m × 80-90m with H-shaped goals
        </Text>
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
  menuButton: {
    padding: 8,
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
  centerLine: {
    position: 'absolute',
    top: 0,
    left: '50%',
    width: 2,
    height: '100%',
    backgroundColor: '#FFFFFF',
    marginLeft: -1,
  },
  line45m1: {
    position: 'absolute',
    top: 0,
    left: '25%',
    width: 2,
    height: '100%',
    backgroundColor: '#FFFFFF',
    marginLeft: -1,
  },
  line45m2: {
    position: 'absolute',
    top: 0,
    right: '25%',
    width: 2,
    height: '100%',
    backgroundColor: '#FFFFFF',
    marginRight: -1,
  },
  line21m1: {
    position: 'absolute',
    top: 0,
    left: '15%',
    width: 2,
    height: '100%',
    backgroundColor: '#FFFFFF',
    marginLeft: -1,
  },
  line21m2: {
    position: 'absolute',
    top: 0,
    right: '15%',
    width: 2,
    height: '100%',
    backgroundColor: '#FFFFFF',
    marginRight: -1,
  },
  goalArea1: {
    position: 'absolute',
    top: '30%',
    left: 0,
    width: '15%',
    height: '40%',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderLeftWidth: 0,
  },
  goalArea2: {
    position: 'absolute',
    top: '30%',
    right: 0,
    width: '15%',
    height: '40%',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRightWidth: 0,
  },
  smallRectangle1: {
    position: 'absolute',
    top: '42%',
    left: 0,
    width: '8%',
    height: '16%',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderLeftWidth: 0,
  },
  smallRectangle2: {
    position: 'absolute',
    top: '42%',
    right: 0,
    width: '8%',
    height: '16%',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRightWidth: 0,
  },
  goal1: {
    position: 'absolute',
    top: '46%',
    left: -3,
    width: 6,
    height: '8%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goal2: {
    position: 'absolute',
    top: '46%',
    right: -3,
    width: 6,
    height: '8%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalPost: {
    width: 3,
    height: '200%',
    backgroundColor: '#FFFFFF',
    marginTop: '-50%',
  },
  crossbar: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#FFFFFF',
    marginTop: -1.5,
  },
  penaltySpot1: {
    position: 'absolute',
    top: '48%',
    left: '11%',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginTop: -3,
    marginLeft: -3,
  },
  penaltySpot2: {
    position: 'absolute',
    top: '48%',
    right: '11%',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginTop: -3,
    marginRight: -3,
  },
  player: {
    position: 'absolute',
    width: 60,
    height: 60,
    backgroundColor: colors.accent,
    borderRadius: 30,
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
  playerText: {
    color: colors.background,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: colors.backgroundAlt,
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
  },
});
