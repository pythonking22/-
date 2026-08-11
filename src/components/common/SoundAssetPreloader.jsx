import { useEffect } from 'react'
import { primeSfxList } from '../../utils/sound'
import { getRanchHabitatSoundSrc, getGrassStageSoundSrc } from '../../utils/habitatSound'
import { SFX } from '../../utils/sfx'

const PRELOAD_SOURCES = [
  SFX.buttonDefault,
  SFX.buttonTutorial,
  SFX.currencyPurchase,
  SFX.missionReward,
  SFX.titleReward,
  SFX.gachaResult,
  SFX.dailyQuizComplete,
  SFX.quizCorrect,
  SFX.quizWrong,
  SFX.registerGold,
  SFX.registerSilver,
  SFX.registerBronze,
  SFX.newEgg,
  SFX.eggToLarva,
  SFX.larvaToPupa,
  SFX.pupaToAdult,
  getRanchHabitatSoundSrc('soil'),
  getRanchHabitatSoundSrc('forest'),
  getRanchHabitatSoundSrc('pond'),
  getRanchHabitatSoundSrc('street-trees'),
  getRanchHabitatSoundSrc('grass'),
  getGrassStageSoundSrc(0),
  getGrassStageSoundSrc(1),
].filter(Boolean)

export default function SoundAssetPreloader() {
  useEffect(() => {
    primeSfxList(PRELOAD_SOURCES)
  }, [])

  return null
}
