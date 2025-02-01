import type * as BUCK5 from '.';
import { format } from 'date-fns';
import axios from 'axios';
const today = () => {
  return format(new Date(), 'yyyy-MM-dd');
};
export const BUCK_DAEMON_URL = 'http://127.0.0.1:8000';

export const BuckRequest = async (
  requestOptions: BUCK5.BuckRequestConfig
): Promise<any> => {
  const options: any = {
    method: requestOptions.method,
    url: `${BUCK_DAEMON_URL}${requestOptions.request}`,
    headers: {
      'Content-Type': requestOptions.contentType
        ? requestOptions.contentType
        : '',
      'X-BUCK-APP': 'cep-panel',
    },
    data: requestOptions.data,
  };

  return new Promise((resolve, reject) => {
    axios.request(options).then((response) => {
      if (response.status === 200) {
        resolve(response.data);
      } else {
      }
    });
  });
};

export const WhoAmI = async () => {
  const options: BUCK5.BuckRequestConfig = {
    method: 'GET',
    request: `/auth/whoami`,
  };
  try {
    const userData = (await BuckRequest(options)).data as BUCK5.UserData;
    return Promise.resolve(userData);
  } catch (err) {
    return Promise.reject(err);
  }
};

export const Login = async (
  options: BUCK5.BuckRequestConfig
): Promise<BUCK5.UserData> => {
  options.contentType = 'application/json';
  const userData = (await BuckRequest(options)).user.data as BUCK5.UserData;
  console.log(userData);
  return Promise.resolve(userData);
};

export const Authenticated = async (): Promise<BUCK5.UserData> => {
  const options: BUCK5.BuckRequestConfig = {
    method: 'GET',
    request: `/auth/authenticated`,
  };

  const userData = (await BuckRequest(options)).user.data as BUCK5.UserData;

  return Promise.resolve(userData);
};

export const Projects = async (): Promise<BUCK5.Item[]> => {
  const projectsOptions: BUCK5.BuckRequestConfig = {
    method: 'GET',
    request: '/projects',
  };
  const projects = (await BuckRequest(projectsOptions)) as BUCK5.Item[];
  console.log(projects);
  return Promise.resolve(projects);
};

export const Project = async (projectKey: string): Promise<BUCK5.Item> => {
  const projectsOptions: BUCK5.BuckRequestConfig = {
    method: 'GET',
    request: `/projects/${projectKey}`,
  };
  const project = (await BuckRequest(projectsOptions)) as BUCK5.Item;
  return Promise.resolve(project);
};

export const Shots = async (projectKey: string): Promise<BUCK5.Item[]> => {
  const projectsOptions: BUCK5.BuckRequestConfig = {
    method: 'GET',
    request: `/projects/${projectKey}/shots`,
  };
  const shots = (await BuckRequest(projectsOptions)) as BUCK5.Item[];

  return Promise.resolve(shots);
};

export const Shot = async (shotKey: string): Promise<BUCK5.Item> => {
  const projectsOptions: BUCK5.BuckRequestConfig = {
    method: 'GET',
    request: `/shots/${shotKey}`,
  };
  const shot = (await BuckRequest(projectsOptions)) as BUCK5.Item;

  return Promise.resolve(shot);
};

export const Tasks = async (projectKey: string): Promise<BUCK5.Task[]> => {
  const tasksOptions: BUCK5.BuckRequestConfig = {
    method: 'GET',
    request: `/projects/${projectKey}/tasks`,
  };
  const res = await BuckRequest(tasksOptions);
  const tasks = res.items as BUCK5.Task[];
  return Promise.resolve(tasks);
};

export const UpdateTask = async (
  taskKey: string,
  data: any
): Promise<BUCK5.Item> => {
  const tasksOptions: BUCK5.BuckRequestConfig = {
    method: 'PATCH',
    contentType: 'application/json',
    request: `/tasks/${taskKey}`,
    data: data,
  };

  const res = await BuckRequest(tasksOptions);
  console.log('UPDATE BUCK5.Task', res);
  const task = res as BUCK5.Item;
  return Promise.resolve(task);
};

