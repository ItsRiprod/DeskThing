import { Icon, findClosestGlyphAvailable } from '..'

function IconMicOffDiscord(props: any): JSX.Element {
  const strokeWidth = props.strokeWidth || 1

  const iconList = [{
    'size': 16,
    'svgContent': '<path d=\'M8 0a4 4 0 00-4 4v3c0 .898.296 1.727.795 2.394L3.55 10.64A5.724 5.724 0 012.25 7V6H.75v1c0 1.796.653 3.44 1.734 4.705L.47 13.72a.75.75 0 001.05 1.071L14.953 1.356l.011-.01.065-.066A.75.75 0 0013.97.22l-2.267 2.266A4.001 4.001 0 008 0zm4 6.432L10.142 8.29c-.21.348-.504.642-.852.852l-1.823 1.823A4 4 0 0012 7v-.568zm-5.972 5.971l-1.144 1.145c.73.348 1.527.577 2.366.664V16h1.5v-1.788A7.251 7.251 0 0015.25 7V6h-1.5v1a5.75 5.75 0 01-7.722 5.403zm-.154-4.087A2.487 2.487 0 015.5 7V4a2.5 2.5 0 014.983-.294l-4.61 4.61z\'/>'
  }, {
    'size': 24,
    'svgContent': '<path d="m2.7 22.7 20-20a1 1 0 0 0-1.4-1.4l-20 20a1 1 0 1 0 1.4 1.4ZM10.8 17.32c-.21.21-.1.58.2.62V20H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-2.06A8 8 0 0 0 20 10a1 1 0 0 0-2 0c0 1.45-.52 2.79-1.38 3.83l-.02.02A5.99 5.99 0 0 1 12.32 16a.52.52 0 0 0-.34.15l-1.18 1.18ZM15.36 4.52c.15-.15.19-.38.08-.56A4 4 0 0 0 8 6v4c0 .3.03.58.1.86.07.34.49.43.74.18l6.52-6.52ZM5.06 13.98c.16.28.53.31.75.09l.75-.75c.16-.16.19-.4.08-.61A5.97 5.97 0 0 1 6 10a1 1 0 0 0-2 0c0 1.45.39 2.81 1.06 3.98Z"></path>'
  }];

  const closestSize = findClosestGlyphAvailable(iconList, props.iconSize || 24);

  const svgContent = `
    <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${closestSize.svgContent}</svg>
  `

  return <Icon {...props} dangerouslySetInnerHTML={{ __html: svgContent }} />
}

export default IconMicOffDiscord
