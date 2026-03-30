import * as fs from "fs";
import * as path from "path";

// ffmpeg types — optional deps, graceful fallback if not installed
let ffmpeg: any = null;
let ffmpegPath: string | null = null;
try {
  ffmpeg = require("fluent-ffmpeg");
  ffmpegPath = require("ffmpeg-static");
  if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);
} catch {
  // fluent-ffmpeg or ffmpeg-static not installed — assembly will use fallback
}

export interface SentenceTimecodeInput {
  sentence: string;
  startSeconds: number;
  endSeconds: number;
  photoIndex: number;
}

export interface AssemblyInput {
  photos: string[];
  narrationPath?: string;
  overlayText?: string;
  outputDir: string;
  itemId: string;
  duration?: number;
  sentenceTimecodes?: SentenceTimecodeInput[];
}

export interface AssemblyResult {
  success: boolean;
  videoPath: string | null;
  videoUrl: string | null;
  durationSeconds: number;
  error?: string;
}

/**
 * Calculate per-photo durations from sentence timecodes.
 *
 * When timecodes are provided, each photo's duration is determined by the
 * sentences mapped to it. When not provided, photos share time equally.
 */
function calculatePhotoDurations(
  photoCount: number,
  totalDuration: number,
  sentenceTimecodes?: SentenceTimecodeInput[]
): number[] {
  if (!sentenceTimecodes || sentenceTimecodes.length === 0) {
    // Equal distribution fallback
    const perPhoto = totalDuration / photoCount;
    return Array(photoCount).fill(perPhoto);
  }

  // Group timecodes by photoIndex
  const grouped = new Map<number, { start: number; end: number }>();

  for (const tc of sentenceTimecodes) {
    const idx = Math.min(tc.photoIndex, photoCount - 1);
    const existing = grouped.get(idx);
    if (existing) {
      existing.start = Math.min(existing.start, tc.startSeconds);
      existing.end = Math.max(existing.end, tc.endSeconds);
    } else {
      grouped.set(idx, { start: tc.startSeconds, end: tc.endSeconds });
    }
  }

  // Build durations array — minimum 1 second per photo
  const durations: number[] = [];
  for (let i = 0; i < photoCount; i++) {
    const range = grouped.get(i);
    if (range) {
      durations.push(Math.max(1, range.end - range.start));
    } else {
      // Photo has no assigned sentences — give it a minimum duration
      durations.push(Math.max(1, totalDuration / photoCount));
    }
  }

  return durations;
}

/**
 * Assemble a vertical (9:16) video ad from photos with Ken Burns effect,
 * text overlays, and optional narration audio.
 *
 * When sentenceTimecodes are provided, photo durations are calculated from
 * sentence boundaries for narration-synced transitions.
 *
 * Requires fluent-ffmpeg and ffmpeg-static to be installed.
 * Returns a graceful error if ffmpeg is not available.
 */
