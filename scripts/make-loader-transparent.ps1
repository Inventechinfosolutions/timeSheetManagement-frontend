# Remove white background from loader video using ffmpeg.
# Requires ffmpeg installed and in PATH: https://ffmpeg.org/download.html
# Run from project root: .\scripts\make-loader-transparent.ps1

$inputPath  = "src/assets/User_s_Animation_GIF_Request_Fulfilled.mp4"
$outputPath = "public/User_s_Animation_GIF_Request_Fulfilled.webm"

if (-not (Test-Path $inputPath)) {
    Write-Error "Input not found: $inputPath"
    exit 1
}

$outDir = Split-Path $outputPath
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }

ffmpeg -i $inputPath -vf "colorkey=0xffffff:0.35:0.1" -c:v libvpx-vp9 -pix_fmt yuva420p $outputPath

if ($LASTEXITCODE -eq 0) {
    Write-Host "Done. Transparent video saved to $outputPath"
} else {
    Write-Error "ffmpeg failed. Ensure ffmpeg is installed and in PATH."
    exit 1
}
