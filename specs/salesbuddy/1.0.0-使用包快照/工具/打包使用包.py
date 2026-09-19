"""Verify local links, record hashes, and create a portable department design handbook ZIP."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import hashlib
import json
import re
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parent.parent
ZIP = ROOT.parent / '部门产品设计规范-完整使用包-1.0.0.zip'

class Document(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.ids = set()

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if attributes.get('id'):
            self.ids.add(attributes['id'])
        for key in ('href', 'src'):
            if attributes.get(key):
                self.links.append(attributes[key])

def digest(data):
    return hashlib.sha256(data).hexdigest()

def read_html(file):
    result = Document()
    result.feed(file.read_text())
    return result

report = json.loads((ROOT / '交付检查.json').read_text())
assert report['failed'] == 0, '浏览器检查未通过'
links = 0
dynamic = 0
for file in ROOT.rglob('*.html'):
    if '工具' in file.parts:
        continue
    for link in read_html(file).links:
        url = urlsplit(link)
        if url.scheme or link.startswith('//'):
            continue
        target = (file.parent / unquote(url.path)).resolve() if url.path else file
        assert target.is_relative_to(ROOT), (file.name, '引用越出分发包', link)
        assert target.exists(), (file.name, '目标缺失', link)
        links += 1
        if url.fragment and target.suffix == '.html':
            if url.fragment.startswith('template-') and target == ROOT / '示例册/design-system/index.html':
                assert url.fragment in {'template-home', 'template-list', 'template-detail', 'template-visit', 'template-analytics'}
                dynamic += 1  # The browser test verifies these hash routes.
            else:
                assert unquote(url.fragment) in read_html(target).ids, (file.name, '锚点缺失', link)

rule_source = (ROOT.parent / '01-SalesBuddy-Web规范/设计规范.md').read_text()
rule_copy = (ROOT / '部门产品设计规范.md').read_text()
def rules(text):
    result = {}
    for row in text.splitlines():
        match = re.match(r'^\| ([PVCBTG]-\d{2})\b', row)
        if match:
            # Portable URLs change; the approved wording and rule columns must remain unchanged.
            result[match.group(1)] = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', row)
    return result
assert len(rules(rule_source)) == 26
assert rules(rule_source) == rules(rule_copy), '已确认规则文本出现差异'
report['deliveryStructure'] = {
    'localLinksChecked': links,
    'dynamicHashLinksCoveredByBrowser': dynamic,
    'confirmedRulesUnchanged': 26,
    'documents': '完整手册、四种模板、依据阅读副本、离线示例与许可',
}
(ROOT / '交付检查.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
entries = []
for file in sorted(ROOT.rglob('*')):
    if file.is_file() and file.name != '文件清单.json':
        data = file.read_bytes()
        entries.append({'path': str(file.relative_to(ROOT)), 'bytes': len(data), 'sha256': digest(data)})
(ROOT / '文件清单.json').write_text(json.dumps({'version': '1.0.0', 'date': '2026-09-19', 'note': '文件清单自身不参与自校验', 'files': entries}, ensure_ascii=False, indent=2) + '\n')
with zipfile.ZipFile(ZIP, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for file in sorted(ROOT.rglob('*')):
        if file.is_file():
            archive.write(file, Path('部门产品设计规范-1.0.0') / file.relative_to(ROOT))
with tempfile.TemporaryDirectory(prefix='department-design-check-') as directory:
    with zipfile.ZipFile(ZIP) as archive:
        assert archive.testzip() is None
        archive.extractall(directory)
    unpacked = Path(directory) / '部门产品设计规范-1.0.0'
    for entry in entries:
        assert digest((unpacked / entry['path']).read_bytes()) == entry['sha256'], entry['path']
    assert (unpacked / 'index.html').exists()
print(json.dumps({'zip': str(ZIP), 'zipBytes': ZIP.stat().st_size, 'filesChecked': len(entries), 'localLinksChecked': links, 'confirmedRulesUnchanged': 26, 'zipCRC': 'passed', 'extractionHashes': 'passed'}, ensure_ascii=False))
