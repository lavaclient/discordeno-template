import { join } from "https://deno.land/std@0.104.0/path/mod.ts"
import { cache, DiscordenoMessage, DiscordenoVoiceState, Embed, sendMessage } from "../../deps.ts";

const cwd = `${Deno.mainModule.substring(0, Deno.mainModule.lastIndexOf("/"))}`;

export function walk(directory: string): string[] {
    function read(dir: string, files: string[] = []): string[] {
        for (const entry of Deno.readDirSync(dir)) {
            const path = join(dir, entry.name);
            if (entry.isDirectory) {
                files.concat(read(path, files));
            } else if (entry.isFile) {
                files.push(path);
            } else {
                // fuck symlinks ig
            }
        }

        return files;
    }

    return read(directory);
}

export function getMemberVoiceState(guildId: bigint, memberId: bigint): DiscordenoVoiceState | null {
    return cache.guilds.get(guildId)?.voiceStates?.get(memberId) ?? null;
}

export function isMemberInVc(guildId: bigint, memberId: bigint): boolean {
    return !!getMemberVoiceState(guildId, memberId)?.channelId;
}

export function sendEmbeds(channelId: bigint, ...embeds: Embed[]): Promise<DiscordenoMessage> {
    return sendMessage(channelId, { embeds });
}

/* methods that are pretty much from the official discordeno template. */
let uniqueFilePathCounter = 0;
let paths: string[] = [];

export async function importDirectory(dir: string) {
    const entries = Deno.readDirSync(dir)
    for (const entry of entries) {
        if (!entry.name) {
            continue
        }

        const path = join(dir, entry.name);
        if (entry.isFile) {
            if (path.endsWith(".ts")) {
                paths.push(`import "file://${path}#${uniqueFilePathCounter}";`);
            }

            continue;
        }

        await importDirectory(path);
    }

    uniqueFilePathCounter++;
}

export async function fileLoader() {
    await Deno.writeTextFile(`file_loader.ts`, paths.join("\n"))
    await import(`${cwd}/file_loader.ts#${uniqueFilePathCounter}`);
    paths = [];
}
