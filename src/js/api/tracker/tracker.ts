import { ca } from "date-fns/locale";
import { GetRows, GetCodaIdFromUrl } from "../coda/coda";

export const GetCodaTrackerData = async (
  clips: any[],
  codaUrl: string,
  codaTable: string
) => {
  const docId = GetCodaIdFromUrl(codaUrl);
  const rows = await GetRows(docId, codaTable);

  if (!rows) {
    return [];
  }

  try {
    const trackerClips = clips.map((clip) => {
      const row = rows.find((row: any) => {
        return row.name.match(clip.shotName.split("_")[0]);
      });
      if (row) {
        clip.shotName = row.name;
        return {
          ...clip,
          trackerClip: row,
        };
      }
      return clip;
    });

    return trackerClips;
  } catch (err) {
    return [];
  }
};
