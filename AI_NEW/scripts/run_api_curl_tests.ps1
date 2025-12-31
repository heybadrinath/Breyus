$BaseUrl = "http://localhost:8000"
$ApiKey = $env:AI_API_KEY
$BaseUrl = $BaseUrl.TrimEnd("/")

$summary = New-Object System.Collections.Generic.List[object]

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss.fff"
    Write-Host "[$timestamp] $Message"
}

function Invoke-CurlRequest {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Path,
        [string]$Body
    )

    $normalizedPath = if ($Path.StartsWith("/")) { $Path } else { "/$Path" }
    $url = "$BaseUrl$normalizedPath"

    Write-Log "STEP: $Name"
    Write-Log "Request: $Method $url"
    $headerInfo = "Content-Type: application/json"
    if ($ApiKey) {
        $headerInfo += "; X-API-Key: (set)"
    } else {
        $headerInfo += "; X-API-Key: (not set)"
    }
    Write-Log "Headers: $headerInfo"
    if ($Body) {
        Write-Log "Request Body: $Body"
    } else {
        Write-Log "Request Body: <none>"
    }

    $curlArgs = @(
        "--silent",
        "--show-error",
        "--location",
        "--request", $Method,
        $url
    )

    if ($ApiKey) {
        $curlArgs += @("--header", "X-API-Key: $ApiKey")
    }
    if ($Method -eq "GET") {
        $curlArgs += @("--header", "Accept: application/json")
    } else {
        $curlArgs += @("--header", "Content-Type: application/json")
    }
    $tempFile = $null
    if ($Body) {
        $tempFile = [System.IO.Path]::GetTempFileName()
        Set-Content -Path $tempFile -Value $Body -Encoding UTF8 -NoNewline
        $curlArgs += @("--data-binary", "@$tempFile")
    }
    $curlArgs += @("--write-out", "`nHTTPSTATUS:%{http_code}`n")

    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $output = & curl.exe @curlArgs 2>&1
    } finally {
        if ($tempFile -and (Test-Path $tempFile)) {
            Remove-Item $tempFile -Force
        }
    }
    $stopwatch.Stop()
    $durationMs = [Math]::Round($stopwatch.Elapsed.TotalMilliseconds, 0)

    $outputText = if ($output -is [array]) { ($output -join "`n") } else { [string]$output }
    $status = ""
    $body = $outputText
    $marker = "HTTPSTATUS:"
    $markerIndex = $outputText.LastIndexOf($marker)
    if ($markerIndex -ge 0) {
        $body = $outputText.Substring(0, $markerIndex).TrimEnd()
        $status = $outputText.Substring($markerIndex + $marker.Length).Trim()
    }
    if (-not $status) {
        $status = "unknown"
    }

    Write-Log "Status: $status"
    Write-Log "DurationMs: $durationMs"
    if ($body) {
        Write-Log "Response Body: $body"
    } else {
        Write-Log "Response Body: <empty>"
    }
    Write-Host ""

    $summary.Add([PSCustomObject]@{
        Name = $Name
        Method = $Method
        Path = $normalizedPath
        Status = $status
        DurationMs = $durationMs
    }) | Out-Null

    return $body
}

if (-not $ApiKey) {
    $envPath = Join-Path $PSScriptRoot "..\.env"
    if (Test-Path $envPath) {
        Get-Content $envPath | ForEach-Object {
            $line = $_.Trim()
            if (-not $line -or $line.StartsWith("#")) { return }
            if ($line -match "^\s*AI_API_KEY\s*=") {
                $ApiKey = ($line -split "=", 2)[1].Trim().Trim("'").Trim('"')
            }
        }
    }
}
if (-not $ApiKey) {
    $ApiKey = "dev-secret-key-change-in-production"
}

Write-Log "Starting AI API curl test run"
Write-Log "BaseUrl: $BaseUrl"
if (-not $ApiKey) {
    Write-Log "WARN: AI_API_KEY is not set. Requests will be sent without X-API-Key."
}
Write-Host ""

Invoke-CurlRequest "Root" "GET" "/" $null
Invoke-CurlRequest "Health" "GET" "/health" $null
Invoke-CurlRequest "Cache Stats" "GET" "/cache/stats" $null

$commoditiesBody = '{ "commodity": "Coffee", "country_preference": "India", "port_preference": "Mumbai", "price_range": { "min": 1000, "max": 3000 }, "limit": 5 }'
Invoke-CurlRequest "Commodities Search Niche (India)" "POST" "/v1/commodities/search-niche" $commoditiesBody

$commoditiesGlobalBody = '{ "commodity": "Coffee", "limit": 5 }'
Invoke-CurlRequest "Commodities Search Niche (Global)" "POST" "/v1/commodities/search-niche" $commoditiesGlobalBody

$commoditiesStrictBody = '{ "commodity": "Coffee", "country_preference": "Brazil", "port_preference": "Santos", "price_range": { "min": 2500, "max": 2600 }, "limit": 5 }'
Invoke-CurlRequest "Commodities Search Niche (Strict Filters)" "POST" "/v1/commodities/search-niche" $commoditiesStrictBody

$linksBody = '{ "role": "buyer", "buyer_name": "Buyer Co", "commodity": "Coffee Beans", "hs_code": "090111", "country_preference": "India", "port_preference": "Nhava Sheva", "price_range": { "min": 2000, "max": 2500 }, "profile": { "country": "Switzerland", "location": { "lat": 47.3769, "lon": 8.5417 }, "mean_monthly_revenue": 550000, "payment_terms": "letter of credit", "credit_score": 720 } }'
Invoke-CurlRequest "Links Predict (Buyer)" "POST" "/v1/links/predict" $linksBody

