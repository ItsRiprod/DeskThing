import { Icon, findClosestGlyphAvailable } from '..'

function IconShuffle(props: any): JSX.Element {
  const strokeWidth = props.strokeWidth || 0

  const iconList = [{
    'size': 16,
    'svgContent': '<path d=\'M13.151.922a.75.75 0 10-1.06 1.06L13.109 3H11.16a3.75 3.75 0 00-2.873 1.34l-6.173 7.356A2.25 2.25 0 01.39 12.5H0V14h.391a3.75 3.75 0 002.873-1.34l6.173-7.356a2.25 2.25 0 011.724-.804h1.947l-1.017 1.018a.75.75 0 001.06 1.06L15.98 3.75 13.15.922zM.391 3.5H0V2h.391c1.109 0 2.16.49 2.873 1.34L4.89 5.277l-.979 1.167-1.796-2.14A2.25 2.25 0 00.39 3.5z\'/><path d=\'M7.5 10.723l.98-1.167.957 1.14a2.25 2.25 0 001.724.804h1.947l-1.017-1.018a.75.75 0 111.06-1.06l2.829 2.828-2.829 2.828a.75.75 0 11-1.06-1.06L13.109 13H11.16a3.75 3.75 0 01-2.873-1.34l-.787-.938z\'/>'
  }, {
    'size': 24,
    'svgContent': '<path d=\'M18.788 3.702a1 1 0 011.414-1.414L23.914 6l-3.712 3.712a1 1 0 11-1.414-1.414L20.086 7h-1.518a5 5 0 00-3.826 1.78l-7.346 8.73a7 7 0 01-5.356 2.494H1v-2h1.04a5 5 0 003.826-1.781l7.345-8.73A7 7 0 0118.569 5h1.518l-1.298-1.298z\'/><path d=\'M18.788 14.289a1 1 0 000 1.414L20.086 17h-1.518a5 5 0 01-3.826-1.78l-1.403-1.668-1.306 1.554 1.178 1.4A7 7 0 0018.568 19h1.518l-1.298 1.298a1 1 0 101.414 1.414L23.914 18l-3.712-3.713a1 1 0 00-1.414 0zM7.396 6.49l2.023 2.404-1.307 1.553-2.246-2.67a5 5 0 00-3.826-1.78H1v-2h1.04A7 7 0 017.396 6.49z\'/>'
  }];

  const closestSize = findClosestGlyphAvailable(iconList, props.iconSize || 24);

  const svgContent = `
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${closestSize.svgContent}</svg>
  `

  return <Icon {...props} dangerouslySetInnerHTML={{ __html: svgContent }} />
}

export default IconShuffle
