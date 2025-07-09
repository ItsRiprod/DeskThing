import crypto from 'crypto'
import os from 'os'
import { readFromFile, writeToFile } from '@server/services/files/fileService'
import Logger from '@server/utils/logger'

interface MachineIdData {
  id: string
  publicKey: string
  privateKey: string
  clientId: string
}

const MACHINE_ID_FILE = 'machine-id.json'

export async function getMachineId(): Promise<MachineIdData> {
  try {
    // Try to load existing machine ID
    const existing = await readFromFile<MachineIdData>(MACHINE_ID_FILE)
    if (existing?.id && existing?.publicKey && existing?.privateKey) {
      return existing
    }
  } catch {
    Logger.debug('No existing machine ID found, generating new one', {
      function: 'getMachineId',
      source: 'machineId'
    })
  }

  // Generate new machine ID
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'der' },
    privateKeyEncoding: { type: 'pkcs8', format: 'der' }
  })

  const privateKeyBase64 = Buffer.from(privateKey).toString('base64')
  const publicKeyRaw = publicKey.slice(-32) // Extract raw public key bytes
  const publicKeyBase64 = Buffer.from(publicKeyRaw).toString('base64')

  const clientId = crypto.createHash('sha256').update(publicKeyBase64).digest('hex')

  // Create deterministic ID based on hardware
  const machineInfo = [
    os.hostname(),
    os.platform(),
    os.arch(),
    os.cpus()[0]?.model || 'unknown',
    process.env.USERNAME || process.env.USER || 'unknown'
  ].join('-')

  const id = crypto.createHash('sha256').update(machineInfo).digest('hex')

  const machineData: MachineIdData = {
    id,
    publicKey: publicKeyBase64,
    privateKey: privateKeyBase64,
    clientId
  }

  try {
    await writeToFile(machineData, MACHINE_ID_FILE)
  } catch (error) {
    Logger.error('Failed to save machine ID', {
      error: error as Error,
      function: 'getMachineId',
      source: 'machineId'
    })
  }

  return machineData
}
