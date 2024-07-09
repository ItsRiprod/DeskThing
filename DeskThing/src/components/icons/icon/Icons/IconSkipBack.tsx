import { Icon, findClosestGlyphAvailable } from '..'

function IconSkipBack(props: any): JSX.Element {
  const strokeWidth = props.strokeWidth || 0

  const iconList = [{
    'size': 16,
    'svgContent': '<path d=\'M3.3 1a.7.7 0 01.7.7v5.15l9.95-5.744a.7.7 0 011.05.606v12.575a.7.7 0 01-1.05.607L4 9.149V14.3a.7.7 0 01-.7.7H1.7a.7.7 0 01-.7-.7V1.7a.7.7 0 01.7-.7h1.6z\'/>'
  }, {
    'size': 24,
    'svgContent': '<path d=\'M6.3 3a.7.7 0 01.7.7v6.805l11.95-6.899a.7.7 0 011.05.606v15.576a.7.7 0 01-1.05.606L7 13.495V20.3a.7.7 0 01-.7.7H4.7a.7.7 0 01-.7-.7V3.7a.7.7 0 01.7-.7h1.6z\'/>'
  }];

  const closestSize = findClosestGlyphAvailable(iconList, props.iconSize || 24);

  const svgContent = `
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${closestSize.svgContent}</svg>
  `

  return <Icon {...props} dangerouslySetInnerHTML={{ __html: svgContent }} />
}

export default IconSkipBack
