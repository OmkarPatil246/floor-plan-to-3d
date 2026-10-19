#!/usr/bin/env node
/**
 * Simple HTTP server for the 3D Furniture Placement System
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 8000;

// MIME types mapping
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm',
    '.glb': 'model/gltf-binary',
    '.gltf': 'model/gltf+json'
};

function serveFile(filePath, res) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('500 Internal Server Error');
            }
            return;
        }

        const ext = path.extname(filePath);
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        
        res.writeHead(200, {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end(data);
    });
}

const server = http.createServer((req, res) => {
    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }

    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    // Resolve the file path
    filePath = path.join(__dirname, filePath);

    // Check if it's a directory
    fs.stat(filePath, (err, stats) => {
        if (!err && stats.isDirectory()) {
            filePath = path.join(filePath, 'index.html');
        }
        serveFile(filePath, res);
    });
});

function openBrowser(url) {
    const platform = process.platform;
    let command;

    if (platform === 'win32') {
        command = `start ${url}`;
    } else if (platform === 'darwin') {
        command = `open ${url}`;
    } else {
        command = `xdg-open ${url}`;
    }

    exec(command, (err) => {
        if (err) {
            console.log(`Could not open browser automatically: ${err.message}`);
        }
    });
}

function main() {
    server.listen(PORT, () => {
        console.log('╔═══════════════════════════════════════════════════╗');
        console.log('║   3D Furniture Placement System Server Running   ║');
        console.log('╚═══════════════════════════════════════════════════╝');
        console.log(`\n🌐 Server running at: http://localhost:${PORT}`);
        console.log(`📂 Serving directory: ${__dirname}`);
        console.log('\n🚀 Opening in browser...');
        console.log('\n⚠️  Press Ctrl+C to stop the server\n');

        // Open browser
        openBrowser(`http://localhost:${PORT}`);
    });

    // Handle server shutdown
    process.on('SIGINT', () => {
        console.log('\n\n✅ Server stopped. Goodbye!');
        process.exit(0);
    });
}

main();
