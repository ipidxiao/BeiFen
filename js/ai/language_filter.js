// GENERATED from js/ai/language_filter.mjs — do not edit; run: npm run build:js
// AI narrative language filter — wraps LANGUAGE_SELF_CORRECTION for chat display


const CoCLanguageFilter = {
    processText,
    detectViolations,
    safeFallback,
    evaluate(text) {
        return detectViolations(text).ok ? 1 : 0;
    },
    run(text, opts) {
        const result = run(text, opts);
        return result.text;
    },
    runDetailed(text, opts) {
        return run(text, opts);
    }
};

if (typeof window !== 'undefined') {
    window.CoCLanguageFilter = CoCLanguageFilter;
}
