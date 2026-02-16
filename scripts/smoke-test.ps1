# Smoke test post-deploy:
# - health
# - login
# - availability
# - create booking
$ErrorActionPreference = "Stop"

$base = "http://localhost:8080/api/v1"
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

Write-Host "[1/4] Health check"
$health = Invoke-RestMethod -Uri "$base/health/ready" -Method Get -WebSession $session
if ($health.status -ne "ready") {
  throw "Health check fallito"
}

Write-Host "[2/4] Login member demo"
$loginBody = @{ email = "member@ludocloud.local"; password = "Password123!" } | ConvertTo-Json
$login = Invoke-RestMethod -Uri "$base/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -WebSession $session
$token = $login.accessToken
if (-not $token) {
  throw "Token non ricevuto"
}

$headers = @{ Authorization = "Bearer $token" }

Write-Host "[3/4] Recupero disponibilita tavoli"
$start = (Get-Date).AddDays(2).Date.AddHours(18)
$end = $start.AddMinutes(90)
$tablesUrl = "$base/tables?startAt=$([uri]::EscapeDataString($start.ToUniversalTime().ToString("o")))&endAt=$([uri]::EscapeDataString($end.ToUniversalTime().ToString("o")))"
$tables = Invoke-RestMethod -Uri $tablesUrl -Method Get -Headers $headers -WebSession $session
if (-not $tables -or $tables.Count -eq 0) {
  throw "Nessun tavolo disponibile"
}

$tableId = $tables[0].id

Write-Host "[4/4] Creazione prenotazione smoke"
$bookingBody = @{
  tableId = $tableId
  startAt = $start.ToUniversalTime().ToString("o")
  endAt = $end.ToUniversalTime().ToString("o")
  peopleCount = 2
  notes = "Smoke test"
  gameSelections = @()
} | ConvertTo-Json

$booking = Invoke-RestMethod -Uri "$base/bookings" -Method Post -Body $bookingBody -ContentType "application/json" -Headers $headers -WebSession $session

Write-Host "Smoke test completato. Booking ID: $($booking.id)"
