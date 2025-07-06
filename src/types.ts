export interface TickTonesSettings {
  tickSoundEnabled: boolean;
  tickSound: string;
  tickSoundVolume: number;
  untickSoundEnabled: boolean;
  untickSound: string;
  untickSoundVolume: number;
}

export const DEFAULT_SETTINGS: TickTonesSettings = {
  tickSoundEnabled: true,
  tickSound: "Task_Completed",
  tickSoundVolume: 0.6,
  untickSoundEnabled: false,
  untickSound: "Task_Completed",
  untickSoundVolume: 0.6,
};
