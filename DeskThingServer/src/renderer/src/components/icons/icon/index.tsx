export const Icon = ({
  iconSize = 24,
  color = "currentColor",
  title,
  titleId,
  desc,
  descId,
  className,
  dangerouslySetInnerHTML,
  ...restProps
}): JSX.Element => {
  return (
    <svg
      color={color}
      role="img"
      height={iconSize}
      width={iconSize}
      viewBox={`0 0 ${iconSize} ${iconSize}`}
      className={className}
      {...restProps}
    >
      {dangerouslySetInnerHTML ? (
        <g dangerouslySetInnerHTML={dangerouslySetInnerHTML} />
      ) : (
        <>
          {title && <title id={titleId}>{title}</title>}
          {desc && <desc id={descId}>{desc}</desc>}
        </>
      )}
    </svg>
  )
}
