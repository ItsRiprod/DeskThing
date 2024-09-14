#!/bin/sh

# Port for the proxy
LISTENING_PORT=8891
TARGET_HOST='127.0.0.1'
TARGET_PORT=8891

# Define log file for debugging
LOG_FILE="/var/log/setup-proxy.log"

# Function to log messages
log_message() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> $LOG_FILE
}

# Notify that the script has started
log_message "Starting proxy setup on port $LISTENING_PORT, forwarding to $TARGET_HOST:$TARGET_PORT"

# Flush existing iptables rules
log_message "Flushing existing iptables rules..."
if iptables -t nat -F && iptables -F; then
  log_message "Successfully flushed existing iptables rules."
else
  log_message "Failed to flush existing iptables rules."
  exit 1
fi

# Set up iptables rule for port forwarding
log_message "Setting up iptables rule..."
if iptables -t nat -A PREROUTING -p tcp --dport $LISTENING_PORT -j DNAT --to-destination $TARGET_HOST:$TARGET_PORT &&
   iptables -t nat -A POSTROUTING -p tcp -d $TARGET_HOST --dport $TARGET_PORT -j MASQUERADE; then
  log_message "Successfully set up iptables rule."
else
  log_message "Failed to set up iptables rule."
  exit 1
fi

# Log the current iptables rules for verification
log_message "Current iptables rules:"
if iptables -t nat -L -n -v >> $LOG_FILE; then
  log_message "Successfully logged current iptables rules."
else
  log_message "Failed to log current iptables rules."
  exit 1
fi

# Notify that the setup is complete
log_message "Proxy setup complete. Listening on port $LISTENING_PORT and forwarding to $TARGET_HOST:$TARGET_PORT"

# Keep the script running to prevent Supervisor from stopping it
while true; do
  sleep 60
done
