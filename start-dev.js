const { spawn } = require('child_process');

console.log('\n======================================================');
console.log('🚀 Starting NagrikSeva Full-Stack Development Services');
console.log('======================================================\n');

// Start backend
const backend = spawn('npm', ['--prefix', 'backend', 'run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

// Start frontend
const frontend = spawn('npm', ['--prefix', 'frontend', 'run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

const cleanup = () => {
  console.log('\n🛑 Shutting down NagrikSeva servers...');
  if (backend) backend.kill();
  if (frontend) frontend.kill();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
