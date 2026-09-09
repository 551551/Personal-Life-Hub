Add-Type -AssemblyName System.Drawing

function New-BrandBitmap([int]$width, [int]$height, [bool]$transparent, [double]$logoScale = 0.72) {
  $bitmap = New-Object System.Drawing.Bitmap($width, $height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  if ($transparent) { $graphics.Clear([System.Drawing.Color]::Transparent) }
  else { $graphics.Clear([System.Drawing.Color]::FromArgb(15, 23, 42)) }

  $side = [Math]::Min($width, $height) * $logoScale
  $left = ($width - $side) / 2
  $top = ($height - $side) / 2
  $circleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(13, 148, 136))
  $graphics.FillEllipse($circleBrush, $left, $top, $side, $side)
  $penWidth = [Math]::Max(4, $side * 0.085)
  $plusPen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, $penWidth)
  $plusPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $plusPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $arm = $side * 0.27
  $centerX = $width / 2
  $centerY = $height / 2
  $graphics.DrawLine($plusPen, $centerX, $centerY - $arm, $centerX, $centerY + $arm)
  $graphics.DrawLine($plusPen, $centerX - $arm, $centerY, $centerX + $arm, $centerY)
  $plusPen.Dispose()
  $circleBrush.Dispose()
  $graphics.Dispose()
  return $bitmap
}

function Save-BrandPng([string]$path, [int]$width, [int]$height, [bool]$transparent, [double]$logoScale = 0.72) {
  $bitmap = New-BrandBitmap $width $height $transparent $logoScale
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Dispose()
}

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$resourceRoot = Join-Path $projectRoot 'android\app\src\main\res'
$sourceAssetRoot = Join-Path $projectRoot 'mobile-assets'
New-Item -ItemType Directory -Force -Path $sourceAssetRoot | Out-Null
Save-BrandPng (Join-Path $sourceAssetRoot 'icon-1024.png') 1024 1024 $false 0.72

$densitySizes = @{
  'mdpi' = 48
  'hdpi' = 72
  'xhdpi' = 96
  'xxhdpi' = 144
  'xxxhdpi' = 192
}

foreach ($density in $densitySizes.Keys) {
  $size = $densitySizes[$density]
  $folder = Join-Path $resourceRoot "mipmap-$density"
  Save-BrandPng (Join-Path $folder 'ic_launcher.png') $size $size $false 0.72
  Save-BrandPng (Join-Path $folder 'ic_launcher_round.png') $size $size $false 0.72
  Save-BrandPng (Join-Path $folder 'ic_launcher_foreground.png') ($size * 2.25) ($size * 2.25) $true 0.58
}

Get-ChildItem $resourceRoot -Recurse -Filter 'splash.png' | ForEach-Object {
  $existing = [System.Drawing.Image]::FromFile($_.FullName)
  $width = $existing.Width
  $height = $existing.Height
  $existing.Dispose()
  Save-BrandPng $_.FullName $width $height $false 0.22
}
