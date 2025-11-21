import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

// Determine backend URL at runtime
const getBackendURL = () => {
  const envUrl = import.meta.env.VITE_BACKEND_URL;
  if (envUrl) {
    return envUrl;
  }
  
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1' ||
     window.location.hostname === '');
  
  if (isLocalhost) {
    return "http://localhost:3000";
  }
  
  return "https://omegal-50vd.onrender.com";
};

const URL = getBackendURL();

export const Room = ({
    name,
    localAudioTrack,
    localVideoTrack
}: {
    name: string,
    localAudioTrack: MediaStreamTrack | null,
    localVideoTrack: MediaStreamTrack | null,
}) => {
    const [lobby, setLobby] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [remoteUserName, setRemoteUserName] = useState<string | null>(null);
    
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const sendingPcRef = useRef<RTCPeerConnection | null>(null);
    const receivingPcRef = useRef<RTCPeerConnection | null>(null);
    const remoteStreamRef = useRef<MediaStream | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const roomIdRef = useRef<string | null>(null);

    useEffect(() => {
        const socket = io(URL, {
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });
        
        socketRef.current = socket;
        
        socket.on("connect", () => {
            console.log("✅ Connected to server, joining room as:", name);
            setIsConnected(true);
            setConnectionError(null);
            socket.emit("join", { name });
        });

        socket.on("connect_error", (error) => {
            console.error("❌ Connection error:", error);
            setConnectionError("Failed to connect to server. Please check your connection.");
            setIsConnected(false);
        });

        socket.on("disconnect", (reason) => {
            console.log("⚠️ Disconnected:", reason);
            setIsConnected(false);
            if (reason === "io server disconnect") {
                setConnectionError("Disconnected from server. Please refresh the page.");
            }
        });
        
        socket.on('send-offer', async ({roomId}) => {
            console.log("📤 Sending offer for room:", roomId);
            setLobby(false);
            roomIdRef.current = roomId;
            
            const pc = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            });

            sendingPcRef.current = pc;
            
            if (localVideoTrack && !isVideoOff) {
                pc.addTrack(localVideoTrack);
            }
            if (localAudioTrack && !isMuted) {
                pc.addTrack(localAudioTrack);
            }

            pc.onicecandidate = async (e) => {
                if (e.candidate && socket.connected) {
                   socket.emit("add-ice-candidate", {
                    candidate: e.candidate,
                    type: "sender",
                    roomId
                   });
                }
            };

            pc.onnegotiationneeded = async () => {
                try {
                    console.log("🔄 Negotiation needed, creating offer");
                    const sdp = await pc.createOffer();
                    await pc.setLocalDescription(sdp);
                    socket.emit("offer", {
                        sdp,
                        roomId
                    });
                } catch (error) {
                    console.error("Error creating offer:", error);
                }
            };

            pc.onconnectionstatechange = () => {
                console.log("Connection state:", pc.connectionState);
                if (pc.connectionState === "failed") {
                    setConnectionError("Connection failed. Trying to reconnect...");
                }
            };
        });

        socket.on("offer", async ({roomId, sdp: remoteSdp}) => {
            console.log("📥 Received offer for room:", roomId);
            setLobby(false);
            roomIdRef.current = roomId;
            
            const pc = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            });
            
            try {
                await pc.setRemoteDescription(remoteSdp);
                const sdp = await pc.createAnswer();
                await pc.setLocalDescription(sdp);
                
                const stream = new MediaStream();
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = stream;
                }

                remoteStreamRef.current = stream;
                receivingPcRef.current = pc;
                
                pc.ontrack = (event) => {
                    const nextStream = remoteStreamRef.current ?? new MediaStream();
                    nextStream.addTrack(event.track);
                    remoteStreamRef.current = nextStream;
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = nextStream;
                        remoteVideoRef.current.play().catch(() => null);
                    }
                };

                pc.onicecandidate = async (e) => {
                    if (e.candidate && socket.connected) {
                       socket.emit("add-ice-candidate", {
                        candidate: e.candidate,
                        type: "receiver",
                        roomId
                       });
                    }
                };

                socket.emit("answer", {
                    roomId,
                    sdp: sdp
                });
            } catch (error) {
                console.error("Error handling offer:", error);
                setConnectionError("Failed to establish connection. Please try again.");
            }
        });

        socket.on("answer", ({ sdp: remoteSdp }) => {
            console.log("✅ Received answer");
            setLobby(false);
            sendingPcRef.current?.setRemoteDescription(remoteSdp).catch((error) => {
                console.error("Error setting remote description:", error);
            });
        });

        socket.on("lobby", () => {
            console.log("🏠 Back in lobby");
            setLobby(true);
            setRemoteUserName(null);
        });

        socket.on("add-ice-candidate", ({candidate, type}) => {
            if (type === "sender") {
                receivingPcRef.current?.addIceCandidate(candidate).catch(() => null);
            } else {
                sendingPcRef.current?.addIceCandidate(candidate).catch(() => null);
            }
        });

        return () => {
            socket.disconnect();
            sendingPcRef.current?.close();
            receivingPcRef.current?.close();
        };

    }, [name, isMuted, isVideoOff]);

    useEffect(() => {
        if (localVideoRef.current && localVideoTrack) {
            const stream = new MediaStream([localVideoTrack]);
            localVideoRef.current.srcObject = stream;
            localVideoRef.current.play().catch(() => null);
        }
    }, [localVideoTrack]);

    // Update tracks when mute/video state changes
    useEffect(() => {
        if (sendingPcRef.current) {
            if (localAudioTrack) {
                const sender = sendingPcRef.current.getSenders().find(s => 
                    s.track?.kind === 'audio'
                );
                if (sender) {
                    sender.track!.enabled = !isMuted;
                }
            }
        }
    }, [isMuted, localAudioTrack]);

    useEffect(() => {
        if (sendingPcRef.current) {
            if (localVideoTrack) {
                const sender = sendingPcRef.current.getSenders().find(s => 
                    s.track?.kind === 'video'
                );
                if (sender) {
                    sender.track!.enabled = !isVideoOff;
                }
            }
        }
    }, [isVideoOff, localVideoTrack]);

    const handleMuteToggle = () => {
        setIsMuted(!isMuted);
        if (localAudioTrack) {
            localAudioTrack.enabled = isMuted;
        }
    };

    const handleVideoToggle = () => {
        setIsVideoOff(!isVideoOff);
        if (localVideoTrack) {
            localVideoTrack.enabled = isVideoOff;
        }
    };

    const handleLeave = () => {
        if (socketRef.current) {
            socketRef.current.disconnect();
        }
        sendingPcRef.current?.close();
        receivingPcRef.current?.close();
        window.location.reload();
    };

    return (
        <main className="page page--room">
            <section className="room">
                <header className="room-header">
                    <div className="room-header-info">
                        <p className="eyebrow">Connected as</p>
                        <h2>{name || "Guest"}</h2>
                    </div>
                    <div className="room-header-status">
                        <span className={`status-pill ${lobby ? "status-pill--idle" : "status-pill--live"}`}>
                            {lobby ? (
                                <>
                                    <span className="status-dot"></span>
                                    Finding someone...
                                </>
                            ) : (
                                <>
                                    <span className="status-dot status-dot--live"></span>
                                    Connected
                                </>
                            )}
                        </span>
                        {!isConnected && (
                            <span className="status-pill status-pill--error">
                                <span className="status-dot status-dot--error"></span>
                                Disconnected
                            </span>
                        )}
                    </div>
                </header>

                {connectionError && (
                    <div className="error-banner">
                        <span>⚠️</span>
                        <span>{connectionError}</span>
                    </div>
                )}

                <div className="video-grid">
                    <div className="video-tile">
                        <div className="video-label">
                            <span>You</span>
                            {isMuted && <span className="mute-indicator">🔇</span>}
                            {isVideoOff && <span className="video-off-indicator">📷</span>}
                        </div>
                        <div className="video-shell">
                            <video
                                autoPlay
                                muted
                                playsInline
                                ref={localVideoRef}
                                className="video-player"
                            />
                            {isVideoOff && (
                                <div className="video-overlay video-overlay--black">
                                    <div className="video-placeholder">
                                        <span className="placeholder-icon">👤</span>
                                        <span>Camera off</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="video-tile">
                        <div className="video-label">
                            {lobby ? "Waiting..." : (remoteUserName || "Stranger")}
                        </div>
                        <div className="video-shell remote-shell">
                            <video
                                autoPlay
                                playsInline
                                ref={remoteVideoRef}
                                className="video-player"
                            />
                            {lobby && (
                                <div className="video-overlay">
                                    <div className="lobby-animation">
                                        <div className="spinner"></div>
                                        <span>Looking for someone to chat with...</span>
                                        <p className="lobby-hint">This usually takes just a few seconds</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="room-controls">
                    <button 
                        className={`control-btn ${isMuted ? 'control-btn--active' : ''}`}
                        onClick={handleMuteToggle}
                        title={isMuted ? "Unmute" : "Mute"}
                    >
                        {isMuted ? "🔇" : "🎤"}
                        <span>{isMuted ? "Unmute" : "Mute"}</span>
                    </button>
                    
                    <button 
                        className={`control-btn ${isVideoOff ? 'control-btn--active' : ''}`}
                        onClick={handleVideoToggle}
                        title={isVideoOff ? "Turn on camera" : "Turn off camera"}
                    >
                        {isVideoOff ? "📷" : "📹"}
                        <span>{isVideoOff ? "Camera On" : "Camera Off"}</span>
                    </button>
                    
                    <button 
                        className="control-btn control-btn--danger"
                        onClick={handleLeave}
                        title="Leave room"
                    >
                        🚪
                        <span>Leave</span>
                    </button>
                </div>
            </section>
        </main>
    );
};
