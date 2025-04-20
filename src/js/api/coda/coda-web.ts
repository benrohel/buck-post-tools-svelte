import markdownToTxt from 'markdown-to-txt';
import { CODA_TOKEN } from '../../../../secrets';
interface Header {
  [key: string]: string;
}

interface BuckRequestConfig {
  method: 'GET' | 'PUT' | 'POST' | 'DELETE' | 'PATCH';
  request: string;
  headers?: Header;
  contentType?: string;
  data?: any;
}

const CODA_URL = 'https://coda.io/apis/v1';
const codaIdRE = /(?<urlPrefix>.*_d)(?<projectId>.*?)\//;

export const GetCodaIdFromUrl = (url: string): string => {
  try {
    console.log(url);
    const [match, urlPrefix, projectId] = codaIdRE.exec(url) as Array<string>;
    if (match && projectId) {
      return projectId;
    }
    return '';
  } catch (e) {
    console.log(e);
    return '';
  }
};

const expressionsDocId = 'TFoJxLBvGS';

export const CodaRequest = async (
  requestOptions: BuckRequestConfig
): Promise<any> => {
  const url = `${CODA_URL}${requestOptions.request}`;
  const headers: HeadersInit = {
    Authorization: `Bearer ${CODA_TOKEN}`,
  };

  // Set Content-Type header only if data is present or explicitly provided
  if (requestOptions.data) {
    headers['Content-Type'] = requestOptions.contentType || 'application/json';
  } else if (requestOptions.contentType) {
    headers['Content-Type'] = requestOptions.contentType;
  }
  console.log('headers', headers);

  const fetchOptions: RequestInit = {
    method: requestOptions.method,
    headers: headers,
    // Stringify data if present, otherwise body is undefined
    body: requestOptions.data ? JSON.stringify(requestOptions.data) : undefined,
  };

  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      // Provide more context on fetch errors
      const errorText = await response.text();
      console.error(
        `Coda API request failed: ${response.status} ${response.statusText}`,
        errorText
      );
      throw new Error(`Request failed with status ${response.status}`);
    }

    // Check if the response body is expected to be empty for certain statuses (like 204 No Content)
    if (response.status === 204) {
      return Promise.resolve(null); // Or handle as appropriate
    }

    // Assume JSON response, adjust if other types are expected
    return await response.json();
  } catch (error) {
    console.error('Error during Coda API request:', error);
    // Re-throw the error to allow calling functions to handle it
    throw error;
  }
};

const GetDoc = async (tableId: string) => {
  const options: BuckRequestConfig = {
    request: `/docs/${expressionsDocId}`,
    method: 'GET',
  };

  const table = await CodaRequest(options);
  return Promise.resolve(table);
};

export const GetTable = async (docUrl: string, tableId: string) => {
  const docId = GetCodaIdFromUrl(docUrl);
  const options: BuckRequestConfig = {
    request: `/docs/${docId}/tables/${tableId}`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${CODA_TOKEN}`,
    },
  };

  const table = await CodaRequest(options);
  return Promise.resolve(table);
};

const sortByName = (a: any, b: any) => {
  if (!a.values.Name || !b.values.Name) {
    return -1;
  }
  if (a.values.Name < b.values.Name) {
    return 1;
  } else if (a.values.Name > b.values.Name) {
    return -1;
  } else {
    return -1;
  }
};

export const GetExpressions = async (
  docId: string,
  tableId: string
): Promise<ExpressionSnippet[]> => {
  const options: BuckRequestConfig = {
    request: `/docs/${docId}/tables/${tableId}/rows?useColumnNames=true&valueFormat=rich&sortBy=natural`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${CODA_TOKEN}`,
    },
  };

  const ReVariables = new RegExp(/{{(\w+)}}/g);
  const rows = await CodaRequest(options);
  const items: ExpressionSnippet[] = rows.items
    .map((item: any) => {
      let { Description, Name, Expression, Thumbnail, Property, Publish } =
        item.values;
      let expression = markdownToTxt(Expression);
      let variables = expression.match(ReVariables) as string[];
      if (variables) {
        variables = variables.map((v) => {
          let txt = v.replace('{{', '');
          txt = txt.replace('}}', '');
          return txt;
        });
      }
      return {
        id: item.id,
        values: {
          Name: markdownToTxt(Name),
          Description: markdownToTxt(Description),
          Expression: expression,
          Variables: variables,
          Property: markdownToTxt(Property),
          Thumbnail: Thumbnail,
          Publish: Publish,
        },
      };
    })
    .filter((r: any) => {
      return r.values.Name;
    })
    .filter((p: any) => {
      return p.values.Publish;
    });

  return Promise.resolve(items);
};

