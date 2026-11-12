# Asks Windows to stay out of idle sleep for as long as one process runs, and exits with it.
#
# Windows sleeps on a lack of keyboard and mouse input, whatever is running. A suspend in the
# middle of an E2E run stalls every worker at once and reports their tests as timed out. This
# blocks idle sleep only: the screen may still turn off, and the lid or the power button still
# sleeps the machine.
#
# `tests/global-setup.ts` starts it with the runner's process id, so there is nothing to stop:
# it ends when the runner does, however the run ended.
param(
  [Parameter(Mandatory = $true)]
  [int]$ParentPid
)

$parent = Get-Process -Id $ParentPid -ErrorAction SilentlyContinue
if ($null -eq $parent) { exit 0 }
# A process id is reused once its process has gone, so the start time says it is still the runner.
$startedAt = $parent.StartTime

Add-Type -Namespace KeepAwake -Name Power -MemberDefinition @'
[System.Runtime.InteropServices.DllImport("kernel32.dll")]
public static extern uint SetThreadExecutionState(uint esFlags);
'@
# ES_CONTINUOUS | ES_SYSTEM_REQUIRED: stay out of idle sleep until this thread says otherwise.
$ES_CONTINUOUS = [uint32]2147483648
$ES_SYSTEM_REQUIRED = [uint32]1

try {
  [KeepAwake.Power]::SetThreadExecutionState($ES_CONTINUOUS -bor $ES_SYSTEM_REQUIRED) | Out-Null
  while ($true) {
    Start-Sleep -Seconds 5
    $current = Get-Process -Id $ParentPid -ErrorAction SilentlyContinue
    if ($null -eq $current -or $current.StartTime -ne $startedAt) { break }
  }
} finally {
  [KeepAwake.Power]::SetThreadExecutionState($ES_CONTINUOUS) | Out-Null
}
