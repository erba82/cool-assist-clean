Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
 = [System.Windows.Forms.Screen]::PrimaryScreen
 = .Bounds.Width
 = .Bounds.Height
 = .Bounds.Left
 = .Bounds.Top
 = New-Object System.Drawing.Bitmap -ArgumentList , 
 = [System.Drawing.Graphics]::FromImage()
.CopyFromScreen(, , 0, 0, .Size)
.Save(\ C:\Users\Erfan\cool-assist-final\cool-assist-clean\screenshot.png\, [System.Drawing.Imaging.ImageFormat]::Png)
.Dispose()
.Dispose()
