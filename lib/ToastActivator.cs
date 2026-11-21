// Per-user, windowless COM local server. The host owns all DSH identities and answers.
using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;

[ComImport, ComVisible(true), Guid("53E31837-6600-4A81-9395-75CFFE746F94"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface INotificationActivationCallback {
    void Activate([MarshalAs(UnmanagedType.LPWStr)] string app, [MarshalAs(UnmanagedType.LPWStr)] string argument,
                  [In, MarshalAs(UnmanagedType.LPArray, SizeParamIndex = 3)] ToastInput[] input, uint count);
}

[StructLayout(LayoutKind.Sequential)]
public struct ToastInput {
    [MarshalAs(UnmanagedType.LPWStr)] public string Key;
    [MarshalAs(UnmanagedType.LPWStr)] public string Value;
}

[ComVisible(true), Guid("4FE06378-A53B-4DBD-B897-073C920113D4"), ClassInterface(ClassInterfaceType.None)]
public class ToastActivator : INotificationActivationCallback {
    internal static string Inbox(string instance) {
        return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "DSHNotifyInteractive", "toast", instance);
    }

    public void Activate(string app, string argument, ToastInput[] input, uint count) {
        if (app != "DSH.NotifyInteractive.Preview" || argument == null ||
            !Regex.IsMatch(argument, @"\A[0-9a-f]{32}/[0-9a-f]{32}\z") || count > 1) return;
        string[] parts = argument.Split('/');
        string folder = Inbox(parts[0]);
        if (!Directory.Exists(folder)) return;

        string reply = "";
        if (count == 1) {
            if (input == null || input.Length != 1 || input[0].Key != "reply") return;
            reply = input[0].Value ?? "";
            if (reply.Length > 8000) return;
        }
        string temp = Path.Combine(folder, Guid.NewGuid().ToString("N") + ".tmp");
        try {
            File.WriteAllText(temp, reply, new UTF8Encoding(false));
            // Atomic publish. The host consumes this opaque button identity once.
            File.Move(temp, Path.Combine(folder, parts[1] + ".reply"));
        } catch (IOException) {
            // A repeated click or a retired host cannot deliver a second answer.
        } finally { if (File.Exists(temp)) File.Delete(temp); }
    }
}

internal class Program {
    [MTAThread]
    static void Main(string[] args) {
        var registration = new RegistrationServices();
        int cookie = registration.RegisterTypeForComClients(typeof(ToastActivator),
            RegistrationClassContext.LocalServer, RegistrationConnectionType.MultipleUse);
        try {
            if (args.Length == 2 && args[0] == "--host" && Regex.IsMatch(args[1], @"\A[0-9a-f]{32}\z")) {
                string inbox = ToastActivator.Inbox(args[1]);
                Directory.CreateDirectory(inbox);
                Console.WriteLine("ready");
                Console.Out.Flush();
                try { Console.ReadLine(); } // EOF also closes the inbox if WSL terminates unexpectedly.
                finally {
                    try { Directory.Delete(inbox, true); } catch (IOException) { }
                }
            } else {
                Thread.Sleep(TimeSpan.FromSeconds(15));
            }
        }
        finally { registration.UnregisterTypeForComClients(cookie); }
    }
}
