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
  if (!dormID || dormID === 0 || !userID || userID === 0) {
    console.warn(`⚠️ Unauthorized socket (${socket.id}) attempted to access restricted features.`);
    socket.emit("unauthorized", { message: "Authentication required." });
    return;
  }

  socket.on("getMenuData", (lang: string) => {
    console.log(`Request for menu data in language: ${lang}`);
    try {
      const labels = data.getMenuData(lang);
      socket.emit("menuData", labels);
    } catch (error) {
      console.error("Error fetching menu data:", error);
      socket.emit("error", { message: "Failed to fetch menu data." });
    }
  });

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
      const events = await data.getEvents(filters);
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
      const saved = await data.createEvent({ ...item, dormID });
      const response = saved.event || { id: saved.id, ...item };
      socket.emit("eventCreated", response);

      if (typeof callback === "function") {
        callback({ id: saved.id, insertId: saved.insertId, event: response });
      }

      socket.to(`dorm-${dormID}`).emit("eventCreated", response);
    } catch (error: any) {
      console.error("Error creating event:", error);
      if (typeof callback === "function") {
        callback({ error: error.message || "Failed to create event." });
      }
      socket.emit("error", { message: "Failed to create event." });
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
      try {
        await data.addCustomCleaningTask(
          payload.weekID,
          userID,
          payload.title,
          payload.description || "",
          payload.isImportant || false
        );

        const tasks = await data.getCleaningWeekTasks(userID, payload.weekID);
        socket.emit("cleaningWeekTasks", tasks);

        if (typeof callback === "function") {
          callback({ success: true });
        }
      } catch (error: any) {
        console.error("Error adding task:", error);

        if (typeof callback === "function") {
          callback({ error: error.message });
        }

        socket.emit("error", { message: "Failed to add task." });
      }
    }
  );

  /**
   * Delete custom task (NOT base tasks)
   */
  socket.on("deleteCleaningTask",
    async (payload: { weekTaskID: number }, callback?: Function) => {
      try {
        await data.deleteCustomCleaningTask(payload.weekTaskID, userID);

        socket.emit("cleaningTaskDeleted", {
          weekTaskID: payload.weekTaskID,
        });

        socket.to(`dorm-${dormID}`).emit("cleaningTaskDeleted", {
          weekTaskID: payload.weekTaskID,
        });

        if (typeof callback === "function") {
          callback({ success: true });
        }
      } catch (error: any) {
        console.error("Error deleting task:", error);

        if (typeof callback === "function") {
          callback({ error: error.message });
        }

        socket.emit("error", { message: "Failed to delete task." });
      }
    }
  );

  socket.on("getDashboard", async () => {
    try {
      const dashboard = await data.getDashboard(userID, dormID);
      socket.emit("dashboard", dashboard);
    } catch (err) {
      console.error("Dashboard error:", err);
      socket.emit("error", { message: "Failed to fetch dashboard." });
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

  socket.on("getAnswers", async (eID: number, callback) => {
    if (role !== "ADMIN") {
      callback({ error: "unauthorized" });
      return;
    }

    try {
      const answers = await data.getAnswers(eID);
      callback({ answers });
    } catch (error) {
      callback({ error: "Failed to fetch survey answers" });
    }
  });

  socket.on("submitAnswer",async(eID: number, answer: string, callback:any)=> {
  try{
    await data.saveSurveyAnswer(userID, eID, answer)
    if(typeof callback === "function"){
      callback({
        success:true,
        message:"Answer saved"
      })
    }

  }catch(err:any){
    if(typeof callback === "function"){
      callback({
        error:err.message
      })
    }
  }
});


//----------------CHAT---------------

  socket.on("getChatRooms", async() => {
    try{
      const rooms = await data.getChatRooms(dormID);
      socket.emit("chatRooms", rooms);
    } catch(err){
      socket.emit("error", { message: "Failed to fetch chat rooms" });
    }
  });

  socket.on("joinChatRoom", async(chatID: number) => {
    socket.join(`chat-${chatID}`);
    console.log(`Joined socket chat-${chatID}`)
    try{
      const hasAccess = await data.hasAccessToChat(chatID, userID);
      if (!hasAccess){
        console.warn(`Unauthorized access attempt: User ${userID} tried to join Chat ${chatID}`);
        socket.emit("error", { message: "You do not have access to this chat." });
        return;
      }
      const logs = await data.getChatHistory(chatID);
      const name = await data.getChatName(chatID);
      socket.emit("chatHistory", {chatID, logs, name});
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
    console.log("time to send message", message);
    try{
        const hasAccess = await data.hasAccessToChat(chatID, userID);
        if (!hasAccess){
          console.warn(`Unauthorized access attempt: User ${userID} tried to join Chat ${chatID}`);
          socket.emit("error", { message: "You do not have access to this chat." });
          return;
        }
        const newMessage = await data.newMessage(message, chatID, userID);
        getIO().to(`chat-${chatID}`).emit("newMessage", newMessage)

        if (typeof callback === "function"){
          callback(newMessage);
        }
      }catch (err: any) {
        console.error("Error creating survey", err);
        
        if (typeof callback === "function"){
          callback({ error: err.message || "Failed to create survey"});
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
}

export { sockets };
