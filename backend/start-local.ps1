$ErrorActionPreference = 'Stop'
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
