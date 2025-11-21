import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Room } from "./Room";

export const Landing = () => {
    const [name, setName] = useState("");
    const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null);
    const [localVideoTrack, setlocalVideoTrack] = useState<MediaStreamTrack | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [joined, setJoined] = useState(false);
    const [isLoadingCam, setIsLoadingCam] = useState(true);
    const [camError, setCamError] = useState<string | null>(null);

    const getCam = async () => {
        try {
            setIsLoadingCam(true);
            setCamError(null);
            const stream = await window.navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: "user"
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            streamRef.current = stream;

            const audioTrack = stream.getAudioTracks()[0];
            const videoTrack = stream.getVideoTracks()[0];

            setLocalAudioTrack(audioTrack);
            setlocalVideoTrack(videoTrack);

            if (videoRef.current && videoTrack) {
                videoRef.current.srcObject = new MediaStream([videoTrack]);
                await videoRef.current.play();
            }
        } catch (error: any) {
            console.error("Unable to start camera", error);
            if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
                setCamError("Camera and microphone access is required. Please allow access and refresh the page.");
            } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
                setCamError("No camera or microphone found. Please connect a device and try again.");
            } else {
                setCamError("We couldn't access your camera. Please check your device permissions and try again.");
            }
        } finally {
            setIsLoadingCam(false);
        }
    };

    useEffect(() => {
        getCam();

        return () => {
            streamRef.current?.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleJoin = (event?: FormEvent) => {
        event?.preventDefault();
        if (!name.trim()) {
            return;
        }
        if (!localVideoTrack && !camError) {
            setCamError("Please wait for camera to initialize...");
            return;
        }
        setJoined(true);
    };

    if (!joined) {
    return (
        <main className="page page--landing">
            <section className="landing-card">
                <div className="landing-header">
                    <h1 className="landing-title">
                        <span className="title-icon">💬</span>
                        Omegal Live
                    </h1>
                    <p className="landing-subtitle">
                        Connect with people from around the world through anonymous video chats
                    </p>
                </div>

                <div className="video-stack">
                    <div className="eyebrow">Camera Preview</div>
                    <div className="video-shell">
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="video-player"
                        />
                        {isLoadingCam && (
                            <div className="video-overlay">
                                <div className="loading-spinner"></div>
                                <span>Starting your camera...</span>
                            </div>
                        )}
                        {!isLoadingCam && !localVideoTrack && (
                            <div className="video-overlay video-overlay--error">
                                <span className="error-icon">⚠️</span>
                                <span>Camera access needed</span>
                                <button className="retry-btn" onClick={getCam}>
                                    Try Again
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <form className="landing-form" onSubmit={handleJoin}>
                    <label className="field">
                        <span className="field-label">What should we call you?</span>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name (e.g. Alex)"
                            className="text-input"
                            type="text"
                            maxLength={20}
                            autoComplete="off"
                        />
                    </label>

                    {camError && (
                        <div className="form-error">
                            <span>⚠️</span>
                            <span>{camError}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="primary-btn"
                        disabled={!name.trim() || isLoadingCam || (!localVideoTrack && !camError)}
                    >
                        {isLoadingCam ? (
                            <>
                                <span className="btn-spinner"></span>
                                Starting camera...
                            </>
                        ) : (
                            <>
                                <span></span>
                                Start Chatting
                            </>
                        )}
                    </button>
                    
                    <div className="hint-box">
                        <p className="hint">
                            💡 <strong>Privacy first:</strong> Your camera preview stays local until you connect with someone. You can mute or leave anytime.
                        </p>
                    </div>
                </form>
            </section>
        </main>
    );
    }

    return <Room name={name} localAudioTrack={localAudioTrack} localVideoTrack={localVideoTrack} />
}
