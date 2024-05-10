import dotenv from "dotenv";

dotenv.config();
console.log(process.env);

const CODA_BASE_URL = "https://coda.io/apis/v1";
const CODA_TOKEN = "f4274878-0883-4b33-8f2a-8711dde04e80";

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

GetRows("ZeCy10FvzV", "table-pTYL57KY3D").then((res) => {
  console.log(res);
});
