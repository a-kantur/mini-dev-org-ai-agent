# Automate running the mini-dev-org-app agent
$projectPath = "C:\Users\anna_\OneDrive\Documents\L&D\Vibe Coding projects\mini-AI-dev-org\mini-dev-org-app"

# Navigate to project
Set-Location $projectPath

# Install dependencies if node_modules missing
if (!(Test-Path "node_modules")) {
    Write-Host "Installing dependencies..."
    npm install
}

# Start the server
Write-Host "Starting server..."
npm start