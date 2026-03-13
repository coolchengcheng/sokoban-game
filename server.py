#!/usr/bin/env python3
"""Simple HTTP server for the Sokoban game on port 8081."""
import http.server
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass  # Quiet

if __name__ == '__main__':
    server = http.server.HTTPServer(('0.0.0.0', 8081), Handler)
    print('Sokoban server running at http://localhost:8081')
    server.serve_forever()
