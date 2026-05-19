import initialSql from './001_initial.sql?raw'

export interface Migration {
  version: number
  name: string
  sql: string
}

export const migrations: Migration[] = [
  { version: 1, name: '001_initial', sql: initialSql },
]
