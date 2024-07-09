import { Icon, findClosestGlyphAvailable } from '..'

function IconCollection(props: any): JSX.Element {
  const strokeWidth = props.strokeWidth || 1

  const iconList = [{
    'size': 16,
    'svgContent': '<path d=\'M8.375 1.098a.75.75 0 01.75 0l5.5 3.175a.75.75 0 01.375.65V15.25a.75.75 0 01-.75.75h-5.5a.75.75 0 01-.75-.75V1.747a.75.75 0 01.375-.65zM9.5 3.046V14.5h4V5.356l-4-2.31zM1 1.75a.75.75 0 011.5 0v13.5a.75.75 0 01-1.5 0V1.75zm3.5 0a.75.75 0 011.5 0v13.5a.75.75 0 01-1.5 0V1.75z\'/>'
  }, {
    'size': 24,
    'svgContent': '<path d=\'M14.5 2.134a1 1 0 011 0l6 3.464a1 1 0 01.5.866V21a1 1 0 01-1 1h-6a1 1 0 01-1-1V3a1 1 0 01.5-.866zM16 4.732V20h4V7.041l-4-2.309zM3 22a1 1 0 01-1-1V3a1 1 0 012 0v18a1 1 0 01-1 1zm6 0a1 1 0 01-1-1V3a1 1 0 012 0v18a1 1 0 01-1 1z\'/>'
  }];

  const closestSize = findClosestGlyphAvailable(iconList, props.iconSize || 24);

  const svgContent = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${closestSize.svgContent}</svg>
  `

  return <Icon {...props} dangerouslySetInnerHTML={{ __html: svgContent }} />
}

export default IconCollection
