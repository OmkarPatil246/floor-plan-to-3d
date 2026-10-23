#!/usr/bin/env python3
"""Simple HTTP server for the 3D Furniture Placement System"""

import http.server
import socketserver
import os
import webbrowser
from pathlib import Path

PORT = 8001

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def main():
    # Change to the directory where the script is located
    os.chdir(Path(__file__).parent)
    
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"╔═══════════════════════════════════════════════════╗")
        print(f"║   3D Furniture Placement System Server Running   ║")
        print(f"╚═══════════════════════════════════════════════════╝")
        print(f"\n🌐 Server running at: http://localhost:{PORT}")
        print(f"📂 Serving directory: {os.getcwd()}")
        print(f"\n🚀 Opening in browser...")
        print(f"\n⚠️  Press Ctrl+C to stop the server\n")
        
        # Open browser
        webbrowser.open(f'http://localhost:{PORT}')
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print(f"\n\n✅ Server stopped. Goodbye!")

if __name__ == "__main__":
    main()
