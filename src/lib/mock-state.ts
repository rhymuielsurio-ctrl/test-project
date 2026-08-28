import * as fs from "node:fs";
import * as path from "node:path";
import { MOCK_BALANCES, MOCK_LEAVE_REQUESTS } from "./mock-data";

interface MockStateFile {
  balances: typeof MOCK_BALANCES;
  requests: typeof MOCK_LEAVE_REQUESTS;
}

let hydrated = false;

function stateFile(): string {
  return path.join(process.cwd(), "mock-state.json");
}

function replaceContents<T>(target: T[], source: T[]): void {
  target.splice(0, target.length, ...source);
}

export async function loadMockState(): Promise<void> {
  if (hydrated) return;
  hydrated = true;

  let raw: string;
  try {
    raw = await fs.promises.readFile(stateFile(), "utf8");
  } catch {
    return;
  }

  try {
    const state = JSON.parse(raw) as Partial<MockStateFile>;
    if (Array.isArray(state.requests) && state.requests.length > 0) {
      replaceContents(MOCK_LEAVE_REQUESTS, state.requests);
    }
    if (Array.isArray(state.balances) && state.balances.length > 0) {
      replaceContents(MOCK_BALANCES, state.balances);
    }
  } catch {
    return;
  }
}

export async function saveMockState(): Promise<void> {
  try {
    const payload: MockStateFile = {
      balances: MOCK_BALANCES,
      requests: MOCK_LEAVE_REQUESTS,
    };
    await fs.promises.writeFile(stateFile(), JSON.stringify(payload, null, 2), "utf8");
  } catch {
    return;
  }
}
