$ErrorActionPreference = 'Stop'
# Reuse a healthy Atlas server instead of starting a second process on its port.
$atlasPortBusy = $false
$atlasProbe = New-Object System.Net.Sockets.TcpClient
try {
    $atlasProbe.Connect('127.0.0.1', 8000)
    $atlasPortBusy = $true
} catch [System.Net.Sockets.SocketException] {
    # No listener: proceed with normal startup.
} finally {
    $atlasProbe.Dispose()
}
if ($atlasPortBusy) {
    $atlasAlreadyRunning = $false
    try {
        $atlasHealth = Invoke-RestMethod 'http://127.0.0.1:8000/health' -TimeoutSec 5
        $atlasSchema = Invoke-RestMethod 'http://127.0.0.1:8000/openapi.json' -TimeoutSec 5
        $atlasAlreadyRunning = $atlasHealth.status -eq 'healthy' -and $atlasSchema.info.title -eq 'Project Atlas API'
    } catch {
        # An occupied port alone does not identify a healthy Atlas server.
    }
    if ($atlasAlreadyRunning) {
        Write-Host 'Project Atlas backend is already running at http://127.0.0.1:8000'
        Write-Host 'API docs: http://127.0.0.1:8000/docs'
        return
    }
    throw 'Port 8000 is occupied by another service or an unhealthy backend. Close that process, then rerun this launcher. Use netstat -ano | findstr :8000 to identify its PID.'
}
$atlasPreviousDatabaseUrl = $env:DATABASE_URL
Push-Location $PSScriptRoot
try {
    $atlasPython = Join-Path $PSScriptRoot '.venv/Scripts/python.exe'
    if (-not (Test-Path -LiteralPath $atlasPython)) {
        throw 'Install dependencies first: python -m venv .venv; .venv/Scripts/python -m pip install -r requirements-dev.txt'
    }
    # Explicit local-only database; the existing .env may point at a shared database.
    $env:DATABASE_URL = 'sqlite:///' + ((Join-Path $PSScriptRoot 'atlas-local.db') -replace '\\', '/')
    & $atlasPython -m app.init_db
    if ($LASTEXITCODE -ne 0) { throw 'Database initialization failed.' }
    & $atlasPython -m uvicorn app.main:app --host 127.0.0.1 --port 8000
} finally {
    if ($null -eq $atlasPreviousDatabaseUrl) {
        Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
    } else {
        $env:DATABASE_URL = $atlasPreviousDatabaseUrl
    }
    Pop-Location
}
