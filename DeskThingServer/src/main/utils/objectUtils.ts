export const deepMerge = <T>(target: T, source: Partial<T>): T => {
  for (const key in source) {
    if (source[key] instanceof Object && target && typeof target === 'object' && key in target) {
      Object.assign(
        source[key] as object,
        deepMerge(target[key as keyof T], source[key] as Partial<T[keyof T]>)
      )
    }
  }
  Object.assign(target || {}, source)
  return target
}
