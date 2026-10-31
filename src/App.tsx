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
import { getStorageData } from './utils/storage';
import { getUserProfile, UserProfile } from './utils/userProfile';
import { sounds } from './utils/audio';
import { socket } from './utils/socket';

type ActiveView = 'dashboard' | 'runner' | 'shooter' | 'snake' | 'tile' | 'hockey' | 'pong';

export const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [storageData, setStorageData] = useState(getStorageData());
  const [userProfile, setUserProfile] = useState<UserProfile>(getUserProfile());
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLobbyOpen, setIsLobbyOpen] = useState(false);
  const [lobbyGameType, setLobbyGameType] = useState<'hockey' | 'pong'>('hockey');
  const [activeRoomData, setActiveRoomData] = useState<any>(null);
  const [activeRole, setActiveRole] = useState<string>('player1');

  useEffect(() => {
    // Auto initialize WebSocket connection in background
    socket.connect();
  }, []);

  const refreshData = () => {
    setStorageData(getStorageData());
    setUserProfile(getUserProfile());
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
    refreshData();
    setActiveView('dashboard');
  };

  const handleOpenLobby = (gameType: 'hockey' | 'pong' = 'hockey') => {
    setLobbyGameType(gameType);
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
            onOpenProfile={() => setIsProfileOpen(true)}
            profile={userProfile}
            highScores={storageData.scores}
            history={storageData.history}
            achievements={storageData.achievements}
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
        onSave={(updated) => setUserProfile(updated)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 text-center text-xs text-slate-500">
        <p>Walboy The King &bull; Salons Multijoueurs &amp; Arcade Hub &bull; AI Studio</p>
      </footer>
    </div>
  );
};

export default App;
