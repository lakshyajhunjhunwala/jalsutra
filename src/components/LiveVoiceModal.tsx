import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Radio,
  Sparkles,
  AlertCircle,
  Send,
  Loader2,
  Activity,
  Layers,
} from 'lucide-react';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInquireText?: (text: string) => void;
}

interface MessageItem {
  sender: 'user' | 'assistant';
  text: string;
  time: string;
}

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({ isOpen, onClose }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isUserTalking, setIsUserTalking] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Ready to connect to Gemini 3.8 Live API');
  const [error, setError] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<MessageItem[]>([]);
  const [textInput, setTextInput] = useState<string>('');
  const [voiceVolume, setVoiceVolume] = useState<number>(0);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const isMutedRef = useRef<boolean>(false);
  const scrollEndRef = useRef<HTMLDivElement | null>(null);

  // Keep ref in sync
  isMutedRef.current = isMuted;

  useEffect(() => {
    if (scrollEndRef.current) {
      scrollEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcripts]);

  // Clean up when modal closes or unmounts
  useEffect(() => {
    if (!isOpen) {
      disconnectLive();
    }
    return () => {
      disconnectLive();
    };
  }, [isOpen]);

  // Convert Float32Array to 16-bit PCM ArrayBuffer
  const floatTo16BitPCM = (input: Float32Array): ArrayBuffer => {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return output.buffer;
  };

  // Convert ArrayBuffer to base64
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Convert base64 to 24kHz AudioBuffer
  const base64ToAudioBuffer = (ctx: AudioContext, base64: string): AudioBuffer => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const int16Array = new Int16Array(bytes.buffer);
    const audioBuffer = ctx.createBuffer(1, int16Array.length, 24000);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < int16Array.length; i++) {
      channelData[i] = int16Array[i] / 32768.0;
    }
    return audioBuffer;
  };

  const stopAllScheduledAudio = () => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
      } catch (e) {}
    });
    activeSourcesRef.current = [];
    if (outputAudioCtxRef.current) {
      nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
    }
    setIsSpeaking(false);
  };

  const playAudioChunk = (base64Audio: string) => {
    if (!outputAudioCtxRef.current) {
      outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
    }
    const ctx = outputAudioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    try {
      const buffer = base64ToAudioBuffer(ctx, base64Audio);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      const currentTime = ctx.currentTime;
      // Schedule gapless playback
      const startTime = Math.max(currentTime, nextStartTimeRef.current);
      source.start(startTime);
      nextStartTimeRef.current = startTime + buffer.duration;

      activeSourcesRef.current.push(source);
      setIsSpeaking(true);

      source.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
        if (activeSourcesRef.current.length === 0) {
          setIsSpeaking(false);
        }
      };
    } catch (e) {
      console.error('Error decoding/playing audio chunk:', e);
    }
  };

  const connectLive = async () => {
    setError(null);
    setIsConnecting(true);
    setStatusMessage('Requesting microphone permissions and connecting to gemini-3.8-live...');

    try {
      // 1. Microphone setup at 16kHz
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
      inputAudioCtxRef.current = inputCtx;

      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
      outputAudioCtxRef.current = outputCtx;
      nextStartTimeRef.current = outputCtx.currentTime;

      // 2. Connect WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        setStatusMessage('Connected to Gemini 3.8 Live API. Speak naturally or type below.');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.status === 'connected') {
            setStatusMessage('Live Audio Channel Active with gemini-3.8-live');
          }

          if (msg.audio) {
            playAudioChunk(msg.audio);
          }

          if (msg.text) {
            setTranscripts((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.sender === 'assistant') {
                return [
                  ...prev.slice(0, -1),
                  { ...last, text: last.text + ' ' + msg.text },
                ];
              }
              return [
                ...prev,
                {
                  sender: 'assistant',
                  text: msg.text,
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ];
            });
          }

          if (msg.interrupted) {
            stopAllScheduledAudio();
            setStatusMessage('Interrupted. Listening to you...');
          }

          if (msg.error) {
            setError(msg.error);
            setStatusMessage('Error encountered in live session');
          }
        } catch (e) {
          console.error('Error handling WebSocket message:', e);
        }
      };

      ws.onerror = (err) => {
        console.error('Live WebSocket error:', err);
        setError('WebSocket connection error. Please verify server and API credentials.');
        setIsConnecting(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        setStatusMessage('Live session disconnected.');
      };

      // 3. Audio Processing Stream
      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (isMutedRef.current || ws.readyState !== WebSocket.OPEN) return;

        const channelData = e.inputBuffer.getChannelData(0);

        // Calculate simple volume level for visualizer
        let sum = 0;
        for (let i = 0; i < channelData.length; i++) {
          sum += Math.abs(channelData[i]);
        }
        const avg = sum / channelData.length;
        setVoiceVolume(Math.min(100, Math.round(avg * 400)));

        if (avg > 0.02) {
          setIsUserTalking(true);
        } else {
          setIsUserTalking(false);
        }

        const pcmBuffer = floatTo16BitPCM(channelData);
        const base64Audio = arrayBufferToBase64(pcmBuffer);

        ws.send(JSON.stringify({ audio: base64Audio }));
      };

      source.connect(processor);
      processor.connect(inputCtx.destination);
    } catch (err: any) {
      console.error('Failed to start Live Audio session:', err);
      setError(
        err.message?.includes('Permission denied')
          ? 'Microphone permission was denied. Please allow microphone access in your browser.'
          : err.message || 'Failed to initialize audio.'
      );
      setIsConnecting(false);
    }
  };

  const disconnectLive = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }
    stopAllScheduledAudio();
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setIsSpeaking(false);
    setIsUserTalking(false);
    setVoiceVolume(0);
    setStatusMessage('Live session ended.');
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    const userText = textInput.trim();
    setTextInput('');

    setTranscripts((prev) => [
      ...prev,
      {
        sender: 'user',
        text: userText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text: userText }));
    } else {
      // Connect first if not connected
      connectLive().then(() => {
        setTimeout(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ text: userText }));
          }
        }, 1200);
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FAF7F0] border border-[#D5CABB] rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E8E0D2] flex items-center justify-between bg-[#F4EDE1]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#8B3A1C] text-white flex items-center justify-center shadow-xs">
              <Radio className={`w-5 h-5 ${isConnected ? 'animate-pulse text-[#FFDD99]' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-lg text-[#251E17]">
                  Gemini 3.8 Live Voice Assistant
                </h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#E4DAC8] text-[#5A4D3F] border border-[#D0C4AF]">
                  gemini-3.8-live
                </span>
              </div>
              <p className="text-xs text-[#706253]">
                Real-time spoken dialogue with bidirectional 16kHz/24kHz streaming audio
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              disconnectLive();
              onClose();
            }}
            className="p-1.5 rounded-lg text-[#6B5E4F] hover:bg-[#E5DAC8] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Audio Visualizer Stage */}
        <div className="p-6 bg-gradient-to-b from-[#F2ECE0] to-[#FAF7F0] border-b border-[#E8E0D2] flex flex-col items-center justify-center text-center relative overflow-hidden">
          {/* Animated Waveform rings */}
          <div className="relative w-36 h-36 flex items-center justify-center mb-4">
            {/* Outer pulse */}
            <div
              className={`absolute inset-0 rounded-full border-2 transition-all duration-300 ${
                isSpeaking
                  ? 'border-[#8B3A1C]/40 animate-ping scale-110'
                  : isUserTalking
                  ? 'border-[#2D7349]/50 animate-ping'
                  : isConnected
                  ? 'border-[#8B3A1C]/20 scale-100'
                  : 'border-[#CFC4B2]'
              }`}
            />
            {/* Middle wave */}
            <div
              className={`absolute w-28 h-28 rounded-full border transition-all duration-200 ${
                isSpeaking
                  ? 'bg-[#8B3A1C]/15 border-[#8B3A1C]'
                  : isUserTalking
                  ? 'bg-[#2D7349]/15 border-[#2D7349]'
                  : isConnected
                  ? 'bg-[#E5DAC8] border-[#C4B7A0]'
                  : 'bg-[#EAE2D3] border-[#D4C8B5]'
              }`}
            />
            {/* Center action button */}
            <button
              onClick={() => {
                if (isConnected) {
                  disconnectLive();
                } else {
                  connectLive();
                }
              }}
              disabled={isConnecting}
              className={`relative z-10 w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer text-white font-medium ${
                isConnected
                  ? isSpeaking
                    ? 'bg-[#8B3A1C]'
                    : isUserTalking
                    ? 'bg-[#2D7349]'
                    : 'bg-[#8B3A1C]'
                  : 'bg-[#3D3227]'
              }`}
            >
              {isConnecting ? (
                <Loader2 className="w-7 h-7 animate-spin" />
              ) : isConnected ? (
                isSpeaking ? (
                  <Volume2 className="w-7 h-7 animate-bounce" />
                ) : (
                  <Mic className="w-7 h-7" />
                )
              ) : (
                <Mic className="w-7 h-7" />
              )}
              <span className="text-[10px] mt-1 tracking-tight">
                {isConnecting ? 'Linking...' : isConnected ? 'End Call' : 'Start Call'}
              </span>
            </button>
          </div>

          {/* Status Label */}
          <div className="flex items-center gap-2 text-xs font-medium text-[#483B2E]">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isSpeaking
                  ? 'bg-[#8B3A1C] animate-pulse'
                  : isUserTalking
                  ? 'bg-[#2D7349] animate-pulse'
                  : isConnected
                  ? 'bg-emerald-600'
                  : 'bg-stone-400'
              }`}
            />
            <span>{statusMessage}</span>
          </div>

          {/* Audio volume indicator bar */}
          {isConnected && (
            <div className="w-48 bg-[#E2D6C2] h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-75 ${
                  isSpeaking ? 'bg-[#8B3A1C]' : 'bg-[#2D7349]'
                }`}
                style={{ width: `${Math.max(8, voiceVolume)}%` }}
              />
            </div>
          )}

          {/* Controls toggle bar */}
          {isConnected && (
            <div className="flex items-center gap-3 mt-4 text-xs">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 font-medium border cursor-pointer transition-colors ${
                  isMuted
                    ? 'bg-[#FBEAEA] text-[#932424] border-[#E8BFBF]'
                    : 'bg-[#EAE1D1] text-[#44382B] border-[#D4C7B3] hover:bg-[#DFD4C2]'
                }`}
              >
                {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isMuted ? 'Mic Muted' : 'Mute Mic'}</span>
              </button>

              <button
                onClick={stopAllScheduledAudio}
                className="px-3 py-1.5 rounded-md flex items-center gap-1.5 font-medium border bg-[#EAE1D1] text-[#44382B] border-[#D4C7B3] hover:bg-[#DFD4C2] cursor-pointer transition-colors"
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span>Interrupt Speech</span>
              </button>
            </div>
          )}

          {error && (
            <div className="mt-3 p-2.5 bg-[#FDEEED] border border-[#ECC0BB] text-[#8C2314] rounded text-xs flex items-center gap-2 max-w-md">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Live Conversation Transcript Feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FAF7F0] min-h-[160px] max-h-[260px]">
          {transcripts.length === 0 ? (
            <div className="text-center py-6 text-xs text-[#7B6E5F] space-y-1">
              <p className="font-serif text-sm font-semibold text-[#3E3327]">
                Try saying or asking:
              </p>
              <p>“How did Chandragupta Maurya and Ashoka build the Sudarshana Lake dam?”</p>
              <p>“What is the 1369 CE Porumamilla tank inscription’s 12 hydraulic rules?”</p>
              <p>“Explain Kallanai Grand Anicut’s foundation on shifting Cauvery sand.”</p>
            </div>
          ) : (
            transcripts.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div className="flex items-center gap-1 text-[10px] text-[#7E7060] mb-0.5">
                  <span className="font-semibold capitalize">
                    {msg.sender === 'user' ? 'You' : 'Gemini 3.8 Live'}
                  </span>
                  <span>·</span>
                  <span>{msg.time}</span>
                </div>
                <div
                  className={`p-3 rounded-lg text-xs leading-relaxed max-w-[85%] ${
                    msg.sender === 'user'
                      ? 'bg-[#8B3A1C] text-white rounded-tr-none'
                      : 'bg-[#EDE4D5] text-[#28211A] rounded-tl-none border border-[#DECDB8]'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))
          )}
          <div ref={scrollEndRef} />
        </div>

        {/* Fallback Text Input Row for typing questions directly into Live stream */}
        <form
          onSubmit={handleSendText}
          className="p-3 border-t border-[#E8E0D2] bg-[#F4EDE1] flex items-center gap-2"
        >
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={
              isConnected
                ? 'Type to speak into live session or ask a question...'
                : 'Type here to connect and ask live assistant...'
            }
            className="flex-1 bg-white border border-[#D5CABB] rounded-lg px-3 py-2 text-xs text-[#2A2219] placeholder-[#9E9080] outline-none focus:border-[#8B3A1C]"
          />
          <button
            type="submit"
            disabled={!textInput.trim()}
            className="px-4 py-2 bg-[#8B3A1C] hover:bg-[#722E15] disabled:bg-[#C5BAAA] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
