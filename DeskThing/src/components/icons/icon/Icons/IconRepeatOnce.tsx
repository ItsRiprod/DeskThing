import { Icon, findClosestGlyphAvailable } from '..'

function IconRepeatOnce(props: any): JSX.Element {
  const strokeWidth = props.strokeWidth || 0

  const iconList = [{
    'size': 16,
    'svgContent': '<path d=\'M0 4.75A3.75 3.75 0 013.75 1h.75v1.5h-.75A2.25 2.25 0 001.5 4.75v5A2.25 2.25 0 003.75 12H5v1.5H3.75A3.75 3.75 0 010 9.75v-5zM12.25 2.5h-.75V1h.75A3.75 3.75 0 0116 4.75v5a3.75 3.75 0 01-3.75 3.75H9.81l1.018 1.018a.75.75 0 11-1.06 1.06L6.939 12.75l2.829-2.828a.75.75 0 111.06 1.06L9.811 12h2.439a2.25 2.25 0 002.25-2.25v-5a2.25 2.25 0 00-2.25-2.25z\'/><path d=\'M9.12 8V1H7.787c-.128.72-.76 1.293-1.787 1.313V3.36h1.57V8h1.55z\'/>'
  }, {
    'size': 24,
    'svgContent': '<path d=\'M11.382 2.516c.306-.323.448-.7.448-.969h2V11h-2V5H10V3h.378c.341 0 .706-.17 1.004-.484zM1 7a5 5 0 015-5h1v2H6a3 3 0 00-3 3v8a3 3 0 003 3h1v2H6a5 5 0 01-5-5V7z\'/><path d=\'M18 4h-1V2h1a5 5 0 015 5v8a5 5 0 01-5 5h-4.798l1.298 1.298a1 1 0 11-1.414 1.415L9.373 19l3.713-3.712a1 1 0 011.414 1.414L13.202 18H18a3 3 0 003-3V7a3 3 0 00-3-3z\'/>'
  }];

  const closestSize = findClosestGlyphAvailable(iconList, props.iconSize || 24);

  const svgContent = `
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${closestSize.svgContent}</svg>
  `

  return <Icon {...props} dangerouslySetInnerHTML={{ __html: svgContent }} />
}

export default IconRepeatOnce
