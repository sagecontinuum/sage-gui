

export function queryData<Type>(data: Type[], query: string) : Type[] {
  return data.filter(row =>
    Object.values(row)
      .join('').toLowerCase()
      .includes(query.toLowerCase())
  )
}