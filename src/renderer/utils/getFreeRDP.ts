import { execFileAsync, stringifyExecFile } from "../lib/exec-helper";

export class FreeRDPInstallation {
    file: string;
    defaultArgs: string[];

    constructor(file: string, defaultArgs: string[] = []) {
        this.file = file;
        this.defaultArgs = defaultArgs;
    }

    exec(args: string[]): Promise<{
        stdout: string;
        stderr: string;
    }> {
        return execFileAsync(this.file, this.defaultArgs.concat(args));
    }

    stringifyExec(args: string[]): string {
        return stringifyExecFile(this.file, this.defaultArgs.concat(args));
    }
}

/**
 * List of FreeRDP installations to check for, in order of preference
 * The flatpak is checked first because it is most likely to be up to date.
 */
const freeRDPInstallations = [
    new FreeRDPInstallation("flatpak", ["run", "--command=xfreerdp", "com.freerdp.FreeRDP"]),
    new FreeRDPInstallation("xfreerdp3"),
    new FreeRDPInstallation("xfreerdp"),
];

/**
 * Returns the correct FreeRDP 3.x.x command available on the system or null
 */
export async function getFreeRDP() {
    const VERSION_3_STRING = "version 3.";
    for (let installation of freeRDPInstallations) {
        try {
            const shellOutput = await installation.exec(["--version"]);
            if (shellOutput.stdout.includes(VERSION_3_STRING)) {
                return installation;
            }
        } catch {}
    }
    return null;
}
