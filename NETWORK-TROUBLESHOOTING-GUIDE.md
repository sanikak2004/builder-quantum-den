# Network Troubleshooting Guide

This guide helps you resolve common network and Docker issues with the Authen Ledger eKYC system.

## Common Issues and Solutions

### 1. Docker Service Not Running

#### Symptoms:
- Error messages like "Cannot connect to the Docker daemon"
- "The command 'docker' could not be found"
- Services failing to start due to Docker dependency

#### Solutions:

**For Windows:**

1. **Check if Docker Desktop is installed:**
   ```powershell
   Test-Path "C:\Program Files\Docker\Docker\Docker Desktop.exe"
   ```

2. **Start Docker Desktop:**
   ```powershell
   Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
   ```

3. **If Docker Desktop won't start, try running as administrator:**
   ```powershell
   Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe" -Verb RunAs
   ```

4. **Check Docker service status:**
   ```powershell
   Get-Service *docker*
   ```

5. **Start Docker service (if available):**
   ```powershell
   Start-Service com.docker.service
   ```

**For Linux/macOS:**

1. **Start Docker service:**
   ```bash
   sudo systemctl start docker
   # or
   sudo service docker start
   ```

2. **Enable Docker to start on boot:**
   ```bash
   sudo systemctl enable docker
   ```

### 2. Hyperledger Fabric Network Issues

#### Symptoms:
- "Failed to initialize Hyperledger Fabric connection"
- "Required certificate files not found"
- Blockchain operations failing

#### Solutions:

1. **Check if required files exist:**
   ```bash
   ls -la server/blockchain/crypto-config/
   ls -la server/blockchain/wallet/
   ```

2. **Run the Fabric network setup script:**
   ```bash
   chmod +x scripts/setup-fabric-network.sh
   ./scripts/setup-fabric-network.sh
   ```

3. **Start the Fabric network:**
   ```bash
   cd server/blockchain/network
   docker-compose -f docker-compose-authen-ledger.yaml up -d
   ```

4. **Check network status:**
   ```bash
   docker ps
   ```

5. **View network logs:**
   ```bash
   docker-compose -f docker-compose-authen-ledger.yaml logs
   ```

### 3. IPFS Service Issues

#### Symptoms:
- "IPFS not available"
- Document storage failing
- Hash verification issues

#### Solutions:

1. **Check if IPFS is running:**
   ```bash
   curl -X POST http://127.0.0.1:5001/api/v0/id
   ```

2. **Start IPFS daemon:**
   ```bash
   ipfs daemon
   ```

3. **Initialize IPFS (if not already done):**
   ```bash
   ipfs init
   ```

### 4. Connection Profile Issues

#### Symptoms:
- "Failed to load connection profile"
- "Invalid connection profile format"
- Network connection failures

#### Solutions:

1. **Validate connection profile JSON:**
   ```bash
   cat server/blockchain/connection-profile.json | python -m json.tool
   ```

2. **Check file permissions:**
   ```bash
   ls -la server/blockchain/connection-profile.json
   ```

3. **Restore default connection profile if corrupted:**
   ```bash
   cp server/blockchain/connection-profile.json.backup server/blockchain/connection-profile.json
   ```

## Environment Configuration

### Development Environment (.env)

