import { time } from "console";
import { GetRows, GetCodaIdFromUrl, UpdateRow } from "../coda/coda";
import { GetFileVersion } from "../files/files";
import { set } from "date-fns";

export const GetCodaTrackerData = async (
  clips: any[],
  docId: string,
  codaTable: string
) => {
  console.log("coda table", codaTable);
  const rows = await GetRows(docId, codaTable);
  console.log("rows", rows);

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
    console.log("tracker clips", trackerClips);
    return trackerClips;
  } catch (err) {
    return [];
  }
};

export const UpdateTracker = async (clips: any[]) => {
  for (let i = 0; i < clips.length; i++) {
    let clip = clips[i];
    const rowUrl = clip.trackerClip.href;
    await UpdateRow(rowUrl, {
      row: {
        cells: [
          {
            column: "Edit Version",
            value: GetFileVersion(clip.filepath),
          },
        ],
      },
    });
  }
};
