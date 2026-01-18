export interface TickTonesSettings {
  tickSoundEnabled: boolean;
  tickSound: string;
  tickSounds: string[];
  tickSoundVolume: number;
  untickSoundEnabled: boolean;
  untickSound: string;
  untickSounds: string[];
  untickSoundVolume: number;
  useRandomTickSound: boolean;
  useRandomUntickSound: boolean;
}

export const DEFAULT_SETTINGS: TickTonesSettings = {
  tickSoundEnabled: true,
  tickSound: "Task_Completed",
  tickSounds: [],
  tickSoundVolume: 0.6,
  untickSoundEnabled: false,
  untickSound: "Task_Completed",
  untickSounds: [],
  untickSoundVolume: 0.6,
  useRandomTickSound: false,
  useRandomUntickSound: false,
};
