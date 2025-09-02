# Deploy FixItFlow to Vercel
Write-Host "Starting deployment to Vercel..."
Write-Host "Project: FixItFlow"
Write-Host "Domain: fixitflow.online"

# Deploy with yes to all prompts
$env:VERCEL_PROJECT_ID = ""
vercel --prod --confirm
