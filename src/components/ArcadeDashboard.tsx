import React from 'react';
import { 
  Gamepad2, 
  Rocket, 
  Sparkles, 
  Layers, 
  Trophy, 
  Zap, 
  Flame, 
  Volume2, 
  VolumeX, 
  Coins, 
  Award,
  ChevronRight,
  History,
  Users,
  User,
  Plus,
  Play
} from 'lucide-react';
import { GameRecord, Achievement } from '../utils/storage';
import { UserProfile } from '../utils/userProfile';

interface ArcadeDashboardProps {
  onSelectGame: (gameId: 'runner' | 'shooter' | 'snake' | 'tile' | 'hockey' | 'pong') => void;
  onOpenMultiplayerLobby: (preferredGame?: 'hockey' | 'pong') => void;
  onOpenProfile: () => void;
  profile: UserProfile;
  highScores: Record<string, number>;
  history: GameRecord[];
  achievements: Achievement[];
  coins: number;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const ArcadeDashboard: React.FC<ArcadeDashboardProps> = ({
  onSelectGame,
  onOpenMultiplayerLobby,
  onOpenProfile,
  profile,
  highScores,
  history,
  achievements,
  coins,
  isMuted,
  onToggleMute,
}) => {
  const soloGames = [
    {
      id: 'runner' as const,
      title: 'Cyber Dash',
      tagline: 'Endless Synthwave Cyber Runner',
      desc: 'Sprint through cyberspace, leap over laser pylons, and slide under rogue attack drones.',
      icon: Zap,
      color: 'from-cyan-500 to-indigo-600',
      badge: 'HIGH SPEED',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      highScore: highScores['runner'] || 0,
    },
    {
      id: 'shooter' as const,
      title: 'Galaxy Defender',
      tagline: 'Retro Arcade Starfighter',
      desc: 'Deploy your starfighter, obliterate alien cruisers, dodge asteroids, and upgrade plasma weapons.',
      icon: Rocket,
      color: 'from-blue-600 to-cyan-500',
      badge: 'ACTION SHOT',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      highScore: highScores['shooter'] || 0,
    },
    {
      id: 'snake' as const,
      title: 'Neon Snake',
      tagline: 'Cyber Grid Slither',
      desc: 'Maneuver through neon matrix grids, consume gold energy, and activate quantum ghost phasing.',
      icon: Sparkles,
      color: 'from-emerald-500 to-teal-600',
      badge: 'CLASSIC',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      highScore: highScores['snake'] || 0,
    },
    {
      id: 'tile' as const,
      title: 'Quantum Fusion',
      tagline: '2048 Energy Merging',
      desc: 'Slide and synthesize matching isotope blocks together to forge the ultimate 2048 quantum core.',
      icon: Layers,
      color: 'from-indigo-500 to-purple-600',
      badge: 'PUZZLE',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      highScore: highScores['tile'] || 0,
    },
  ];

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-10">
      {/* Top Banner & Profile Bar */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-slate-800 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold tracking-wider uppercase">
              <Gamepad2 className="w-4 h-4" /> Walboy The King Arcade
            </div>
            <h1 className="text-3xl sm:text-5xl font-black font-arcade text-white tracking-wide">
              RETRO &amp; ARCADE <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400">HUB</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
              Arène multijoueur en temps réel et classiques de l'arcade. Créez un salon, défiez vos amis en duel ou jouez en solo contre l'IA.
            </p>
          </div>

          {/* Player Profile & Stats Card */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Interactive Player Profile Badge */}
            <div
              onClick={onOpenProfile}
              className="group cursor-pointer flex items-center gap-3.5 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-3.5 shadow-lg transition"
              title="Cliquez pour modifier votre pseudo ou avatar"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/30 to-cyan-500/30 border border-indigo-500/40 flex items-center justify-center text-2xl group-hover:scale-105 transition transform">
                {profile.avatar}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold font-arcade text-white group-hover:text-cyan-400 text-sm sm:text-base transition">
                    {profile.username}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {profile.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                  <span>V: <b className="text-emerald-400">{profile.stats.wins}</b></span>
                  <span>&bull;</span>
                  <span>D: <b className="text-rose-400">{profile.stats.losses}</b></span>
                  <span>&bull;</span>
                  <span className="text-[11px] text-cyan-400 underline underline-offset-2">Modifier</span>
                </div>
              </div>
            </div>

            {/* Global Controls & Coins */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2.5 bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-3 shadow-lg">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Pièces</span>
                  <span className="text-base font-bold font-arcade text-amber-300">{coins}</span>
                </div>
              </div>

              <button
                onClick={onToggleMute}
                className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition shadow-lg"
                title="Activer/Désactiver le son"
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
              </button>
            </div>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-cyan-600/20 blur-3xl pointer-events-none" />
      </div>

      {/* MULTIPLAYER HIGHLIGHT SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-arcade text-white flex items-center gap-2">
                ARÈNE MULTIJOUEUR <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold uppercase">TEMPS RÉEL</span>
              </h2>
              <p className="text-xs text-slate-400">Créez un salon ou rejoignez un ami avec un simple code de salon</p>
            </div>
          </div>

          <button
            onClick={() => onOpenMultiplayerLobby()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-white font-bold font-arcade text-xs sm:text-sm shadow-lg shadow-cyan-500/20 transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" /> Rejoindre / Créer Salon
          </button>
        </div>

        {/* Two Featured Multiplayer Games */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Neon Air Hockey Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950 border-2 border-cyan-500/40 p-6 shadow-2xl flex flex-col justify-between group hover:border-cyan-400 transition-all duration-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3.5 rounded-2xl bg-cyan-500/20 text-cyan-300 text-3xl shadow-lg shadow-cyan-500/20">
                    🏒
                  </div>
                  <div>
                    <h3 className="text-2xl font-black font-arcade text-white group-hover:text-cyan-300 transition-colors">
                      Neon Air Hockey
                    </h3>
                    <span className="text-xs font-semibold text-cyan-400">DUEL ULTRA RÉACTIF &bull; 1v1</span>
                  </div>
                </div>

                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  TOP CHOIX
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Le grand classique de la compétition d'arcade ! Glissez votre maillet lumineux, donnez de l'impulsion au palet, faites rebondir sur les rails néon et marquez dans le but adverse.
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                <span className="bg-slate-950/70 p-2 rounded-xl border border-slate-800 text-center">
                  ⚡ Physique en temps réel
                </span>
                <span className="bg-slate-950/70 p-2 rounded-xl border border-slate-800 text-center">
                  🎯 Premier à 5 buts
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => onOpenMultiplayerLobby('hockey')}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold font-arcade text-xs shadow-lg shadow-cyan-500/20 transition transform active:scale-95"
              >
                <Users className="w-4 h-4" /> JOUER EN SALON MULTI
              </button>
              <button
                onClick={() => onSelectGame('hockey')}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold font-arcade text-xs border border-slate-700 transition"
              >
                <Play className="w-3.5 h-3.5" /> Entraînement vs IA
              </button>
            </div>
          </div>

          {/* Cyber Pong Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950 border-2 border-indigo-500/40 p-6 shadow-2xl flex flex-col justify-between group hover:border-indigo-400 transition-all duration-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3.5 rounded-2xl bg-indigo-500/20 text-indigo-300 text-3xl shadow-lg shadow-indigo-500/20">
                    🏓
                  </div>
                  <div>
                    <h3 className="text-2xl font-black font-arcade text-white group-hover:text-indigo-300 transition-colors">
                      Cyber Pong
                    </h3>
                    <span className="text-xs font-semibold text-indigo-400">SYNCHRO RÉSEAU &bull; 1v1</span>
                  </div>
                </div>

                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  CLASSIQUE
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Le duel de réflexes par excellence ! Contrôlez votre raquette de haute précision, appliquez des effets d'angle et défendez votre ligne de but pour décrocher la victoire à 5 points.
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                <span className="bg-slate-950/70 p-2 rounded-xl border border-slate-800 text-center">
                  🎮 Contrôles tactiles &amp; clavier
                </span>
                <span className="bg-slate-950/70 p-2 rounded-xl border border-slate-800 text-center">
                  💥 Accélération des échanges
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => onOpenMultiplayerLobby('pong')}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold font-arcade text-xs shadow-lg shadow-indigo-500/20 transition transform active:scale-95"
              >
                <Users className="w-4 h-4" /> JOUER EN SALON MULTI
              </button>
              <button
                onClick={() => onSelectGame('pong')}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold font-arcade text-xs border border-slate-700 transition"
              >
                <Play className="w-3.5 h-3.5" /> Entraînement vs IA
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SOLO ARCADE GAMES GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold font-arcade text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" /> JEUX SOLO D'ARCADE
          </h2>
          <span className="text-xs text-slate-400">4 Défis Solo</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {soloGames.map(game => {
            const Icon = game.icon;
            return (
              <div
                key={game.id}
                onClick={() => onSelectGame(game.id)}
                className="group relative overflow-hidden rounded-2xl bg-slate-900/70 border border-slate-800/90 hover:border-indigo-500/60 p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${game.color} text-white shadow-lg`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${game.badgeColor}`}>
                      {game.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold font-arcade text-white group-hover:text-cyan-400 transition-colors">
                      {game.title}
                    </h3>
                    <p className="text-xs text-indigo-300/80 font-medium mt-0.5">{game.tagline}</p>
                    <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">{game.desc}</p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Record</span>
                    <span className="text-base font-bold font-arcade text-white">{game.highScore}</span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-bold font-arcade text-cyan-400 group-hover:translate-x-1 transition-transform">
                    LANCER LE JEU <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Grid: Achievements & Recent Runs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Achievements */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold font-arcade text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-400" /> SALON DES TROPHÉES
            </h3>
            <span className="text-xs text-slate-400">{unlockedCount} / {achievements.length} débloqués</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {achievements.map(ach => (
              <div
                key={ach.id}
                className={`p-3 rounded-xl border transition flex items-start gap-3 ${
                  ach.unlocked
                    ? 'bg-indigo-950/40 border-indigo-500/40 text-slate-200'
                    : 'bg-slate-950/40 border-slate-800/60 text-slate-500 opacity-60'
                }`}
              >
                <div className={`p-2 rounded-lg ${ach.unlocked ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-600'}`}>
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold font-arcade text-white">{ach.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{ach.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Game Runs */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold font-arcade text-white flex items-center gap-2">
              <History className="w-5 h-5 text-cyan-400" /> HISTORIQUE DES PARTIES
            </h3>
            <span className="text-xs text-slate-400">Derniers Scores</span>
          </div>

          {history.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              Aucune partie enregistrée. Lancez un jeu ci-dessus pour inscrire votre score !
            </div>
          ) : (
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {history.slice(0, 6).map(rec => {
                const gameName =
                  rec.gameId === 'runner'
                    ? 'Cyber Dash'
                    : rec.gameId === 'shooter'
                    ? 'Galaxy Defender'
                    : rec.gameId === 'snake'
                    ? 'Neon Snake'
                    : 'Quantum Fusion';

                return (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs"
                  >
                    <div>
                      <span className="font-bold font-arcade text-slate-200 block">{gameName}</span>
                      <span className="text-[10px] text-slate-500">{rec.date}</span>
                    </div>
                    <span className="text-sm font-bold font-arcade text-cyan-400">{rec.score} pts</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
