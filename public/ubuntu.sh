#!/bin/bash

# Fungsi untuk logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Fungsi untuk error handling
handle_error() {
    log "ERROR: $1"
    exit 1
}

# Pastikan script dijalankan sebagai root
if [ "$(id -u)" != "0" ]; then
    handle_error "Script harus dijalankan dengan sudo"
fi

# Fungsi untuk validasi IP address
validate_ip() {
    local ip=$1
    if [[ $ip =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
        OIFS=$IFS
        IFS='.'
        ip=($ip)
        IFS=$OIFS
        [[ ${ip[0]} -le 255 && ${ip[1]} -le 255 && ${ip[2]} -le 255 && ${ip[3]} -le 255 ]]
        return $?
    else
        return 1
    fi
}



# Fungsi untuk membaca input dengan timeout dan validasi
get_input() {
    local prompt="$1"
    local default="$2"
    local validation_func="$3"
    local input
    local valid=false
    
    while [ "$valid" = false ]; do
        # Gunakan /dev/tty untuk memastikan input bisa dibaca meski melalui pipe
        exec < /dev/tty
        read -p "$prompt" input
        
        if [ -z "$input" ] && [ ! -z "$default" ]; then
            input="$default"
        fi
        
        if [ ! -z "$validation_func" ]; then
            if $validation_func "$input"; then
                valid=true
            else
                log "Input tidak valid, silakan coba lagi"
                continue
            fi
        else
            valid=true
        fi
    done
    echo "$input"
}

# Fungsi untuk mengecek status instalasi paket
check_package_installed() {
    dpkg -l "$1" &> /dev/null
    return $?
}

# Fungsi untuk backup file konfigurasi
backup_config() {
    local file="$1"
    if [ -f "$file" ]; then
        cp "$file" "${file}.backup.$(date +%Y%m%d_%H%M%S)" || handle_error "Gagal backup file $file"
    fi
}

# Fungsi untuk menginstall paket dengan retry
install_package() {
    local package="$1"
    local max_attempts=3
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log "Mencoba menginstall $package (Percobaan $attempt dari $max_attempts)"
        if apt-get install -y "$package"; then
            log "Berhasil menginstall $package"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 5
    done
    handle_error "Gagal menginstall $package setelah $max_attempts percobaan"
}

# Main script starts here
log "Memulai konfigurasi server..."

# Minta dan validasi input
user_ip=$(get_input "Masukkan IP address (contoh: 192.168.1.1): " "" validate_ip)
user_domain=$(get_input "Masukkan nama domain (contoh: smkeki.sch.id): " "" )
mysql_root_password=$(get_input "Masukkan password untuk root MySQL: ")
phpmyadmin_password=$(get_input "Masukkan password untuk phpMyAdmin: ")
# Tambahan input untuk Samba
samba_username=$(get_input "Masukkan username untuk Samba (contoh: smkuser): " "")
samba_password=$(get_input "Masukkan password untuk Samba: ")

# Fix untuk dpkg yang interrupted
log "Memperbaiki package yang interrupted..."
dpkg --configure -a || handle_error "Gagal memperbaiki dpkg yang interrupted"

# Update sistem dengan proper error handling
log "Updating system packages..."
export DEBIAN_FRONTEND=noninteractive

# Bersihkan apt cache dan fix dependencies
apt-get clean
apt-get autoremove -y
apt-get autoclean

# Update dengan proper error handling
if ! apt-get update -y; then
    log "WARNING: Update gagal, mencoba fix..."
    rm -f /var/lib/apt/lists/lock
    rm -f /var/cache/apt/archives/lock
    rm -f /var/lib/dpkg/lock*
    dpkg --configure -a
    apt-get update -y || handle_error "Gagal melakukan update sistem"
fi

# Upgrade dengan proper error handling
if ! apt-get upgrade -y; then
    log "WARNING: Upgrade gagal, mencoba fix..."
    dpkg --configure -a
    apt-get upgrade -y || handle_error "Gagal melakukan upgrade sistem"
fi

# Tambah repository universe
add-apt-repository universe -y || handle_error "Gagal menambahkan repository universe"

# Set konfigurasi otomatis untuk MySQL dan phpMyAdmin
debconf-set-selections <<< "mysql-server mysql-server/root_password password $mysql_root_password"
debconf-set-selections <<< "mysql-server mysql-server/root_password_again password $mysql_root_password"
debconf-set-selections <<< "phpmyadmin phpmyadmin/dbconfig-install boolean true"
debconf-set-selections <<< "phpmyadmin phpmyadmin/mysql/admin-pass password $mysql_root_password"
debconf-set-selections <<< "phpmyadmin phpmyadmin/mysql/app-pass password $phpmyadmin_password"
debconf-set-selections <<< "phpmyadmin phpmyadmin/reconfigure-webserver multiselect apache2"

# Install paket yang diperlukan dengan proper error handling
packages="bind9 apache2 mysql-server apache2-utils phpmyadmin samba"
for package in $packages; do
    if ! check_package_installed "$package"; then
        # Fix dpkg sebelum instalasi
        dpkg --configure -a
        install_package "$package"
    fi
done

# Backup dan konfigurasi file-file penting
backup_config "/etc/resolv.conf"
backup_config "/etc/bind/named.conf.default-zones"
backup_config "/etc/apache2/sites-available/000-default.conf"
backup_config "/etc/samba/smb.conf"

# Konfigurasi DNS
cat > /etc/resolv.conf <<EOL
nameserver $user_ip
nameserver 8.8.8.8
search $user_domain
options edns0 trust-ad
EOL

# Konfigurasi zona Bind9
reversed_ip=$(echo "$user_ip" | awk -F. '{print $3"."$2"."$1}')

cat > /etc/bind/named.conf.default-zones <<EOL
# Default zones
zone "localhost" {
    type master;
    file "/etc/bind/db.local";
};

zone "127.in-addr.arpa" {
    type master;
    file "/etc/bind/db.127";
};

zone "0.in-addr.arpa" {
    type master;
    file "/etc/bind/db.0";
};

zone "255.in-addr.arpa" {
    type master;
    file "/etc/bind/db.255";
};

# Custom SMK zones
zone "$user_domain" {
     type master;
     file "/etc/bind/smk.db";
 };

zone "$reversed_ip.in-addr.arpa" {
     type master;
     file "/etc/bind/smk.ip";
 };
EOL

# Konfigurasi file zona
cat > /etc/bind/smk.db <<EOL
\$TTL    604800
@       IN      SOA     ns.$user_domain. root.$user_domain. (
                        $(date +%Y%m%d)01 ; Serial
                        604800    ; Refresh
                        86400     ; Retry
                        2419200   ; Expire
                        604800 )  ; Negative Cache TTL
;
@       IN      NS      ns.$user_domain.
@       IN      MX 10   $user_domain.
@       IN      A       $user_ip
ns      IN      A       $user_ip
www     IN      CNAME   ns
mail    IN      CNAME   ns
ftp     IN      CNAME   ns
ntp     IN      CNAME   ns
proxy   IN      CNAME   ns
EOL

# Konfigurasi file PTR
octet=$(echo "$user_ip" | awk -F. '{print $4}')
cat > /etc/bind/smk.ip <<EOL
@       IN      SOA     ns.$user_domain. root.$user_domain. (
                        $(date +%Y%m%d)01 ; Serial
                        604800    ; Refresh
                        86400     ; Retry
                        2419200   ; Expire
                        604800 )  ; Negative Cache TTL
;
@       IN      NS      ns.$user_domain.
$octet  IN      PTR     ns.$user_domain.
EOL

# Konfigurasi Apache
cat > /etc/apache2/sites-available/000-default.conf <<EOL
<VirtualHost $user_ip:80>
        ServerAdmin admin@$user_domain
        ServerName www.$user_domain
        DocumentRoot /var/www
        ErrorLog \${APACHE_LOG_DIR}/error.log
        LogLevel warn
        CustomLog \${APACHE_LOG_DIR}/access.log combined
        
        <Directory /var/www/>
                Options Indexes FollowSymLinks
                AllowOverride All
                Require all granted
        </Directory>
</VirtualHost>
EOL

# Buat index.php
mkdir -p /var/www
cat > /var/www/index.php <<EOL
<!DOCTYPE html>
<html>
<head>
    <title>Welcome to $user_domain</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <h1>Selamat Datang di Server $user_domain</h1>
    <?php phpinfo(); ?>
</body>
</html>
EOL

# Set izin akses untuk /var/www dengan lebih aman
chown -R www-data:www-data /var/www/
find /var/www/ -type d -exec chmod 755 {} \;
find /var/www/ -type f -exec chmod 644 {} \;

# Konfigurasi Samba
useradd -m $samba_username 2>/dev/null || true
echo -e "$samba_password\n$samba_password" | passwd $samba_username

cat > /etc/samba/smb.conf <<EOL
[global]
   workgroup = WORKGROUP
   server string = Samba Server %v
   netbios name = $(hostname)
   security = user
   map to guest = bad user
   dns proxy = no

[www]
   path = /var/www/
   browseable = yes
   writeable = yes
   valid users = $samba_username
   create mask = 0644
   directory mask = 0755
   force user = www-data
EOL

# Set Samba password untuk user
echo -e "$samba_password\n$samba_password" | smbpasswd -a $samba_username

# Konfigurasi phpMyAdmin
echo "Include /etc/phpmyadmin/apache.conf" >> /etc/apache2/apache2.conf

# Aktifkan modul Apache
a2ensite 000-default.conf
a2enmod rewrite
a2enmod ssl

# Restart layanan dengan error handling
services="bind9 apache2 mysql smbd"
for service in $services; do
    systemctl restart $service || log "WARNING: Gagal restart $service"
    systemctl enable $service || log "WARNING: Gagal enable $service"
done

# Test konfigurasi
log "Testing konfigurasi..."
apache2ctl configtest || log "WARNING: Apache config test failed"
named-checkconf || log "WARNING: BIND config test failed"

log "==== Konfigurasi Selesai ===="
log "Domain: $user_domain"
log "IP Address: $user_ip"
log "phpMyAdmin URL: http://$user_ip/phpmyadmin"
log "Samba share tersedia di: //$user_ip/www"
log "Username Samba: $samba_username"