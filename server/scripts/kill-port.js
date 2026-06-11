const { execSync } = require('child_process');
try {
  execSync(
    'powershell -Command "Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }"',
    { stdio: 'pipe' }
  );
  console.log('Port 5000 cleared.');
} catch (e) {
  // Nothing was on the port — that's fine
}
