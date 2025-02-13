/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import {
  readFromFile,
  readFromGlobalFile,
  writeToFile,
  writeToGlobalFile,
  deleteFile,
  addToFile
} from '@server/services/files/fileService'

vi.mock('@server/utils/logger', () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn()
  }
}))

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn((path) => (path === 'userData' ? '\\mock\\user\\data' : '\\mock\\temp'))
  }
}))

vi.mock('node:fs', () => ({
  default: {
    promises: {
      access: vi.fn(),
      readFile: vi.fn(),
      writeFile: vi.fn(),
      mkdir: vi.fn(),
      copyFile: vi.fn(),
      rm: vi.fn(),
      appendFile: vi.fn(),
      stat: vi.fn(),
      unlink: vi.fn()
    }
  }
}))

describe('FileService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('readFromFile', () => {
    it('should read and parse JSON file successfully', async () => {
      const mockData = { test: 'data' }
      vi.mocked(fs.promises.access).mockResolvedValue(undefined)
      vi.mocked(fs.promises.readFile).mockResolvedValue(Buffer.from(JSON.stringify(mockData)))

      const result = await readFromFile<typeof mockData>('test.json')
      expect(result).toEqual(mockData)
      expect(fs.promises.readFile).toHaveBeenCalledWith('\\mock\\user\\data\\test.json')
    })

    it('should throw error when JSON parsing fails', async () => {
      vi.mocked(fs.promises.access).mockResolvedValue(undefined)
      vi.mocked(fs.promises.readFile).mockResolvedValue(Buffer.from('invalid json'))

      await expect(readFromFile('test.json')).rejects.toThrow('[readFromFile]: Error reading data')
    })
  })

  describe('writeToFile', () => {
    it('should write data to new file when file does not exist', async () => {
      const mockData = { key: 'value' }
      vi.mocked(fs.promises.access).mockRejectedValue(new Error())
      vi.mocked(fs.promises.mkdir).mockResolvedValue(undefined)
      vi.mocked(fs.promises.writeFile).mockResolvedValue(undefined)

      await expect(writeToFile(mockData, 'test.json')).resolves.toBeUndefined()
      expect(fs.promises.mkdir).toHaveBeenCalledWith('\\mock\\user\\data', { recursive: true })
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        '\\mock\\user\\data\\test.json',
        JSON.stringify(mockData, null, 2)
      )
    })

    it('should use temp file for safe writing when file exists', async () => {
      const mockData = { key: 'value' }
      vi.mocked(fs.promises.access).mockResolvedValue(undefined)
      vi.mocked(fs.promises.mkdir).mockResolvedValue(undefined)
      vi.mocked(fs.promises.writeFile).mockResolvedValue(undefined)
      vi.mocked(fs.promises.copyFile).mockResolvedValue(undefined)
      vi.mocked(fs.promises.rm).mockResolvedValue(undefined)

      await expect(writeToFile(mockData, 'test.json')).resolves.toBeUndefined()
      expect(fs.promises.mkdir).toHaveBeenCalledWith('\\mock\\temp', { recursive: true })
      expect(fs.promises.copyFile).toHaveBeenCalled()
      expect(fs.promises.rm).toHaveBeenCalled()
    })
  })

  describe('addToFile', () => {
    it('should append string data to file', async () => {
      const mockData = 'test data'
      vi.mocked(fs.promises.mkdir).mockResolvedValue(undefined)
      vi.mocked(fs.promises.appendFile).mockResolvedValue(undefined)

      await expect(addToFile(mockData, 'test.log')).resolves.toBeUndefined()
      expect(fs.promises.appendFile).toHaveBeenCalledWith(
        '\\mock\\user\\data\\test.log',
        'test data\n'
      )
    })

    it('should append buffer data to file', async () => {
      const mockData = Buffer.from('test data')
      vi.mocked(fs.promises.mkdir).mockResolvedValue(undefined)
      vi.mocked(fs.promises.appendFile).mockResolvedValue(undefined)

      await expect(addToFile(mockData, 'test.log')).resolves.toBeUndefined()
      expect(fs.promises.appendFile).toHaveBeenCalledWith(
        '\\mock\\user\\data\\test.log',
        'test data\n'
      )
    })
  })

  describe('deleteFile', () => {
    it('should delete existing file', async () => {
      vi.mocked(fs.promises.stat).mockResolvedValue({ isFile: () => true } as fs.Stats)
      vi.mocked(fs.promises.unlink).mockResolvedValue(undefined)

      await expect(deleteFile('test.json')).resolves.toBeUndefined()
      expect(fs.promises.unlink).toHaveBeenCalledWith('\\mock\\user\\data\\test.json')
    })

    it('should throw error when file does not exist', async () => {
      const error = new Error('File not found')
      ;(error as any).code = 'ENOENT'
      vi.mocked(fs.promises.stat).mockRejectedValue(error)

      await expect(deleteFile('test.json')).rejects.toThrow('[deleteFile] File does not exist')
    })

    it('should throw error when path is not a file', async () => {
      vi.mocked(fs.promises.stat).mockResolvedValue({ isFile: () => false } as fs.Stats)

      await expect(deleteFile('test.json')).rejects.toThrow(
        '[deleteFile] Path exists but is not a file'
      )
    })
  })

  describe('deprecated functions', () => {
    it('writeToGlobalFile should call writeToFile', async () => {
      const mockData = { key: 'value' }
      vi.mocked(fs.promises.access).mockResolvedValue(undefined)
      vi.mocked(fs.promises.mkdir).mockResolvedValue(undefined)
      vi.mocked(fs.promises.writeFile).mockResolvedValue(undefined)
      vi.mocked(fs.promises.copyFile).mockResolvedValue(undefined)
      vi.mocked(fs.promises.rm).mockResolvedValue(undefined)

      await expect(writeToGlobalFile(mockData, 'test.json')).resolves.toBeUndefined()
    })

    it('readFromGlobalFile should return false when file does not exist', async () => {
      vi.mocked(fs.promises.access).mockRejectedValue(new Error())

      const result = await readFromGlobalFile('test.json')
      expect(result).toBe(false)
    })
  })
})
