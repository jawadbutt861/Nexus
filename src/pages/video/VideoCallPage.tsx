import React, { useState, useRef, useEffect } from 'react';
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, Monitor, MonitorOff,
  Phone, Users, MessageCircle
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { users } from '../../data/users';
import { Card, CardBody } from '../../components/ui/Card';
import toast from 'react-hot-toast';

export const VideoCallPage: React.FC = () => {
  const { user } = useAuth();
  const [inCall, setInCall] = useState(false);
  const [videoOn, setVideoOn] = useState(true);
  const [audioOn, setAudioOn] = useState(true);
  const [screenShare, setScreenShare] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [selectedPeer, setSelectedPeer] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const peers = users.filter(u => u.id !== user?.id).slice(0, 4);

  useEffect(() => {
    if (inCall) {
      timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCallDuration(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [inCall]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const startCall = (peerId: string) => {
    setSelectedPeer(peerId);
    setInCall(true);
    setVideoOn(true);
    setAudioOn(true);
    setScreenShare(false);
    toast.success('Call connected (mock)');
  };

  const endCall = () => {
    setInCall(false);
    setSelectedPeer(null);
    toast('Call ended · ' + formatDuration(callDuration), { icon: '📞' });
  };

  const toggleScreenShare = () => {
    setScreenShare(s => !s);
    toast(screenShare ? 'Screen share stopped' : 'Screen share started (mock)');
  };

  const peer = users.find(u => u.id === selectedPeer);

  if (inCall && peer) {
    return (
      <div className="animate-fade-in space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Video Call</h1>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-mono">
            {formatDuration(callDuration)}
          </span>
        </div>

        {/* Main video area */}
        <div className="relative bg-gray-900 rounded-2xl overflow-hidden" style={{ height: '420px' }}>
          {/* Remote video (mock) */}
          <div className="absolute inset-0 flex items-center justify-center">
            {screenShare ? (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <div className="text-center text-white">
                  <Monitor size={64} className="mx-auto mb-3 text-gray-400" />
                  <p className="text-lg font-medium">Screen sharing active</p>
                  <p className="text-sm text-gray-400">Your screen is being shared</p>
                </div>
              </div>
            ) : (
              <div className="text-center text-white">
                <Avatar src={peer.avatarUrl} alt={peer.name} size="xl" className="mx-auto mb-3" />
                <p className="text-xl font-semibold">{peer.name}</p>
                <p className="text-sm text-gray-400 capitalize">{peer.role}</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-green-400">Connected</span>
                </div>
              </div>
            )}
          </div>

          {/* Self video (PiP) */}
          <div className="absolute bottom-4 right-4 w-32 h-24 bg-gray-700 rounded-lg overflow-hidden border-2 border-gray-600 flex items-center justify-center">
            {videoOn ? (
              <div className="text-center text-white">
                <Avatar src={user?.avatarUrl || ''} alt={user?.name || ''} size="md" className="mx-auto" />
                <p className="text-xs mt-1 text-gray-300">You</p>
              </div>
            ) : (
              <div className="text-center text-white">
                <VideoOff size={20} className="mx-auto text-gray-400" />
                <p className="text-xs mt-1 text-gray-400">Camera off</p>
              </div>
            )}
          </div>

          {/* Status indicators */}
          <div className="absolute top-4 left-4 flex gap-2">
            {!audioOn && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <MicOff size={12} /> Muted
              </span>
            )}
            {screenShare && (
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <Monitor size={12} /> Sharing
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 py-2">
          <button
            onClick={() => setAudioOn(a => !a)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${audioOn ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' : 'bg-red-500 hover:bg-red-600 text-white'}`}
            title={audioOn ? 'Mute' : 'Unmute'}
          >
            {audioOn ? <Mic size={20} /> : <MicOff size={20} />}
          </button>

          <button
            onClick={() => setVideoOn(v => !v)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${videoOn ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' : 'bg-red-500 hover:bg-red-600 text-white'}`}
            title={videoOn ? 'Turn off camera' : 'Turn on camera'}
          >
            {videoOn ? <Video size={20} /> : <VideoOff size={20} />}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${screenShare ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
            title={screenShare ? 'Stop sharing' : 'Share screen'}
          >
            {screenShare ? <MonitorOff size={20} /> : <Monitor size={20} />}
          </button>

          <button
            onClick={endCall}
            className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-lg"
            title="End call"
          >
            <PhoneOff size={22} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Video Calls</h1>
        <p className="text-gray-600">Start a video call with your connections</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {peers.map(peer => (
          <Card key={peer.id} hoverable>
            <CardBody>
              <div className="flex items-center gap-3 mb-4">
                <Avatar src={peer.avatarUrl} alt={peer.name} size="lg" status={peer.isOnline ? 'online' : 'offline'} />
                <div>
                  <p className="font-semibold text-gray-900">{peer.name}</p>
                  <p className="text-sm text-gray-500 capitalize">{peer.role}</p>
                  <p className="text-xs text-gray-400">{peer.isOnline ? 'Online' : 'Offline'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  fullWidth
                  leftIcon={<Video size={16} />}
                  onClick={() => startCall(peer.id)}
                >
                  Video Call
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Phone size={16} />}
                  onClick={() => { setSelectedPeer(peer.id); setVideoOn(false); setInCall(true); }}
                >
                  Audio
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardBody>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Users size={18} className="text-primary-500" />
            <span>Video calls are end-to-end encrypted via WebRTC. This is a frontend mock — real calls require a signaling server.</span>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
