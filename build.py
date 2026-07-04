"""CoC 7th Engine — build (V18.1) — ZIP_STORED for speed (~5s)"""
import subprocess, zipfile, os, sys
from pathlib import Path

ROOT = Path(__file__).parent
EXCLUDE = {'node_modules','__pycache__','.git','.github','docs','测试','tests','roles','icons','src-tauri','scripts'}

def build(name='CoC_Engine_V18.1.zip'):
    # Regenerate browser .js from .mjs sources before packaging
    r = subprocess.run(['npm', 'run', 'build:js'], cwd=ROOT, capture_output=True, text=True, shell=(sys.platform == 'win32'))
    if r.returncode != 0:
        print(r.stdout or r.stderr or 'build:js failed')
        raise SystemExit(r.returncode)
    out = str(ROOT / name)
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_STORED) as z:
        n = 0
        for r, ds, fs in os.walk(ROOT):
            ds[:] = [d for d in ds if d not in EXCLUDE and not d.startswith('.')]
            for f in fs:
                if f.endswith(('.pyc','.py','.zip','.md','.bak')) or f.startswith('CCGS_'): continue
                if f == '.merge_log.txt': continue
                z.write(os.path.join(r,f), os.path.relpath(os.path.join(r,f), ROOT).replace('\\','/'))
                n += 1
    kb = os.path.getsize(out)/1024
    print(f'Built: {name} ({kb:.0f}KB, {n} files)')
    return out

if __name__ == '__main__':
    build()
