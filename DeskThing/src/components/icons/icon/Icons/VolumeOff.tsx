import { Icon, findClosestGlyphAvailable } from '..'

function VolumeOff(props: any): JSX.Element {
  const strokeWidth = props.strokeWidth || 1

  const iconList = [{
    'size': 16,
    'svgContent': '<path d=\'M13.86 5.47a.75.75 0 00-1.061 0l-1.47 1.47-1.47-1.47A.75.75 0 008.8 6.53L10.269 8l-1.47 1.47a.75.75 0 101.06 1.06l1.47-1.47 1.47 1.47a.75.75 0 001.06-1.06L12.39 8l1.47-1.47a.75.75 0 000-1.06z\'/><path d=\'M10.116 1.5A.75.75 0 008.991.85l-6.925 4a3.642 3.642 0 00-1.33 4.967 3.639 3.639 0 001.33 1.332l6.925 4a.75.75 0 001.125-.649v-1.906a4.73 4.73 0 01-1.5-.694v1.3L2.817 9.852a2.141 2.141 0 01-.781-2.92c.187-.324.456-.594.78-.782l5.8-3.35v1.3c.45-.313.956-.55 1.5-.694V1.5z\'/>'
  }, {
    'size': 24,
    'svgContent': '<path d=\'M17.293 15.207a1 1 0 001.414 0l1.793-1.793 1.793 1.793a1 1 0 001.414-1.414L21.914 12l1.793-1.793a1 1 0 00-1.414-1.414L20.5 10.586l-1.793-1.793a1 1 0 10-1.414 1.414L19.086 12l-1.793 1.793a1 1 0 000 1.414zM14.5 1.134A1 1 0 0115 2v20a1 1 0 01-1.5.866L2.846 16.712a5.445 5.445 0 010-9.424L13.5 1.135a1 1 0 011 0zM3.847 9.02a3.444 3.444 0 000 5.96L13 20.268V3.732L3.847 9.02z\'/>'
  }];

  const closestSize = findClosestGlyphAvailable(iconList, props.iconSize || 24);

  const svgContent = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${closestSize.svgContent}</svg>
  `

  return <Icon {...props} dangerouslySetInnerHTML={{ __html: svgContent }} />
}

export default VolumeOff