export const Versions = async (taskKey: string): Promise<BUCK5.Item[]> => {
  const tasksOptions: BUCK5.BuckRequestConfig = {
    method: 'GET',
    request: `/tasks/${taskKey}/versions`,
  };

  const res = await BuckRequest(tasksOptions);

  if (res.items) {
    const versions = res.items as BUCK5.Item[];
    const sorted = versions.sort((a, b) => {
      if (a.data.name < b.data.name) {
        return -1;
      } else if (a.data.name > b.data.name) {
        return 1;
      } else {
        return -1;
      }
    });
    return Promise.resolve(sorted);
  } else {
    return Promise.resolve([]);
  }
};

export const ShotVersions = async (shotKey: string): Promise<any[]> => {
  const tasksOptions: BUCK5.BuckRequestConfig = {
    method: 'POST',
    contentType: 'application/json',
    request: `/advanced/traverse/${shotKey}`,
    data: {
      query:
        '# -($Child,4)> $Version View{BUCK5.Item:BUCK5.Item,parent:FIRST($parent)}',
      aliases: {
        parent: '# <()- * VIEW {key:BUCK5.Item._key,name:BUCK5.Item.data.name}',
      },
    },
  };

  const res = await BuckRequest(tasksOptions);

  if (res) {
    const versions = res as any[];

    const sorted = versions.sort((a, b) => {
      if (a.BUCK5.Item.data.name < b.BUCK5.Item.data.name) {
        return -1;
      } else if (a.BUCK5.Item.data.name > b.BUCK5.Item.data.name) {
        return 1;
      } else {
        return -1;
      }
    });
    return Promise.resolve(sorted);
  } else {
    return Promise.resolve([]);
  }
};

export const PostVersions = async (
  projectKey: string,
  taskKey: string,
  files: string[],
  versionName: string,
  addToPlaylist: boolean = false
): Promise<BUCK5.PostVersionData> => {
  const options: BUCK5.BuckRequestConfig = {
    method: 'POST',
    request: `/tasks/${taskKey}/versions`,
    contentType: 'application/json',
    data: { versionName: versionName, filepaths: files },
  };

  const res = await BuckRequest(options);

  if (addToPlaylist) {
    const playlist = await GetPlaylistByName(projectKey, `${today()}-anim`);
    await AddMediaToPlaylist(playlist._key, res.uploadedMedia[0]._key);
  }
  if (res) {
    return Promise.resolve(res as BUCK5.PostVersionData);
  } else {
    return Promise.resolve({} as BUCK5.PostVersionData);
  }
};

export const Comments = async (versionKey: string) => {
  const tasksOptions: BUCK5.BuckRequestConfig = {
    method: 'POST',
    contentType: 'application/json',
    request: `/advanced/traverse/${versionKey}`,
    data: {
      query: '#-($Child, 4)> $Comment VIEW BUCK5.Item',
    },
  };
  const comments = (await BuckRequest(tasksOptions)) as BUCK5.Item[];
  return Promise.resolve(comments);
};

export const TaskStatuses = async (projectKey: string) => {
  const tasksOptions: BUCK5.BuckRequestConfig = {
    method: 'POST',
    request: `/advanced/traverse/${projectKey}`,
    data: {
      query: '# -()> $Properties  VIEW BUCK5.Item.tasks_status',
      options: {
        populate: false,
      },
    },
  };
  const taskStatuses = (await BuckRequest(tasksOptions)) as BUCK5.StatusData[];
  return Promise.resolve(taskStatuses);
};

export const Playlists = async (projectKey: string) => {
  const options: BUCK5.BuckRequestConfig = {
    method: 'GET',
    request: `/projects/${projectKey}/playlists`,
  };
  const playlists = (await BuckRequest(options)).items as BUCK5.Playlist[];
  return Promise.resolve(playlists);
};

