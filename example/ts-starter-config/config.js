const main = '/tmp/ags/main.js';

try {
    await Utils.execAsync([
        'bun', 'build', `${App.configDir}/main.ts`,
        '--outfile', main,
        '--external', 'resource://*',
        '--external', 'gi://*',
        '--external', 'file://*',
    ]);
} catch (error) {
    console.error(error);
    App.quit();
}

const { default: config } = await import(`file://${main}`);
export default config;
