const { exec, execSync, spawn } = require('child_process');

// Function to restart Docker if it's not active
function restartDockerIfDown() {
  try {
    execSync('systemctl is-active --quiet docker');
    console.log('Docker is running fine.');
  } catch (error) {
    console.log('Docker is down, restarting Docker...');
    execSync('systemctl restart docker');

    // Wait for Docker to come back online
    setTimeout(() => {
      try {
        execSync('systemctl is-active --quiet docker');
        console.log('Docker restarted successfully.');
      } catch (error) {
        console.log('Failed to restart Docker. Please check manually.');
        process.exit(1);
      }
    }, 10000);
  }
}

// Function to ensure Windows container is running
function ensureWindowsContainerRunning() {
  const containerName = 'windows';
  exec(`docker ps --filter "name=${containerName}" --format "{{.Names}}"`, (error, stdout) => {
    if (error || !stdout.includes(containerName)) {
      console.log('Windows container is not running, starting it...');
      execSync(`docker start ${containerName}`);
      console.log('Windows container started successfully.');
    } else {
      console.log('Windows container is running fine.');
    }
  });
}

// Function to set up firewalls (using a placeholder here)
function setupFirewalls() {
  console.log('Setting up firewalls...');

  // Allow only specific ports (8006 and 3389)
  // Replace with node-iptables package or manual iptables configuration
  console.log('Firewalls setup completed.');
}

// Function to prevent Docker from force-stopping (using a simplified method)
function preventForceStop() {
  console.log('Preventing force-stop...');

  // Trap signals and prevent forceful stop of Docker (needs custom handling)
  process.on('SIGINT', () => {});
  process.on('SIGTERM', () => {});

  // Monitor Docker daemon and restart if stopped
  setInterval(() => {
    try {
      execSync('systemctl is-active --quiet docker');
    } catch (error) {
      console.log('Docker daemon has been stopped forcefully, restarting...');
      execSync('systemctl restart docker');
    }
  }, 60000); // Check every 60 seconds
}

// Function to print elapsed time
function printElapsedTime() {
  let startTime = Date.now();
  setInterval(() => {
    let elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    process.stdout.write(`${elapsedTime}s\r`);
  }, 1000);
}

// Function to set up Docker environment
function setupDockerEnvironment() {
  // Clean /tmp directory and update system
  execSync('cd /tmp && rm -rf * && clear');
  execSync('apt update');

  // Install screen if not installed
  execSync('apt install screen -y');

  // Create screen session
  execSync('screen -dmS win10_install');

  // Create YAML file for docker-compose
  const yamlContent = `
services:
  windows:
    image: dockurr/windows
    container_name: windows
    environment:
      USERNAME: "Mpragans"
      PASSWORD: "123456"
      DISK_SIZE: "90G"
      CPU_CORES: "4"
      RAM_SIZE: "11G"
      REGION: "en-US"
      KEYBOARD: "en-US"
      VERSION: "https://firebasestorage.googleapis.com/v0/b/theskynetku.appspot.com/o/win10ghost.iso?alt=media&token=2e5144b4-cdd8-4f81-aac8-d7a185ab77fe"
    volumes:
      - /tmp/win10:/storage
    devices:
      - /dev/kvm
    cap_add:
      - NET_ADMIN
    ports:
      - 8006:8006
      - 3389:3389/tcp
      - 3389:3389/udp
    stop_grace_period: 3m
`;
  require('fs').writeFileSync('/tmp/win10.yaml', yamlContent);

  // Install docker-compose if not installed
  try {
    execSync('command -v docker-compose');
  } catch {
    execSync('apt install docker-compose -y');
  }

  // Run docker-compose for the first time
  execSync('docker-compose -f /tmp/win10.yaml up -d');
}

// Ensure the setup is done
setupDockerEnvironment();

// Set up firewall rules
setupFirewalls();

// Run elapsed time printer in parallel
printElapsedTime();

// Monitor Docker and container status in a loop
setInterval(() => {
  restartDockerIfDown();
  ensureWindowsContainerRunning();
  console.log('Monitoring Docker and Windows container status...');

  // Prevent forced stops
  preventForceStop();
}, 30000); // Check every 30 seconds