export const GetPlaylistByName = async (
  projectKey: string,
  playlistName: string,
  framerate: number = 24
): Promise<BUCK5.Playlist> => {
  const playlists = await Playlists(projectKey);
  console.log(playlists);
  let playlist = playlists.find((p) => p.data.name === playlistName);
  if (!playlist) {
    playlist = await CreatePlaylist(projectKey, playlistName, framerate);
  }
  return Promise.resolve(playlist);
};

export const CreatePlaylist = async (
  projectKey: string,
  name: string,
  framerate: number = 24,
  end: number = 720
): Promise<BUCK5.Playlist> => {
  const options: BUCK5.BuckRequestConfig = {
    method: 'POST',
    request: `/projects/${projectKey}/playlists`,
    contentType: 'application/json',
    data: {
      name: name,
      framerate: framerate,
      end: end,
    },
  };
  const res = (await BuckRequest(options)) as BUCK5.Playlist;
  return Promise.resolve(res);
};

export const FileUrl = (tb: string) => {
  return `${BUCK_DAEMON_URL}/${tb}`;
};

export const AddMediaToPlaylist = async (
  playlistKey: string,
  mediaKey: string
) => {
  const options: BUCK5.BuckRequestConfig = {
    method: 'PATCH',
    request: `/playlists/${playlistKey}/link`,
    contentType: 'application/json',
    data: {
      data: { track: 'A' },
      targetKey: mediaKey,
    },
  };
  const res = (await BuckRequest(options)) as BUCK5.Playlist;
  return Promise.resolve(res);
};

//// NOT BUCK 5 DEAMON

export const getLatestTaskMediaFromList = async (
  projectKey: string,
  taskName: string,
  shotList: string[]
) => {
  const regexShots = shotList
    .map((s) => {
      return `^${s}$`;
    })
    .join('|');
  const options: BUCK5.BuckRequestConfig = {
    method: 'POST',
    request: `/traverse/${projectKey}`,
    data: {
      query: `# -($Child,9)> $Shot AND BUCK5.Item.data.name =~ '${regexShots}' VIEW{shot:{_key:BUCK5.Item._key,name:BUCK5.Item.data.name},BUCK5.Task:$TaskName}}`,
      aliases: {
        LastMedias: `LAST(# -($Child,2)> $Media VIEW {_key:BUCK5.Item._key,filename:BUCK5.Item.data.filename})`,
        TaskName: `# -($Child,4)> BUCK5.Item.type == 'BUCK5.Task' AND BUCK5.Item.data.name == '${taskName}' VIEW {_key:BUCK5.Item._key,name:BUCK5.Item.data.name,latestMedia:$LastMedias}`,
      },
    },
  };
  const shotMedias = (await BuckRequest(options)) as any;
  return Promise.resolve(shotMedias);
};

export const AfterEffectsProperties = async (
  projectKey: string
): Promise<BUCK5.AeProperties> => {
  const options: BUCK5.BuckRequestConfig = {
    method: 'POST',
    request: `/advanced/traverse/${projectKey}`,
    contentType: 'application/json',
    data: {
      query:
        "# -($Child, 2)> $Properties AND BUCK5.Item.data.name == 'AfterEffects' VIEW BUCK5.Item",
    },
  };
  const res = await BuckRequest(options);
  console.log('ae properties', res);
  const aeProperties = res[0].data as BUCK5.AeProperties;
  return Promise.resolve(aeProperties);
};

