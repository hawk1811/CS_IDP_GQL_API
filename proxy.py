from http.server import HTTPServer, SimpleHTTPRequestHandler
import urllib.request
import urllib.parse
import json
import ssl
import sys
import os
import argparse
import socket
from urllib.error import HTTPError
from typing import Optional, Dict, Any

class ProxyHTTPRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Increase buffer size for larger requests
        self.rbufsize = 1024 * 1024
        super().__init__(*args, **kwargs)

    def handle_one_request(self) -> None:
        try:
            super().handle_one_request()
        except ConnectionError as e:
            print(f"Connection error: {e}", file=sys.stderr)
        except Exception as e:
            print(f"Error handling request: {e}", file=sys.stderr)

    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            body = self.rfile.read(content_length)
            
            # Parse request data
            request_data = json.loads(body)
            target_url = request_data.get('url')
            method = request_data.get('method', 'GET')
            headers = request_data.get('headers', {})
            data = request_data.get('body')
            
            # Handle URL-encoded data
            if headers.get('Content-Type') == 'application/x-www-form-urlencoded' and isinstance(data, str):
                data = data.encode('utf-8')
            elif data is not None:
                data = json.dumps(data).encode('utf-8')

            # Create proxy request
            req = urllib.request.Request(
                target_url,
                data=data,
                headers=headers,
                method=method
            )

            # Handle SSL context
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE

            # Make the request
            response = urllib.request.urlopen(req, context=ctx)
            
            # Read response data with timeout
            response_data = response.read(timeout=30)
            
            # Send response back to client
            self.send_response(response.status)
            self.send_header('Content-type', response.getheader('Content-Type', 'application/json'))
            self._send_cors_headers()
            self.end_headers()
            
            self.wfile.write(response_data)

        except HTTPError as e:
            self._handle_http_error(e)
        except json.JSONDecodeError as e:
            self._handle_error(400, f"Invalid JSON: {str(e)}")
        except Exception as e:
            self._handle_error(500, str(e))

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def _send_cors_headers(self):
        """Send CORS headers"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def _handle_http_error(self, e: HTTPError):
        """Handle HTTP errors"""
        self.send_response(e.code)
        self.send_header('Content-type', 'application/json')
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(e.read())

    def _handle_error(self, code: int, message: str):
        """Handle general errors"""
        self.send_response(code)
        self.send_header('Content-type', 'application/json')
        self._send_cors_headers()
        self.end_headers()
        error_response = json.dumps({
            'error': message,
            'code': code
        }).encode('utf-8')
        self.wfile.write(error_response)

def is_port_in_use(port: int) -> bool:
    """Check if a port is already in use"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def get_available_port(start_port: int, max_attempts: int = 10) -> Optional[int]:
    """Find an available port starting from start_port"""
    for port in range(start_port, start_port + max_attempts):
        if not is_port_in_use(port):
            return port
    return None

def main():
    parser = argparse.ArgumentParser(description='Cross-platform HTTP Proxy Server')
    parser.add_argument('--host', default='localhost', 
                      help='Host to bind to (default: localhost)')
    parser.add_argument('--port', type=int, default=8000,
                      help='Port to bind to (default: 8000)')
    parser.add_argument('--auto-port', action='store_true',
                      help='Automatically find an available port if the specified port is in use')
    
    args = parser.parse_args()
    
    # Handle port allocation
    port = args.port
    if is_port_in_use(port):
        if args.auto_port:
            new_port = get_available_port(port)
            if new_port:
                port = new_port
                print(f"Port {args.port} is in use. Using port {port} instead.")
            else:
                print(f"Could not find an available port starting from {port}")
                sys.exit(1)
        else:
            print(f"Port {port} is already in use. Use --auto-port to automatically find an available port.")
            sys.exit(1)

    server_address = (args.host, port)
    
    try:
        httpd = HTTPServer(server_address, ProxyHTTPRequestHandler)
        print(f"Proxy server starting on {args.host}:{port}...")
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.server_close()
    except PermissionError:
        print(f"Permission denied to bind to {args.host}:{port}")
        if os.name != 'nt' and port < 1024:  # Unix-like systems
            print("Note: On Unix-like systems, binding to ports below 1024 requires root privileges.")
        sys.exit(1)
    except Exception as e:
        print(f"Error starting server: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
