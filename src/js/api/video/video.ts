import {path, child_process} from "../../lib/cep/node";
interface VideoInfosCheck {
  width: number;
  height: number;
  nb_frames: number;
  start_time: number;
  time_base: number;
  nb_of_streams: number;
  [key: string]: number;
}

const GetVideoInfos = (probeOutput: string) => {
  const json = JSON.parse(probeOutput);
  return {
    width: json.streams[0].width,
    height: json.streams[0].height,
    nb_frames: json.streams[0].nb_frames,
    start_time: json.format.start_time,
    time_base: json.format.time_base,
    nb_of_streams: json.streams.length
  };
};

interface VideoError {
  source: any;
  destination: any;
  name:string
}

export const checkVideoFileUpdate = (source: string, destination: string) : Promise<VideoError[]> => {


  
const ffprobePath = path.join(__dirname, 'ffprobe');
  const checkSource = child_process.execSync(`"${ffprobePath}" -v quiet -print_format json -show_format -show_streams "${source}"`).toString();
  const checkDestination = child_process.execSync(`"${ffprobePath}" -v quiet -print_format json -show_format -show_streams ${destination}`).toString();
  const sourceJson: VideoInfosCheck = GetVideoInfos(checkSource);
  const destinationJson: VideoInfosCheck = GetVideoInfos(checkDestination);

  console.log('sourceJson', sourceJson);
  console.log('destinationJson', destinationJson);

  const errors: VideoError[] = [];
  Object.keys(sourceJson ).forEach(key => {
    if (sourceJson[key] !== destinationJson[key]) {
      errors.push({
        source: sourceJson[key],
        destination: destinationJson[key],
        name: key
      });
    }
  });
  if (errors.length > 0) {
    console.warn(`Video files are different: ${errors.join(', ')}`);
    return Promise.resolve(errors);
  }
  return Promise.resolve([]);
};
  