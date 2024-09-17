import { TerminalApi, ThemeService } from '@vscode-utility/terminal-browserify';
import { window } from 'vscode';
import { Configuration } from '../configuration/configuration';
import { constants } from '../utils/constants';
import { findTerminal } from '../utils/find-terminal-in-config';
import { showErrorMessageWithDetail } from '../utils/utils';

export const activeByTerminalAsync = async (
    sessionId: string | undefined,
    terminalArrayIndex: number | undefined,
    terminalItemName: string | undefined
): Promise<void> => {
    try {
        const terminal = await findTerminal(sessionId, terminalArrayIndex, terminalItemName);
        if (!terminal) {
            window.showWarningMessage(constants.selectTerminalToActive);
            return;
        }

        // Read the config
        const { createTerminal, getCwdPath } = TerminalApi.instance();
        const configInstance = Configuration.instance();
        const config = await configInstance.load();
        const { theme = 'default', noClear = false } = config;
        const themeService = new ThemeService(theme);

        // Set terminal cwd
        const terminals = Array.isArray(terminal) ? terminal : [terminal];
        for (let i = 0; i < terminals.length; i++) {
            const tm = terminals[i];
            const cwdPath = await getCwdPath(tm.cwd);
            if (cwdPath) {
                tm.cwdPath = cwdPath;
            }
        }

        // Create terminal
        if (Array.isArray(terminal)) {
            const parentTerminal = createTerminal(themeService, terminal[0], { kind: 'parent' }, noClear);
            for (let i = terminal.length - 1; i >= 1; i--) {
                createTerminal(themeService, terminal[i], { kind: 'children', parentTerminal }, noClear);
            }
        } else {
            createTerminal(themeService, terminal, { kind: 'standalone' }, noClear);
        }
    } catch (error) {
        showErrorMessageWithDetail(constants.activeTerminalFailed, error);
    }
};
