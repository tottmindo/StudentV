/**
 * Sets up WebSocket event handlers for various data operations.
 * Handles authentication and different data requests from clients.
 * 
 * @param socket - The Socket.io socket instance for the client connection
 * @param data - Data access object containing methods for database operations
 * @param dormID - The ID of the dormitory for authentication
 * 
 * @throws Will emit "unauthorized" event if dormID is invalid

 */
import { Socket } from "socket.io";
import { Data } from "./data.js";
import { generateCleaningWeekForDorm } from "./jobs/scheduler.js";
import { getIO } from "./routes/socketManager.js";
function sockets(socket: Socket, data: Data, dormID: number, userID: number, role: string): void {
  if ((!dormID && role !== "ADMIN") || !userID) {
    console.warn(`⚠️ Unauthorized socket (${socket.id}) attempted to access restricted features.`);
    socket.emit("unauthorized", { message: "Authentication required." });
    return;
  }

  socket.on("getWaterData", async ()=>{
    console.log('Request for water data');
    try {
      const waterLogData = await data.getWaterData(); // Fetch testdata
      socket.emit("waterData", waterLogData); // Send testdata back to the client
    } catch (error) {
      console.error("Error fetching water data:", error);
      socket.emit("error", { message: "Failed to fetch water data." });
      }
  });

  socket.on("getEvents", async (filters: any) => {
    console.log(`Request for events with filters:`, filters);
    try {
      const events = await data.getEvents({ ...filters, dormID, userID });
      socket.emit("eventsData", events);
    } catch (error) {
      console.error("Error fetching events:", error);
      socket.emit("error", { message: "Failed to fetch events." });
    }
  });

  socket.on("createEvent", async (item: any, callback: any) => {
    console.log(`Request to create event:`, item);
    try {
      if (!dormID) throw new Error("Authentication is required to create an event.");
      const saved = await data.createEvent({ ...item, dormID, userID });
      const response = saved.event || { id: saved.id, ...item };
      socket.emit("eventCreated", response);

      if (typeof callback === "function") {
        callback({ id: saved.id, insertId: saved.insertId, event: response });
      }

      socket.to(`dorm-${dormID}`).emit("eventCreated", response);
      if (item.inviteFloor) getIO().to(`dorm-${dormID}`).emit("eventInvitationsUpdated");
    } catch (error: any) {
      console.error("Error creating event:", error);
      if (typeof callback === "function") {
        callback({ error: error.message || "Failed to create event." });
      }
      socket.emit("error", { message: "Failed to create event." });
    }
  });

  socket.on("respondToEventInvitation", async (payload: { eventID: number; accepted: boolean }, callback?: Function) => {
    try {
      await data.respondToEventInvitation(Number(payload.eventID), userID, dormID, Boolean(payload.accepted));
      getIO().to(`dorm-${dormID}`).emit("eventInvitationsUpdated", { eventID: Number(payload.eventID) });
      if (typeof callback === "function") callback({ success: true });
    } catch (error: any) {
      if (typeof callback === "function") callback({ error: error.message });
    }
  });

  socket.on("cancelEvent", async (payload: { eventID: number }, callback?: Function) => {
    try {
      await data.cancelEvent(Number(payload.eventID), userID, dormID);
      getIO().to(`dorm-${dormID}`).emit("eventCancelled", { eventID: Number(payload.eventID) });
      getIO().to(`dorm-${dormID}`).emit("eventInvitationsUpdated", { eventID: Number(payload.eventID) });
      if (typeof callback === "function") callback({ success: true });
    } catch (error: any) {
      if (typeof callback === "function") callback({ error: error.message });
    }
  });

  socket.on("getActivatedEvents", async (userID: number) => {
    console.log(`Request for activated events for user: ${userID}`);
    try {
      const events = await data.getActivatedEvents(userID);
      socket.emit("activatedEventsData", events);
    } catch (error) {
      console.error("Error fetching activated events:", error);
      socket.emit("error", { message: "Failed to fetch activated events." });
    }
  });
 
  // =====================================================
  // 🧹 CLEANING SYSTEM (NEW)
  // =====================================================

  /**
   * Get all cleaning weeks for dorm
   */
  socket.on("getCleaningWeeks", async () => {
    try {
      const weeks = await data.getCleaningWeeks(dormID, userID);
      socket.emit("cleaningWeeks", weeks);
    } catch (error) {
      console.error("Error fetching cleaning weeks:", error);
      socket.emit("error", { message: "Failed to fetch cleaning weeks." });
    }
  });

  /**
   * Get checklist tasks for a specific week (user scoped)
   */
  socket.on("getCleaningWeekTasks", async (payload: { weekID: number }) => {
    try {
      const tasks = await data.getCleaningWeekTasks(userID, payload.weekID);
      socket.emit("cleaningWeekTasks", tasks);
    } catch (error) {
      console.error("Error fetching week tasks:", error);
      socket.emit("error", { message: "Failed to fetch cleaning tasks." });
    }
  });

  /**
   * Toggle task completion
   */
  socket.on("toggleCleaningTask",
    async (payload: { weekTaskID: number; completed: boolean }, callback?: Function) => {
      try {
        await data.toggleCleaningTask(
          payload.weekTaskID,
          userID,
          payload.completed
        );

        socket.emit("cleaningTaskUpdated", {
          weekTaskID: payload.weekTaskID,
          completed: payload.completed,
        });

        socket.to(`dorm-${dormID}`).emit("cleaningTaskUpdated", {
          weekTaskID: payload.weekTaskID,
          completed: payload.completed,
        });

        if (typeof callback === "function") {
          callback({ success: true });
        }
      } catch (error: any) {
        if (
          error?.message === "Only the assigned user can update this task." ||
          error?.message === "Cleaning tasks can only be updated during their assigned week."
        ) {
          console.warn(`Socket ${socket.id} tried to update a locked cleaning task.`);
        } else {
          console.error("Error toggling task:", error);
        }

        if (typeof callback === "function") {
          callback({ error: error.message });
        }

        socket.emit("error", { message: "Failed to update task." });
      }
    }
  );

  socket.on("rungenerateCleaningWeekForDorm", async () => {
    try {
      console.log(`Request to generate cleaning week for dorm 1`);
      await generateCleaningWeekForDorm(1);
      console.log(`Cleaning week generated for dorm 1`);
    } catch (error) {
      console.error("Error generating cleaning week:", error);
      socket.emit("error", { message: "Failed to generate cleaning week." });
    }
  });

  /**
   * Add custom task
   */
  socket.on("addCleaningTask",
    async (
      payload: {
        weekID: number;
        title: string;
        description?: string;
        isImportant?: boolean;
      },
      callback?: Function
    ) => {
      if (typeof callback === "function") callback({ error: "Recurring tasks must be proposed and approved on the Community page." });
    }
  );

  /**
   * Delete custom task (NOT base tasks)
   */
  socket.on("deleteCleaningTask",
    async (payload: { weekTaskID: number }, callback?: Function) => {
      if (typeof callback === "function") callback({ error: "Tasks can only be removed by a majority vote on the Community page." });
    }
  );

  socket.on("getCleaningWeekSwapRequests", async (payload: { dormID: number }, callback?: Function) => {
    try {
      const requests = await data.getCleaningWeekSwapRequests(userID, dormID);
      socket.emit("cleaningWeekSwapRequests", requests);
      if (typeof callback === "function") callback({ success: true, requests });
    } catch (error: any) {
      console.error("Error fetching swap requests:", error);
      if (typeof callback === "function") callback({ error: error.message });
      socket.emit("error", { message: "Failed to fetch cleaning swap requests." });
    }
  });

  socket.on("requestCleaningWeekSwap", async (payload: { sourceWeekID: number; targetWeekID: number }, callback?: Function) => {
    try {
      await data.createCleaningWeekSwapRequest(userID, payload.sourceWeekID, payload.targetWeekID);
      if (typeof callback === "function") callback({ success: true });
      getIO().to(`dorm-${dormID}`).emit('swapRequestUpdated');
    } catch (error: any) {
      console.error("Error creating swap request:", error);
      if (typeof callback === "function") callback({ error: error.message });
      socket.emit("error", { message: "Failed to create cleaning week swap request." });
    }
  });

  socket.on("respondCleaningWeekSwapRequest", async (payload: { requestID: number; accepted: boolean }, callback?: Function) => {
    try {
      await data.respondCleaningWeekSwapRequest(userID, dormID, payload.requestID, payload.accepted);
      if (typeof callback === "function") callback({ success: true });

      // Broadcast update to all users in the dorm so they can refresh swap requests
      getIO().to(`dorm-${dormID}`).emit('swapRequestUpdated', { requestID: payload.requestID, accepted: payload.accepted });
    } catch (error: any) {
      console.error("Error responding to swap request:", error);
      if (typeof callback === "function") callback({ error: error.message });
      socket.emit("error", { message: "Failed to process cleaning week swap response." });
    }
  });

  socket.on("getDashboard", async () => {
    // Global administrators have no resident/dorm dashboard. Their landing
    // data is loaded by the dedicated administration endpoints instead.
    if (role === "ADMIN") return;
    try {
      const dashboard = await data.getDashboard(userID, dormID);
      socket.emit("dashboard", dashboard);
    } catch (err) {
      console.error("Dashboard error:", err);
      socket.emit("error", { message: "Failed to fetch dashboard." });
    }
  });                                         

  socket.on("getWaterStats", async (payload?: { days?: number }) => {
    try {
      const days = Number(payload?.days) || 30;
      const stats = await data.getFloorWaterStats(dormID, days);
      socket.emit("waterStats", stats);
    } catch (err) {
      console.error("Water stats error:", err);
      socket.emit("waterStatsError", { message: "Failed to fetch water statistics." });
    }
  });

  //---------------SURVEYS-------------------

  socket.on("createSurvey", async(item: any, callback: any) => {
    if (role !== "ADMIN"){
      socket.emit("error", {message: "unauthorized"});
      return;
    }
    console.log("Request to create survey", item);
    try{
        const saved = await data.createSurvey(item);
        getIO().emit("surveyCreated", saved)

        if (typeof callback === "function"){
          callback(saved);
        }
      }catch (err: any) {
        console.error("Error creating survey", err);
        
        if (typeof callback === "function"){
          callback({ error: err.message || "Failed to create survey"});
        }
      }
  });

  socket.on("updateSurvey", async(item: any, callback: any) => {
    if (role !== "ADMIN"){
      socket.emit("error", {message: "unauthorized"});
      return;
    }
    console.log("Request to update survey", item);
    try{
        const saved = await data.updateSurvey(item);
        getIO().emit("surveyUpdated", saved)

        if (typeof callback === "function"){
          callback(saved);
        }
      }catch (err: any) {
        console.error("Error updating survey", err);
        
        if (typeof callback === "function"){
          callback({ error: err.message || "Failed to update survey"});
        }
      socket.emit("error", {message: "Failed to update survey"});
      }
  });

  socket.on("getSurveyAll", async() => {
    if (role !== "ADMIN"){ //Säkert nog?
      socket.emit("error", {message: "unauthorized"});
      return;
    }
    console.log(`Request for getting all surveys`);
    try {
      const allSurveys = await data.getSurveyAll();
      socket.emit("allSurveys", allSurveys);
    } catch (error) {
      console.error("Error fetching all surveys:", error);
      socket.emit("error", { message: "Failed to fetch all surveys." });
    }
  });

  socket.on("getSurvey", async(eID: number) => {
    try{
      const survey = await data.getSurvey(eID);
      socket.emit("surveyData", survey);
    }catch (error){
      console.error("Error fetching survey", error);
      socket.emit("error", { message: "Failed to fetch all surveys." });
    }
  });

  socket.on("deleteSurvey", async(eID: number, callback: any) => {
    if (role !== "ADMIN"){
      callback({ error: "unauthorized" });
      return;
    }try{
      console.log("Deleting survey");
      const result = await data.deleteSurvey(eID);
      getIO().emit("surveyDeleted", { eID });
      callback({success: true, result});
    }catch(err: any){
      console.log("Error deleting survey", err);

      callback({ error: err.message || "Failed to delete survey"});
    }
  });

  socket.on("submitAnswer", async (eID: number, answer: string | null, optionIDs: number[], callback: any ) => {
    try {

      await data.saveSurveyAnswer(
        userID,
        eID,
        answer,
        optionIDs
      );

      if (typeof callback === "function") {
        callback({
          success: true,
          message: "Answer saved"
        });
      }

    } catch (err: any) {

      if (typeof callback === "function") {
        callback({
          error: err.message
        });
      }

    }
  });

  socket.on("getAnswers", async (eID: number, callback) => {
  if (role !== "ADMIN") {
    callback({ error: "unauthorized" });
    return;
  }
  try {
    const answers = await data.getAnswers(eID);
    callback({ answers });
  } catch (error) {
    console.error("getAnswers error:", error);
    callback({
      error: "Failed to fetch survey answers"
    });
  }
});

//----------------CHAT---------------

  socket.on("getChatRooms", async() => {
    try{
      const rooms = await data.getChatRooms(dormID, userID);
      socket.emit("chatRooms", rooms);
    } catch(err){
      socket.emit("error", { message: "Failed to fetch chat rooms" });
    }
  });

  const emitUnreadChats = async (target = socket) => target.emit("chatUnreadCounts", await data.getChatUnreadCounts(userID));
  socket.on("getChatUnreadCounts", async() => {
    try { await emitUnreadChats(); }
    catch (err) { console.error("Error fetching unread chats:", err); }
  });
  socket.on("markChatRead", async(chatID: number) => {
    try { await data.markChatRead(chatID, userID); await emitUnreadChats(); }
    catch (err) { console.error("Error marking chat as read:", err); }
  });

  socket.on("joinChatRoom", async(chatID: number) => {
    try{
      if (!Number.isInteger(chatID) || chatID <= 0) throw new Error("Invalid chat room.");
      const hasAccess = await data.hasAccessToChat(chatID, userID);
      if (!hasAccess){
        console.warn(`Unauthorized access attempt: User ${userID} tried to join Chat ${chatID}`);
        socket.emit("error", { message: "You do not have access to this chat." });
        return;
      }
      await socket.join(`chat-${chatID}`);
      console.log(`Joined socket chat-${chatID}`)
      const logs = await data.getChatHistory(chatID, userID);
      const name = await data.getChatName(chatID, userID);
      socket.emit("chatHistory", {chatID, logs, name});
      await data.markChatRead(chatID, userID);
      await emitUnreadChats();
    }catch(err:any){
      socket.leave(`chat-${chatID}`);
      socket.emit("error", { message: "Failed to fetch chat logs "});
    }
  });

  socket.on("leaveChatRoom", async(chatID: number) => {
    socket.leave(`chat-${chatID}`);
    console.log(`Left socket chat-${chatID}`);
  });

  socket.on("sendMessage", async(chatID: number, message : string, callback: any) => {
    try{
        const cleanMessage = typeof message === "string" ? message.trim() : "";
        if (!Number.isInteger(chatID) || chatID <= 0) throw new Error("Invalid chat room.");
        if (!cleanMessage || cleanMessage.length > 2000) throw new Error("Messages must contain between 1 and 2000 characters.");
        const hasAccess = await data.hasAccessToChat(chatID, userID);
        if (!hasAccess){
          console.warn(`Unauthorized access attempt: User ${userID} tried to join Chat ${chatID}`);
          socket.emit("error", { message: "You do not have access to this chat." });
          if (typeof callback === "function") callback({ error: "You do not have access to this chat." });
          return;
        }
        const newMessage = await data.newMessage(cleanMessage, chatID, userID);
        const recipients = await data.getChatMessageRecipients(chatID, userID);
        for (const recipientID of recipients) {
          getIO().to(`user-${recipientID}`).emit("newMessage", newMessage);
          if (recipientID !== userID) {
            const unread = await data.getChatUnreadCounts(recipientID);
            getIO().to(`user-${recipientID}`).emit("chatUnreadCounts", unread);
          }
        }

        if (typeof callback === "function"){
          callback(newMessage);
        }
      }catch (err: any) {
        console.error("Error creating chat message", err);
        
        if (typeof callback === "function"){
          callback({ error: err.message || "Failed to send message"});
        }
      }
  });


//-----------EXTERNAL EVENTS----------------
  socket.on("getExternalEvents", async () => {
    try {
      const weeks = await data.getExternalEvents();
     
      socket.emit("externalEvents", weeks);
    } catch (error) {
      console.error("Error fetching external events:", error);
      socket.emit("error", { message: "Failed to fetch external events." });
    }
  });

  socket.on("getNationsguidenEvents", async () => {
    try {
      const events = await data.getNationsguidenEvents()

      socket.emit("nationsguidenEvents", events)
    } catch (error) {
      console.error("Error fetching Nationsguiden events:", error)

      socket.emit("error", {
        message: "Failed to fetch Nationsguiden events."
      })
    }
  });
}



export { sockets };