$linksDeepBody = '{ "role": "buyer", "buyer_name": "Acme Imports", "commodity": "Electrical switches", "hs_code": "85389000", "mode": "deep", "top_k": 150, "country_preference": "Germany" }'
Invoke-CurlRequest "Links Predict (Buyer, Deep)" "POST" "/v1/links/predict" $linksDeepBody

$linksLiteBody = '{ "role": "buyer", "buyer_name": "Buyer Co", "commodity": "Coffee Beans", "hs_code": "090111", "profile": { "country": "Switzerland", "location": { "lat": 47.3769, "lon": 8.5417 } } }'
Invoke-CurlRequest "Links Predict (Buyer, Lite)" "POST" "/v1/links/predict" $linksLiteBody

$linksUnknownBuyerBody = '{ "role": "buyer", "buyer_name": "Unknown Buyer Co", "commodity": "Coffee Beans", "hs_code": "090111", "country_preference": "India", "port_preference": "Nhava Sheva", "price_range": { "min": 2000, "max": 2500 }, "profile": { "country": "Switzerland", "location": { "lat": 47.3769, "lon": 8.5417 } } }'
Invoke-CurlRequest "Links Predict (Buyer, Unknown Name)" "POST" "/v1/links/predict" $linksUnknownBuyerBody

$linksSellerBody = '{ "role": "seller", "seller_name": "Seller Co", "commodity": "Coffee Beans", "hs_code": "090111", "country_preference": "Switzerland", "port_preference": "Rotterdam", "price_range": { "min": 1800, "max": 2600 }, "profile": { "country": "India", "location": { "lat": 12.9716, "lon": 77.5946 }, "mean_monthly_revenue": 500000, "payment_terms": "advance", "credit_score": 680 } }'
Invoke-CurlRequest "Links Predict (Seller)" "POST" "/v1/links/predict" $linksSellerBody

$linksLegacyBody = '{ "entity": { "name": "Buyer Co", "type": "buyer" }, "commodity": "Coffee Beans", "reference_entity": { "name": "Seller Co" } }'
Invoke-CurlRequest "Links Predict (Legacy Payload)" "POST" "/v1/links/predict" $linksLegacyBody

$linksInvalidBody = '{ "commodity": "Coffee Beans" }'
Invoke-CurlRequest "Links Predict (Invalid, No Seeker)" "POST" "/v1/links/predict" $linksInvalidBody

$tradesBody = '{ "role": "buyer", "buyer_name": "Buyer Co", "seller_name": "Seller Co", "commodity": "Coffee Beans", "hs_code": "090111", "buyer_country": "Switzerland", "seller_country": "India", "buyer_port": "Nhava Sheva", "price_range": { "min": 2000, "max": 2500 }, "profile": { "country": "Switzerland", "location": { "lat": 47.3769, "lon": 8.5417 }, "mean_monthly_revenue": 550000, "payment_terms": "letter of credit", "credit_score": 720 } }'
Invoke-CurlRequest "Trades Score (Buyer Role)" "POST" "/v1/trades/score" $tradesBody

$tradesSellerBody = '{ "role": "seller", "seller_name": "Seller Co", "buyer_name": "Buyer Co", "commodity": "Coffee Beans", "hs_code": "090111", "buyer_country": "Switzerland", "seller_country": "India", "buyer_port": "Rotterdam", "price_range": { "min": 1800, "max": 2600 }, "profile": { "country": "India", "location": { "lat": 12.9716, "lon": 77.5946 }, "mean_monthly_revenue": 500000, "payment_terms": "advance", "credit_score": 680 } }'
Invoke-CurlRequest "Trades Score (Seller Role)" "POST" "/v1/trades/score" $tradesSellerBody

$tradesMinimalBody = '{ "buyer_name": "Buyer Co", "seller_name": "Seller Co", "commodity": "Coffee Beans", "hs_code": "090111" }'
Invoke-CurlRequest "Trades Score (Minimal)" "POST" "/v1/trades/score" $tradesMinimalBody

$analysisBody = '{ "commodity": "Coffee Beans", "hs_code": "090111", "market_context": { "buyer_country": "Switzerland", "seller_country": "India", "port": "Nhava Sheva", "price_range": { "min": 2000, "max": 2500 }, "role": "buyer" } }'
$analysisResponse = Invoke-CurlRequest "Analysis Initiate" "POST" "/v1/analysis/initiate" $analysisBody

$jobId = $null
try {
    $parsed = $analysisResponse | ConvertFrom-Json -ErrorAction Stop
    $jobId = $parsed.data.jobId
} catch {
    $jobId = $null
}

if ($jobId) {
    Write-Log "Analysis jobId: $jobId"
    Start-Sleep -Seconds 2
    Invoke-CurlRequest "Analysis Results" "GET" "/v1/analysis/results/$jobId" $null
} else {
    Write-Log "WARN: Could not parse jobId; skipping analysis results."
}

Write-Host ""
Write-Log "Summary"
foreach ($item in $summary) {
    Write-Host ("- {0} {1} {2} status={3} durationMs={4}" -f $item.Method, $item.Path, $item.Name, $item.Status, $item.DurationMs)
}
$totalMs = ($summary | Measure-Object -Property DurationMs -Sum).Sum
Write-Log ("Total DurationMs: {0}" -f [Math]::Round($totalMs, 0))
Write-Log "Done."
