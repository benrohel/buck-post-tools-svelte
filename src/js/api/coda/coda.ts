import { table } from "console";
import tokens from "../../../../tokens.json";

const CODA_BASE_URL = "https://coda.io/apis/v1";
const CODA_TOKEN = tokens.coda;

const POST_ADMIN_CODA_URL =
  "https://coda.io/d/Post-Admin-Hub_d1n0bLgRgrq/PostData_suWrR#Coda-Tracker-Infos_tutJQ/r1";
const POST_PROJECT_INFO_TABLE_ID = "grid-vw_8cU1tJQ";

const codaidRE = /(?<urlPrefix>.*_d)(?<projectId>.*?)\//;
export const GetCodaIdFromUrl = (url: string): string => {
  try {
    const [match, urlPrefix, projectId] = codaidRE.exec(url) as Array<string>;
    if (match && projectId) {
      return projectId;
    }
    return "";
  } catch (e) {
    console.log(e);
    return "";
  }
};

export const GetTable = async (docId: string, tableName: string) => {
  const options = {
    method: "GET",
    headers: {
      Authorization: `Bearer ${CODA_TOKEN}`,
    },
  };

  const reponse = await fetch(
    `${CODA_BASE_URL}/docs/${docId}/tables/${tableName}`,
    options
  );
  const json = await reponse.json();
  return json;
};

export const GetRows = async (docId: string, tableName: string) => {
  const options = {
    method: "GET",
    headers: {
      Authorization: `Bearer ${CODA_TOKEN}`,
    },
  };

  const params = new URLSearchParams({
    useColumnNames: "true",
    valueFormat: "simple",
  });

  const response = await fetch(
    `${CODA_BASE_URL}/docs/${docId}/tables/${tableName}/rows?${params}`,
    options
  );
  const json = await response.json();
  return json.items;
};

export const UpdateRow = async (row: string, data: any) => {
  const options = {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${CODA_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
  const response = await fetch(`${row}`, options);
  console.log(response);
  const json = await response.json();
  return json;
};

declare interface CodaCell {
  column: string;
  value: any;
}

declare interface CodaUpsterRow {
  cells: CodaCell[];
}

declare interface CodaUpsertRowsData {
  rows: CodaUpsterRow[];
  keyColumns: string[];
}

export const UpsertRows = async (
  docUrl: string,
  tableName: string,
  data: CodaUpsertRowsData
): Promise<boolean> => {
  const docId = GetCodaIdFromUrl(docUrl);

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CODA_TOKEN}`,
    },
    body: JSON.stringify(data),
  };

  const response = await fetch(
    `https://coda.io/apis/v1/docs/${docId}/tables/${tableName}/rows`,
    options
  );
  console.log(response);
  if (response.status === 202) {
    return Promise.resolve(true);
  } else {
    return Promise.resolve(false);
  }
};

export const GetProjectTrackerInfos = async () => {
  const docId = GetCodaIdFromUrl(POST_ADMIN_CODA_URL);
  const projectRows = await GetRows(docId, POST_PROJECT_INFO_TABLE_ID);

  return projectRows.map((row: any) => {
    const projectName = row.values["Project"];
    const editVersionColumn = row.values["EditVersionColumn"];
    const compVersionColumn = row.values["CompVersionColumn"];
    const tableName = row.values["TableName"];
    const docUrl = row.values["DocUrl"];
    return {
      docUrl: docUrl,
      name: projectName,
      tableName: tableName,
      editVersionColumn: editVersionColumn,
      compVersionColumn: compVersionColumn,
    };
  });
};
