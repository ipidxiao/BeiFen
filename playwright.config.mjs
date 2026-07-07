// @ts-check
/** Playwright config — optional E2E (OPT-034). Not run in default npm test. */
export default {
    testDir: './tests/playwright',
    timeout: 60_000,
    retries: 0,
    use: {
        baseURL: 'http://127.0.0.1:8080',
        headless: true,
        trace: 'off',
    },
    webServer: {
        command: 'python -m http.server 8080',
        url: 'http://127.0.0.1:8080',
        reuseExistingServer: true,
        timeout: 30_000,
    },
};
