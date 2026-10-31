# Serves the repo root for the prototype pages with caching off, so an edited engine file shows on a plain reload
# (python3 -m http.server lets the browser keep stale ES modules). Run from the repo root:
#   python3 prototypes/crt-site/serve.py   → http://127.0.0.1:4173/prototypes/crt-site/
import http.server, functools

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

http.server.ThreadingHTTPServer(('127.0.0.1', 4173), functools.partial(NoCache, directory='.')).serve_forever()
