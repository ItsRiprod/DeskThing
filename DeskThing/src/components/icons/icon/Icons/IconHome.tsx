import { Icon, findClosestGlyphAvailable } from '..'

function IconHome(props: any): JSX.Element {
  const strokeWidth = props.strokeWidth || 1

  const iconList = [{
    'size': 16,
    'svgContent': '<path d=\'M6.625.988a2.75 2.75 0 012.75 0l5.25 3.03c.541.314.875.891.875 1.516v9.724a.75.75 0 01-.75.75h-5a.75.75 0 01-.75-.75V10.5H7v4.758a.75.75 0 01-.75.75h-5a.75.75 0 01-.75-.75V5.534c0-.625.334-1.202.875-1.515L6.625.988zm2 1.299a1.25 1.25 0 00-1.25 0l-5.25 3.031A.25.25 0 002 5.534v8.974h3.5V9.75A.75.75 0 016.25 9h3.5a.75.75 0 01.75.75v4.758H14V5.534a.25.25 0 00-.125-.216l-5.25-3.031z\'/>'
  }, {
    'size': 24,
    'svgContent': '<path d=\'M12.5 3.247a1 1 0 00-1 0L4 7.577V20h4.5v-6a1 1 0 011-1h5a1 1 0 011 1v6H20V7.577l-7.5-4.33zm-2-1.732a3 3 0 013 0l7.5 4.33a2 2 0 011 1.732V21a1 1 0 01-1 1h-6.5a1 1 0 01-1-1v-6h-3v6a1 1 0 01-1 1H3a1 1 0 01-1-1V7.577a2 2 0 011-1.732l7.5-4.33z\'/>'
  }];

  const closestSize = findClosestGlyphAvailable(iconList, props.iconSize || 24);

  const svgContent = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${closestSize.svgContent}</svg>
  `

  return <Icon {...props} dangerouslySetInnerHTML={{ __html: svgContent }} />
}

export default IconHome
