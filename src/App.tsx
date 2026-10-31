import React, { useState, useEffect } from 'react';
import { ArcadeDashboard } from './components/ArcadeDashboard';
import { CyberRunner } from './components/games/CyberRunner';
import { SpaceDefender } from './components/games/SpaceDefender';
import { NeonSnake } from './components/games/NeonSnake';
import { QuantumFusion } from './components/games/QuantumFusion';
import { NeonAirHockey } from './components/games/NeonAirHockey';
import { CyberPong } from './components/games/CyberPong';
import { LobbyModal } from './components/multiplayer/LobbyModal';
import { ProfileModal } from './components/multiplayer/ProfileModal';
import { WelcomeOnboardingModal } from './components/multiplayer/WelcomeOnboardingModal';
import { getStorageData } from './utils/storage';
import { getUserProfile, UserProfile } from './utils/userProfile';
import { sounds } from './utils/audio';
import { socket } from './utils/socket';
import { 
  fetchGlobalLeaderboard, 
  fetchRecentMatches, 
  GlobalLeaderboardPlayer, 
  MatchHistoryLog 
} from './utils/multiplayerStats';

type ActiveView = 'dashboard' | 'runner' | 'shooter' | 'snake' | 'tile' | 'hockey' | 'pong';

export const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [storageData, setStorageData] = useState(getStorageData());
  const [userProfile, setUserProfile] = useState<UserProfile>(getUserProfile());
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(() => !getUserProfile().hasChosenNickname);
  const [pendingJoinCode, setPendingJoinCode] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('join') || params.get('room');
  });
  const [isLobbyOpen, setIsLobbyOpen] = useState(false);
  const [lobbyGameType, setLobbyGameType] = useState<'hockey' | 'pong'>('hockey');
  const [activeRoomData, setActiveRoomData] = useState<any>(null);
  const [activeRole, setActiveRole] = useState<string>('player1');
  const [globalLeaderboard, setGlobalLeaderboard] = useState<GlobalLeaderboardPlayer[]>([]);
  const [recentMatches, setRecentMatches] = useState<MatchHistoryLog[]>([]);

  const loadStats = () => {
    fetchGlobalLeaderboard().then(setGlobalLeaderboard);
    fetchRecentMatches().then(setRecentMatches);
  };

  useEffect(() => {
    // Auto initialize WebSocket connection in background
    socket.connect();
    loadStats();

    // Auto-join via URL direct invitation (e.g. ?join=AIR-123) if nickname is already set
    if (pendingJoinCode && userProfile.hasChosenNickname) {
      const targetCode = pendingJoinCode.toUpperCase().trim();
      const tryJoin = () => {
        sounds.playLaser();
        socket.send({
          type: 'join_room',
          roomId: targetCode,
          username: userProfile.username,
          avatar: userProfile.avatar,
          playerKey: userProfile.id,
        });
      };

      if (socket.isConnected()) {
        tryJoin();
      } else {
        const unsub = socket.on('connection_open', () => {
          tryJoin();
          unsub();
        });
      }
    }

    const unsubJoined = socket.on('room_joined', (data) => {
      handleRoomJoined(data.room, data.role);
    });

    const unsubReconnected = socket.on('room_reconnected', (data) => {
      handleRoomJoined(data.room, data.role);
    });

    const unsubOver = socket.on('game_over', () => {
      setTimeout(() => loadStats(), 1000);
    });

    return () => {
      unsubJoined();
      unsubReconnected();
      unsubOver();
    };
  }, []);

  const refreshData = () => {
    setStorageData(getStorageData());
    setUserProfile(getUserProfile());
    loadStats();
  };

  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const handleNewHighScore = (_score: number) => {
    refreshData();
  };

  const handleBackToDashboard = () => {
    if (activeRoomData) {
      socket.send({ type: 'leave_room' });
      setActiveRoomData(null);
    }
    // Clean up URL if query param was present
    if (window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    refreshData();
    setActiveView('dashboard');
  };

  const handleOpenLobby = (gameType: 'hockey' | 'pong' = 'hockey') => {
    setLobbyGameType(gameType);
    setIsLobbyOpen(true);
  };

  const handleQuickMatch = () => {
    setLobbyGameType('hockey');
    setIsLobbyOpen(true);
  };

  const handleRoomJoined = (roomData: any, role: string) => {
    setActiveRoomData(roomData);
    setActiveRole(role);
    if (roomData.gameType === 'pong') {
      setActiveView('pong');
    } else {
      setActiveView('hockey');
    }
  };

  const handleWelcomeComplete = (updated: UserProfile) => {
    setUserProfile(updated);
    setIsWelcomeOpen(false);
    loadStats();

    if (pendingJoinCode) {
      const targetCode = pendingJoinCode.toUpperCase().trim();
      const sendJoin = () => {
        sounds.playLaser();
        socket.send({
          type: 'join_room',
          roomId: targetCode,
          username: updated.username,
          avatar: updated.avatar,
          playerKey: updated.id,
        });
        setPendingJoinCode(null);
      };

      if (socket.isConnected()) {
        sendJoin();
      } else {
        const unsub = socket.on('connection_open', () => {
          sendJoin();
          unsub();
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Main Viewport */}
      <main className="flex-1 flex flex-col justify-center items-center py-6">
        {activeView === 'dashboard' && (
          <ArcadeDashboard
            onSelectGame={(gameId) => {
              setActiveRoomData(null);
              setActiveView(gameId);
            }}
            onOpenMultiplayerLobby={handleOpenLobby}
            onQuickMatch={handleQuickMatch}
            onOpenProfile={() => setIsProfileOpen(true)}
            profile={userProfile}
            highScores={storageData.scores}
            history={storageData.history}
            achievements={storageData.achievements}
            globalLeaderboard={globalLeaderboard}
            recentMatches={recentMatches}
            coins={storageData.coins}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
          />
        )}

        {/* Solo Retro Games */}
        {activeView === 'runner' && (
          <CyberRunner
            onBack={handleBackToDashboard}
            highScore={storageData.scores['runner'] || 0}
            onNewHighScore={handleNewHighScore}
          />
        )}

        {activeView === 'shooter' && (
          <SpaceDefender
            onBack={handleBackToDashboard}
            highScore={storageData.scores['shooter'] || 0}
            onNewHighScore={handleNewHighScore}
          />
        )}

        {activeView === 'snake' && (
          <NeonSnake
            onBack={handleBackToDashboard}
            highScore={storageData.scores['snake'] || 0}
            onNewHighScore={handleNewHighScore}
          />
        )}

        {activeView === 'tile' && (
          <QuantumFusion
            onBack={handleBackToDashboard}
            highScore={storageData.scores['tile'] || 0}
            onNewHighScore={handleNewHighScore}
          />
        )}

        {/* Real-time Multiplayer & Solo Air Hockey */}
        {activeView === 'hockey' && (
          <NeonAirHockey
            onBack={handleBackToDashboard}
            profile={userProfile}
            initialRoomData={activeRoomData}
            role={activeRole}
            onProfileUpdated={(updated) => setUserProfile(updated)}
          />
        )}

        {/* Real-time Multiplayer & Solo Cyber Pong */}
        {activeView === 'pong' && (
          <CyberPong
            onBack={handleBackToDashboard}
            profile={userProfile}
            initialRoomData={activeRoomData}
            role={activeRole}
            onProfileUpdated={(updated) => setUserProfile(updated)}
          />
        )}
      </main>

      {/* Multiplayer Room Creation & Lobby Browser Modal */}
      <LobbyModal
        isOpen={isLobbyOpen}
        onClose={() => setIsLobbyOpen(false)}
        profile={userProfile}
        initialGameType={lobbyGameType}
        onRoomJoined={handleRoomJoined}
      />

      {/* Profile & Nickname Customization Modal */}
      <ProfileModal
        profile={userProfile}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onSave={(updated) => {
          setUserProfile(updated);
          loadStats();
        }}
      />

      {/* First Launch Welcome & Nickname Choice Modal */}
      <WelcomeOnboardingModal
        isOpen={isWelcomeOpen}
        currentProfile={userProfile}
        invitationRoomCode={pendingJoinCode}
        onComplete={handleWelcomeComplete}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 text-center text-xs text-slate-500">
        <p>Walboy The King &bull; Salons Multijoueurs &amp; Arcade Hub &bull; AI Studio</p>
      </footer>
    </div>
  );
};

export default App;
