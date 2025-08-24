# 🧭 Compass Daemon Setup Guide

Now you can run Compass as a proper background daemon! Here are all your options for running Compass in the background.

## 🚀 Quick Start

### **Option 1: Built-in Daemon (Simple)**

```bash
# Build the updated compass
go build -o compass ./cmd/compass/

# Start as daemon
./compass start --daemon

# Check status
./compass status

# Stop daemon
./compass stop

# Restart daemon
./compass restart
```

### **Option 2: Systemd Service (Advanced)**

```bash
# Install as systemd user service
./scripts/install-service.sh

# Control with systemd
systemctl --user start compass
systemctl --user status compass
systemctl --user stop compass
systemctl --user restart compass
```

## 📋 **What Changed**

✅ **Added `internal/daemon/daemon.go`** - Complete daemon management  
✅ **Updated `cmd/compass/main.go`** - Proper daemon implementation  
✅ **Added systemd service file** - System integration  
✅ **Added installation script** - Easy setup  

## 🛠️ **Available Commands**

| Command | Description | Works With |
|---------|-------------|------------|
| `compass start` | Start in foreground | Both |
| `compass start --daemon` | Start as background daemon | Built-in |
| `compass stop` | Stop daemon | Both |
| `compass restart` | Restart daemon | Built-in |
| `compass status` | Show daemon status + config | Both |
| `compass stats` | Show activity statistics | Both |
| `systemctl --user start compass` | Start systemd service | Systemd |
| `systemctl --user status compass` | Check systemd status | Systemd |

## 📍 **Daemon Files**

### Built-in Daemon:
- **PID file**: `~/.compass/compass.pid`
- **Log file**: `~/.compass/compass.log`
- **Config**: `~/.config/compass/config.yaml`
- **Database**: `~/.compass/compass.db`

### Systemd Service:
- **Service file**: `~/.config/systemd/user/compass.service`
- **Logs**: `journalctl --user -u compass`
- **Config**: Same as built-in

## 🔍 **Why Daemon Mode?**

### **Before (No Daemon)**
❌ Terminal must stay open  
❌ Process dies if terminal closes  
❌ No background tracking  
❌ Manual process management  

### **After (With Daemon)**
✅ Runs in background  
✅ Survives terminal closure  
✅ Continuous activity tracking  
✅ Proper process management  
✅ Log files and PID management  
✅ Graceful start/stop/restart  

## ⚡ **Usage Examples**

### **Daily Usage**
```bash
# Start tracking when you begin work
compass start --daemon

# Check if it's running
compass status

# View your stats during the day
compass stats

# Stop when done
compass stop
```

### **Auto-start Setup (Systemd)**
```bash
# Install as service
./scripts/install-service.sh

# Enable auto-start on login
systemctl --user enable compass

# Start now
systemctl --user start compass

# Check logs
journalctl --user -u compass -f
```

### **Development/Testing**
```bash
# Run in foreground (for debugging)
compass start

# Or test daemon mode
compass start --daemon
compass status
compass stop
```

## 🔧 **Troubleshooting**

### **Issue: "daemon is already running"**
```bash
compass status  # Check if really running
compass stop    # Stop if needed
compass start --daemon  # Start fresh
```

### **Issue: Daemon won't start**
```bash
# Check logs
cat ~/.compass/compass.log

# Or for systemd
journalctl --user -u compass --no-pager
```

### **Issue: Can't connect to dashboard**
```bash
compass status  # Verify daemon is running
curl http://localhost:8080/api/health  # Test API
```

### **Issue: Permission denied**
```bash
# Ensure compass binary is executable
chmod +x compass

# Check ownership of files
ls -la ~/.compass/
```

## 📊 **Monitoring**

### **Check Daemon Status**
```bash
compass status
# Shows: daemon status, PID, uptime, config paths
```

### **View Real-time Logs**
```bash
# Built-in daemon
tail -f ~/.compass/compass.log

# Systemd service  
journalctl --user -u compass -f
```

### **Performance Monitoring**
```bash
# Check process info
ps aux | grep compass

# Check resource usage
htop | grep compass
```

## 🎯 **Best Practices**

### **For Daily Use**
1. **Use built-in daemon** for simplicity: `compass start --daemon`
2. **Check status regularly**: `compass status`
3. **Stop cleanly**: `compass stop` (not kill -9)

### **For System Integration**
1. **Use systemd service** for auto-start
2. **Monitor with systemctl**: `systemctl --user status compass`
3. **Check logs regularly**: `journalctl --user -u compass`

### **For Development**
1. **Start in foreground** for debugging: `compass start`
2. **Use daemon mode** for testing: `compass start --daemon`
3. **Check logs** for errors: `cat ~/.compass/compass.log`

## ✅ **Verification Checklist**

- [ ] Compass builds without errors: `go build -o compass ./cmd/compass/`
- [ ] Daemon starts successfully: `compass start --daemon`
- [ ] Status shows running: `compass status`
- [ ] Dashboard accessible: `curl http://localhost:8080/api/health`
- [ ] Daemon stops cleanly: `compass stop`
- [ ] Log file created: `ls -la ~/.compass/compass.log`
- [ ] PID file managed properly: `ls -la ~/.compass/compass.pid`

## 🎉 **You're Done!**

Your Compass now runs as a proper daemon! 🎊

- ✅ **Background execution** without terminal dependency
- ✅ **Proper process management** with PID files  
- ✅ **Logging system** for debugging
- ✅ **Graceful shutdown** handling
- ✅ **System integration** with systemd
- ✅ **Auto-start capability** on login

**Dashboard**: http://localhost:8080  
**Commands**: `compass start --daemon`, `compass stop`, `compass status`  
**Logs**: `~/.compass/compass.log`  

Happy tracking! 🧭✨
