import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

// Determine backend URL
// Priority: 1) Environment variable, 2) Production fallback, 3) Localhost for dev
const getBackendURL = () => {
  // If environment variable is set, use it
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  
  // In production (Vercel), always use production backend
  if (import.meta.env.PROD || window.location.hostname !== 'localhost') {
    return "https://omegal-50vd.onrender.com";
  }
  
  // Only use localhost in local development
  return "http://localhost:3000";
};

const URL = getBackendURL();

// Always log the URL being used for debugging
console.log("🔗 Connecting to backend:", URL);
console.log("📦 VITE_BACKEND_URL env var:", import.meta.env.VITE_BACKEND_URL || "NOT SET - using fallback");
console.log("🌍 Production mode:", import.meta.env.PROD);
console.log("🌐 Hostname:", window.location.hostname);

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
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const sendingPcRef = useRef<RTCPeerConnection | null>(null);
    const receivingPcRef = useRef<RTCPeerConnection | null>(null);
    const remoteStreamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        const socket = io(URL);
        
        // Emit join event when socket connects
        socket.on("connect", () => {
            console.log("Connected to server, joining room as:", name);
            socket.emit("join", { name });
        });
        
        socket.on('send-offer', async ({roomId}) => {
            console.log("sending offer");
            setLobby(false);
            const pc = new RTCPeerConnection();

            sendingPcRef.current = pc;
            if (localVideoTrack) {
                console.error("added tack");
                console.log(localVideoTrack)
                pc.addTrack(localVideoTrack)
            }
            if (localAudioTrack) {
                console.error("added tack");
                console.log(localAudioTrack)
                pc.addTrack(localAudioTrack)
            }

            pc.onicecandidate = async (e) => {
                console.log("receiving ice candidate locally");
                if (e.candidate) {
                   socket.emit("add-ice-candidate", {
                    candidate: e.candidate,
                    type: "sender",
                    roomId
                   })
                }
            }

            pc.onnegotiationneeded = async () => {
                console.log("on negotiation neeeded, sending offer");
                const sdp = await pc.createOffer();
                //@ts-ignore
                pc.setLocalDescription(sdp)
                socket.emit("offer", {
                    sdp,
                    roomId
                })
            }
        });

            socket.on("offer", async ({roomId, sdp: remoteSdp}) => {
            console.log("received offer");
            setLobby(false);
            const pc = new RTCPeerConnection();
            pc.setRemoteDescription(remoteSdp)
            const sdp = await pc.createAnswer();
            //@ts-ignore
            pc.setLocalDescription(sdp)
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
                if (!e.candidate) {
                    return;
                }
                console.log("omn ice candidate on receiving seide");
                if (e.candidate) {
                   socket.emit("add-ice-candidate", {
                    candidate: e.candidate,
                    type: "receiver",
                    roomId
                   })
                }
            }

            socket.emit("answer", {
                roomId,
                sdp: sdp
            });
            setTimeout(() => {
                const track1 = pc.getTransceivers()[0]?.receiver.track;
                const track2 = pc.getTransceivers()[1]?.receiver.track;

                if (!track1 || !track2 || !remoteVideoRef.current) {
                    return;
                }

                const stream = (remoteVideoRef.current.srcObject as MediaStream) ?? new MediaStream();
                if (!remoteVideoRef.current.srcObject) {
                    remoteVideoRef.current.srcObject = stream;
                }
                stream.addTrack(track1);
                stream.addTrack(track2);
                remoteVideoRef.current.play().catch(() => null);
            }, 5000)
        });

        socket.on("answer", ({ sdp: remoteSdp }) => {
            setLobby(false);
            sendingPcRef.current?.setRemoteDescription(remoteSdp);
            console.log("loop closed");
        })

        socket.on("lobby", () => {
            setLobby(true);
        })

        socket.on("add-ice-candidate", ({candidate, type}) => {
            console.log("add ice candidate from remote");
            console.log({candidate, type})
            if (type === "sender") {
                receivingPcRef.current?.addIceCandidate(candidate);
            } else {
                sendingPcRef.current?.addIceCandidate(candidate);
            }
        })

        return () => {
            socket.disconnect();
        };

    }, [name])

    useEffect(() => {
        if (localVideoRef.current && localVideoTrack) {
            localVideoRef.current.srcObject = new MediaStream([localVideoTrack]);
            localVideoRef.current.play().catch(() => null);
        }
    }, [localVideoTrack])

    return (
        <main className="page page--room">
            <section className="room">
                <header className="room-header">
                    <div>
                        <p className="eyebrow">Connected as</p>
                        <h2>{name || "Guest"}</h2>
                    </div>
                    <span className={`status-pill ${lobby ? "status-pill--idle" : "status-pill--live"}`}>
                        {lobby ? "Matching…" : "Live"}
                    </span>
                </header>

                <div className="video-grid">
                    <div className="video-tile">
                        <div className="video-label">You</div>
                        <div className="video-shell">
                            <video
                                autoPlay
                                muted
                                playsInline
                                ref={localVideoRef}
                                className="video-player"
                            />
                        </div>
                    </div>

                    <div className="video-tile">
                        <div className="video-label">{lobby ? "Looking…" : "Stranger"}</div>
                        <div className="video-shell remote-shell">
                            <video
                                autoPlay
                                playsInline
                                ref={remoteVideoRef}
                                className="video-player"
                            />
                            {lobby && (
                                <div className="video-overlay">
                                    <span>Waiting for someone to join</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}