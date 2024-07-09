import { Icon, findClosestGlyphAvailable } from '..'

function IconRepeat(props: any): JSX.Element {
  const strokeWidth = props.strokeWidth || 0

  const iconList = [{
    'size': 16,
    'svgContent': '<path d=\'M0 4.75A3.75 3.75 0 013.75 1h8.5A3.75 3.75 0 0116 4.75v5a3.75 3.75 0 01-3.75 3.75H9.81l1.018 1.018a.75.75 0 11-1.06 1.06L6.939 12.75l2.829-2.828a.75.75 0 111.06 1.06L9.811 12h2.439a2.25 2.25 0 002.25-2.25v-5a2.25 2.25 0 00-2.25-2.25h-8.5A2.25 2.25 0 001.5 4.75v5A2.25 2.25 0 003.75 12H5v1.5H3.75A3.75 3.75 0 010 9.75v-5z\'/>'
  }, {
    'size': 24,
    'svgContent': '<path d=\'M6 2a5 5 0 00-5 5v8a5 5 0 005 5h1v-2H6a3 3 0 01-3-3V7a3 3 0 013-3h12a3 3 0 013 3v8a3 3 0 01-3 3h-4.798l1.298-1.298a1 1 0 10-1.414-1.414L9.373 19l3.713 3.712a1 1 0 001.414-1.414L13.202 20H18a5 5 0 005-5V7a5 5 0 00-5-5H6z\'/>'
  }];

  const closestSize = findClosestGlyphAvailable(iconList, props.iconSize || 24);

  const svgContent = `
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${closestSize.svgContent}</svg>
  `

  return <Icon {...props} dangerouslySetInnerHTML={{ __html: svgContent }} />
}

export default IconRepeat
