[CmdletBinding(SupportsShouldProcess)]
param([switch]$LegacyOnly)
$ErrorActionPreference = 'Stop'
$appId = 'DSH.NotifyInteractive.Preview'
$clsid = '{4FE06378-A53B-4DBD-B897-073C920113D4}'
$folder = Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'DSHNotifyInteractive\toast'
$server = "HKCU:\Software\Classes\CLSID\$clsid"
$app = "HKCU:\Software\Classes\AppUserModelId\$appId"
$preferences = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Notifications\Settings\$appId"
$legacy = Join-Path (Split-Path $folder) 'companion'
$legacyManifest = Join-Path $legacy 'package.json'
if (Test-Path $legacy) {
    if (!(Test-Path $legacyManifest) -or (Get-Content -Raw -LiteralPath $legacyManifest | ConvertFrom-Json).name -ne 'dsh-notify-companion') {
        throw 'Unrecognized legacy directory. Nothing removed.'
    }
    if (!$WhatIfPreference -and (Get-Process -Name electron -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "$legacy\*" })) {
        throw 'Stop the legacy DSH companion before uninstalling.'
    }
}
if (!$LegacyOnly) {
    if (Test-Path "$server\LocalServer32") {
        $exe = (Get-Item "$server\LocalServer32").GetValue('ServerExecutable')
        if (!$exe -or [IO.Path]::GetDirectoryName($exe) -ne $folder) { throw 'Unexpected activation registration. Nothing removed.' }
    }
    if (!$WhatIfPreference -and (Get-Process -Name 'ToastActivator-*' -ErrorAction SilentlyContinue | Where-Object { $_.Path -and [IO.Path]::GetDirectoryName($_.Path) -eq $folder })) {
        throw 'Stop DSH Web instances using Windows notifications before uninstalling.'
    }
    if ($PSCmdlet.ShouldProcess('DSH Web for the current Windows user', 'Remove notification history, registration, system notification preferences and activator files')) {
        if (Test-Path $app) {
            $manager = [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType=WindowsRuntime]
            try { $manager::History.Clear($appId) }
            catch { if ($_.Exception.GetBaseException().HResult -ne -2147023728) { throw } }
        }
        foreach ($key in @($app, $server, $preferences)) {
            if (Test-Path $key) { Remove-Item -LiteralPath $key -Recurse }
        }
        if (Test-Path $folder) { Remove-Item -LiteralPath $folder -Recurse }
    }
}
if ((Test-Path $legacy) -and $PSCmdlet.ShouldProcess($legacy, 'Remove the retired DSH Electron runtime')) {
    Remove-Item -LiteralPath $legacy -Recurse
}
