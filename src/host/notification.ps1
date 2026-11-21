# Native banner and Notification Center identity (keep the historical AUMID to preserve user settings).
$ErrorActionPreference = 'Stop'
$appId = 'DSH.NotifyInteractive.Preview'
$data = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String([Console]::In.ReadToEnd().Trim())) | ConvertFrom-Json
$manager = [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType=WindowsRuntime]
$key = "HKCU:\Software\Classes\AppUserModelId\$appId"
if ($data.removeGroup) {
    if (!(Test-Path $key)) { return }
    $manager::History.RemoveGroup([string]$data.removeGroup, $appId)
    return
}

if ($data.removeTag) {
    $manager::History.Remove([string]$data.removeTag, [string]$data.group, $appId)
    return
}
if (!(Test-Path $key)) { $null = New-Item -Path $key -Force }
$null = New-ItemProperty -Path $key -Name DisplayName -Value 'DSH Web' -PropertyType String -Force
$notifier = $manager::CreateToastNotifier($appId)

# WinRT can return ELEMENT_NOT_FOUND before the first Show registers this identity.
$setting = $null
try { $setting = $notifier.get_Setting().ToString() }
catch { if ($_.Exception.GetBaseException().HResult -ne -2147023728) { throw } }
if ($setting -and $setting -ne 'Enabled') { Write-Output 'system-muted'; return }
if ($data.popup) {
    $xml = [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType=WindowsRuntime]::new()
    $xml.LoadXml('<toast activationType="protocol"><visual><binding template="ToastGeneric"><text/><text/></binding></visual><audio silent="true"/></toast>')
    $xml.DocumentElement.SetAttribute('launch', [string]$data.url)
    $lines = $xml.GetElementsByTagName('text')
    $lines.Item(0).InnerText = $data.title
    $lines.Item(1).InnerText = $data.body
    if ($data.form) {
        $actions = $xml.CreateElement('actions')
        if ($data.form.input) {
            $field = $xml.CreateElement('input')
            $field.SetAttribute('id', 'reply')
            $field.SetAttribute('type', 'text')
            $field.SetAttribute('placeHolderContent', '输入回答')
            $null = $actions.AppendChild($field)
        }
        foreach ($button in $data.form.buttons) {
            $action = $xml.CreateElement('action')
            $action.SetAttribute('activationType', 'foreground')
            $action.SetAttribute('content', [string]$button.label)
            $action.SetAttribute('arguments', [string]$button.argument)
            $null = $actions.AppendChild($action)
        }
        $null = $xml.DocumentElement.InsertBefore($actions, $xml.GetElementsByTagName('audio').Item(0))
    }
    $toast = [Windows.UI.Notifications.ToastNotification, Windows.UI.Notifications, ContentType=WindowsRuntime]::new($xml)
    $toast.Tag = $data.tag
    $toast.Group = $data.group
    $notifier.Show($toast)
}

$played = $false
if ($data.wav) {
    # Unknown notification policy is silent. Check again immediately before independent playback.
    try { $mode = $manager::GetDefault().NotificationMode.ToString() } catch { $mode = 'Unknown' }
    if ($mode -eq 'Unrestricted' -and (!$setting -or $notifier.get_Setting().ToString() -eq 'Enabled')) {
        $stream = [IO.MemoryStream]::new([Convert]::FromBase64String($data.wav))
        $player = [System.Media.SoundPlayer]::new($stream)
        try { $player.PlaySync(); $played = $true } finally { $player.Dispose(); $stream.Dispose() }
    }
}
if ($data.popup) { Write-Output 'accepted' }
elseif ($played) { Write-Output 'sound-only' }
else { Write-Output 'system-muted' }
