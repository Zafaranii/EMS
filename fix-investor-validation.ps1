$file = 'd:\Work\Personal\Task\frontend\redesign\src\app\pages\reservation\reservation.component.ts'
$content = Get-Content $file -Raw

# Replace the investor availability find logic
$content = $content -replace `
  'const investorAvailability = inv\.availability\.find\(a => a\.sector === sector\);', `
  'const investorAvailability = inv.availability.find(a => a.sector === sector && a.availableDate === date);'

# Replace the error message
$content = $content -replace `
  'Investor is not available for the \$\{sector\} sector\.', `
  'Investor is not available for $${sector} on $${date}.'

Set-Content $file $content
Write-Host "✓ Updated investor availability validation"
