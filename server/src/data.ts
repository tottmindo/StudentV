// Compatibility entry point. New code should import domain repositories from
// `database` or `modules` rather than adding more concerns to this facade.
export { Data } from "./database/dataRepository.js";
export type {
  CleaningWeek,
  CleaningWeekSwapRequest,
  CleaningWeekTask,
} from "./types/data.js";
