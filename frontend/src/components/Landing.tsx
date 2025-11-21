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
            const stream = await window.navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            streamRef.current = stream;

            const audioTrack = stream.getAudioTracks()[0];
            const videoTrack = stream.getVideoTracks()[0];

            setCamError(null);
            setLocalAudioTrack(audioTrack);
            setlocalVideoTrack(videoTrack);

            if (videoRef.current && videoTrack) {
                videoRef.current.srcObject = new MediaStream([videoTrack]);
                await videoRef.current.play();
            }
        } catch (error) {
            console.error("Unable to start camera", error);
            setCamError("We couldn’t access your camera. Check permissions and try again.");
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
        setJoined(true);
    };

    if (!joined) {
    return (
        <main className="page page--landing">
            <section className="landing-card">
                <div className="video-stack">
                    <div className="eyebrow">Preview</div>
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
                                <span>Starting camera…</span>
                            </div>
                        )}
                        {!isLoadingCam && !localVideoTrack && (
                            <div className="video-overlay video-overlay--error">
                                <span>This preview needs camera access.</span>
                            </div>
                        )}
                    </div>
                </div>

                <form className="landing-form" onSubmit={handleJoin}>
                    <p className="eyebrow">Omegal Live</p>
                    <h1>Jump into a video chat</h1>
                    <p className="muted">
                        Share your name, allow camera access, and we’ll match you with someone in seconds.
                    </p>

                    <label className="field">
                        <span className="field-label">Display name</span>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Alex"
                            className="text-input"
                            type="text"
                        />
                    </label>

                    {camError && <p className="form-error">{camError}</p>}

                    <button
                        type="submit"
                        className="primary-btn"
                        disabled={!name.trim() || !localVideoTrack}
                    >
                        Enter the room
                    </button>
                    <p className="hint">
                        You can mute or leave anytime. Camera preview stays local until you connect.
                    </p>
                </form>
            </section>
        </main>
    );
    }

    return <Room name={name} localAudioTrack={localAudioTrack} localVideoTrack={localVideoTrack} />
}