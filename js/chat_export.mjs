// ===============================================
// 归属：【程序】 引擎核心 / AI调度 / 状态管理
// 美术/策划/QA 请勿直接修改此文件
// 修改后放入 roles/programmer/ 运行 merge.py 合并
// ===============================================

/**
 * Chat Export Utilities — copy & export conversation.
 * Attached to CoCState for global access from any view.
 */
export const ChatExport = {
    /**
     * Copy all visible chat messages to clipboard as plain text.
     */
    copyChatText: function(state) {
        const text = (state.gameState.chatHistory || [])
            .filter(function(m) { return !m.isLocalOnly && !m.isLocalError && !m.isHidden; })
            .map(function(m) {
                var role = m.role === 'user' ? '[玩家]' : m.role === 'assistant' ? '[守秘人]' : '[系统]';
                return role + ' ' + (m.content || '');
            })
            .join('\n\n');
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function() {
                state.showToast('已复制 ' + text.length + ' 字符到剪贴板', 'success');
            });
        } else {
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            state.showToast('已复制 ' + text.length + ' 字符到剪贴板', 'success');
        }
    },

    /**
     * Export chat as Markdown file download.
     */
    exportChatMarkdown: function(state) {
        var lines = [];
        lines.push('# CoC 7th Engine — 对话记录');
        lines.push('> 导出时间: ' + new Date().toLocaleString('zh-CN'));
        lines.push('> 地点: ' + (state.gameState.currentLocation || '未知'));
        lines.push('');
        
        (state.gameState.chatHistory || []).forEach(function(m) {
            if (m.isLocalOnly || m.isLocalError || m.isHidden) return;
            var role = m.role === 'user' ? '**玩家**' : m.role === 'assistant' ? '**守秘人**' : '*系统*';
            lines.push('### ' + role);
            lines.push((m.content || '').replace(/\n/g, '\n\n'));
            lines.push('');
        });
        
        var text = lines.join('\n');
        var blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'CoC_Chat_' + new Date().toISOString().slice(0, 10) + '.md';
        a.click();
        URL.revokeObjectURL(url);
        state.showToast('对话已导出为 Markdown 文件', 'success');
    }
};
