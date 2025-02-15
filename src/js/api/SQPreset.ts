import { fs, os } from '../lib/cep/node';
import upath from 'upath';
import { gePremiereFramerate, gePremiereVideoFramerate } from './timecode';
import pkg from '../../../package.json';
const SHARED_FOLDER = '/Volumes/globalprefs/SHARED/';

declare interface SQPresetOption {
  width: string;
  height: string;
  framerate: string;
}

export const getSqTemplate = ({
  width,
  height,
  framerate,
}: SQPresetOption): string => {
  const fr = gePremiereFramerate(framerate);
  const vf = gePremiereVideoFramerate(framerate);
  console.log(vf);
  console.log(fr);
  return `<?xml version="1.0" encoding="UTF-8"?>
  <PremiereData Version="3">
    <SequencePreset ObjectRef="1"/>
    <SequencePreset ObjectID="1" ClassID="5e73dd7e-4f86-4917-80eb-08ddb2f4a5f3" Version="9">
      <WorkingColorSpace>{"baseColorProfile":{"colorProfileName":"BT.709 RGB Full"},"baseProfileType":1}</WorkingColorSpace>
      <SequenceWorkingColorSpace>{"workingSpaceConfigVersion":1,"workingSpaceID":"BT.709 RGB Full","workingSpaceIsLinearized":0}</SequenceWorkingColorSpace>
      <PreviewVideoFrameSize>0,0,${width},${height}</PreviewVideoFrameSize>
      <ImmersiveVideoVRConfiguration>{"ambisonicsHRIR":"","ambisonicsMonitoringType":0,"capturedHorizontalView":0,"capturedVerticalView":0,"fieldOfHorizontalView":108,"fieldOfVerticalView":108,"projectionType":0,"stereoscopicEye":0,"stereoscopicType":0,"version":3}</ImmersiveVideoVRConfiguration>
      <VideoTracks>[]</VideoTracks>
      <AudioTracks>[{"mAssign":0,"mAudioSends":[],"mChannelType":1,"mExpandedHeight":25,"mIsOpen":false,"mIsSubmix":false,"mKeyframeMode":true,"mLocked":false,"mMatrix":[],"mMute":false,"mName":"","mPan":0,"mPannerAssignments":[],"mSolo":false,"mSyncLock":true,"mTargeted":false,"mTrackID":-1,"mVolume":1},{"mAssign":0,"mAudioSends":[],"mChannelType":1,"mExpandedHeight":25,"mIsOpen":false,"mIsSubmix":false,"mKeyframeMode":true,"mLocked":false,"mMatrix":[],"mMute":false,"mName":"","mPan":0,"mPannerAssignments":[],"mSolo":false,"mSyncLock":true,"mTargeted":false,"mTrackID":-1,"mVolume":1},{"mAssign":0,"mAudioSends":[],"mChannelType":1,"mExpandedHeight":25,"mIsOpen":false,"mIsSubmix":false,"mKeyframeMode":true,"mLocked":false,"mMatrix":[],"mMute":false,"mName":"","mPan":0,"mPannerAssignments":[],"mSolo":false,"mSyncLock":true,"mTargeted":false,"mTrackID":-1,"mVolume":1}]</AudioTracks>
      <InitialNumberOfVideoTracks>3</InitialNumberOfVideoTracks>
      <AdaptiveNumChannels>2</AdaptiveNumChannels>
      <VideoAllowLinearCompositing>true</VideoAllowLinearCompositing>
      <VideoUseMaxRenderQuality>true</VideoUseMaxRenderQuality>
      <VideoUseMaxBitDepth>true</VideoUseMaxBitDepth>
      <VideoPixelAspectRatio>1,1</VideoPixelAspectRatio>
      <PreviewPresetVideoCodec.Win>1634755432</PreviewPresetVideoCodec.Win>
      <PreviewPresetFileName.Win>QuickTime</PreviewPresetFileName.Win>
      <PreviewPresetVideoCodec.Mac>1634755432</PreviewPresetVideoCodec.Mac>
      <PreviewPresetFileName.Mac>QuickTime</PreviewPresetFileName.Mac>
      <EditingModeGUID.Win>795454d9-d3c2-429d-9474-923ab13b7018</EditingModeGUID.Win>
      <EditingModeGUID.Mac>795454d9-d3c2-429d-9474-923ab13b7018</EditingModeGUID.Mac>
      <Descriptions Version="1">
        <DescriptionItem Version="1" Index="0">
          <Second>${width}x${height} at ${framerate}fps</Second>
          <First>en_US</First>
        </DescriptionItem>
      </Descriptions>
      <Names Version="1">
        <NameItem Version="1" Index="0">
          <Second>${width}x${height}_${framerate.replace('.', '')}</Second>
          <First>en_US</First>
        </NameItem>
      </Names>
      <VideoFieldType>0</VideoFieldType>
      <AudioTimeDisplay>200</AudioTimeDisplay>
      <VideoTimeDisplay>${fr}</VideoTimeDisplay>
      <AudioChannelType>1</AudioChannelType>
      <AudioFrameRate>5292000</AudioFrameRate>
      <VideoFrameSize>0,0,${width},${height}</VideoFrameSize>
      <VideoFrameRate>${vf}</VideoFrameRate>
    </SequencePreset>
  </PremiereData>`;
};

const GetResourceFolder = async (): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    const folder = upath.join(SHARED_FOLDER, 'PREMIERE');
    if (!fs.existsSync(folder)) {
      resolve(null);
      return;
    }
    resolve(folder);
  });
};

export const getSQPreset = async ({
  width,
  height,
  framerate,
}: SQPresetOption): Promise<string> => {
  return new Promise((resolve, reject) => {
    const sqString = getSqTemplate({ width, height, framerate });
    GetResourceFolder().then((resourceFolder) => {
      if (resourceFolder) {
        const sqPresetPath = upath.join(
          resourceFolder,
          `${width}x${height}_${framerate.replace('.', '')}.sqpreset`
        );
        if (!fs.existsSync(sqPresetPath)) {
          fs.writeFileSync(sqPresetPath, sqString);
        }
        resolve(upath.normalize(sqPresetPath));
        if (fs.existsSync(sqPresetPath)) {
        }
      }
    });
  });
};

export const getPresetFile = (
  width: string,
  height: string,
  framerate: string
) => {
  const preset = getSqTemplate({ width, height, framerate });
  const userFolder = os.homedir();
  const presetPath = upath.join(
    userFolder,
    'Library',
    'Application Support',
    pkg.name,
    'sqpresets',
    `${width}x${height}_${framerate.replace('.', '')}.sqpreset`
  );
  try {
    if (!fs.existsSync(upath.dirname(presetPath))) {
      fs.mkdirSync(upath.dirname(presetPath), { recursive: true });
    }
    fs.writeFileSync(presetPath, preset);
    console.log('Writing preset ', presetPath);
    return presetPath;
  } catch (e) {
    console.log(e);
    throw new Error(`Preset file not created at path: ${presetPath}`);
  }
};
