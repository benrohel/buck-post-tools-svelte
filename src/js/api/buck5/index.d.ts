interface Header {
  [key: string]: string;
}

export interface BuckRequestConfig {
  method: 'GET' | 'PUT' | 'POST' | 'DELETE' | 'PATCH';
  request: string;
  headers?: Header;
  contentType?: string;
  data?: any;
}

interface Parent {
  _key: string;
  name: string;
  type: string;
}

interface Checklist {
  checked: boolean;
  name: string;
}

interface TaskData {
  checklist: Checklist[];
  color: string;
  completion: number;
  description: string;
  name: string;
  status: string;
}

interface Task extends Item {
  data: TaskData;
}

interface Item {
  data: any;
  _id: string;
  _key: string;
  _rev: string;
  type: string;
  uuid: string;
  extra_properties: any;
  parent?: any;
}

interface UserData {
  email: string;
  name: string;
  thumbnail: string;
  discardedAssistants: string[];
}

interface ProjectData {
  name: string;
  description?: string;
  discardedAssistants: string[];
  thumbnail?: string;
}

interface Project extends Item {
  data: ProjectData;
}

interface StatusData {
  color: string;
  completion: number;
  status: string;
  valid: boolean;
}

interface PlaylistData {
  name: string;
  thumbnail?: string;
  framerate: number;
  end: number;
  tags: string[];
}

interface Playlist extends Item {
  data: PlaylistData;
}

interface AeProperties {
  workingSpace: string;
  workingGamma: number;
  bitsPerChannel: number;
  outputModule?: string;
}

interface MediaData {
  destination: string;
  encoding: string;
  encodingProgress: number;
  encodingStatus: string;
  fieldname: string;
  filename: string;
  framerate: string;
  height: number;
  mimetype: string;
  name: string;
  nbframes: number;
  originalname: string;
  path: string;
  screenshot: string;
  size: number;
  thumbnail: string;
  url: string;
  width: number;
}

interface Media extends Item {
  data: MediaData;
}

interface VersionData {
  name: string;
}

interface Version extends Item {
  data: VersionData;
}

interface PostVersionData {
  uploadedMedia: Media[];
  version: Version;
}