Ensure your [.env](file:///c:/Users/ARYAN/Desktop/newbuild/builder-quantum-den/.env) file has the correct settings:

```bash
# Enable/disable services based on availability
FABRIC_ENABLED=false  # Set to true when Fabric network is running
IPFS_ENABLED=false    # Set to true when IPFS is running

# Service fallback configuration
BLOCKCHAIN_FALLBACK_ENABLED=true
SIMULATED_BLOCKCHAIN=true
```

### Production Environment (.env.production)

For production deployments:

```bash
# Enable real services when available
FABRIC_ENABLED=true
IPFS_ENABLED=true

# Disable fallbacks in production
BLOCKCHAIN_FALLBACK_ENABLED=false
SIMULATED_BLOCKCHAIN=false
```

## Testing Network Connectivity

### Test Docker Connectivity

```bash
# Check Docker version
docker --version

# Check Docker info
docker info

# Run a simple test container
docker run hello-world
```

### Test Blockchain Connectivity

```bash
# Check if Fabric containers are running
docker ps | grep fabric

# Test connection to Fabric peer
telnet localhost 7051

# Test connection to Fabric CA
telnet localhost 7054
```

### Test IPFS Connectivity

```bash
# Check IPFS API
curl -X POST http://127.0.0.1:5001/api/v0/version

# Check IPFS Gateway
curl http://127.0.0.1:8080/ipfs/QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn

# Check IPFS connectivity
curl -X POST http://127.0.0.1:5001/api/v0/swarm/peers
```

## Service Health Check Endpoints

The application provides several health check endpoints:

1. **Basic Health Check:**
   ```
   GET /api/health
   ```

2. **Database Test:**
   ```
   GET /api/database/test
   ```

3. **Ping Test:**
   ```
   GET /api/ping
   ```

4. **Blockchain Status:**
   ```
   GET /api/blockchain/status
   ```

## Fallback Mechanisms

The system includes several fallback mechanisms:

1. **Simulated Blockchain**: When the real Hyperledger Fabric network is not available, the system uses a simulated blockchain that provides the same API interface but doesn't actually connect to a real network.

2. **Mock IPFS Storage**: When IPFS is not available, document storage uses local mock storage.

3. **Graceful Degradation**: Services continue to operate with reduced functionality when dependencies are not available.

To check if you're using fallback mechanisms, look at the health check response:

```json
{
  "services": {
    "fabric": {
      "connected": false,
      "usingRealNetwork": false,
      "status": "Using simulated blockchain"
    }
  }
}
```

## Common Error Messages and Solutions

### "Failed to initialize Hyperledger Fabric connection"

**Cause**: Missing certificate files or Fabric network not running.

**Solution**: 
1. Run the Fabric setup script
2. Start the Fabric network with Docker Compose
3. Check that certificate files exist in the expected locations

### "IPFS not available"

**Cause**: IPFS daemon not running or not installed.

**Solution**:
1. Install IPFS if not already installed
2. Start the IPFS daemon
3. Check IPFS API connectivity

### "Required certificate files not found"

**Cause**: Cryptographic material not generated for the Fabric network.

**Solution**:
1. Run the Fabric network setup script which generates certificates
2. Check that the [crypto-config](file:///c:/Users/ARYAN/Desktop/newbuild/builder-quantum-den/server/blockchain/crypto-config) directory exists and has content

### "Cannot connect to the Docker daemon"

**Cause**: Docker service not running or not accessible.

**Solution**:
1. Start Docker Desktop or the Docker service
2. Check that your user has permissions to access Docker
3. On Linux, you might need to add your user to the docker group:
   ```bash
   sudo usermod -aG docker $USER
   ```

## Advanced Troubleshooting

### Enable Debug Logging

Set these environment variables for more detailed logging:

```bash
LOG_LEVEL=debug
DEBUG=*
```

### Check System Resources

Monitor system resources when running the full stack:

```bash
# Check Docker resource usage
docker stats

# Check system resources
htop  # or top on macOS/Linux
```

### Network Port Conflicts

If you get port binding errors, check what's using the ports:

```bash
# Windows
netstat -ano | findstr :7051

# Linux/macOS
lsof -i :7051
```

Then kill the conflicting process if needed:

```bash
# Windows
taskkill /PID <process_id> /F

# Linux/macOS
kill -9 <process_id>
```

## Getting Help

If you're still experiencing issues:

1. Check the application logs for detailed error messages
2. Verify all environment variables are correctly set
3. Ensure all required services are running
4. Check that firewall settings allow the required ports
5. Consult the project documentation for your specific deployment scenario

For additional support, you can:
- Check the GitHub issues for similar problems
- Reach out to the development team
- Consult the Hyperledger Fabric and IPFS documentation