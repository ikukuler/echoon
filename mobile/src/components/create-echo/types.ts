import { EchoPart } from "../../types";

export interface DraftAttachment {
  draftId: string;
  type: Exclude<EchoPart["type"], "text">;
  content: string;
  localUri?: string;
  fileName?: string;
  mimeType?: string;
  duration?: number;
}
