import { Tts } from 'store/OnboardingStore';

export enum LearnTactileTtsNames {
  SHELF_EXPLAIN,
  SHELF_DIAL_TURN,
  SHELF_DIAL_PRESS,
  TRACKLIST_DIAL_PRESS,
  NPV_EXPLAIN,
  NPV_DIAL_PRESS,
  NPV_BACK_PRESS,
  TRACKLIST_BACK_PRESS,
  SHELF_BACK_PRESS,
  END_TOUR,
  SKIP_TOUR,
}

export const learnTactileTTS: Record<LearnTactileTtsNames, Tts> = {
  [LearnTactileTtsNames.SHELF_EXPLAIN]: {
    fileName: 'onboarding_learn_tactile_shelf_explain.mp3',
    fileLength: 7000,
  },
  [LearnTactileTtsNames.SHELF_DIAL_TURN]: {
    fileName: 'onboarding_learn_tactile_shelf_dial_turn.mp3',
    fileLength: 2000,
  },
  [LearnTactileTtsNames.SHELF_DIAL_PRESS]: {
    fileName: 'onboarding_learn_tactile_shelf_dial_press.mp3',
    fileLength: 4000,
  },
  [LearnTactileTtsNames.TRACKLIST_DIAL_PRESS]: {
    fileName: 'onboarding_learn_tactile_tracklist_dial_press.mp3',
    fileLength: 2000,
  },
  [LearnTactileTtsNames.NPV_EXPLAIN]: {
    fileName: 'onboarding_learn_tactile_npv_explain.mp3',
    fileLength: 4000,
  },
  [LearnTactileTtsNames.NPV_DIAL_PRESS]: {
    fileName: 'onboarding_learn_tactile_npv_dial_press.mp3',
    fileLength: 4000,
  },
  [LearnTactileTtsNames.NPV_BACK_PRESS]: {
    fileName: 'onboarding_learn_tactile_npv_back_press.mp3',
    fileLength: 6000,
  },
  [LearnTactileTtsNames.TRACKLIST_BACK_PRESS]: {
    fileName: 'onboarding_learn_tactile_tracklist_back_press.mp3',
    fileLength: 3000,
  },
  [LearnTactileTtsNames.SHELF_BACK_PRESS]: {
    fileName: 'onboarding_learn_tactile_shelf_back_press.mp3',
    fileLength: 6000,
  },
  [LearnTactileTtsNames.END_TOUR]: {
    fileName: 'onboarding_learn_tactile_end_tour.mp3',
    fileLength: 5000,
  },
  [LearnTactileTtsNames.SKIP_TOUR]: {
    fileName: 'onboarding_learn_tactile_end_tour_via_skip.mp3',
    fileLength: 5000,
  },
};
