import { z } from "zod";

export const updateResidentProfileSchema = z.object({
  bio: z.string().trim().max(500),
});

const taskTitle = z.string().trim().min(2).max(100);
const taskDescription = z.string().trim().max(1000).default("");
export const createTaskProposalSchema = z.object({ title: taskTitle, description: taskDescription, isImportant: z.boolean().default(false) });
export const createTaskChangeProposalSchema = createTaskProposalSchema;
export const castTaskVoteSchema = z.object({ choice: z.enum(["approve", "reject"]) });
