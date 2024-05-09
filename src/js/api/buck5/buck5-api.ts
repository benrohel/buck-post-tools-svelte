import { format } from "date-fns";
import axios from "axios";
const today = () => {
  return format(new Date(), "yyyy-MM-dd");
};
export const BUCK_DAEMON_URL = "http://127.0.0.1:8000";

export const BuckRequest = async (
  requestOptions: BuckRequestConfig
): Promise<any> => {
  const options: any = {
    method: requestOptions.method,
    url: `${BUCK_DAEMON_URL}${requestOptions.request}`,
    headers: {
      "Content-Type": requestOptions.contentType
        ? requestOptions.contentType
        : "",
      "X-BUCK-APP": "cep-panel",
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
  const options: BuckRequestConfig = {
    method: "GET",
    request: `/auth/whoami`,
  };
  try {
    const userData = (await BuckRequest(options)).data as UserData;
    return Promise.resolve(userData);
  } catch (err) {
    return Promise.reject(err);
  }
};

export const Login = async (options: BuckRequestConfig): Promise<UserData> => {
  options.contentType = "application/json";
  const userData = (await BuckRequest(options)).user.data as UserData;
  console.log(userData);
  return Promise.resolve(userData);
};

export const Authenticated = async (): Promise<UserData> => {
  const options: BuckRequestConfig = {
    method: "GET",
    request: `/auth/authenticated`,
  };

  const userData = (await BuckRequest(options)).user.data as UserData;

  return Promise.resolve(userData);
};

export const Projects = async (): Promise<Item[]> => {
  const projectsOptions: BuckRequestConfig = {
    method: "GET",
    request: "/projects",
  };
  const projects = (await BuckRequest(projectsOptions)) as Item[];
  console.log(projects);
  return Promise.resolve(projects);
};

export const Project = async (projectKey: string): Promise<Item> => {
  const projectsOptions: BuckRequestConfig = {
    method: "GET",
    request: `/projects/${projectKey}`,
  };
  const project = (await BuckRequest(projectsOptions)) as Item;
  return Promise.resolve(project);
};

export const Shot = async (shotKey: string): Promise<Item> => {
  const projectsOptions: BuckRequestConfig = {
    method: "GET",
    request: `/shots/${shotKey}`,
  };
  const shot = (await BuckRequest(projectsOptions)) as Item;

  return Promise.resolve(shot);
};

export const Tasks = async (projectKey: string): Promise<Task[]> => {
  const tasksOptions: BuckRequestConfig = {
    method: "GET",
    request: `/projects/${projectKey}/tasks`,
  };
  const res = await BuckRequest(tasksOptions);
  const tasks = res.items as Task[];
  return Promise.resolve(tasks);
};

export const UpdateTask = async (taskKey: string, data: any): Promise<Item> => {
  const tasksOptions: BuckRequestConfig = {
    method: "PATCH",
    contentType: "application/json",
    request: `/tasks/${taskKey}`,
    data: data,
  };

  const res = await BuckRequest(tasksOptions);
  console.log("UPDATE TASK", res);
  const task = res as Item;
  return Promise.resolve(task);
};

export const Versions = async (taskKey: string): Promise<Item[]> => {
  const tasksOptions: BuckRequestConfig = {
    method: "GET",
    request: `/tasks/${taskKey}/versions`,
  };

  const res = await BuckRequest(tasksOptions);

  if (res.items) {
    const versions = res.items as Item[];
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
  const tasksOptions: BuckRequestConfig = {
    method: "POST",
    contentType: "application/json",
    request: `/advanced/traverse/${shotKey}`,
    data: {
      query: "# -($Child,4)> $Version View{item:item,parent:FIRST($parent)}",
      aliases: { parent: "# <()- * VIEW {key:item._key,name:item.data.name}" },
    },
  };

  const res = await BuckRequest(tasksOptions);

  if (res) {
    const versions = res as any[];

    const sorted = versions.sort((a, b) => {
      if (a.item.data.name < b.item.data.name) {
        return -1;
      } else if (a.item.data.name > b.item.data.name) {
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
): Promise<PostVersionData> => {
  const options: BuckRequestConfig = {
    method: "POST",
    request: `/tasks/${taskKey}/versions`,
    contentType: "application/json",
    data: { versionName: versionName, filepaths: files },
  };

  const res = await BuckRequest(options);

  if (addToPlaylist) {
    const playlist = await GetPlaylistByName(projectKey, `${today()}-anim`);
    await AddMediaToPlaylist(playlist._key, res.uploadedMedia[0]._key);
  }
  if (res) {
    return Promise.resolve(res as PostVersionData);
  } else {
    return Promise.resolve({} as PostVersionData);
  }
};

export const Comments = async (versionKey: string) => {
  const tasksOptions: BuckRequestConfig = {
    method: "POST",
    contentType: "application/json",
    request: `/advanced/traverse/${versionKey}`,
    data: {
      query: "#-($Child, 4)> $Comment VIEW item",
    },
  };
  const comments = (await BuckRequest(tasksOptions)) as Item[];
  return Promise.resolve(comments);
};

export const TaskStatuses = async (projectKey: string) => {
  const tasksOptions: BuckRequestConfig = {
    method: "POST",
    request: `/advanced/traverse/${projectKey}`,
    data: {
      query: "# -()> $Properties  VIEW item.tasks_status",
      options: {
        populate: false,
      },
    },
  };
  const taskStatuses = (await BuckRequest(tasksOptions)) as StatusData[];
  return Promise.resolve(taskStatuses);
};

export const Playlists = async (projectKey: string) => {
  const options: BuckRequestConfig = {
    method: "GET",
    request: `/projects/${projectKey}/playlists`,
  };
  const playlists = (await BuckRequest(options)).items as Playlist[];
  return Promise.resolve(playlists);
};

export const GetPlaylistByName = async (
  projectKey: string,
  playlistName: string,
  framerate: number = 24
): Promise<Playlist> => {
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
): Promise<Playlist> => {
  const options: BuckRequestConfig = {
    method: "POST",
    request: `/projects/${projectKey}/playlists`,
    contentType: "application/json",
    data: {
      name: name,
      framerate: framerate,
      end: end,
    },
  };
  const res = (await BuckRequest(options)) as Playlist;
  return Promise.resolve(res);
};

export const FileUrl = (tb: string) => {
  return `${BUCK_DAEMON_URL}/${tb}`;
};

export const AddMediaToPlaylist = async (
  playlistKey: string,
  mediaKey: string
) => {
  const options: BuckRequestConfig = {
    method: "PATCH",
    request: `/playlists/${playlistKey}/link`,
    contentType: "application/json",
    data: {
      data: { track: "A" },
      targetKey: mediaKey,
    },
  };
  const res = (await BuckRequest(options)) as Playlist;
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
    .join("|");
  const options: BuckRequestConfig = {
    method: "POST",
    request: `/traverse/${projectKey}`,
    data: {
      query: `# -($Child,9)> $Shot AND item.data.name =~ '${regexShots}' VIEW{shot:{_key:item._key,name:item.data.name},task:$TaskName}}`,
      aliases: {
        LastMedias: `LAST(# -($Child,2)> $Media VIEW {_key:item._key,filename:item.data.filename})`,
        TaskName: `# -($Child,4)> item.type == 'Task' AND item.data.name == '${taskName}' VIEW {_key:item._key,name:item.data.name,latestMedia:$LastMedias}`,
      },
    },
  };
  const shotMedias = (await BuckRequest(options)) as any;
  return Promise.resolve(shotMedias);
};

export const AfterEffectsProperties = async (
  projectKey: string
): Promise<AeProperties> => {
  const options: BuckRequestConfig = {
    method: "POST",
    request: `/advanced/traverse/${projectKey}`,
    contentType: "application/json",
    data: {
      query:
        "# -($Child, 2)> $Properties AND item.data.name == 'AfterEffects' VIEW item",
    },
  };
  const res = await BuckRequest(options);
  console.log("ae properties", res);
  const aeProperties = res[0].data as AeProperties;
  return Promise.resolve(aeProperties);
};

export const ItemTree = async (itemKey: string): Promise<string[]> => {
  const options: BuckRequestConfig = {
    method: "POST",
    request: `/advanced/traverse/${itemKey}`,
    contentType: "application/json",
    data: {
      query:
        "# <($Child,9)- * COLLECT criterias = $groups INTO collection = $view  VIEW  $return",
      aliases: {
        groups: {
          type: "item.type",
          key: "item._key",
          name: "item.data.name",
          length: "LENGTH(#<($Child,99)- *)",
        },
        view: {
          type: "item.type",
          name: "item.data.name",
          key: "item._key",
          length: "LENGTH(#<($Child,99)- *)",
        },
        return: {
          type: "criterias.type",
          name: "criterias.name",
          key: "criterias.key",
          length: "criterias.length",
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
    .slice(sorted.indexOf(sorted.find((s: any) => s.type === "Project")))
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
  const options: BuckRequestConfig = {
    method: "POST",
    request: `/tasks/${taskKey}/versions`,
    contentType: "application/json",
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
  const options: BuckRequestConfig = {
    method: "POST",
    request: `/advanced/traverse/${projectKey}`,
    contentType: "application/json",
    data: {
      query:
        "# -($Child,1)> $Properties VIEW {tasks_status:item.data.tasks_status,postRoot:item.data.postRoot}",
    },
  };
  const res = await BuckRequest(options);
  return Promise.resolve(res[0]);
};

export const GetEdits = async (projectKey: string): Promise<any> => {
  const options: BuckRequestConfig = {
    method: "POST",
    request: `/advanced/traverse/${projectKey}`,
    contentType: "application/json",
    data: {
      query: "# -($Child,3)> $Timeline View{_key:item._key,data:item.data}",
    },
  };
  const res = await BuckRequest(options);

  return Promise.resolve(res);
};

export const GetClips = async (editKey: string): Promise<any> => {
  const options: BuckRequestConfig = {
    method: "POST",
    request: `/advanced/traverse/${editKey}`,
    contentType: "application/json",
    data: { query: "# <($Child,1)> item.type=='Clip' View item" },
  };
  const res = await BuckRequest(options);
  return Promise.resolve(res);
};

export const GetShotForClip = async (clip: any): Promise<any> => {
  const options: BuckRequestConfig = {
    method: "POST",
    request: `/advanced/traverse/${clip._key}`,
    contentType: "application/json",
    data: {
      query: "# <($Breakdown, 2)> $Shot View item",
    },
  };
  const res = await BuckRequest(options);

  return Promise.resolve({ ...clip, shot: res[0] });
};

export const GetItem = async (itemKey: string): Promise<any> => {
  const options: BuckRequestConfig = {
    method: "GET",
    request: `advanced/adv/items/${itemKey}`,
  };
  const res = await BuckRequest(options);
  return Promise.resolve(res);
};

export const PatchItem = async (itemKey: string, data: any): Promise<any> => {
  const options: BuckRequestConfig = {
    method: "PATCH",
    request: `/advanced/adv/items/${itemKey}`,
    contentType: "application/json",
    data: data,
  };
  const res = await BuckRequest(options);
  return Promise.resolve(res);
};
