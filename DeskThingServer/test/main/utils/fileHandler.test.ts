import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import {
  readFromFile,
  readFromGlobalFile,
  writeToFile,
  writeToGlobalFile
} from '@server/utils/fileHandler'

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn().mockReturnValue('\\mock\\user\\data')
  }
}))

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn()
  }
}))

describe('fileHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('readFromFile', () => {
    it('should return false when file does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false)
      const result = readFromFile('test.json')
      expect(result).toBe(false)
      expect(fs.existsSync).toHaveBeenCalledWith('\\mock\\user\\data\\test.json')
    })

    it('should read and parse JSON file successfully', () => {
      const mockData = { test: 'data' }
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from(JSON.stringify(mockData)))

      const result = readFromFile<typeof mockData>('test.json')
      expect(result).toEqual(mockData)
      expect(fs.readFileSync).toHaveBeenCalledWith('\\mock\\user\\data\\test.json')
    })

    it('should return false when JSON parsing fails', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('invalid json'))

      const result = readFromFile('test.json')
      expect(result).toBe(false)
    })

    it('should return false when file read throws error', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('Read error')
      })

      const result = readFromFile('test.json')
      expect(result).toBe(false)
    })
  })
})
describe('writeToFile', () => {
  it('should successfully write data to file', () => {
    const mockData = { key: 'value' }
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.writeFileSync).mockImplementation(() => undefined)

    const result = writeToFile(mockData, 'test.json')
    expect(result).toBe(true)
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      '\\mock\\user\\data\\test.json',
      JSON.stringify(mockData, null, 2)
    )
  })

  it('should create directory if it does not exist', () => {
    const mockData = { key: 'value' }
    vi.mocked(fs.existsSync).mockReturnValue(false)
    vi.mocked(fs.mkdirSync).mockImplementation(() => undefined)
    vi.mocked(fs.writeFileSync).mockImplementation(() => undefined)

    const result = writeToFile(mockData, 'nested/path/test.json')
    expect(result).toBe(true)
    expect(fs.mkdirSync).toHaveBeenCalledWith('\\mock\\user\\data\\nested\\path', {
      recursive: true
    })
  })

  it('should return false when write operation fails', () => {
    const mockData = { key: 'value' }
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.writeFileSync).mockImplementation(() => {
      throw new Error('Write error')
    })

    const result = writeToFile(mockData, 'test.json')
    expect(result).toBe(false)
  })
})

describe('writeToGlobalFile', () => {
  it('should successfully write data to global file', () => {
    const mockData = { key: 'value' }
    vi.mocked(fs.writeFileSync).mockImplementation(() => undefined)

    const result = writeToGlobalFile(mockData, '/global/path/test.json')
    expect(result).toBe(true)
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      '/global/path/test.json',
      JSON.stringify(mockData, null, 2)
    )
  })

  it('should return false when global write operation fails', () => {
    const mockData = { key: 'value' }
    vi.mocked(fs.writeFileSync).mockImplementation(() => {
      throw new Error('Write error')
    })

    const result = writeToGlobalFile(mockData, '/global/path/test.json')
    expect(result).toBe(false)
  })
})

describe('readFromGlobalFile', () => {
  it('should successfully read and parse global file', () => {
    const mockData = { key: 'value' }
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from(JSON.stringify(mockData)))

    const result = readFromGlobalFile<typeof mockData>('test.json')
    expect(result).toEqual(mockData)
    expect(fs.readFileSync).toHaveBeenCalledWith('\\mock\\user\\data\\test.json')
  })

  it('should return false when global file does not exist', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false)

    const result = readFromGlobalFile('test.json')
    expect(result).toBe(false)
  })

  it('should return false when global file parsing fails', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('invalid json'))

    const result = readFromGlobalFile('test.json')
    expect(result).toBe(false)
  })
})
