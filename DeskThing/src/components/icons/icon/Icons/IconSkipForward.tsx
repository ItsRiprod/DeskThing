import { Icon, findClosestGlyphAvailable } from '..'

function IconSkipForward(props: any): JSX.Element {
  const strokeWidth = props.strokeWidth || 0

  const iconList = [{
    'size': 16,
    'svgContent': '<path d=\'M12.7 1a.7.7 0 00-.7.7v5.15L2.05 1.107A.7.7 0 001 1.712v12.575a.7.7 0 001.05.607L12 9.149V14.3a.7.7 0 00.7.7h1.6a.7.7 0 00.7-.7V1.7a.7.7 0 00-.7-.7h-1.6z\'/>'
  }, {
    'size': 24,
    'svgContent': '<path d=\'M17.7 3a.7.7 0 00-.7.7v6.805L5.05 3.606A.7.7 0 004 4.212v15.576a.7.7 0 001.05.606L17 13.495V20.3a.7.7 0 00.7.7h1.6a.7.7 0 00.7-.7V3.7a.7.7 0 00-.7-.7h-1.6z\'/>'
  }];

  const closestSize = findClosestGlyphAvailable(iconList, props.iconSize || 24);

  const svgContent = `
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${closestSize.svgContent}</svg>
  `

  return <Icon {...props} dangerouslySetInnerHTML={{ __html: svgContent }} />
}

export default IconSkipForward