export const GetDriveNames = async (docId: string): Promise<CodaValue> => {
  const options: BuckRequestConfig = {
    request: `/docs/${docId}/tables/${'Project Naming Data'}/rows?useColumnNames=true&valueFormat=simple&sortBy=natural`,
    method: 'GET',
  };

  const rows = await CodaRequest(options);
  const items: any[] = rows.items.map((item: any) => {
    return {
      googleDrive: item.values.googleDrive,
      abadal: item.values.abadal,
      caddy: item.values.caddy,
    };
  });
  return Promise.resolve(items[0]);
};

export const GetRows = async (
  docUrl: string,
  tableId: string
): Promise<CodaItem[]> => {
  const docId = GetCodaIdFromUrl(docUrl);
  const richoptions: BuckRequestConfig = {
    request: `/docs/${docId}/tables/${tableId}/rows?useColumnNames=true&valueFormat=natural&sortBy=natural`,
    method: 'GET',
  };
  const richRows = await CodaRequest(richoptions);
  return Promise.resolve(richRows.items);
};

export const GetTracker = async (
  docId: string,
  tableId: string
): Promise<CodaTask[]> => {
  const richoptions: BuckRequestConfig = {
    request: `/docs/${docId}/tables/${tableId}/rows?useColumnNames=true&valueFormat=rich&sortBy=natural`,
    method: 'GET',
  };
  const richRows = await CodaRequest(richoptions);

  const items: CodaTask[] = richRows.items.map((item: any) => {
    console.log(item.values['Status']);
    return {
      id: item.id,
      outputName: markdownToTxt(item.values['Output Name']),
      name: item.values['Name'].name,
      shotName:
        item.values['Shot'].length > 0
          ? item.values['Shot'][0].name
          : item.values['Shot'].name,
      thumbnail: item.values['Thumbnail']
        ? item.values['Thumbnail'][0].url
        : '',
      assignee: {
        name: item.values['Assignee'].name ?? '',
        email: item.values['Assignee'].email ?? '',
      },
      status: item.values['Status'].name ?? 'On Hold',
      compVersion: item.values['Version'],
      heroVersion: item.values['Hero Version'],
      editVersion: markdownToTxt(item.values['Version In Edit']),
      version: markdownToTxt(item.values['Version']),
      notes: markdownToTxt(item.values['Notes']),
      parent: { name: markdownToTxt(item.values['parent']) },
      filename: markdownToTxt(item.values['filename preview']),
    };
  });
  return Promise.resolve(items);
};

export const GetShots = (tasks: CodaTask[]) => {
  const shots = tasks.reduce((acc, task) => {
    if (task.shotName) {
      if (!acc[task.shotName]) {
        acc[task.shotName] = [task];
      } else {
        acc[task.shotName].push(task);
      }
    }
    return acc;
  }, {} as any);

  // make shots array
  const shotsArray = Object.keys(shots).map((key) => {
    return {
      name: key,
      tasks: shots[key],
    };
  });

  return shotsArray;
};

export const updateRow = async (
  docUrl: string,
  tableId: string,
  rowId: string,
  rowValues: CodaValue
): Promise<boolean> => {
  const docId = GetCodaIdFromUrl(docUrl);
  const data = {
    row: {
      cells: Object.keys(rowValues).map((r) => {
        return { column: r, value: rowValues[r] };
      }),
    },
  };
  const richoptions: BuckRequestConfig = {
    request: `/docs/${docId}/tables/${tableId}/rows/${rowId}`,
    method: 'PUT',
    contentType: 'application/json',
    data: data,
  };
  const result = await CodaRequest(richoptions);
  return result ? Promise.resolve(true) : Promise.resolve(false);
};

export const GetStatuses = async (docId: string): Promise<any[]> => {
  const options: BuckRequestConfig = {
    request: `/docs/${docId}/tables/Statuses/rows?useColumnNames=true&valueFormat=rich&sortBy=natural`,
    method: 'GET',
  };
  const rows = await CodaRequest(options);
  return Promise.resolve(rows.items);
};
