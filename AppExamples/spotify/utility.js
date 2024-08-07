const axios = require('axios')

const fetchImageData = async (url, type) => {
  try {
    console.log(`Fetching ${type} data...`)
    const response = await axios.get(url, { responseType: 'arraybuffer' })
    const imgData = `data:image/${type};base64,${Buffer.from(response.data).toString('base64')}`
    console.log(`Sending ${type} data`)
    return imgData
  } catch (error) {
    console.error(`Error fetching ${type}:`, error)
    throw error
  }
}

const getImageData = (url) => fetchImageData(url, 'jpeg')
const getGifData = (url) => fetchImageData(url, 'gif')

module.exports = { getImageData, getGifData }
