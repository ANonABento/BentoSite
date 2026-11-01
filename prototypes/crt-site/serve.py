# Serves the repo root for the prototype pages with caching off, so an edited engine file shows on a plain reload
# (python3 -m http.server lets the browser keep stale ES modules). Run from the repo root:
#   python3 prototypes/crt-site/serve.py   → http://127.0.0.1:4173/prototypes/crt-site/
# POST /__save-theatre with the studio's save file writes src/components/Prologue/theatre-state.json (local only).
import functools, http.server, json, os, re

STATE = os.path.join('src', 'components', 'Prologue', 'theatre-state.json')


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_POST(self):
        if self.path != '/__save-theatre':
            return self.send_error(404)
        try:
            data = json.loads(self.rfile.read(int(self.headers.get('Content-Length', 0))))
            if not isinstance(data, dict):
                raise ValueError('expected an object')
        except ValueError as e:
            return self.send_error(400, str(e))
        text = json.dumps(data, indent=2)
        text = re.sub(r'\[\s*([-\d.e,\s]+?)\s*\]', lambda m: '[' + ', '.join(m.group(1).split()).replace(',,', ',') + ']', text)
        with open(STATE, 'w') as f:
            f.write(text + '\n')
        self.send_response(204)
        self.end_headers()


http.server.ThreadingHTTPServer(('127.0.0.1', 4173), functools.partial(Handler, directory='.')).serve_forever()
