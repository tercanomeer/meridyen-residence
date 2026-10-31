# Yerel önizleme sunucusu: python3 -m http.server ile aynı, yalnızca tarayıcıya önbelleğe
# almamasını söyler (değişen CSS/JS her yenilemede gelir).
# Kullanım: python3 tools/serve.py [port]

import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4318
    root = Path(__file__).resolve().parent.parent
    handler = partial(NoCacheHandler, directory=str(root))
    with ThreadingHTTPServer(("127.0.0.1", port), handler) as server:
        print(f"http://localhost:{port}", flush=True)
        server.serve_forever()


if __name__ == "__main__":
    main()
