declare interface CodaValue {
  [key: string]: any;
}

declare interface CodaItem {
  id: string;
  values: CodaValue;
}

declare interface Thumbnail {
  name: string;
  height: number;
  width: number;
  url: string;
}
declare interface ExpressionValues {
  Creator: string;
  Description: string;
  Expression: string;
  Name: string;
  Thumbnail?: Thumbnail[];
  Property?: string;
  Variables?: string[];
}

declare interface ExpressionSnippet {
  id: string;
  values: ExpressionValues;
  favorite?: boolean;
}

declare interface TrackerValues {
  Parent: string;
  Thumbnail: string;
  ShotName: string;
  assignee: Assignee;
  Status: string;
  CompVersion: string;
  EditVersion: string;
  Notes: string;
}

declare interface Assignee {
  name: string;
  email: string;
}

declare interface CodaAsset {
  id: string;
}

declare interface CodaRichItem {
  name: string;
  tableId: string;
  rowId: string;
  tableUrl: string;
}
declare interface CodaTask {
  id: string;
  name: string;
  shotName: string;
  outputName: string;
  variation?: string;
  latestVersion?: number;
  version: string;
  editVersion?: number;
  thumbnail?: string;
  status: string;
  assignee: Assignee;
  breakdown?: string[];
  notes?: string;
  parent: CodaRichItem;
  filename?: string;
}