export async function assembleVideo(input: AssemblyInput): Promise<AssemblyResult> {
  const { photos, narrationPath, overlayText, outputDir, itemId, duration, sentenceTimecodes } = input;

  // Ensure output directory
  const videosDir = path.join(process.cwd(), "public", "videos");
  if (!fs.existsSync(videosDir)) {
    fs.mkdirSync(videosDir, { recursive: true });
  }
  const outDir = outputDir || videosDir;
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  if (!ffmpeg) {
    console.log("[videobot] Assembly: ffmpeg not available — returning placeholder");
    return {
      success: false,
      videoPath: null,
      videoUrl: null,
      durationSeconds: 0,
      error: "ffmpeg not installed. Install fluent-ffmpeg and ffmpeg-static for video assembly.",
    };
  }

  if (!photos || photos.length === 0) {
    return {
      success: false,
      videoPath: null,
      videoUrl: null,
      durationSeconds: 0,
      error: "No photos provided for video assembly",
    };
  }

  // Validate that photo files exist
  const validPhotos = photos
    .map((p) => path.isAbsolute(p) ? p : path.join(process.cwd(), "public", p))
    .filter((p) => fs.existsSync(p));

  if (validPhotos.length === 0) {
    return {
      success: false,
      videoPath: null,
      videoUrl: null,
      durationSeconds: 0,
      error: "No valid photo files found",
    };
  }

  // Calculate per-photo durations
  const baseDuration = duration || 30;
  const photoDurations = calculatePhotoDurations(validPhotos.length, baseDuration, sentenceTimecodes);
  const totalDuration = photoDurations.reduce((sum, d) => sum + d, 0);

  const filename = `videobot-${itemId}-${Date.now()}.mp4`;
  const outputPath = path.join(outDir, filename);

  try {
    console.log(`[videobot] Assembly: ${validPhotos.length} photos, total ${totalDuration.toFixed(1)}s${sentenceTimecodes ? " (timecode-synced)" : " (equal split)"}`);

    await new Promise<void>((resolve, reject) => {
      // Build ffmpeg command with Ken Burns (zoompan), crossfade, and text overlay
      let cmd = ffmpeg();

      // Add each photo as an input with its specific duration
      for (let i = 0; i < validPhotos.length; i++) {
        const photoDur = Math.ceil(photoDurations[i]);
        cmd = cmd.input(validPhotos[i]).inputOptions(["-loop", "1", "-t", String(photoDur)]);
      }

      // Add narration if provided
      if (narrationPath && fs.existsSync(narrationPath)) {
        cmd = cmd.input(narrationPath);
      }

      // Build complex filter for Ken Burns + text overlay
      const filterParts: string[] = [];
      const concatInputs: string[] = [];

      validPhotos.forEach((_, i) => {
        const photoDur = Math.ceil(photoDurations[i]);
        // Scale to 1080x1920 (9:16) and apply zoompan for Ken Burns
        filterParts.push(
          `[${i}:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,` +
          `zoompan=z='min(zoom+0.0015,1.5)':d=${photoDur * 25}:s=1080x1920:fps=25` +
          `[v${i}]`
        );
        concatInputs.push(`[v${i}]`);
      });

      // Concatenate all video segments
      filterParts.push(
        `${concatInputs.join("")}concat=n=${validPhotos.length}:v=1:a=0[vout]`
      );

      // Add text overlay if provided
      if (overlayText) {
        const escaped = overlayText.replace(/'/g, "'\\''").replace(/:/g, "\\:");
        filterParts.push(
          `[vout]drawtext=text='${escaped}':fontsize=36:fontcolor=white:` +
          `borderw=2:bordercolor=black:x=(w-text_w)/2:y=h-100[vfinal]`
        );
      }

      const finalLabel = overlayText ? "vfinal" : "vout";

      cmd = cmd
        .complexFilter(filterParts)
        .outputOptions([
          "-map", `[${finalLabel}]`,
          ...(narrationPath && fs.existsSync(narrationPath)
            ? ["-map", `${validPhotos.length}:a`]
            : []),
          "-c:v", "libx264",
          "-preset", "fast",
          "-crf", "23",
          "-pix_fmt", "yuv420p",
          "-movflags", "+faststart",
          "-t", String(Math.ceil(totalDuration)),
        ])
        .output(outputPath)
        .on("end", () => resolve())
        .on("error", (err: Error) => reject(err));

      cmd.run();
    });

    const videoUrl = `/videos/${filename}`;
    console.log(`[videobot] Assembly: video saved to ${videoUrl} (${totalDuration.toFixed(1)}s)`);

    return {
      success: true,
      videoPath: outputPath,
      videoUrl,
      durationSeconds: totalDuration,
    };
  } catch (e: any) {
    console.error("[videobot] Assembly error:", e.message);
    return {
      success: false,
      videoPath: null,
      videoUrl: null,
      durationSeconds: 0,
      error: `Video assembly failed: ${e.message}`,
    };
  }
}