export const ItemTree = async (itemKey: string): Promise<string[]> => {
  const options: BUCK5.BuckRequestConfig = {
    method: 'POST',
    request: `/advanced/traverse/${itemKey}`,
    contentType: 'application/json',
    data: {
      query:
        '# <($Child,9)- * COLLECT criterias = $groups INTO collection = $view  VIEW  $return',
      aliases: {
        groups: {
          type: 'BUCK5.Item.type',
          key: 'BUCK5.Item._key',
          name: 'BUCK5.Item.data.name',
          length: 'LENGTH(#<($Child,99)- *)',
        },
        view: {
          type: 'BUCK5.Item.type',
          name: 'BUCK5.Item.data.name',
          key: 'BUCK5.Item._key',
          length: 'LENGTH(#<($Child,99)- *)',
        },
        return: {
          type: 'criterias.type',
          name: 'criterias.name',
          key: 'criterias.key',
          length: 'criterias.length',
        },
      },
    },
  };
  const res = await BuckRequest(options);

  const sorted = res.sort((a: any, b: any) => {
    if (a.length < b.length) {
      return -1;
    } else if (a.length > b.length) {
      return 1;
    } else {
      return -1;
    }
  });

  const tokens = sorted
    .slice(sorted.indexOf(sorted.find((s: any) => s.type === 'Project')))
    .map((s: any) => {
      return s.name;
    });

  return Promise.resolve(tokens);
};

declare interface VersionInput {
  taskKey: string;
  version: string;
  filepath?: string;
}

export const Publish = async (taskKey: string, version: string) => {
  const options: BUCK5.BuckRequestConfig = {
    method: 'POST',
    request: `/tasks/${taskKey}/versions`,
    contentType: 'application/json',
    data: {
      version: version,
    },
  };
  const res = await BuckRequest(options);
  return Promise.resolve(res);
};

export const GetProjectProperties = async (
  projectKey: string
): Promise<any> => {
  const options: BUCK5.BuckRequestConfig = {
    method: 'POST',
    request: `/advanced/traverse/${projectKey}`,
    contentType: 'application/json',
    data: {
      query:
        '# -($Child,1)> $Properties VIEW {tasks_status:BUCK5.Item.data.tasks_status,postRoot:BUCK5.Item.data.postRoot}',
    },
  };
  const res = await BuckRequest(options);
  return Promise.resolve(res[0]);
};

export const GetEdits = async (projectKey: string): Promise<any> => {
  const options: BUCK5.BuckRequestConfig = {
    method: 'POST',
    request: `/advanced/traverse/${projectKey}`,
    contentType: 'application/json',
    data: {
      query:
        '# -($Child,3)> $Timeline View{_key:BUCK5.Item._key,data:BUCK5.Item.data}',
    },
  };
  const res = await BuckRequest(options);

  return Promise.resolve(res);
};

export const GetClips = async (editKey: string): Promise<any> => {
  const options: BUCK5.BuckRequestConfig = {
    method: 'POST',
    request: `/advanced/traverse/${editKey}`,
    contentType: 'application/json',
    data: { query: "# <($Child,1)> BUCK5.Item.type=='Clip' View BUCK5.Item" },
  };
  const res = await BuckRequest(options);
  return Promise.resolve(res);
};

export const GetShotForClip = async (clip: any): Promise<any> => {
  const options: BUCK5.BuckRequestConfig = {
    method: 'POST',
    request: `/advanced/traverse/${clip._key}`,
    contentType: 'application/json',
    data: {
      query: '# <($Breakdown, 2)> $Shot View BUCK5.Item',
    },
  };
  const res = await BuckRequest(options);

  return Promise.resolve({ ...clip, shot: res[0] });
};

export const GetItem = async (itemKey: string): Promise<any> => {
  const options: BUCK5.BuckRequestConfig = {
    method: 'GET',
    request: `advanced/adv/items/${itemKey}`,
  };
  const res = await BuckRequest(options);
  return Promise.resolve(res);
};

export const PatchItem = async (itemKey: string, data: any): Promise<any> => {
  const options: BUCK5.BuckRequestConfig = {
    method: 'PATCH',
    request: `/advanced/adv/items/${itemKey}`,
    contentType: 'application/json',
    data: data,
  };
  const res = await BuckRequest(options);
  return Promise.resolve(res);
};
