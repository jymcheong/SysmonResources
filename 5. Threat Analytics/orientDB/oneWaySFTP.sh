sudo adduser uploader
sudo mkdir -p /var/sftp/uploads
sudo chown root:root /var/sftp
sudo chmod 755 /var/sftp
sudo chown uploader:uploader /var/sftp/uploads

echo "Match User uploader" >> /etc/ssh/sshd_config
echo "ForceCommand internal-sftp" >> /etc/ssh/sshd_config
echo "PasswordAuthentication yes" >> /etc/ssh/sshd_config
echo "ChrootDirectory /var/sftp" >> /etc/ssh/sshd_config
echo "PermitTunnel no" >> /etc/ssh/sshd_config
echo "AllowAgentForwarding no" >> /etc/ssh/sshd_config
echo "AllowTcpForwarding no" >> /etc/ssh/sshd_config
echo "X11Forwarding no " >> /etc/ssh/sshd_config

sudo systemctl restart sshd