import express from "express";
import { authenticate, AuthenticatedRequest, requireCompletedAccount } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { cancelTaskProposal, castTaskProposalVote, createTaskChangeProposal, createTaskProposal, createTaskRemovalProposal, listDormCommunity, listDormTaskGovernance, updateResidentProfile } from "../services/communityService.js";
import { castTaskVoteSchema, createTaskChangeProposalSchema, createTaskProposalSchema, updateResidentProfileSchema } from "../validators/communitySchemas.js";
import { getIO } from "./socketManager.js";

const router = express.Router();

function requireResidentDorm(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  if (req.authUser?.role !== "STUDENT" || req.authUser.dormID == null) {
    res.status(403).json({ error: "A resident dorm assignment is required." });
    return;
  }
  next();
}

router.get("/", authenticate, requireCompletedAccount, requireResidentDorm, async (req: AuthenticatedRequest, res) => {
  try {
    res.json(await listDormCommunity(req.authUser!.userID, req.authUser!.dormID!));
  } catch (error) {
    console.error("Could not load dorm community:", error);
    res.status(500).json({ error: "Could not load your community." });
  }
});

router.patch("/profile", authenticate, requireCompletedAccount, requireResidentDorm, validate(updateResidentProfileSchema), async (req: AuthenticatedRequest, res) => {
  try {
    res.json(await updateResidentProfile(req.authUser!.userID, req.authUser!.dormID!, req.body.bio));
  } catch (error) {
    console.error("Could not update resident profile:", error);
    res.status(500).json({ error: "Could not save your introduction." });
  }
});

router.get("/cleaning-tasks", authenticate, requireCompletedAccount, requireResidentDorm, async (req: AuthenticatedRequest, res) => {
  try { res.json(await listDormTaskGovernance(req.authUser!.userID, req.authUser!.dormID!)); }
  catch (error) { console.error("Could not load cleaning task votes:", error); res.status(500).json({ error: "Could not load cleaning task votes." }); }
});

router.post("/cleaning-tasks/proposals", authenticate, requireCompletedAccount, requireResidentDorm, validate(createTaskProposalSchema), async (req: AuthenticatedRequest, res) => {
  try { const result = await createTaskProposal(req.authUser!.userID, req.authUser!.dormID!, req.body); getIO().to(`dorm-${req.authUser!.dormID}`).emit("cleaningTaskProposalsUpdated"); res.status(201).json(result); }
  catch (error: any) { res.status(400).json({ error: error.message || "Could not create task proposal." }); }
});

router.post("/cleaning-tasks/:templateID/change", authenticate, requireCompletedAccount, requireResidentDorm, validate(createTaskChangeProposalSchema), async (req: AuthenticatedRequest, res) => {
  try { const result = await createTaskChangeProposal(req.authUser!.userID, req.authUser!.dormID!, Number(req.params.templateID), req.body); getIO().to(`dorm-${req.authUser!.dormID}`).emit("cleaningTaskProposalsUpdated"); res.status(201).json(result); }
  catch (error: any) { res.status(400).json({ error: error.message || "Could not start change vote." }); }
});

router.post("/cleaning-tasks/:templateID/remove", authenticate, requireCompletedAccount, requireResidentDorm, async (req: AuthenticatedRequest, res) => {
  try { const result = await createTaskRemovalProposal(req.authUser!.userID, req.authUser!.dormID!, Number(req.params.templateID)); getIO().to(`dorm-${req.authUser!.dormID}`).emit("cleaningTaskProposalsUpdated"); res.status(201).json(result); }
  catch (error: any) { res.status(400).json({ error: error.message || "Could not start removal vote." }); }
});

router.post("/cleaning-tasks/proposals/:proposalID/vote", authenticate, requireCompletedAccount, requireResidentDorm, validate(castTaskVoteSchema), async (req: AuthenticatedRequest, res) => {
  try { const result = await castTaskProposalVote(req.authUser!.userID, req.authUser!.dormID!, Number(req.params.proposalID), req.body.choice); getIO().to(`dorm-${req.authUser!.dormID}`).emit("cleaningTaskProposalsUpdated"); res.json(result); }
  catch (error: any) { res.status(400).json({ error: error.message || "Could not record vote." }); }
});

router.delete("/cleaning-tasks/proposals/:proposalID", authenticate, requireCompletedAccount, requireResidentDorm, async (req: AuthenticatedRequest, res) => {
  try { const result = await cancelTaskProposal(req.authUser!.userID, req.authUser!.dormID!, Number(req.params.proposalID)); getIO().to(`dorm-${req.authUser!.dormID}`).emit("cleaningTaskProposalsUpdated"); res.json(result); }
  catch (error: any) { res.status(400).json({ error: error.message || "Could not cancel vote." }); }
});

export default router;
