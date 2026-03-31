# Drop Illustrator Exports Here

Export each artboard as a PNG from Illustrator and drop the file into this folder using EXACTLY these filenames.
Once all files are in place, run: `node scripts/process-logos.mjs`

## Required files (drop all of these):

| Filename | From Artboard | Notes |
|---|---|---|
| `raw-lockup.png` | AB-01 | 2400×900, transparent |
| `raw-nav.png` | AB-02 | 2400×700, transparent |
| `raw-mark.png` | AB-03 | 600×600, transparent |
| `raw-tagline.png` | AB-04 | 1800×300, transparent |
| `raw-og.png` | AB-08 | 1200×630, #0A0A0F background |

The script will generate all final sizes from these 5 source files.

## NOT needed here (export directly to Illustrator/print workflow):
- AB-09 logo-print-cmyk.pdf
- AB-10 logo-print-black.pdf
- AB-11 logo-print-white.pdf
