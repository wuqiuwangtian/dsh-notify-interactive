# Stage 1 uses a separate per-user notification identity for isolated DSH runs.
$ErrorActionPreference = 'Stop'
$appId = 'DSH.NotifyInteractive.Preview'
$data = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String([Console]::In.ReadToEnd().Trim())) | ConvertFrom-Json
$manager = [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType=WindowsRuntime]
if ($data.removeGroup) {
    $manager::History.RemoveGroup([string]$data.removeGroup, $appId)
    return
}

$key = "HKCU:\Software\Classes\AppUserModelId\$appId"
$null = New-Item -Path $key -Force
$null = New-ItemProperty -Path $key -Name DisplayName -Value 'DSH Web (Preview)' -PropertyType String -Force
$notifier = $manager::CreateToastNotifier($appId)

$xml = [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType=WindowsRuntime]::new()
$xml.LoadXml('<toast activationType="protocol"><visual><binding template="ToastGeneric"><text/><text/></binding></visual><audio silent="true"/></toast>')
$xml.DocumentElement.SetAttribute('launch', [string]$data.url)
$lines = $xml.GetElementsByTagName('text')
$lines.Item(0).InnerText = $data.title
$lines.Item(1).InnerText = $data.body
$toast = [Windows.UI.Notifications.ToastNotification, Windows.UI.Notifications, ContentType=WindowsRuntime]::new($xml)
$toast.Tag = $data.tag
$toast.Group = $data.group
$notifier.Show($toast)
