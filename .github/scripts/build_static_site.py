"""Stage explicitly listed website/branding files, never dashboard catalogue/media.

Local build only: no AWS calls, Git changes or publication. The output directory
must not already exist and must be outside the source tree.
"""
import argparse
from html.parser import HTMLParser
import json
from pathlib import Path, PurePosixPath
import re
import tempfile
from urllib.parse import unquote, urlsplit


class BuildError(ValueError):
    pass


MANIFEST = Path(__file__).resolve().parents[1] / 'static-site-assets.json'
REQUIRED = {'index.html', 'script.js', 'style.css', 'success.html', 'site.webmanifest'}
FORBIDDEN_ROOTS = {'backend', '.git', '.aws', 'media', 'incoming', 'validated', 'packages'}


def safe_path(value):
    if not isinstance(value, str) or not value or '\\' in value or '\x00' in value:
        raise BuildError('Invalid static asset path.')
    path = PurePosixPath(value)
    if (path.is_absolute() or any(part in ('', '.', '..') for part in value.split('/'))
            or any(char in value for char in '*?[]#')
            or path.parts[0] in FORBIDDEN_ROOTS or path.name == 'catalogue.json'):
        raise BuildError(f'Path is outside website/branding ownership: {value}')
    return path


def load_manifest(path=MANIFEST):
    data = json.loads(path.read_text())
    files = data.get('files') if isinstance(data, dict) else None
    if not isinstance(data, dict) or data.get('schemaVersion') != 1 or not isinstance(files, list) or not files:
        raise BuildError('Invalid static assets manifest.')
    for value in files:
        safe_path(value)
    if len(set(files)) != len(files) or not REQUIRED.issubset(files):
        raise BuildError('Duplicate asset or missing core website file.')
    return files


class PageAssets(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = []

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if tag in ('script', 'img', 'source') and attrs.get('src'):
            self.references.append(attrs['src'])
        if tag == 'link' and set(attrs.get('rel', '').split()) & {
                'stylesheet', 'icon', 'apple-touch-icon', 'manifest'} and attrs.get('href'):
            self.references.append(attrs['href'])
        if tag in ('img', 'source') and attrs.get('srcset'):
            self.references.extend(part.strip().split()[0] for part in attrs['srcset'].split(',') if part.strip())


def local_reference(reference, origin):
    url = urlsplit(reference)
    if url.scheme or url.netloc or not url.path:
        return None
    path = unquote(url.path)
    relative = path.lstrip('/') if path.startswith('/') else str(PurePosixPath(origin).parent / path)
    return str(safe_path(relative))


def inspect(source, manifest=MANIFEST):
    source = source.resolve(strict=True)
    files = load_manifest(manifest)
    contents = {}
    for name in files:
        path = source / name
        # Reject symlinks, including intermediate directories, before reading.
        if any(part.is_symlink() for part in (path, *path.parents) if part != source and source in part.parents):
            raise BuildError(f'Symlink cannot be published: {name}')
        if not path.is_file() or not path.resolve().is_relative_to(source):
            raise BuildError(f'Missing or external static asset: {name}')
        contents[name] = path.read_bytes()
    for name, raw in contents.items():
        references = []
        if name.endswith('.html'):
            parser = PageAssets()
            parser.feed(raw.decode('utf-8'))
            references = parser.references
        elif name.endswith('.css'):
            references = [entry.strip().strip('\"\'') for entry in re.findall(r'url\(([^)]+)\)', raw.decode('utf-8'))]
        elif name == 'site.webmanifest':
            references = [icon['src'] for icon in json.loads(raw).get('icons', [])]
        for reference in references:
            target = local_reference(reference, name)
            if target is not None and target not in contents:
                raise BuildError(f'Referenced asset must be explicitly reviewed/listed: {name} -> {target}')
    return source, contents


def build(source, output, manifest=MANIFEST):
    source, contents = inspect(source, manifest)
    if output.is_symlink():
        raise BuildError('Output must be a new directory outside the source tree.')
    output = output.resolve()
    if output.exists() or output.is_relative_to(source) or source.is_relative_to(output):
        raise BuildError('Output must be a new directory outside the source tree.')
    if not output.parent.is_dir():
        raise BuildError('Output parent must already exist.')
    # Build a complete temporary tree before exposing the deployment directory.
    with tempfile.TemporaryDirectory(prefix='dustythrifts-static-', dir=output.parent) as directory:
        ready = Path(directory) / 'ready'
        ready.mkdir()
        for name, raw in contents.items():
            target = ready / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(raw)
        if output.exists() or output.is_symlink():
            raise BuildError('Output appeared during preparation; nothing overwritten.')
        ready.rename(output)
    return sorted(contents)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--check', action='store_true')
    mode.add_argument('--build', action='store_true')
    parser.add_argument('--source', type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    if args.build and args.output is None:
        parser.error('--build requires --output')
    try:
        if args.build:
            files = build(args.source, args.output)
        else:
            _, contents = inspect(args.source)
            files = sorted(contents)
        print(json.dumps({'result': 'static_site_built' if args.build else 'static_site_preflight_passed',
            'files': files, 'fileCount': len(files), 'sourceFilesChanged': False,
            'catalogueIncluded': False, 'managedProductMediaIncluded': False, 'deploymentPerformed': False}, indent=2))
    except (OSError, ValueError, TypeError, KeyError) as error:
        parser.exit(1, f'Static site build stopped: {error}\n')


if __name__ == '__main__':
    main()
