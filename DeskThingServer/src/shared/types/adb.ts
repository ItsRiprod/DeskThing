export enum SCRIPT_IDs {
  RESTART = 'restart_script',
  PROXY = 'proxy_script'
}

export type ScriptConfig = {
  reboot?: boolean
  force?: boolean
  deviceId: string
}
