#!/usr/bin/env python3
"""
CoC 7th Engine — 无损合并脚本
===============================
merge.py --dry-run           预览
merge.py --conflict-report    查看归属
merge.py                      执行合并
"""
import os, sys, shutil, hashlib
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).parent
MANIFEST_PATH = ROOT / 'MANIFEST.yaml'

def load_manifest():
    roles = {}
    current_role = None
    with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
        for line in f:
            stripped = line.strip()
            if ':' in stripped and not stripped.startswith('#') and not stripped.startswith('-'):
                key = stripped.split(':')[0].strip()
                if key in ['programmer', 'artist', 'qa', 'designer', 'shared']:
                    current_role = key
                    roles.setdefault(current_role, [])
            elif stripped.startswith('- ') and current_role:
                fpath = stripped[2:].strip().rstrip('/')
                if fpath:
                    roles[current_role].append(fpath)
    return {'roles': roles}

def file_role_map(manifest):
    fmap = {}
    for role, patterns in manifest['roles'].items():
        for p in patterns:
            fmap[p] = role
    return fmap

def hash_file(path):
    if not path.exists():
        return None
    with open(path, 'rb') as f:
        return hashlib.md5(f.read()).hexdigest()

def merge(from_dirs, dry_run=False):
    manifest = load_manifest()
    fmap = file_role_map(manifest)
    log_entries = []
    merged, conflicts, skipped = [], [], []

    for role_dir in from_dirs:
        role = role_dir.name if isinstance(role_dir, Path) else Path(role_dir).name
        if role not in ['programmer', 'artist', 'qa', 'designer']:
            print('[SKIP] Unknown role:', role_dir)
            continue

        for src in Path(role_dir).rglob('*'):
            if src.is_dir():
                continue
            rel = src.relative_to(role_dir)
            dst = ROOT / rel
            rel_str = str(rel).replace(chr(92), '/')

            owner = fmap.get(rel_str)
            if owner is None:
                for prefix, o in fmap.items():
                    if rel_str.startswith(prefix):
                        owner = o
                        break

            if owner is None:
                skipped.append((rel_str, 'not in MANIFEST'))
                continue

            if owner != role and owner != 'shared':
                conflicts.append((rel_str, role, owner))
                continue

            if hash_file(src) == hash_file(dst):
                continue

            if dry_run:
                merged.append((rel_str, role))
            else:
                dst.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src, dst)
                merged.append((rel_str, role))
                log_entries.append('MERGE [{}] {}'.format(role, rel_str))

    print()
    print('=' * 55)
    print('  Merge Report  {}'.format(datetime.now().strftime('%Y-%m-%d %H:%M')))
    print('=' * 55)

    if merged:
        print('\n  Merged ({}):'.format(len(merged)))
        for p, r in merged:
            print('    [{:12}] {}'.format(r, p))

    if conflicts:
        print('\n  CONFLICTS ({}):'.format(len(conflicts)))
        for p, attempted, owner in conflicts:
            print('    {}'.format(p))
            print('      Owner: [{}]  Attempted: [{}] -> BLOCKED'.format(owner, attempted))

    if skipped:
        print('\n  Skipped ({}):'.format(len(skipped)))
        for p, reason in skipped:
            print('    {} ({})'.format(p, reason))

    print('\n  Merged:{}  Conflicts:{}  Skipped:{}'.format(len(merged), len(conflicts), len(skipped)))

    if log_entries:
        log_path = ROOT / '.merge_log.txt'
        with open(log_path, 'a', encoding='utf-8') as log:
            log.write('\n--- {} ---\n'.format(datetime.now().isoformat()))
            log.write('\n'.join(log_entries) + '\n')

    return len(conflicts) == 0

if __name__ == '__main__':
    import argparse
    p = argparse.ArgumentParser(description='CoC multi-role merge')
    p.add_argument('--from', dest='from_dirs', nargs='*', help='Role directories')
    p.add_argument('--dry-run', action='store_true', help='Preview only')
    p.add_argument('--conflict-report', action='store_true', help='Show file ownership')
    args = p.parse_args()

    if args.conflict_report:
        manifest = load_manifest()
        fmap = file_role_map(manifest)
        for path, owner in sorted(fmap.items()):
            print('  [{:12}] {}'.format(owner, path))
        sys.exit(0)

    from_dirs = args.from_dirs or []
    if not from_dirs:
        roles_dir = ROOT / 'roles'
        if roles_dir.exists():
            from_dirs = sorted(roles_dir.iterdir())
        else:
            print('Error: roles/ directory not found')
            sys.exit(1)

    from_dirs = [Path(d) for d in from_dirs]
    ok = merge(from_dirs, args.dry_run)
    sys.exit(0 if ok else 1)
