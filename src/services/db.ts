import Dexie, { type EntityTable } from 'dexie';
import type { Writing } from '@/types/writing';

class WritingCoachDB extends Dexie {
  writings!: EntityTable<Writing, 'id'>;

  constructor() {
    super('writing-coach');
    this.version(1).stores({
      // primary key id, 보조 인덱스: updatedAt(최신순), type(필터)
      writings: 'id, updatedAt, type',
    });
  }
}

export const db = new WritingCoachDB();

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `w-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function listWritings(): Promise<Writing[]> {
  return db.writings.orderBy('updatedAt').reverse().toArray();
}

export async function getWriting(id: string): Promise<Writing | undefined> {
  return db.writings.get(id);
}

export async function saveWriting(writing: Writing): Promise<void> {
  await db.writings.put({ ...writing, updatedAt: Date.now() });
}

export async function deleteWriting(id: string): Promise<void> {
  await db.writings.delete(id);
}
