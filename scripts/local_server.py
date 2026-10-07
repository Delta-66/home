"""Serve built sites locally and save homepage bookmarks to their source JSON."""

import json
import os
import sys
import tempfile
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Lock
from urllib.parse import urlsplit


bookmarks_lock = Lock()


class NoCacheHandler(SimpleHTTPRequestHandler):
    bookmarks_path = None

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()

    def send_json(self, status, data):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.bookmarks_path and self.path == "/api/webcollections":
            self.send_json(200, {"fileSave": True, "deleteAll": True})
            return
        if self.bookmarks_path and self.path == "/webcollections/webcollections.json":
            try:
                body = self.bookmarks_path.read_bytes()
            except OSError:
                self.send_json(500, {"error": "无法读取网址数据文件。"})
                return
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    def do_POST(self):
        self.change_bookmark("add")

    def do_DELETE(self):
        self.change_bookmark("delete")

    def change_bookmark(self, action):
        if not self.bookmarks_path or self.path != "/api/webcollections":
            self.send_json(404, {"error": "此服务不支持保存网址。"})
            return
        host = self.headers.get("Host", "")
        origin = self.headers.get("Origin")
        allowed_hosts = (f"127.0.0.1:{self.server.server_port}", f"localhost:{self.server.server_port}")
        if host not in allowed_hosts or (origin and origin != f"http://{host}"):
            self.send_json(403, {"error": "只允许从本地网址集页面保存。"})
            return
        if self.headers.get_content_type() != "application/json":
            self.send_json(415, {"error": "请求必须使用 JSON 格式。"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= 8192:
                raise ValueError("请求大小无效。")
            request = json.loads(self.rfile.read(length))
            if not isinstance(request, dict):
                raise ValueError("请求格式无效。")
        except (ValueError, json.JSONDecodeError):
            self.send_json(400, {"error": "网址数据格式无效。"})
            return

        with bookmarks_lock:
            try:
                data = json.loads(self.bookmarks_path.read_text(encoding="utf-8"))
                categories = data["categories"]
                links = data["links"]
                if not isinstance(categories, list) or not isinstance(links, list):
                    raise ValueError("网址数据文件格式无效。")

                if action == "add":
                    name = request.get("name", "")
                    url = request.get("url", "")
                    description = request.get("description", "")
                    category = request.get("category", "")
                    favorite = request.get("favorite", False)
                    if not all(isinstance(value, str) for value in (name, url, description, category)):
                        raise ValueError("请填写有效的网站信息。")
                    name, url, description = name.strip(), url.strip(), description.strip()
                    parsed_url = urlsplit(url)
                    if (
                        not name or len(name) > 80 or len(description) > 200
                        or parsed_url.scheme not in ("http", "https") or not parsed_url.hostname
                        or category not in {item.get("id") for item in categories if isinstance(item, dict)}
                        or not isinstance(favorite, bool)
                    ):
                        raise ValueError("请检查名称、网址和分类。")
                    if any(link.get("url") == url for link in links if isinstance(link, dict)):
                        self.send_json(409, {"error": "这个网址已经在收藏中。"})
                        return
                    link = {
                        "name": name,
                        "url": url,
                        "description": description,
                        "category": category,
                        "favorite": favorite,
                    }
                    links.append(link)
                else:
                    url = request.get("url")
                    if not isinstance(url, str):
                        raise ValueError("缺少要删除的网址。")
                    link = next((item for item in links if isinstance(item, dict) and item.get("url") == url), None)
                    if link is None:
                        self.send_json(404, {"error": "找不到可删除的网址。"})
                        return
                    links.remove(link)

                content = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
                temp_path = None
                try:
                    with tempfile.NamedTemporaryFile("w", encoding="utf-8", newline="\n", dir=self.bookmarks_path.parent, delete=False) as temp_file:
                        temp_path = Path(temp_file.name)
                        temp_file.write(content)
                    os.replace(temp_path, self.bookmarks_path)
                finally:
                    if temp_path and temp_path.exists():
                        temp_path.unlink()
            except (OSError, ValueError, KeyError) as error:
                self.send_json(400 if isinstance(error, ValueError) else 500, {"error": str(error)})
                return

        self.send_json(200, {"ok": True, "link": link})


if __name__ == "__main__":
    port = int(sys.argv[1])
    if len(sys.argv) > 2:
        NoCacheHandler.bookmarks_path = Path(sys.argv[2]).resolve()
    if len(sys.argv) > 3:
        os.chdir(Path(sys.argv[3]).resolve())
    server = ThreadingHTTPServer(("127.0.0.1", port), NoCacheHandler)
    server.serve_forever()
