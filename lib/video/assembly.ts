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

export interface AssemblyInput {
  photos: string[];
  narrationPath?: string;
  overlayText?: string;
  outputDir: string;
  itemId: string;
  duration?: number;
}

export interface AssemblyResult {
  success: boolean;
  videoPath: string | null;
  videoUrl: string | null;
  durationSeconds: number;
  error?: string;
}

/**
 * Assemble a vertical (9:16) video ad from photos with Ken Burns effect,
 * text overlays, and optional narration audio.
 *
 * Requires fluent-ffmpeg and ffmpeg-static to be installed.
 * Returns a graceful error if ffmpeg is not available.
 */
export async function assembleVideo(input: AssemblyInput): Promise<AssemblyResult> {
  const { photos, narrationPath, overlayText, outputDir, itemId, duration } = input;

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

  const filename = `videobot-${itemId}-${Date.now()}.mp4`;
  const outputPath = path.join(outDir, filename);
  const perPhotoSeconds = duration ? Math.floor(duration / validPhotos.length) : 5;
  const totalDuration = perPhotoSeconds * validPhotos.length;

  try {
    console.log(`[videobot] Assembly: ${validPhotos.length} photos, ${perPhotoSeconds}s each, ${totalDuration}s total`);

    await new Promise<void>((resolve, reject) => {
      // Build ffmpeg command with Ken Burns (zoompan), crossfade, and text overlay
      let cmd = ffmpeg();

      // Add each photo as an input
      for (const photo of validPhotos) {
        cmd = cmd.input(photo).inputOptions(["-loop", "1", "-t", String(perPhotoSeconds)]);
      }

      // Add narration if provided
      if (narrationPath && fs.existsSync(narrationPath)) {
        cmd = cmd.input(narrationPath);
      }

      // Build complex filter for Ken Burns + text overlay
      const filterParts: string[] = [];
      const concatInputs: string[] = [];

      validPhotos.forEach((_, i) => {
        // Scale to 1080x1920 (9:16) and apply zoompan for Ken Burns
        filterParts.push(
          `[${i}:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,` +
          `zoompan=z='min(zoom+0.0015,1.5)':d=${perPhotoSeconds * 25}:s=1080x1920:fps=25` +
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
          "-t", String(totalDuration),
        ])
        .output(outputPath)
        .on("end", () => resolve())
        .on("error", (err: Error) => reject(err));

      cmd.run();
    });

    const videoUrl = `/videos/${filename}`;
    console.log(`[videobot] Assembly: video saved to ${videoUrl} (${totalDuration}s)`);

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
