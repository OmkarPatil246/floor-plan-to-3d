"""
HTTPS Server with Self-Signed Certificate for WebXR Development

This script creates a self-signed SSL certificate and starts the Flask server
with HTTPS support, which is required for native WebXR features (though the
polyfill works on HTTP for Cardboard VR).

Usage:
    python start_https_server.py
"""

import os
import sys
import socket
import logging
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJECT_ROOT))

from config.settings import get_config

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def create_self_signed_cert():
    """Create a self-signed SSL certificate for development."""
    cert_dir = PROJECT_ROOT / 'ssl'
    cert_file = cert_dir / 'cert.pem'
    key_file = cert_dir / 'key.pem'
    
    # Check if certificates already exist
    if cert_file.exists() and key_file.exists():
        logger.info(f"✅ SSL certificates already exist at {cert_dir}")
        return str(cert_file), str(key_file)
    
    # Create ssl directory
    cert_dir.mkdir(exist_ok=True)
    
    logger.info("🔐 Creating self-signed SSL certificate...")
    
    try:
        # Try using cryptography library (preferred)
        from cryptography import x509
        from cryptography.x509.oid import NameOID
        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.primitives.asymmetric import rsa
        from cryptography.hazmat.primitives import serialization
        import datetime
        
        # Generate private key
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
        )
        
        # Get local IP
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            local_ip = s.getsockname()[0]
            s.close()
        except:
            local_ip = "127.0.0.1"
        
        # Create certificate
        subject = issuer = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, "US"),
            x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "Development"),
            x509.NameAttribute(NameOID.LOCALITY_NAME, "Local"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, "Floorplan3D Dev"),
            x509.NameAttribute(NameOID.COMMON_NAME, local_ip),
        ])
        
        cert = x509.CertificateBuilder().subject_name(
            subject
        ).issuer_name(
            issuer
        ).public_key(
            private_key.public_key()
        ).serial_number(
            x509.random_serial_number()
        ).not_valid_before(
            datetime.datetime.utcnow()
        ).not_valid_after(
            datetime.datetime.utcnow() + datetime.timedelta(days=365)
        ).add_extension(
            x509.SubjectAlternativeName([
                x509.DNSName("localhost"),
                x509.DNSName("127.0.0.1"),
                x509.DNSName(local_ip),
                x509.IPAddress(socket.inet_aton(local_ip)),
            ]),
            critical=False,
        ).sign(private_key, hashes.SHA256())
        
        # Write private key
        with open(key_file, "wb") as f:
            f.write(private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.TraditionalOpenSSL,
                encryption_algorithm=serialization.NoEncryption()
            ))
        
        # Write certificate
        with open(cert_file, "wb") as f:
            f.write(cert.public_bytes(serialization.Encoding.PEM))
        
        logger.info(f"✅ SSL certificate created at {cert_dir}")
        logger.info(f"   Certificate: {cert_file}")
        logger.info(f"   Private Key: {key_file}")
        
        return str(cert_file), str(key_file)
        
    except ImportError:
        logger.error("❌ cryptography library not installed")
        logger.info("📦 Installing cryptography...")
        os.system(f"{sys.executable} -m pip install cryptography")
        logger.info("✅ Installed! Please run this script again.")
        sys.exit(1)


def start_https_server():
    """Start the Flask server with HTTPS."""
    from server.main import application
    
    # Get configuration
    app_config = get_config()
    api_config = app_config.get_api_config()
    
    # Create SSL certificate
    cert_file, key_file = create_self_signed_cert()
    
    # Get local IP
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
    except:
        local_ip = "127.0.0.1"
    
    host = api_config["HOST"]
    port = api_config["PORT"]
    
    logger.info("")
    logger.info("=" * 70)
    logger.info("  🔒 HTTPS SERVER STARTING")
    logger.info("=" * 70)
    logger.info("")
    logger.info("  Local Access (This Computer):")
    logger.info(f"    https://localhost:{port}")
    logger.info(f"    https://127.0.0.1:{port}")
    logger.info("")
    logger.info("  Network Access (Other Devices - Phones/Tablets):")
    logger.info(f"    https://{local_ip}:{port}")
    logger.info("")
    logger.info("  ⚠️  IMPORTANT: Certificate Warning")
    logger.info("  Your browser will show a security warning because this is a")
    logger.info("  self-signed certificate. This is NORMAL for development.")
    logger.info("")
    logger.info("  To bypass the warning:")
    logger.info("  • Desktop: Click 'Advanced' → 'Proceed to site (unsafe)'")
    logger.info("  • Mobile: Click 'Advanced' → 'Visit this unsafe site'")
    logger.info("")
    logger.info("  ✅ This is SAFE - it's YOUR OWN certificate on YOUR OWN server!")
    logger.info("")
    logger.info("=" * 70)
    logger.info("")
    
    try:
        # Start Flask with SSL
        application.run(
            host=host,
            port=port,
            debug=False,
            ssl_context=(cert_file, key_file),
            threaded=True
        )
    except Exception as e:
        logger.error(f"❌ Failed to start HTTPS server: {e}")
        logger.error(f"   Make sure port {port} is not already in use")
        logger.error(f"   Run: netstat -ano | findstr :{port}")


if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("  Floorplan-to-3D HTTPS Server (WebXR Development)")
    print("=" * 70 + "\n")
    
    start_https_server()
