<#
.SYNOPSIS
    把本仓库的 skill 安装到 agent 读取的目录。

.DESCRIPTION
    默认复制到 ~\.dsh\skills（DeepSeek Harness 的用户级 skills 目录）。
    用 -Link 改为创建目录联接，之后修改仓库内容即时生效；
    用其他 agent 时把 -Target 指到对应目录，例如 -Target "$HOME\.agents\skills"。

.EXAMPLE
    .\scripts\install.ps1

.EXAMPLE
    .\scripts\install.ps1 -Link

.EXAMPLE
    .\scripts\install.ps1 -Skill project-analysis -Target "$HOME\.agents\skills"
#>
[CmdletBinding()]
param(
    [string]$Target = (Join-Path $HOME ".dsh\skills"),
    [string[]]$Skill,
    [switch]$Link,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$skillsRoot = Join-Path $repoRoot "skills"

if (-not (Test-Path $skillsRoot)) {
    throw "找不到 skills 目录：$skillsRoot"
}

# 收集可用 skill：目录型（带 SKILL.md）与单文件型都算
$available = @()
Get-ChildItem $skillsRoot -Directory | Where-Object {
    $_.Name -notlike ".*" -and (Test-Path (Join-Path $_.FullName "SKILL.md"))
} | ForEach-Object {
    $available += [pscustomobject]@{ Name = $_.Name; Path = $_.FullName; Kind = "dir" }
}
Get-ChildItem $skillsRoot -File -Filter "*.md" | ForEach-Object {
    $available += [pscustomobject]@{ Name = $_.BaseName; Path = $_.FullName; Kind = "file" }
}

if ($available.Count -eq 0) {
    throw "skills 目录里没有任何 skill。"
}

if ($Skill) {
    $missing = $Skill | Where-Object { $_ -notin $available.Name }
    if ($missing) {
        throw "找不到 skill：$($missing -join ', ')。可用：$($available.Name -join ', ')"
    }
    $selected = $available | Where-Object { $Skill -contains $_.Name }
}
else {
    $selected = $available
}

New-Item -ItemType Directory -Force -Path $Target | Out-Null
Write-Host "目标目录：$Target"
Write-Host ("方式：" + $(if ($Link) { "目录联接（改仓库即时生效）" } else { "复制" }))
Write-Host ""

$installed = 0
foreach ($item in $selected) {
    $dest = Join-Path $Target $item.Name

    if (Test-Path $dest) {
        if (-not $Force) {
            Write-Host "  跳过  $($item.Name)（已存在，加 -Force 覆盖）" -ForegroundColor Yellow
            continue
        }
        Remove-Item $dest -Recurse -Force
    }

    if ($Link) {
        if ($item.Kind -eq "file") {
            # 单文件不支持联接，退回复制
            Copy-Item $item.Path $dest -Force
        }
        else {
            New-Item -ItemType Junction -Path $dest -Target $item.Path | Out-Null
        }
    }
    else {
        Copy-Item $item.Path $dest -Recurse -Force
    }

    Write-Host "  完成  $($item.Name)" -ForegroundColor Green
    $installed++
}

Write-Host ""
Write-Host "已安装 $installed 个 skill 到 $Target"
Write-Host "提示：DSH 在启动/加载时读取 skills 目录，装完建议在会话里新开一轮对话，或重启应用。"
