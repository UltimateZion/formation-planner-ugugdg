
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

  const arrangeInFormation = () => {
    const { width, height } = fieldDimensions;
    const playersCount = players.length;
    
    // Simple formation arrangement - distribute players evenly
    const cols = Math.ceil(Math.sqrt(playersCount));
    const rows = Math.ceil(playersCount / cols);
    
    const arrangedPlayers = players.map((player, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      
      const x = (width / (cols + 1)) * (col + 1) - 30;
      const y = (height / (rows + 1)) * (row + 1) - 30;
      
      return { ...player, x, y };
    });
    
    setPlayers(arrangedPlayers);
    console.log('Arranged players in formation');
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
        <Text style={styles.title}>Formation</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Icon name="menu" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={arrangeInFormation}>
          <Icon name="grid" size={16} color={colors.background} />
          <Text style={styles.controlButtonText}>Auto Arrange</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={resetPositions}>
          <Icon name="refresh" size={16} color={colors.background} />
          <Text style={styles.controlButtonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <View 
        style={styles.field}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setFieldDimensions({ width, height });
          console.log('Field dimensions:', width, height);
        }}
      >
        {/* Field markings */}
        <View style={styles.centerCircle} />
        <View style={styles.centerLine} />
        <View style={styles.goalArea1} />
        <View style={styles.goalArea2} />
        
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
          Drag players to position them on the field
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
  field: {
    flex: 1,
    backgroundColor: '#2E7D32',
    margin: 20,
    borderRadius: 12,
    position: 'relative',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)',
    elevation: 4,
  },
  centerCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginTop: -40,
    marginLeft: -40,
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
  goalArea1: {
    position: 'absolute',
    top: '50%',
    left: 0,
    width: 40,
    height: 100,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderLeftWidth: 0,
    marginTop: -50,
  },
  goalArea2: {
    position: 'absolute',
    top: '50%',
    right: 0,
    width: 40,
    height: 100,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRightWidth: 0,
    marginTop: -50,
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
  },
});
