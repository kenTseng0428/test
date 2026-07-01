param(
  [int]$Port = 8000,
  [string]$Root = $PSScriptRoot,
  [string]$Index = "index.html"
)

$ErrorActionPreference = "Stop"
$resolvedRoot = (Resolve-Path -LiteralPath $Root).Path

$mimeTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".htm"  = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".png"  = "image/png"
  ".jpg"  = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".gif"  = "image/gif"
  ".svg"  = "image/svg+xml"
  ".ico"  = "image/x-icon"
  ".json" = "application/json; charset=utf-8"
}

function Send-TextResponse {
  param(
    [System.Net.HttpListenerResponse]$Response,
    [int]$StatusCode,
    [string]$Body
  )

  $bytes = [System.Text.Encoding]::UTF8.GetBytes($Body)
  $Response.StatusCode = $StatusCode
  $Response.ContentType = "text/plain; charset=utf-8"
  $Response.ContentLength64 = $bytes.Length
  $Response.OutputStream.Write($bytes, 0, $bytes.Length)
}

$listener = [System.Net.HttpListener]::new()
$prefix = "http://localhost:$Port/"
$listener.Prefixes.Add($prefix)
$listener.Start()
Write-Host "Serving $resolvedRoot at $prefix"

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $requestPath = [System.Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart("/"))

    if ([string]::IsNullOrWhiteSpace($requestPath)) {
      $requestPath = $Index
    }

    $requestPath = $requestPath -replace "/", [System.IO.Path]::DirectorySeparatorChar
    $candidate = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($resolvedRoot, $requestPath))

    if (-not $candidate.StartsWith($resolvedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
      Send-TextResponse -Response $context.Response -StatusCode 403 -Body "Forbidden"
      $context.Response.Close()
      continue
    }

    if (-not [System.IO.File]::Exists($candidate)) {
      Send-TextResponse -Response $context.Response -StatusCode 404 -Body "Not found"
      $context.Response.Close()
      continue
    }

    $extension = [System.IO.Path]::GetExtension($candidate).ToLowerInvariant()
    $contentType = if ($mimeTypes.ContainsKey($extension)) { $mimeTypes[$extension] } else { "application/octet-stream" }
    $bytes = [System.IO.File]::ReadAllBytes($candidate)

    $context.Response.StatusCode = 200
    $context.Response.ContentType = $contentType
    $context.Response.ContentLength64 = $bytes.Length
    $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    $context.Response.Close()
  }
}
finally {
  if ($listener.IsListening) {
    $listener.Stop()
  }
  $listener.Close()
}
