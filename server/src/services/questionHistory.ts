import { createHash } from 'crypto';
import prisma from '../config/db';
import { Question } from './questionEngine';

export function hashQuestion(text: string): string {
  return createHash('md5').update(text.toLowerCase().trim()).digest('hex');
}

/** Fetch the set of question hashes already seen by any of the given users. */
export async function getSeenHashes(userIds: string[]): Promise<Set<string>> {
  if (!userIds.length) return new Set();
  try {
    const records = await prisma.userQuestionHistory.findMany({
      where: { userId: { in: userIds } },
      select: { questionHash: true }
    });
    return new Set(records.map(r => r.questionHash));
  } catch {
    return new Set(); // DB unavailable — degrade gracefully
  }
}

/** Persist all questions from this game for every player (skip duplicates). */
export async function saveSeenQuestions(userIds: string[], questions: Question[]): Promise<void> {
  if (!userIds.length || !questions.length) return;
  const data = userIds.flatMap(userId =>
    questions.map(q => ({ userId, questionHash: hashQuestion(q.question) }))
  );
  try {
    await prisma.userQuestionHistory.createMany({ data, skipDuplicates: true });
  } catch {
    // Non-fatal — guest userIds will fail FK constraint; real users still saved
  }
}
