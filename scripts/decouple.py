"""
V18.1 批量解耦脚本: window.CoCState.* → CoCStateAccessor.*
安全策略: 只替换已知的state属性访问，不改逻辑。
"""
import os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JS_ROOT = os.path.join(ROOT, 'js')

# 替换映射: (匹配模式, 替换为)
REPLACEMENTS = [
    # 游戏状态
    (r'window\.CoCState\.gameState\.roster', 'CoCStateAccessor.getRoster()'),
    (r'window\.CoCState\.gameState\.chatHistory', 'CoCStateAccessor.getChatHistory()'),
    (r'window\.CoCState\.gameState\.isLoading', 'CoCStateAccessor.isLoading()'),
    (r'window\.CoCState\.gameState\.combat', 'CoCStateAccessor.getCombat()'),
    (r'window\.CoCState\.gameState\.currentLocation', 'CoCStateAccessor.getCurrentLocation()'),
    (r'window\.CoCState\.gameState\.sceneMap', 'CoCStateAccessor.getSceneMap()'),
    (r'window\.CoCState\.gameState\.clueBoard', 'CoCStateAccessor.getClueBoard()'),
    (r'window\.CoCState\.gameState\.npcRoster', 'CoCStateAccessor.getNpcRoster()'),
    (r'window\.CoCState\.gameState\.npcRegistry', 'CoCStateAccessor.getNpcRegistry()'),
    # UI
    (r'window\.CoCState\.showToast\(', 'CoCStateAccessor.showToast('),
    (r'window\.CoCState\.switchScreen\(', 'CoCStateAccessor.switchScreen('),
    (r'window\.CoCState\.pushMessageBatched\(', 'CoCStateAccessor.pushMessage('),
    # 存档
    (r'window\.CoCState\.saveGame\(', 'CoCStateAccessor.saveGame('),
    (r'window\.CoCState\.loadGame\(', 'CoCStateAccessor.loadGame('),
    # 物品
    (r'window\.CoCState\.gameState\.roster\[0\]', 'CoCStateAccessor.getActiveChar()'),
]

# 扫描文件
changed = 0
for root, dirs, files in os.walk(JS_ROOT):
    dirs[:] = [d for d in dirs if d != 'engines']  # skip engine adapters
    for fname in files:
        if not fname.endswith('.js'):
            continue
        fpath = os.path.join(root, fname)
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        for pattern, replacement in REPLACEMENTS:
            content = re.sub(pattern, replacement, content)
        
        if content != original:
            # Add accessor import comment if not present
            if 'CoCStateAccessor' in content and 'V18.1' not in content:
                content = '// V18.1: 使用 CoCStateAccessor\n' + content
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(content)
            count = len(re.findall(r'CoCStateAccessor\.', content))
            rel = os.path.relpath(fpath, ROOT).replace('\\', '/')
            print(f'  {rel}: {count} replacements')
            changed += 1

print(f'\nFiles changed: {changed}')
