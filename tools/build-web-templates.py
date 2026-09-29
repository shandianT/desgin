#!/usr/bin/env python3
"""Compile owned WXML component wiring; keep the existing Web CSS baseline."""
import json
import sys
from html.parser import HTMLParser
from pathlib import Path


class Template(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.tree = []
        self.stack = [self.tree]
        self.tags = []

    def handle_starttag(self, tag, attrs):
        node = {"t": tag, "a": {k: v or "" for k, v in attrs}, "c": []}
        self.stack[-1].append(node)
        self.stack.append(node["c"])
        self.tags.append(tag)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        self.handle_endtag(tag)

    def handle_endtag(self, tag):
        if not self.tags or self.tags[-1] != tag:
            raise ValueError(f"Unbalanced WXML tag: {tag}")
        self.tags.pop()
        self.stack.pop()

    def handle_data(self, data):
        self.stack[-1].append(data)


root = Path(sys.argv[1])
result = {}
def parse(file):
    parser = Template()
    parser.feed(file.read_text())
    parser.close()
    if parser.tags:
        raise ValueError(f"Unclosed tags in {file}")
    return parser.tree


def definitions(tree):
    result = {}
    for node in tree:
        if not isinstance(node, dict):
            continue
        if node["t"] == "template" and node["a"].get("name"):
            result[node["a"]["name"]] = node["c"]
        result.update(definitions(node["c"]))
    return result


for file in sorted(root.rglob("*.wxml")):
    if file.relative_to(root).parts[0] not in ["pages", "components"]:
        continue
    tree = parse(file)
    templates = definitions(tree)
    for node in tree:
        if isinstance(node, dict) and node["t"] == "import":
            source = (file.parent / node["a"]["src"]).resolve()
            if not source.is_relative_to(root.resolve()):
                raise ValueError("Template import escapes business source")
            templates.update(definitions(parse(source)))
    config = file.with_suffix(".json")
    result[file.relative_to(root).with_suffix("").as_posix()] = {
        "tree": tree,
        "templates": templates,
        "config": json.loads(config.read_text()) if config.exists() else {},
    }
print(json.dumps(result, ensure_ascii=False))
