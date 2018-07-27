# This script is for Ubuntu. Pls adapt for other linux
# setup the common user for uploading only
sudo adduser uploader
sudo mkdir -p /var/sftp/uploads
sudo chown root:root /var/sftp
sudo chmod 755 /var/sftp
sudo chown uploader:uploader /var/sftp/uploads
 
# disable existing SFTP Subsystem configuration
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak
sudo sed -i.bak 's/^Subsystem/#Subsystem/' /etc/ssh/sshd_config
# configure SSHD to provide SFTP only, no SSH shell
sudo echo "Subsystem sftp internal-sftp -l INFO" >> /etc/ssh/sshd_config 
sudo echo "Match User uploader" >> /etc/ssh/sshd_config
sudo echo "ForceCommand internal-sftp -f AUTHPRIV -l INFO" >> /etc/ssh/sshd_config
sudo echo "PasswordAuthentication yes" >> /etc/ssh/sshd_config
sudo echo "ChrootDirectory /var/sftp" >> /etc/ssh/sshd_config
sudo echo "PermitTunnel no" >> /etc/ssh/sshd_config
sudo echo "AllowAgentForwarding no" >> /etc/ssh/sshd_config
sudo echo "AllowTcpForwarding no" >> /etc/ssh/sshd_config
sudo echo "X11Forwarding no " >> /etc/ssh/sshd_config
sudo systemctl restart sshd

# Log all SFTP activities, we can use it to detect intrusions
# Suppose machine being monitored is compromised. At some juncture,
# attacker will use the uploader SFTP credentials
# Due to chroot, a socket folder needs to be created for 
sudo mkdir -m2755 /var/sftp/dev
sudo echo 'input(type="imuxsock" Socket="/var/sftp/dev/log" CreatePath="on")' >> /etc/rsyslog.d/sftp.conf
sudo echo "if \$programname == 'internal-sftp' then /var/log/sftp.log" >> /etc/rsyslog.d/sftp.conf
sudo echo '& stop' >> /etc/rsyslog.d/sftp.conf
sudo systemctl reload-or-restart rsyslog

# make it "one-way" write-only, NO read or delete
sudo apt install build-essential pkg-config libfuse-dev
# modify the next line if u r in air-gap environment
sudo wget https://bindfs.org/downloads/bindfs-1.13.9.tar.gz
sudo tar zxvf bindfs-1.13.9.tar.gz
sudo cd bindfs-1.13.9
./configure
make
sudo make install
sudo mkdir ~uploader/winevents
sudo bindfs --perms=a-r --delete-deny ~uploader/winevents /var/sftp/uploads