$files = @(
  "node_modules/@capacitor/android/capacitor/build.gradle",
  "node_modules/@capacitor/app/android/build.gradle",
  "node_modules/@capacitor/haptics/android/build.gradle",
  "node_modules/@capacitor/keyboard/android/build.gradle",
  "node_modules/@capacitor/status-bar/android/build.gradle",
  "node_modules/@capacitor-community/http/android/build.gradle",
  "node_modules/@capacitor/browser/android/build.gradle",
  "android/build.gradle",
  "android/app/build.gradle",
  "android/app/capacitor.build.gradle",
  "android/capacitor-cordova-android-plugins/build.gradle"
)

[int]$total = $files.Count
[int]$parchados = 0

foreach ($file in $files) {
  if (Test-Path $file) {
    $content = Get-Content $file
    if ($content -match "JavaVersion\.VERSION_21") {
      $newContent = $content -replace "JavaVersion\.VERSION_21", "JavaVersion.VERSION_17"
      $newContent | Set-Content $file
      Write-Host "✅ Reparado: $file"
      $parchados++
    } else {
      Write-Host " Sin cambios: $file"
    }
  } else {
    Write-Host "❌ No encontrado: $file"
  }
}

Write-Host "`n Parcheo finalizado."
Write-Host "Total archivos procesados: $total"
Write-Host "Archivos parchados: $parchados"
Write-Host "Listo para compilar con Java 17"
