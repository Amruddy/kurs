Option Explicit

Dim shell, fso, scriptRoot, projectRoot, projectRootJson, sessionsRoot, positions, pollMs, lastSoundAt
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
Set positions = CreateObject("Scripting.Dictionary")

scriptRoot = fso.GetParentFolderName(WScript.ScriptFullName)
projectRoot = fso.GetAbsolutePathName(fso.BuildPath(scriptRoot, ".."))
projectRootJson = Replace(projectRoot, "\", "\\")
sessionsRoot = shell.ExpandEnvironmentStrings("%USERPROFILE%") & "\.codex\sessions"
pollMs = 5000
lastSoundAt = 0

Sub PlayNotificationSound()
  Dim nowSeconds
  nowSeconds = Timer

  If nowSeconds < lastSoundAt Then
    lastSoundAt = 0
  End If

  If nowSeconds - lastSoundAt < 8 Then
    Exit Sub
  End If

  lastSoundAt = nowSeconds
  shell.Run "powershell.exe -NoProfile -Command ""[System.Media.SystemSounds]::Asterisk.Play(); Start-Sleep -Milliseconds 450""", 0, False
End Sub

Function TwoDigits(value)
  If Len(CStr(value)) = 1 Then
    TwoDigits = "0" & CStr(value)
  Else
    TwoDigits = CStr(value)
  End If
End Function

Function TodaySessionFolder()
  TodaySessionFolder = sessionsRoot & "\" & Year(Date) & "\" & TwoDigits(Month(Date)) & "\" & TwoDigits(Day(Date))
End Function

Function HasText(haystack, needle)
  HasText = InStr(1, haystack, needle, vbTextCompare) > 0
End Function

Function JsonPair(key, value)
  JsonPair = Chr(34) & key & Chr(34) & ":" & Chr(34) & value & Chr(34)
End Function

Function EscapedJsonPair(key, value)
  EscapedJsonPair = "\" & Chr(34) & key & "\" & Chr(34) & ":" & "\" & Chr(34) & value & "\" & Chr(34)
End Function

Function IsProjectSession(path)
  On Error Resume Next

  Dim stream, text
  IsProjectSession = False
  If Not fso.FileExists(path) Then Exit Function

  Set stream = fso.OpenTextFile(path, 1, False)
  If Err.Number <> 0 Then
    Err.Clear
    Exit Function
  End If

  text = stream.Read(4096)
  stream.Close

  IsProjectSession = HasText(text, JsonPair("cwd", projectRootJson))
End Function

Function HasApprovalRequest(text)
  HasApprovalRequest = HasText(text, JsonPair("type", "function_call")) And _
    (HasText(text, EscapedJsonPair("sandbox_permissions", "require_escalated")) Or _
     HasText(text, JsonPair("name", "request_user_input")) Or _
     HasText(text, JsonPair("name", "functions.request_user_input")))
End Function

Function HasTaskComplete(text)
  HasTaskComplete = HasText(text, JsonPair("type", "task_complete"))
End Function

Sub CheckFile(path)
  On Error Resume Next

  Dim file, oldPos, stream, text
  If Not fso.FileExists(path) Then Exit Sub

  Set file = fso.GetFile(path)
  If Not IsProjectSession(path) Then
    positions(path) = CLng(file.Size)
    Exit Sub
  End If

  If positions.Exists(path) Then
    oldPos = CLng(positions(path))
  Else
    positions.Add path, CLng(file.Size)
    Exit Sub
  End If

  If file.Size < oldPos Then oldPos = 0
  If file.Size = oldPos Then
    positions(path) = CLng(file.Size)
    Exit Sub
  End If

  Set stream = fso.OpenTextFile(path, 1, False)
  stream.Skip oldPos
  text = stream.ReadAll
  stream.Close

  positions(path) = CLng(file.Size)

  If HasTaskComplete(text) Then
    PlayNotificationSound
  End If
End Sub

Sub CheckFolder(folderPath)
  On Error Resume Next

  Dim folder, file
  If Not fso.FolderExists(folderPath) Then Exit Sub

  Set folder = fso.GetFolder(folderPath)
  For Each file In folder.Files
    If LCase(fso.GetExtensionName(file.Name)) = "jsonl" Then
      CheckFile file.Path
    End If
  Next
End Sub

Do
  CheckFolder TodaySessionFolder()
  WScript.Sleep pollMs
Loop
