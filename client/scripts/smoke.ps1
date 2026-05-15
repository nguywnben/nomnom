try {
  $r = Invoke-WebRequest -Uri http://localhost:5173/ -UseBasicParsing -TimeoutSec 5
  Write-Host ("HTTP " + $r.StatusCode)
  Write-Host "---HEAD---"
  $head = $r.Content.Substring(0, [Math]::Min(1200, $r.Content.Length))
  Write-Host $head
} catch {
  Write-Host ("ERR: " + $_.Exception.Message)
}
