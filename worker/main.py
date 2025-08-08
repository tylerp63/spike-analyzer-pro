import os
import io
import time
import json
import tempfile
from typing import Dict, Any, List, Tuple

import numpy as np
import cv2
from scipy.signal import savgol_filter
from tqdm import tqdm

from supabase import create_client, Client

# ============ Config ============
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
BUCKET = os.environ.get("SUPABASE_BUCKET", "videos")

POLL_INTERVAL_SEC = 3
TARGET_FPS = 30
MIN_CONF = 0.25

# Lazy import for heavy model
model = None

def get_client() -> Client:
    assert SUPABASE_URL and SERVICE_ROLE_KEY, "Missing Supabase env vars"
    return create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

# ============ Video Utils ============

def read_video_frames(path: str, target_fps: int = TARGET_FPS) -> Tuple[List[np.ndarray], float]:
    cap = cv2.VideoCapture(path)
    if not cap.isOpened():
        raise RuntimeError("Failed to open video")
    src_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frame_interval = max(int(round(src_fps / target_fps)), 1)

    frames = []
    idx = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if idx % frame_interval == 0:
            frames.append(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        idx += 1
    cap.release()
    return frames, float(src_fps)

# ============ Pose & Metrics ============

def load_pose_model():
    global model
    if model is None:
        from ultralytics import YOLO
        model = YOLO("yolo11n-pose.pt")  # lightweight
    return model

# Keypoint indices for Ultralytics pose may vary; adapt if needed
# We'll map a minimal set used for volleyball metrics
KP = {
    "nose": 0,
    "left_shoulder": 5,
    "right_shoulder": 6,
    "left_elbow": 7,
    "right_elbow": 8,
    "left_wrist": 9,
    "right_wrist": 10,
    "left_hip": 11,
    "right_hip": 12,
    "left_knee": 13,
    "right_knee": 14,
    "left_ankle": 15,
    "right_ankle": 16,
}


def run_pose(frames: List[np.ndarray]) -> np.ndarray:
    m = load_pose_model()
    keypoints: List[np.ndarray] = []

    for i, frame in enumerate(tqdm(frames, desc="Pose")):
        try:
            results = m.predict(source=frame, verbose=False)
            if not results or getattr(results[0], "keypoints", None) is None:
                raise ValueError("No keypoints returned")

            kp_obj = results[0].keypoints
            k_raw = None

            # Preferred (Ultralytics v8): keypoints.data -> (n, 17, 3)
            if hasattr(kp_obj, "data"):
                data = kp_obj.data
                try:
                    data = data.cpu().numpy()
                except Exception:
                    data = np.asarray(data)
                data = np.squeeze(data)
                if data.ndim == 3 and data.shape[0] >= 1:
                    k_raw = data[0]
                elif data.ndim == 2 and data.shape[0] == 17:
                    k_raw = data
                else:
                    k_raw = None

            # Fallback: indexable keypoints structure
            if k_raw is None:
                try:
                    tmp = kp_obj[0]
                    if hasattr(tmp, "cpu"):
                        k_raw = tmp.cpu().numpy()
                    else:
                        k_raw = np.asarray(tmp)
                except Exception:
                    pass

            if k_raw is None:
                raise ValueError("Unable to extract keypoints array")

            k_raw = np.asarray(k_raw, dtype=np.float32)
            k_flat = np.squeeze(k_raw)
            if k_flat.ndim == 3 and k_flat.shape[0] >= 1:
                k_flat = k_flat[0]

            # Normalize to (17, 3)
            if k_flat.ndim != 2:
                raise ValueError(f"Unexpected ndim: {k_flat.ndim}, shape={k_flat.shape}")
            if k_flat.shape == (17, 2):
                conf = np.ones((17, 1), dtype=np.float32)
                k_flat = np.concatenate([k_flat, conf], axis=1)
            if k_flat.shape != (17, 3):
                raise ValueError(f"Unexpected shape after normalize: {k_flat.shape}")

            keypoints.append(k_flat.astype(np.float32))

        except Exception as e:
            print(f"[Frame {i}] Pose ERROR: {e}")
            keypoints.append(np.full((17, 3), np.nan, dtype=np.float32))

    # Final shape/type check before stack
    clean_keypoints: List[np.ndarray] = []
    for idx, kp in enumerate(keypoints):
        if isinstance(kp, np.ndarray) and kp.shape == (17, 3) and getattr(kp, 'dtype', None) != object:
            clean_keypoints.append(kp.astype(np.float32))
        else:
            print(f"[STACK FIX] Frame {idx} is invalid: {type(kp)}, shape={getattr(kp, 'shape', 'N/A')}, dtype={getattr(kp, 'dtype', 'N/A')}")
            clean_keypoints.append(np.full((17, 3), np.nan, dtype=np.float32))

    print(f"[Pose Summary] Total frames: {len(clean_keypoints)}")
    try:
        stacked = np.stack(clean_keypoints, axis=0).astype(np.float32)
    except Exception as e:
        print(f"[STACK ERROR] {e}")
        for j, kp in enumerate(clean_keypoints[:5]):
            print(f"  sample[{j}] type={type(kp)}, shape={getattr(kp, 'shape', None)}, dtype={getattr(kp, 'dtype', None)}")
        stacked = np.stack([np.full((17, 3), np.nan, dtype=np.float32) for _ in clean_keypoints], axis=0)
    return stacked

def smooth_keypoints(kps: np.ndarray) -> np.ndarray:
    T, J, C = kps.shape
    smoothed = kps.copy()
    for j in range(J):
        for c in range(2):  # x,y only
            series = smoothed[:, j, c]
            conf = kps[:, j, 2]
            # Interpolate low-conf/NaN
            mask = (conf < MIN_CONF) | np.isnan(series)
            if mask.all():
                print(f"[SMOOTH] joint {j} channel {c} all masked; skipping")
                continue
            valid_idx = np.where(~mask)[0]
            smoothed[mask, j, c] = np.interp(np.where(mask)[0], valid_idx, series[valid_idx])
            # Savitzky–Golay
            win = 9 if T >= 9 else (T // 2 * 2 + 1)
            if win >= 5:
                smoothed[:, j, c] = savgol_filter(smoothed[:, j, c], win, 2)
    return smoothed


def angle(a: np.ndarray, b: np.ndarray, c: np.ndarray) -> float:
    # angle at b formed by a-b-c
    ba = a - b
    bc = c - b
    if np.any(np.isnan(ba)) or np.any(np.isnan(bc)):
        return np.nan
    cosang = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-8)
    cosang = np.clip(cosang, -1.0, 1.0)
    return float(np.degrees(np.arccos(cosang)))


def detect_events(kps: np.ndarray, fps: float) -> Dict[str, int]:
    # Simple heuristics: use hip y to find apex; ankles y velocity for takeoff
    T = kps.shape[0]
    y_hip = np.nanmean(kps[:, [KP["left_hip"], KP["right_hip"]], 1], axis=1)
    try:
        apex = int(np.nanargmin(y_hip))  # min y (highest)
    except ValueError:
        apex = 0
        print(f"[EVENT] y_hip all NaN over {T} frames; default apex=0")

    # vertical velocity of ankles
    y_ank = np.nanmean(kps[:, [KP["left_ankle"], KP["right_ankle"]], 1], axis=1)
    vy = np.gradient(y_ank)
    try:
        takeoff = int(np.nanargmax(-vy))  # big upward motion
    except ValueError:
        takeoff = 0
        print(f"[EVENT] ankle velocity all NaN over {T} frames; default takeoff=0")

    # plant: before takeoff where hip starts descent
    dy_hip = np.gradient(y_hip)
    pre = max(0, takeoff - int(fps * 0.5))
    plant = int(pre + np.argmax(dy_hip[pre:takeoff] > 0)) if takeoff > pre else max(0, takeoff - 3)

    # max countermovement: knee min angle before takeoff
    lk, rk = KP["left_knee"], KP["right_knee"]
    lh, rh = KP["left_hip"], KP["right_hip"]
    la, ra = KP["left_ankle"], KP["right_ankle"]
    knee_angles = []
    for t in range(plant, takeoff):
        lk_ang = angle(kps[t, lh, :2], kps[t, lk, :2], kps[t, la, :2])
        rk_ang = angle(kps[t, rh, :2], kps[t, rk, :2], kps[t, ra, :2])
        knee_angles.append(np.nanmean([lk_ang, rk_ang]))
    if len(knee_angles):
        try:
            max_cm = plant + int(np.nanargmin(knee_angles))
        except ValueError:
            max_cm = plant
            print(f"[EVENT] knee_angles all NaN over {len(knee_angles)} frames; default max_cm=plant")
    else:
        max_cm = plant

    # enforce order and bounds
    plant = max(0, min(plant, takeoff))
    max_cm = max(plant, min(max_cm, takeoff))
    apex = max(takeoff, apex)

    plant = int(np.clip(plant, 0, T - 1))
    max_cm = int(np.clip(max_cm, 0, T - 1))
    takeoff = int(np.clip(takeoff, 0, T - 1))
    apex = int(np.clip(apex, 0, T - 1))

    return {"plant": plant, "max_cm": max_cm, "takeoff": takeoff, "apex": apex}


def compute_metrics(kps: np.ndarray, events: Dict[str, int], fps: float) -> Dict[str, Any]:
    plant = events["plant"]; max_cm = events["max_cm"]; takeoff = events["takeoff"]; apex = events["apex"]

    # Trunk angle @ plant: shoulder-hip vs vertical
    ls, rs = KP["left_shoulder"], KP["right_shoulder"]
    lh, rh = KP["left_hip"], KP["right_hip"]
    sh = np.nanmean(kps[plant, [ls, rs], :2], axis=0)
    hp = np.nanmean(kps[plant, [lh, rh], :2], axis=0)
    torso_vec = sh - hp
    trunk_angle = float(abs(np.degrees(np.arctan2(torso_vec[0], torso_vec[1]))))  # vs vertical

    # Knee flex @ max_cm
    lk, rk = KP["left_knee"], KP["right_knee"]
    la, ra = KP["left_ankle"], KP["right_ankle"]
    lk_ang = angle(kps[max_cm, lh, :2], kps[max_cm, lk, :2], kps[max_cm, la, :2])
    rk_ang = angle(kps[max_cm, rh, :2], kps[max_cm, rk, :2], kps[max_cm, ra, :2])
    knee_flex = float(np.nanmean([lk_ang, rk_ang]))

    # Arm cock & elbow extension at takeoff (rough): shoulder-elbow-wrist and elbow angle
    le, re = KP["left_elbow"], KP["right_elbow"]
    lw, rw = KP["left_wrist"], KP["right_wrist"]
    ls_ang = angle(kps[takeoff, le, :2], kps[takeoff, ls, :2], kps[takeoff, lh, :2])
    rs_ang = angle(kps[takeoff, re, :2], kps[takeoff, rs, :2], kps[takeoff, rh, :2])
    arm_cock = float(np.nanmax([ls_ang, rs_ang]))

    le_ang = angle(kps[takeoff, ls, :2], kps[takeoff, le, :2], kps[takeoff, lw, :2])
    re_ang = angle(kps[takeoff, rs, :2], kps[takeoff, re, :2], kps[takeoff, rw, :2])
    elbow_ext = float(np.nanmax([le_ang, re_ang]))

    # Step ratio: penultimate / last using inter-ankle distance peaks before plant
    la_i, ra_i = KP["left_ankle"], KP["right_ankle"]
    ankle_dist = np.linalg.norm(kps[:plant, la_i, :2] - kps[:plant, ra_i, :2], axis=1)
    step_ratio = float("nan")
    if len(ankle_dist) >= 4:
        # crude: last two local maxima
        from scipy.signal import find_peaks
        peaks, _ = find_peaks(ankle_dist, distance=max(1, int(fps * 0.1)))
        if len(peaks) >= 2:
            penult, last = peaks[-2], peaks[-1]
            step_ratio = float(ankle_dist[penult] / (ankle_dist[last] + 1e-6))
        else:
            print("[METRIC] step_ratio cannot be computed (need >=2 peaks)")
    else:
        print("[METRIC] step_ratio cannot be computed (need >=4 samples)")

    jump_time = float((apex - takeoff) / fps)
    time_to_contact = float((apex - plant) / fps)

    return {
        "angles": {
            "arm_cock_peak_deg": arm_cock,
            "elbow_extension_peak_deg": elbow_ext,
            "torso_lean_deg": trunk_angle,
        },
        "timing": {
            "penultimate_last_ratio": step_ratio,
            "jump_time_s": jump_time,
            "time_to_contact_s": time_to_contact,
        },
    }


def draw_overlay(frames: List[np.ndarray], kps: np.ndarray, events: Dict[str, int], out_path: str, fps: int = TARGET_FPS):
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    h, w = frames[0].shape[:2]
    vw = cv2.VideoWriter(out_path, fourcc, fps, (w, h))

    colors = (0, 255, 0)
    for t, frame in enumerate(frames):
        img = frame.copy()[:, :, ::-1]  # RGB->BGR
        # draw simple skeleton lines
        pairs = [(KP["left_shoulder"], KP["left_elbow"]), (KP["left_elbow"], KP["left_wrist"]),
                 (KP["right_shoulder"], KP["right_elbow"]), (KP["right_elbow"], KP["right_wrist"]),
                 (KP["left_hip"], KP["left_knee"]), (KP["left_knee"], KP["left_ankle"]),
                 (KP["right_hip"], KP["right_knee"]), (KP["right_knee"], KP["right_ankle"]),
                 (KP["left_shoulder"], KP["left_hip"]), (KP["right_shoulder"], KP["right_hip"])]
        for a, b in pairs:
            p1 = kps[t, a, :2]; p2 = kps[t, b, :2]
            if not (np.any(np.isnan(p1)) or np.any(np.isnan(p2))):
                cv2.line(img, tuple(p1.astype(int)), tuple(p2.astype(int)), colors, 2)
        # mark events
        for name, idx in events.items():
            if t == idx:
                cv2.putText(img, name.upper(), (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 200, 255), 2)
        vw.write(img)
    vw.release()


def recommend(metrics: Dict[str, Any]) -> List[Dict[str, str]]:
    recs = []
    angles = metrics["angles"]; timing = metrics["timing"]
    if np.isnan(angles.get("torso_lean_deg", np.nan)) or angles.get("torso_lean_deg", 0) > 18:
        recs.append({"drillId": "Torso Control", "focus": "Reduce torso lean at plant"})
    if np.isnan(angles.get("arm_cock_peak_deg", np.nan)) or angles.get("arm_cock_peak_deg", 0) < 115:
        recs.append({"drillId": "Arm Cock Mechanics", "focus": "Increase external rotation pre-takeoff"})
    if np.isnan(timing.get("penultimate_last_ratio", np.nan)) or timing.get("penultimate_last_ratio", 0) < 1.2:
        recs.append({"drillId": "Approach Steps", "focus": "Lengthen penultimate relative to last"})
    return recs

# ============ Main Loop ============

def process_one(client: Client) -> bool:
    # pick oldest queued
    resp = client.table("videos").select("*").eq("status", "queued").order("created_at", desc=False).limit(1).execute()
    items = resp.data or []
    if not items:
        return False
    video = items[0]
    vid = video["id"]; storage_key = video["storage_key"]

    # flip to processing
    client.table("videos").update({"status": "processing", "error_message": None}).eq("id", vid).execute()

    try:
        stage = 'download'
        # download
        obj = client.storage.from_(BUCKET).download(storage_key)
        with tempfile.TemporaryDirectory() as td:
            in_path = os.path.join(td, "in.webm")
            with open(in_path, "wb") as f:
                f.write(obj)

            stage = 'decode_video'
            frames, src_fps = read_video_frames(in_path, TARGET_FPS)
            if not frames:
                raise RuntimeError("No frames decoded")

            # probe metadata
            h, w = frames[0].shape[:2]
            client.table("videos").update({"fps": int(round(src_fps)), "width": w, "height": h}).eq("id", vid).execute()

            # pose → smooth → events → metrics
            stage = 'pose'
            raw_kps = run_pose(frames)
            stage = 'smooth'
            sm_kps = smooth_keypoints(raw_kps)
            stage = 'events'
            events = detect_events(sm_kps, src_fps)
            stage = 'metrics'
            metrics = compute_metrics(sm_kps, events, src_fps)
            recs = recommend(metrics)

            # overlay
            overlay_path = os.path.join(td, "overlay.mp4")
            stage = 'overlay_render'
            draw_overlay(frames, sm_kps, events, overlay_path, fps=min(TARGET_FPS, int(round(src_fps)) or TARGET_FPS))

            # upload artifacts
            overlay_key = f"processed/{vid}/overlay.mp4"
            report_key = f"processed/{vid}/summary.json"

            with open(overlay_path, "rb") as f:
                stage = 'upload_overlay'
                client.storage.from_(BUCKET).upload(overlay_key, f.read(), {
                    "contentType": "video/mp4",
                    "upsert": True,
                })

            report = {
                "videoId": vid,
                "keyFrames": events,
                "metrics": metrics,
                "angles": metrics.get("angles", {}),
                "timing": metrics.get("timing", {}),
                "recommendations": recs,
            }
            stage = 'upload_report'
            client.storage.from_(BUCKET).upload(report_key, json.dumps(report).encode("utf-8"), {
                "contentType": "application/json",
                "upsert": True,
            })

            # persist report row and mark done
            stage = 'insert_report'
            client.table("reports").insert({
                "video_id": vid,
                "overlay_url": overlay_key,
                "summary_json_url": report_key,
            }).execute()
            stage = 'update_status'
            client.table("videos").update({"status": "done"}).eq("id", vid).execute()
            print(f"Processed video {vid}")
            return True

    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print(f"Processing error at stage {stage}:", tb)
        client.table("videos").update({"status": "failed", "error_message": f"{stage}: {tb}"}).eq("id", vid).execute()
        return True


def main():
    client = get_client()
    print("Worker started. Polling for jobs...")
    while True:
        worked = process_one(client)
        if not worked:
            time.sleep(POLL_INTERVAL_SEC)


if __name__ == "__main__":
    main()
