$ErrorActionPreference = 'Stop'
$source = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String([Console]::In.ReadToEnd().Trim()))
$folder = Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'DSHNotifyInteractive\toast'
$null = [IO.Directory]::CreateDirectory($folder)
$hash = [Security.Cryptography.SHA256]::Create()
try { $version = [BitConverter]::ToString($hash.ComputeHash([Text.Encoding]::UTF8.GetBytes($source))).Replace('-', '').Substring(0, 16) }
finally { $hash.Dispose() }
$executable = Join-Path $folder "ToastActivator-$version.exe"
if (![IO.File]::Exists($executable)) {
    $temp = Join-Path $folder ([Guid]::NewGuid().ToString('N') + '.exe')
    try {
        Add-Type -TypeDefinition $source -Language CSharp -OutputAssembly $temp -OutputType WindowsApplication
        try { [IO.File]::Move($temp, $executable) }
        catch [IO.IOException] { if (![IO.File]::Exists($executable)) { throw } }
    } finally { if ([IO.File]::Exists($temp)) { [IO.File]::Delete($temp) } }
}
$clsid = '{4FE06378-A53B-4DBD-B897-073C920113D4}'
$server = [Microsoft.Win32.Registry]::CurrentUser.CreateSubKey("Software\Classes\CLSID\$clsid\LocalServer32")
try {
    $server.SetValue('', '"' + $executable + '"')
    $server.SetValue('ServerExecutable', $executable)
} finally { $server.Dispose() }
$app = [Microsoft.Win32.Registry]::CurrentUser.CreateSubKey('Software\Classes\AppUserModelId\DSH.NotifyInteractive.Preview')
try {
    $app.SetValue('CustomActivator', $clsid)
    $app.SetValue('DisplayName', 'DSH Web')
} finally { $app.Dispose() }
[Console]::Write([Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($executable)))
