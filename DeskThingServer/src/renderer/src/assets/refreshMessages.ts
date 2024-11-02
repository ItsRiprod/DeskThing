export const deviceMessages = [
  { message: 'No device found.', weight: 1, minimum: 0 },
  { message: 'Have you turning it off and back on again?', weight: 3, minimum: 5 },
  { message: 'Still nothing...', weight: 1, minimum: 3 },
  { message: 'Ensure your device is ADB enabled!', weight: 4, minimum: 2 },
  { message: 'Maybe try checking the logs', weight: 2, minimum: 3 },
  { message: 'Double check your cables!', weight: 3, minimum: 3 },
  { message: 'Make sure its plugged directly into your motherboard!', weight: 3, minimum: 3 },
  { message: 'Try a different USB port!', weight: 3, minimum: 3 },
  { message: 'Try a different USB cable!', weight: 3, minimum: 3 },
  { message: 'Try a different USB adapter!', weight: 2, minimum: 3 },
  { message: 'Try a different USB hub! (if applicable)', weight: 2, minimum: 3 },
  { message: 'Does it at least show up in device manager?', weight: 3, minimum: 3 },
  { message: 'Is there a USB connection sound?', weight: 2, minimum: 6 },
  { message: 'Try turning if off and on again!', weight: 3, minimum: 3 },
  { message: 'Are you sure you have ADB enabled?', weight: 4, minimum: 9 },
  { message: 'Try running ADB Devices in the terminal! (If you have ADB)', weight: 4, minimum: 5 },
  { message: 'Installing ADB separately and using Global ADB might help!', weight: 3, minimum: 5 },
  {
    message: '(Phones) Check if USB debugging is enabled in Developer Options',
    weight: 4,
    minimum: 5
  },
  {
    message: '(Phones) Try revoking USB debugging authorizations and reconnecting',
    weight: 3,
    minimum: 5
  },
  { message: 'Ensure your device drivers are up to date', weight: 3, minimum: 17 },
  {
    message:
      '(Phones) Check if your device is in the correct mode (e.g., not in charging only mode)',
    weight: 3,
    minimum: 5
  },
  { message: 'Try using a different computer if possible', weight: 2, minimum: 20 },
  {
    message: '(Phones) Verify that your ADB version is compatible with your device',
    weight: 3,
    minimum: 45
  },
  {
    message: 'Check if your device is recognized by "lsusb" command (on Linux/macOS)',
    weight: 3,
    minimum: 28
  },
  {
    message: 'Ensure that no other program is using ADB or has locked the device',
    weight: 3,
    minimum: 5
  },
  { message: 'Try restarting ADB (Dev -> ADB -> Restart Server)', weight: 4, minimum: 32 },
  { message: 'Have you tried asking the device nicely?', weight: 1, minimum: 19 },
  { message: 'Maybe your device is just shy. Try complimenting it!', weight: 1, minimum: 26 },
  {
    message: "Plot twist: The device was working all along, and we're in a simulation!",
    weight: 1,
    minimum: 12
  },
  {
    message: 'Why do we try if it only continues to bring suffering',
    weight: 1,
    minimum: 12
  },
  {
    message: 'I aspire to have your level of persistance',
    weight: 1,
    minimum: 15
  },
  {
    message: 'I dont think you understand how difficult it is to debug this',
    weight: 1,
    minimum: 15
  },
  {
    message: 'Okay I get it - I dont think its working',
    weight: 1,
    minimum: 20
  },
  {
    message: "You've been at this for quite awhile now, I think you should take a break",
    weight: 1,
    minimum: 20
  },
  {
    message: 'TOUCH GRASS',
    weight: 1,
    minimum: 30
  },
  {
    message:
      '"Insanity is doing the same thing over and over again and expecting different results,"',
    weight: 1,
    minimum: 30
  },
  {
    message: 'Try one more time. I believe in you',
    weight: 1,
    minimum: 30
  },
  {
    message: 'Im sure the problem is something simple, you just need to find it',
    weight: 1,
    minimum: 30
  },
  {
    message: 'At this point just ask on the discord!',
    weight: 1,
    minimum: 50
  },
  {
    message: 'At this point just ask on the discord!',
    weight: 1,
    minimum: 50
  },
  {
    message: 'At this point just ask on the discord!',
    weight: 1,
    minimum: 50
  },
  {
    message: 'Some people never give up!',
    weight: 1,
    minimum: 60
  },
  {
    message: 'Woah! You have a lot of patience. This means youve been trying for a while',
    weight: 1,
    minimum: 60
  },
  {
    message: 'This is an easter egg. Send a screenshot of this over the discord',
    weight: 1,
    minimum: 100
  },
  {
    message: 'There are no more messages. You have reached the end of the line',
    weight: 1,
    minimum: 110
  }
]
