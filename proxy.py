from http.server import HTTPServer, SimpleHTTPRequestHandler
import urllib.request
import urllib.parse
import json
from urllib.error import HTTPError
import ssl

class ProxyHTTPRequestHandler(SimpleHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        body = self.rfile.read(content_length)
        
        try:
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
            
            # Read response data
            response_data = response.read()
            
            # Send response back to client
            self.send_response(response.status)
            self.send_header('Content-type', response.getheader('Content-Type', 'application/json'))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            self.end_headers()
            
            self.wfile.write(response_data)

        except HTTPError as e:
            self.send_response(e.code)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            error_data = e.read()
            self.wfile.write(error_data)
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            error_response = json.dumps({
                'error': str(e),
                'type': str(type(e))
            }).encode('utf-8')
            self.wfile.write(error_response)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

if __name__ == '__main__':
    server_address = ('localhost', 8000)
    httpd = HTTPServer(server_address, ProxyHTTPRequestHandler)
    print("Proxy server starting on port 8000...")
    httpd.serve_forever()