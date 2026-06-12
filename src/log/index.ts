import fs from "node:fs";
import path from "node:path";

const writer = fs.createWriteStream(path.join(import.meta.dirname, "..", "..", "logs", "debug.log"));

function parseMeta(meta: any) {
	if(typeof meta === "string") return meta;
	if(typeof meta === "object") return JSON.stringify(meta, null, 2);
	if(["number", "boolean", "bigint"].includes(typeof meta)) return String(meta);
	if(meta instanceof Map) return JSON.stringify(Object.fromEntries(meta), null, 2);
	if(meta instanceof Set) return JSON.stringify([...meta], null, 2);
	return String(meta);
}

export const logger = {
	log: (message: string, ...meta: any[]) => {
		const strMeta = meta.map(v => parseMeta(v)).join("\n");
		const msgStr = `---------- [MSG] ----------\n${message}\n`;
		const metaStr = `---------- [MET] ----------\n${strMeta}`;
		const logStr = `${msgStr}${metaStr}\n`;

		writer.write(logStr);
	}
}
